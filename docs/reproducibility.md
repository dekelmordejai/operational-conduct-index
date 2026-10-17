# Reproducibilidad

Desde la raíz, con Python 3.11+ y `PYTHONPATH=src`:

```text
python -m unittest discover -s tests -v
python -m ico.cli demo --seed 42 --days 365 --output generated
```

No hay dependencias externas de ejecución ni de pruebas. No se necesita un lock de paquetes para esta ruta. La instalación opcional usa setuptools como dependencia de construcción; no se presenta como entorno herméticamente bloqueado.

Los archivos JSON se escriben con orden estable de generación, sin timestamps variables. La misma semilla, código y configuración reproducen los datos y resultados. El resultado identifica versión del motor y hashes SHA-256 de datos y configuración. Registrar también el commit Git para citar una ejecución publicada.

La CI comprueba Python 3.11 y 3.12, compila los módulos, ejecuta pruebas y genera la demo. Cambiar semilla produce otro escenario, sin representar una población real.

Para cambiar periodo, usar `calculate(data, config, start, end)` desde Python; sus límites son inclusivos. La CLI v0.1.0 genera y evalúa el periodo completo del escenario. Un rango fuera de cobertura se marca incompleto.

## Dashboard v0.2.0

`python scripts/build_dashboard.py` regenera `dashboard/data.js` con semilla 42. La exportación contiene contribuciones canónicas calculadas por Python, evidencia vigente, conteos de registros de origen y exposición diaria. No requiere servidor para abrir el dashboard.

Para verificar agregación y periodos: `python scripts/check_dashboard.py`. Esta comprobación adicional requiere Node.js 20+; acepta `--node` para una ruta explícita. No instala paquetes. Compara 12 escenarios contra Python y comprueba conservación de eventos/exposición entre intervalos contiguos y límites del periodo anterior.

La CI comprueba JavaScript, paridad y ausencia de cambios en el dataset regenerado. Solo después de superar las verificaciones publica `dashboard/` en GitHub Pages desde `main`. Las contribuciones externas ejecutan comprobaciones sin permisos de despliegue.
