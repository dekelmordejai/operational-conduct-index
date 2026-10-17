"""Validation, explicit linkage, exclusive contributions and exposure-based rates.

No fuzzy linkage is performed. Cross-source identity requires an explicit
incident_ref. Reference caps are illustrative, not calibrated safety thresholds.
"""

from collections import defaultdict
from datetime import date
import hashlib
import json
import math

COMPONENTS = ("R", "H", "I")
STATUSES = {"valid", "pending", "dismissed"}
RESPONSIBILITIES = {"operator", "company", "external", "pending"}


def canonical_hash(value):
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    ).hexdigest()


def number(value, label, *, positive=False):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{label}: expected a number")
    if not math.isfinite(value) or value < 0 or (positive and value == 0):
        raise ValueError(f"{label}: invalid nonnegative value")


def validate_config(config):
    if set(config["weights"]) != set(COMPONENTS):
        raise ValueError("weights must cover R, H, I")
    for value in config["weights"].values():
        number(value, "weight")
    if not math.isclose(sum(config["weights"].values()), 1):
        raise ValueError("weights must sum to one")
    if sorted(config["precedence"]) != sorted(COMPONENTS):
        raise ValueError("precedence must be a permutation of R, H, I")
    number(config["rate_base"], "rate_base", positive=True)
    number(config["injury_factor"], "injury_factor", positive=True)
    for component in COMPONENTS:
        number(config["reference_caps"][component], "reference cap", positive=True)
    for name in ("report_points", "infringement_points", "traffic_points"):
        for value in config[name].values():
            number(value, "catalog points")


def validate_dataset(data, config):
    validate_config(config)
    operators = data["operators"]
    if not operators or len(operators) != len(set(operators)):
        raise ValueError("operators must be a nonempty unique roster")
    exposure_keys = set()
    for row in data["exposure"]:
        date.fromisoformat(row["date"])
        key = (row["date"], row["company"], row["line"])
        if key in exposure_keys:
            raise ValueError("duplicate exposure grain")
        exposure_keys.add(key)
        if row["km"] is not None:
            number(row["km"], "km")
    catalogs = {"R": "report_points", "I": "infringement_points", "H": "traffic_points"}
    for row in data["records"]:
        date.fromisoformat(row["date"])
        if row["operator"] not in operators:
            raise ValueError("unknown operator")
        if row["component"] not in COMPONENTS or row["status"] not in STATUSES:
            raise ValueError("unknown component or status")
        if row["responsibility"] not in RESPONSIBILITIES:
            raise ValueError("unknown responsibility")
        for field in ("source", "source_id", "incident_ref", "company", "line"):
            if not isinstance(row[field], str) or not row[field].strip():
                raise ValueError(f"missing identity: {field}")
        if row["code"] not in config[catalogs[row["component"]]]:
            raise ValueError("unknown catalog code")
        for field in ("injured", "fatalities"):
            value = row[field]
            if isinstance(value, bool) or not isinstance(value, int) or value < 0:
                raise ValueError(f"invalid {field}")
        if isinstance(row["revision"], bool) or not isinstance(row["revision"], int) or row["revision"] < 1:
            raise ValueError("revision must be a positive integer")
    if set(data["source_complete"]) != set(COMPONENTS):
        raise ValueError("source completeness must cover every component")
    if any(type(value) is not bool for value in data["source_complete"].values()):
        raise ValueError("source completeness must be boolean")


def latest_records(records):
    """Collapse exact retries and select latest revision; reject conflicting revisions."""
    revisions = {}
    latest = {}
    for row in records:
        identity = (row["source"], row["source_id"])
        key = (*identity, row["revision"])
        if key in revisions and revisions[key] != row:
            raise ValueError("conflicting content for same source revision")
        revisions[key] = row
        if identity not in latest or row["revision"] > latest[identity]["revision"]:
            latest[identity] = row
    return [latest[key] for key in sorted(latest)]


def contributions(records, config):
    groups = defaultdict(list)
    for row in latest_records(records):
        groups[row["incident_ref"]].append(row)
    output = []
    priority = {component: index for index, component in enumerate(config["precedence"])}
    for incident, rows in sorted(groups.items()):
        # A shared reference does not override contradictory identity evidence.
        identities = {(r["operator"], r["company"], r["line"], r["date"]) for r in rows}
        if len(identities) != 1:
            raise ValueError("incident identity conflict requires review")
        eligible = [r for r in rows if r["status"] == "valid" and r["responsibility"] == "operator"]
        chosen = None
        points = 0
        if eligible:
            # Reject multiple distinct allegations within the same component.
            # The MVP requires human resolution rather than choosing arbitrarily.
            for component in COMPONENTS:
                same = [r for r in eligible if r["component"] == component]
                signatures = {(r["code"], r["injured"], r["fatalities"]) for r in same}
                if len(signatures) > 1:
                    raise ValueError("multiple allegations in one incident require review")
            chosen = min(eligible, key=lambda r: (priority[r["component"]], r["source"], r["source_id"]))
            catalog = {"R": "report_points", "I": "infringement_points", "H": "traffic_points"}[chosen["component"]]
            points = config[catalog][chosen["code"]]
            if chosen["component"] == "H" and chosen["injured"] > 0:
                points *= config["injury_factor"]
        first = rows[0]
        output.append({
            "incident_ref": incident,
            **{key: first[key] for key in ("operator", "company", "line", "date")},
            "component": chosen["component"] if chosen else None,
            "points": points,
            "reason": "eligible_exclusive_precedence" if chosen else "no_eligible_record",
            "selected_record": [chosen["source"], chosen["source_id"], chosen["revision"]] if chosen else None,
            "linked_records": [[r["source"], r["source_id"], r["revision"]] for r in rows],
            "human_review_alert": any(r["fatalities"] > 0 for r in rows),
        })
    return output


def calculate(data, config, start, end):
    """Calculate inclusive date range; completeness is an explicit input contract.

    Exposure rows must cover every operating company-line-day within the requested
    range. Missing rows fail closed for the affected group.
    """
    validate_dataset(data, config)
    if date.fromisoformat(start) > date.fromisoformat(end):
        raise ValueError("start must not exceed end")
    resolved = contributions(data["records"], config)
    events = [r for r in resolved if start <= r["date"] <= end]
    exposure = [r for r in data["exposure"] if start <= r["date"] <= end]
    # Full-period company-line coverage must be explicitly declared by the caller.
    coverage = data["exposure_coverage"]
    groups = {("system", "all")}
    for row in events + exposure:
        groups.update({("company", row["company"]), ("line", row["line"]),
                       ("company_line", row["company"] + "/" + row["line"])})

    def belongs(row, level, entity):
        return (level == "system" or (level == "company" and row["company"] == entity)
                or (level == "line" and row["line"] == entity)
                or (level == "company_line" and row["company"] + "/" + row["line"] == entity))

    results = []
    for level, entity in sorted(groups):
        subset = [r for r in events if belongs(r, level, entity)]
        distances = [r for r in exposure if belongs(r, level, entity)]
        points = {c: sum(r["points"] for r in subset if r["component"] == c) for c in COMPONENTS}
        issues = []
        if any(not value for value in data["source_complete"].values()):
            issues.append("incomplete_source")
        if not (coverage["start"] <= start <= end <= coverage["end"] and coverage["complete"] is True):
            issues.append("incomplete_exposure_coverage")
        if not distances or any(r["km"] is None for r in distances):
            issues.append("missing_exposure")
        # An event outside declared operating cells cannot acquire another cell's km.
        cells = {(r["date"], r["company"], r["line"]) for r in distances}
        if any((r["date"], r["company"], r["line"]) not in cells for r in subset):
            issues.append("event_without_exposure")
        km = sum(r["km"] or 0 for r in distances)
        if km == 0:
            issues.append("zero_exposure")
        rates = {c: config["rate_base"] * points[c] / km for c in COMPONENTS} if not issues else None
        scaled = {c: min(1.0, rates[c] / config["reference_caps"][c]) for c in COMPONENTS} if rates else None
        results.append({"level": level, "entity": entity, "points": points, "km": km,
                        "rates_per_100k_km": rates, "scaled": scaled,
                        "reference_exceeded": [c for c in COMPONENTS if rates and rates[c] > config["reference_caps"][c]],
                        "ico_risk": sum(config["weights"][c] * scaled[c] for c in COMPONENTS) if scaled else None,
                        "quality_issues": issues})
    operators = []
    for operator in sorted(data["operators"]):
        subset = [r for r in events if r["operator"] == operator]
        operators.append({"operator": operator,
                          "points": {c: sum(r["points"] for r in subset if r["component"] == c) for c in COMPONENTS},
                          "exposure_adjusted": False,
                          "sources_complete": all(data["source_complete"].values())})
    return {"methodology": config["version"], "reference": config["reference_id"],
            "input_sha256": canonical_hash(data), "config_sha256": canonical_hash(config),
            "period": {"start": start, "end": end}, "results": results,
            "operators": operators, "contributions": events,
            "quality": {"input_records": len(data["records"]),
                        "latest_records": len(latest_records(data["records"])),
                        "canonical_events_in_period": len(events),
                        "eligible_events_in_period": sum(r["component"] is not None for r in events)}}
