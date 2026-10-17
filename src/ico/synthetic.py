"""Generate fictional operating cells and explicit shared incident references."""

from datetime import date, timedelta
import random


def generate(seed=42, days=365, company_count=17):
    if days < 1 or not 1 <= company_count <= 17:
        raise ValueError("days must be positive and companies between 1 and 17")
    rng = random.Random(seed)
    start = date(2025, 1, 1)
    operators = [f"SYN-OP-{i:04d}" for i in range(company_count * 8)]
    records, exposure = [], []
    counter = 0
    for day in range(days):
        current = (start + timedelta(days=day)).isoformat()
        for company in range(company_count):
            company_id = f"SYN-CO-{company+1:02d}"
            line = f"SYN-L-{company % 8 + 1:02d}"
            exposure.append({"company": company_id, "line": line, "date": current,
                             "km": rng.randint(600, 1800)})
            if rng.random() > 0.22:
                continue
            counter += 1
            component = rng.choice(["R", "R", "I", "H"])
            code = {"R": "RO-02", "I": "IF-02", "H": "HT-03"}[component]
            row = {"source": f"synthetic-{component}", "source_id": f"REC-{counter:06d}",
                   "revision": 1, "incident_ref": f"SYN-EVT-{counter:06d}",
                   "date": current, "operator": rng.choice(operators[company*8:(company+1)*8]),
                   "company": company_id, "line": line, "component": component, "code": code,
                   "status": rng.choices(["valid", "pending", "dismissed"], [8, 1, 1])[0],
                   "responsibility": rng.choices(["operator", "external", "pending"], [8, 1, 1])[0],
                   "injured": int(component == "H" and rng.random() < 0.2), "fatalities": 0}
            records.append(row)
            if counter % 5 == 0:
                records.append(dict(row))  # Exact retry, no additional contribution.
            if component == "I" and counter % 3 == 0:
                records.append({**row, "source": "synthetic-R", "source_id": row["source_id"] + "-R",
                                "component": "R", "code": "RO-04"})
    return {"synthetic": True, "seed": seed, "operators": operators, "records": records,
            "exposure": exposure, "source_complete": {"R": True, "I": True, "H": True},
            "exposure_coverage": {"start": start.isoformat(),
                                  "end": (start + timedelta(days=days-1)).isoformat(), "complete": True}}
