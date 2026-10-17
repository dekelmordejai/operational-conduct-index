"""Export canonical Python results for an offline, static interactive dashboard."""

from collections import Counter, defaultdict
import json
from pathlib import Path

from ico import __version__
from ico.engine import canonical_hash, contributions, latest_records, validate_dataset


def dashboard_payload(data, config):
    validate_dataset(data, config)
    canonical = contributions(data["records"], config)
    raw_counts = Counter(row["incident_ref"] for row in data["records"])
    sources = defaultdict(list)
    for row in latest_records(data["records"]):
        sources[row["incident_ref"]].append(row)
    return {
        "engine_version": __version__,
        "methodology": config,
        "input_sha256": canonical_hash(data),
        "config_sha256": canonical_hash(config),
        "coverage": data["exposure_coverage"],
        "source_complete": data["source_complete"],
        "operators": data["operators"],
        "seed": data.get("seed"),
        "events": [{**event, "input_count": raw_counts[event["incident_ref"]],
                    "evidence": sources[event["incident_ref"]]} for event in canonical],
        "exposure": data["exposure"],
    }


def export_dashboard(data, config, destination):
    destination = Path(destination)
    destination.mkdir(parents=True, exist_ok=True)
    payload = dashboard_payload(data, config)
    # Escaping '<' prevents script terminators if a future label contains markup.
    serialized = json.dumps(payload, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    serialized = serialized.replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    (destination / "data.js").write_text("globalThis.ICO_DATA=" + serialized + ";\n", encoding="utf-8")
    return payload
