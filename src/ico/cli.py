"""Credential-free, standard-library demo: python -m ico.cli demo."""

import argparse
import html
import json
from pathlib import Path

from ico import __version__
from ico.engine import calculate
from ico.synthetic import generate


def report_html(result):
    rows = []
    for row in result["results"]:
        risk = row["ico_risk"]
        label = f"{risk:.3f}" if risk is not None else "N/A"
        issues = ", ".join(row["quality_issues"]) or "complete"
        rows.append("<tr>" + "".join(f"<td>{html.escape(str(value))}</td>" for value in
                    [row["level"], row["entity"], round(row["km"]), label, issues]) + "</tr>")
    q = result["quality"]
    return f"""<!doctype html><html lang="es"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ICO · Demostración sintética</title>
<style>body{{font:16px system-ui;max-width:1100px;margin:40px auto;padding:0 20px;background:#f5f7fa;color:#172b4d}}
header,section{{background:white;padding:24px;border-radius:12px;margin:20px 0}}h1{{margin-top:0}}
table{{width:100%;border-collapse:collapse}}td,th{{padding:10px;border-bottom:1px solid #ddd;text-align:left}}
.notice{{border-left:5px solid #7659bd}}code{{overflow-wrap:anywhere}}details{{margin:20px 0}}
</style><header><p>TRANSPORTE · CALIDAD DE DATOS · TRAZABILIDAD</p>
<h1>Índice de Conducta Operativa</h1><p>Demostración independiente con datos 100% sintéticos.</p>
<p>{result['period']['start']} → {result['period']['end']}</p></header>
<section class="notice"><b>Menor ICO_riesgo representa menor carga adversa relativa.</b>
<p>Escala ilustrativa 0–1 con referencias fijas; no son umbrales de seguridad calibrados.
No automatiza sanciones ni decisiones laborales. Los acumulados individuales no ajustan por exposición.</p></section>
<section><h2>Calidad e integración</h2><p>{q['input_records']} registros de entrada ·
{q['latest_records']} registros vigentes · {q['canonical_events_in_period']} eventos canónicos ·
{q['eligible_events_in_period']} eventos elegibles.</p></section>
<section><h2>Resultados por ámbito</h2><table><thead><tr><th>Nivel</th><th>Entidad</th><th>km</th>
<th>ICO_riesgo</th><th>Calidad</th></tr></thead><tbody>{''.join(rows)}</tbody></table></section>
<section><h2>Auditoría</h2><p>Versión {html.escape(result['methodology'])} · motor {__version__}</p>
<p>SHA-256 de datos: <code>{result['input_sha256']}</code></p>
<p>El archivo results.json incluye componentes, tasas y selección de evidencia para cada evento.</p>
</section></html>"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    demo = sub.add_parser("demo", help="Generate synthetic data and an auditable HTML report")
    demo.add_argument("--seed", type=int, default=42)
    demo.add_argument("--days", type=int, default=365)
    demo.add_argument("--output", type=Path, default=Path("generated"))
    demo.add_argument("--config", type=Path, default=Path("config/methodology-v1.json"))
    args = parser.parse_args()
    config = json.loads(args.config.read_text(encoding="utf-8"))
    data = generate(seed=args.seed, days=args.days)
    result = calculate(data, config, data["exposure_coverage"]["start"], data["exposure_coverage"]["end"])
    result["engine_version"] = __version__
    args.output.mkdir(parents=True, exist_ok=True)
    for name, value in [("synthetic-data.json", data), ("results.json", result)]:
        (args.output / name).write_text(json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False) + "\n", encoding="utf-8")
    (args.output / "report.html").write_text(report_html(result), encoding="utf-8")
    print(f"Synthetic demo written to {args.output.resolve()}")


if __name__ == "__main__":
    main()
