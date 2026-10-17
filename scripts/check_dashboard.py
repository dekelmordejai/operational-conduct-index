"""Verify the static aggregation against the Python engine across filter scenarios."""

import argparse
import copy
import json
from pathlib import Path
import subprocess
import tempfile

from ico.dashboard import dashboard_payload
from ico.engine import calculate
from ico.synthetic import generate


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--node", default="node")
    args = parser.parse_args()
    config = json.loads(Path("config/methodology-v1.json").read_text(encoding="utf-8"))
    base = generate()
    cases = []
    scenarios = [
        ("2025-01-01", "2025-12-31", "", ""),
        ("2025-04-01", "2025-06-30", "", ""),
        ("2025-01-01", "2025-01-01", "", ""),
        ("2025-02-13", "2025-04-08", "SYN-CO-03", ""),
        ("2025-07-01", "2025-12-31", "", "SYN-L-01"),
        ("2025-09-01", "2025-09-30", "SYN-CO-09", "SYN-L-01"),
        ("2025-01-01", "2025-12-31", "SYN-CO-01", "SYN-L-02"),
    ]
    for start, end, company, line in scenarios:
        filtered = {**base, "records": [r for r in base["records"] if (not company or r["company"] == company) and (not line or r["line"] == line)],
                    "exposure": [r for r in base["exposure"] if (not company or r["company"] == company) and (not line or r["line"] == line)]}
        result = calculate(filtered, config, start, end)
        cases.append({"payload": dashboard_payload(base, config),
                      "filters": {"start": start, "end": end, "company": company, "line": line},
                      "expected": next(r for r in result["results"] if r["level"] == "system")})
    for failure in ("zero", "missing", "source", "coverage", "missing_cell"):
        changed = copy.deepcopy(base)
        if failure in ("zero", "missing"):
            for row in changed["exposure"]:
                row["km"] = 0 if failure == "zero" else None
        elif failure == "source":
            changed["source_complete"]["H"] = False
        elif failure == "coverage":
            changed["exposure_coverage"]["complete"] = False
        else:
            changed["exposure"] = changed["exposure"][300:]
        result = calculate(changed, config, "2025-01-01", "2025-12-31")
        cases.append({"payload": dashboard_payload(changed, config),
                      "filters": {"start": "2025-01-01", "end": "2025-12-31", "company": "", "line": ""},
                      "expected": next(r for r in result["results"] if r["level"] == "system")})
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "parity-cases.json"
        path.write_text(json.dumps(cases), encoding="utf-8")
        subprocess.run([args.node, "tests/dashboard-parity.cjs", str(path)], check=True)


if __name__ == "__main__":
    main()
