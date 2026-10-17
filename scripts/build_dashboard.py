"""Build the public synthetic dashboard dataset; run with PYTHONPATH=src."""

import argparse
import json
from pathlib import Path

from ico.dashboard import export_dashboard
from ico.synthetic import generate

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--output", type=Path, default=Path("dashboard"))
parser.add_argument("--seed", type=int, default=42)
args = parser.parse_args()
config = json.loads(Path("config/methodology-v1.json").read_text(encoding="utf-8"))
payload = export_dashboard(generate(seed=args.seed), config, args.output)
print(f"Dashboard dataset: {len(payload['events'])} events, {len(payload['exposure'])} operating cells")
