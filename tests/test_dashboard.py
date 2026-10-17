import copy
import json
from pathlib import Path
import tempfile
import unittest

from ico.dashboard import dashboard_payload, export_dashboard
from ico.engine import calculate
from ico.synthetic import generate

CONFIG = json.loads(Path("config/methodology-v1.json").read_text(encoding="utf-8"))


class DashboardExportTests(unittest.TestCase):
    def test_export_matches_authoritative_contributions(self):
        data = generate(seed=42, days=40)
        payload = dashboard_payload(data, CONFIG)
        expected = calculate(data, CONFIG, "2025-01-01", "2025-02-09")
        actual = [{k: v for k, v in row.items() if k not in ("input_count", "evidence")} for row in payload["events"]]
        self.assertEqual(actual, expected["contributions"])
        self.assertEqual(payload["input_sha256"], expected["input_sha256"])
        self.assertEqual(sum(event["input_count"] for event in payload["events"]), len(data["records"]))
        self.assertEqual(sum(len(event["evidence"]) for event in payload["events"]), expected["quality"]["latest_records"])

    def test_public_payload_is_reproducible(self):
        data = generate(days=15)
        self.assertEqual(dashboard_payload(data, CONFIG), dashboard_payload(copy.deepcopy(data), CONFIG))

    def test_javascript_payload_cannot_close_script(self):
        data = generate(days=15)
        data["seed"] = "</script>\u2028"
        with tempfile.TemporaryDirectory() as directory:
            export_dashboard(data, CONFIG, directory)
            script = (Path(directory) / "data.js").read_text(encoding="utf-8")
            self.assertNotIn("</script>", script)
            self.assertNotIn("\u2028", script)
            payload = json.loads(script.removeprefix("globalThis.ICO_DATA=").removesuffix(";\n"))
            self.assertEqual(payload["seed"], data["seed"])
