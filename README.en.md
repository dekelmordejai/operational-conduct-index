# Operational Conduct Index · ICO

An independent portfolio project demonstrating auditable event integration and exposure-based transport analytics. [Español](README.md).

**All data is synthetic.** This is not an official institutional product, a production integration, or a calibrated employment decision tool.

**[Open the interactive dashboard →](https://dekelmordejai.github.io/operational-conduct-index/)**

## Interactive dashboard · v0.2.0

Filter by date range, company and route; inspect monthly or weekly trends, compare exposure-adjusted rates and open each event's evidence. Export the current summary and filtered events as CSV. The responsive interface runs entirely in the browser with bundled synthetic data and no external libraries or API calls. You can also open `dashboard/index.html` offline.

Python resolves canonical events. Browser aggregation is verified against the Python engine across 12 scenarios, including partial periods and incomplete data. The full Python suite contains 32 tests. GitHub Pages deploys the dashboard after CI succeeds. [Dashboard documentation](docs/dashboard.md).

## Working demonstration

The standard-library Python engine generates a seeded fictional year (17 companies, 8 routes, 136 operators), validates records, collapses retries, selects latest revisions, links explicit incident references and applies one exclusive contribution per incident.

It computes company, company–line, line and system rates from summed points and kilometres. Missing data returns a non-calculable result with reasons. Individual operators receive component totals without exposure-adjusted ranking.

```bash
export PYTHONPATH=src
python -m unittest discover -s tests -v
python -m ico.cli demo --seed 42 --days 365 --output generated
```

On PowerShell use `$env:PYTHONPATH = "src"` instead of `export`. Requires Python 3.11+. Open `generated/report.html`; inspect `generated/results.json` for the event audit trail.

## Methodology

The demonstration weights R (operating reports) at 30%, H (traffic incidents) at 30%, and I (validated infringements) at 40%. It applies illustrative exclusive precedence `H > I > R`, rates per 100,000 km and fixed zero-baseline reference caps. Lower `ico_risk` is better. Reference caps are arbitrary demonstration parameters, not validated safety thresholds.

## Explicit limits

No fuzzy matching, live institutional APIs, interactive adjudication, as-of historical reconstruction or individual exposure estimation. The generator's shared references are inputs to exact linkage, not evidence of entity-resolution accuracy. DuckDB/Parquet remain roadmap items.

Read [architecture](docs/architecture.md), [methodology](docs/methodology.md), [decisions](docs/methodology-gaps.md), [data dictionary](docs/data-dictionary.md) and [roadmap](docs/roadmap.md). Technical documentation is currently in Spanish.

Original code and generated synthetic data are MIT licensed. No institutional source documents are redistributed. See [NOTICE](NOTICE.md).
