import copy
import json
from pathlib import Path
import unittest

from ico.cli import report_html
from ico.engine import calculate, contributions, latest_records
from ico.synthetic import generate

CONFIG = json.loads(Path("config/methodology-v1.json").read_text(encoding="utf-8"))


def fixture():
    row = {"source": "reports", "source_id": "1", "revision": 1, "incident_ref": "incident-1",
           "date": "2025-01-01", "operator": "SYN-OP-1", "company": "SYN-CO-A", "line": "SYN-L-1",
           "component": "R", "code": "RO-04", "status": "valid", "responsibility": "operator",
           "injured": 0, "fatalities": 0}
    return {"operators": ["SYN-OP-1", "SYN-OP-2"], "records": [row],
            "exposure": [{"date": row["date"], "company": row["company"], "line": row["line"], "km": 100000}],
            "source_complete": {"R": True, "H": True, "I": True},
            "exposure_coverage": {"start": row["date"], "end": row["date"], "complete": True}}


def run(data, config=CONFIG):
    return calculate(data, config, "2025-01-01", "2025-01-01")


def system(result):
    return next(r for r in result["results"] if r["level"] == "system")


class EngineTests(unittest.TestCase):
    def test_manual_formula(self):
        row = system(run(fixture()))
        self.assertEqual(row["rates_per_100k_km"]["R"], 8)
        self.assertAlmostEqual(row["ico_risk"], 0.3 * 8 / 150)

    def test_retry_idempotence(self):
        data = fixture()
        before = system(run(data))
        data["records"].append(dict(data["records"][0]))
        self.assertEqual(before, system(run(data)))

    def test_cross_source_exclusivity(self):
        data = fixture()
        data["records"].append({**data["records"][0], "source": "infringements", "component": "I", "code": "IF-02"})
        result = run(data)
        self.assertEqual(system(result)["points"], {"R": 0, "H": 0, "I": 2})
        self.assertEqual(len(result["contributions"][0]["linked_records"]), 2)

    def test_distinct_same_day_incidents_remain_distinct(self):
        data = fixture()
        data["records"].append({**data["records"][0], "source_id": "2", "incident_ref": "incident-2"})
        self.assertEqual(system(run(data))["points"]["R"], 16)

    def test_pending_and_dismissed_excluded(self):
        for status in ("pending", "dismissed"):
            data = fixture()
            data["records"][0]["status"] = status
            self.assertEqual(system(run(data))["ico_risk"], 0)

    def test_nonoperator_responsibility_excluded(self):
        for responsibility in ("company", "external", "pending"):
            data = fixture()
            data["records"][0]["responsibility"] = responsibility
            self.assertEqual(system(run(data))["points"]["R"], 0)

    def test_revision_revocation(self):
        data = fixture()
        data["records"].append({**data["records"][0], "revision": 2, "status": "dismissed"})
        self.assertEqual(system(run(data))["ico_risk"], 0)

    def test_conflicting_revision_rejected(self):
        data = fixture()
        data["records"].append({**data["records"][0], "status": "pending"})
        with self.assertRaises(ValueError):
            run(data)

    def test_incident_identity_conflict_rejected(self):
        data = fixture()
        data["records"].append({**data["records"][0], "source_id": "2", "operator": "SYN-OP-2"})
        with self.assertRaises(ValueError):
            run(data)

    def test_multiple_allegations_require_review(self):
        data = fixture()
        data["records"].append({**data["records"][0], "source_id": "2", "code": "RO-01"})
        with self.assertRaises(ValueError):
            run(data)

    def test_injury_factor_applied_once(self):
        data = fixture()
        data["records"][0].update(component="H", code="HT-03", injured=4)
        self.assertEqual(system(run(data))["points"]["H"], 4.5)

    def test_fatality_alert_does_not_change_points(self):
        data = fixture()
        data["records"][0].update(component="H", code="HT-03", fatalities=1)
        result = run(data)
        self.assertTrue(result["contributions"][0]["human_review_alert"])
        self.assertEqual(system(result)["points"]["H"], 3)

    def test_zero_and_missing_exposure_fail_closed(self):
        for value in (None, 0):
            data = fixture()
            data["exposure"][0]["km"] = value
            self.assertIsNone(system(run(data))["ico_risk"])

    def test_incomplete_source_not_zero(self):
        data = fixture()
        data["source_complete"]["H"] = False
        self.assertIsNone(system(run(data))["ico_risk"])

    def test_unknown_catalog_rejected(self):
        data = fixture()
        data["records"][0]["code"] = "unknown"
        with self.assertRaises(ValueError):
            run(data)

    def test_zero_event_operator_preserved(self):
        self.assertEqual(run(fixture())["operators"][1]["points"], {"R": 0, "H": 0, "I": 0})

    def test_company_split_invariance(self):
        data = fixture()
        before = system(run(data))
        data["exposure"][0]["km"] = 40000
        data["exposure"].append({**data["exposure"][0], "company": "SYN-CO-B", "km": 60000})
        self.assertEqual(before, system(run(data)))

    def test_doubling_points_and_exposure_preserves_rate(self):
        data = fixture()
        before = system(run(data))["ico_risk"]
        data["records"].append({**data["records"][0], "source_id": "2", "incident_ref": "incident-2"})
        data["exposure"][0]["km"] *= 2
        self.assertEqual(before, system(run(data))["ico_risk"])

    def test_monotonicity_under_fixed_reference(self):
        data = fixture()
        before = system(run(data))["ico_risk"]
        data["records"].append({**data["records"][0], "source_id": "2", "incident_ref": "incident-2"})
        self.assertGreaterEqual(system(run(data))["ico_risk"], before)

    def test_order_independence(self):
        data = generate(seed=7, days=10, company_count=2)
        before = contributions(data["records"], CONFIG)
        self.assertEqual(before, contributions(list(reversed(data["records"])), CONFIG))

    def test_seed_reproducibility(self):
        self.assertEqual(generate(seed=42, days=10), generate(seed=42, days=10))
        self.assertNotEqual(generate(seed=42, days=10), generate(seed=43, days=10))

    def test_invalid_weights_rejected(self):
        config = copy.deepcopy(CONFIG)
        config["weights"]["R"] = 0.8
        with self.assertRaises(ValueError):
            run(fixture(), config)

    def test_invalid_numeric_values_rejected(self):
        for value in (-1, float("nan"), float("inf"), True):
            data = fixture()
            data["exposure"][0]["km"] = value
            with self.assertRaises(ValueError):
                run(data)

    def test_missing_operating_cell_fail_closed(self):
        data = fixture()
        data["exposure"][0]["company"] = "SYN-CO-B"
        self.assertIsNone(system(run(data))["ico_risk"])

    def test_incomplete_exposure_coverage(self):
        data = fixture()
        data["exposure_coverage"]["complete"] = False
        self.assertIsNone(system(run(data))["ico_risk"])

    def test_outside_period_does_not_count(self):
        data = fixture()
        data["records"][0]["date"] = "2024-12-31"
        self.assertEqual(system(run(data))["ico_risk"], 0)

    def test_reference_exceedance_visible(self):
        data = fixture()
        data["exposure"][0]["km"] = 1
        row = system(run(data))
        self.assertEqual(row["scaled"]["R"], 1)
        self.assertIn("R", row["reference_exceeded"])

    def test_html_escapes_entity_names(self):
        result = run(fixture())
        result["results"][0]["entity"] = "<script>alert(1)</script>"
        report = report_html(result)
        self.assertNotIn("<script>", report)
        self.assertIn("&lt;script&gt;", report)

    def test_full_year_acceptance(self):
        data = generate()
        result = calculate(data, CONFIG, "2025-01-01", "2025-12-31")
        self.assertEqual(len(result["operators"]), 136)
        self.assertEqual(len(data["exposure"]), 17 * 365)
        self.assertTrue(all(r["ico_risk"] is not None for r in result["results"]))
        self.assertLessEqual(result["quality"]["eligible_events_in_period"], result["quality"]["canonical_events_in_period"])


if __name__ == "__main__":
    unittest.main()
