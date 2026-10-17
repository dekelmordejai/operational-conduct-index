# Índice de Conducta Operativa · ICO

**Ingeniería de datos y analítica explicable para evaluar eventos de conducta operativa sin penalizaciones duplicadas.**

[English](README.en.md) · [Metodología](docs/methodology.md) · [Arquitectura](docs/architecture.md) · [Roadmap](docs/roadmap.md)

> Proyecto independiente de portafolio. Datos 100% sintéticos. No es un producto oficial ni está conectado a sistemas de transporte, autoridades o datos de personas reales. La metodología de la demo es ilustrativa y no está calibrada para decisiones laborales.

## El problema

Un mismo hecho puede registrarse como reporte operativo, infracción y hecho de tránsito. Sumar registros puede penalizarlo varias veces. Comparar conteos entre empresas con distinto kilometraje introduce otro sesgo.

Este proyecto conserva la evidencia, produce una sola contribución por evento y agrega numeradores y exposición antes de calcular tasas.

**Ejemplo:** un reporte operativo de 8 puntos y una infracción válida de 2 puntos comparten una referencia explícita. La política demostrativa `H > I > R` conserva ambos registros y asigna 2 puntos al componente I; no suma 10 ni compara severidades de unidades distintas.

## Qué funciona en v0.1.0

- Generador con semilla: 17 empresas, 8 rutas ficticias, 136 operadores y 365 días.
- Validación de catálogos, identidades, estados, revisiones y exposición.
- Ingesta idempotente, selección de última revisión y vinculación por referencia explícita.
- Contribuciones exclusivas, ponderación y tasas por empresa, empresa–línea, línea y sistema.
- Acumulados individuales, sin afirmar comparabilidad por exposición.
- Referencias fijas versionadas, hashes de entradas y explicación por evento.
- Informe HTML local, JSON de auditoría y pruebas automatizadas.

**Pendiente:** vinculación aproximada, revisión interactiva, instantáneas históricas por fecha de conocimiento, DuckDB/Parquet, API y dashboard interactivo. Consulta [las limitaciones](docs/limitations-and-responsible-use.md).

## Ejecutar desde cero

Requisito: Python 3.11 o superior. Ejecuta desde la raíz del repositorio. El motor y las pruebas usan únicamente la biblioteca estándar; no necesitan cuenta, credenciales ni descargas de datos.

**PowerShell:**

```powershell
$env:PYTHONPATH = "src"
python -m unittest discover -s tests -v
python -m ico.cli demo --seed 42 --days 365 --output generated
Start-Process generated/report.html
```

**macOS / Linux:**

```bash
export PYTHONPATH=src
python -m unittest discover -s tests -v
python -m ico.cli demo --seed 42 --days 365 --output generated
```

Abre `generated/report.html` en tu navegador. `generated/results.json` contiene componentes, tasas, exclusiones, alertas y enlaces a registros de evidencia. `generated/synthetic-data.json` contiene la entrada íntegra.

Instalación opcional: `python -m pip install -e .`; después puedes usar `ico demo` desde la raíz. La configuración se pasa con `--config`.

## Cómo interpretar el índice

`ICO_riesgo = 0.30 R + 0.30 H + 0.40 I`, una vez que cada componente fue normalizado por exposición y escalado con su referencia fija.

- Menor es mejor, en una escala ilustrativa 0–1.
- R: vueltas deducidas; H: severidad de hechos viales; I: severidad de infracciones válidas.
- Tasas: puntos por 100 000 km. Empresa, línea y sistema usan suma de puntos / suma de km.
- Datos incompletos o exposición inválida: `null` con motivo; nunca un cero favorable.
- La referencia fija no es un umbral de seguridad. Los valores que la exceden se identifican en JSON.
- Operadores: se muestran acumulados separados por componente; no se publica un ranking ajustado sin exposición individual.

[Decisiones y contradicciones](docs/methodology-gaps.md) explica qué procede de la especificación conceptual y qué se eligió para esta implementación.

## Recorrido técnico

```text
Datos sintéticos → validación → últimas revisiones → eventos canónicos
  → elegibilidad → asignación exclusiva → severidad → agregación y exposición
  → escalamiento fijo → JSON auditable + informe HTML
```

El motor es independiente de la interfaz. El MVP prioriza una ejecución simple y verificable; la arquitectura futura incluye SQL/DuckDB y una interfaz interactiva cuando aporten valor.

## Calidad y reproducibilidad

La suite comprueba ejemplos manuales, exclusividad, falsas fusiones, revocación, invariancia por división de empresas, proporcionalidad de exposición, monotonicidad con referencia fija, datos incompletos y un año sintético completo.

La CI ejecuta pruebas en Python 3.11 y 3.12 y genera la demo sin dependencias de ejecución externas. La misma semilla y configuración producen los mismos archivos JSON. [Reproducibilidad](docs/reproducibility.md).

## Uso profesional

Evidencia de modelado de dominio, calidad de datos, integración de eventos, métricas con exposición y pruebas de propiedades. Los resultados sobre datos sintéticos demuestran funcionamiento; no prueban impacto sobre seguridad real.

## Licencia y contribuciones

Código original y datos sintéticos generados: MIT, ver [LICENSE](LICENSE) y [NOTICE.md](NOTICE.md). No se redistribuyen documentos institucionales ni catálogos normativos reales. [Contribuir](CONTRIBUTING.md) · [Seguridad](SECURITY.md).
