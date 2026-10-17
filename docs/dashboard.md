# Dashboard interactivo v0.2.0

[Abrir demo pública](https://dekelmordejai.github.io/operational-conduct-index/).

## Experiencia

Panorama del ámbito seleccionado con ICO_riesgo, eventos elegibles, exposición y registros consolidados. Gráfica mensual o semanal del índice o de eventos; composición ponderada; tabla comparativa de empresas/líneas; búsqueda y paginación de eventos; modal de evidencia, método y procedencia; exportaciones CSV.

Los filtros superiores (fechas, empresa y línea) actualizan toda la vista. Los filtros del explorador afectan solo a su tabla y exportación de eventos; no modifican el ICO. Los filtros incompatibles de empresa/línea se deshabilitan. Un rango inválido no sustituye la selección aplicada.

El cambio frente al periodo anterior se muestra solo si existe un intervalo completo anterior de igual duración dentro de la cobertura. Por ejemplo, abril–junio tiene 91 días: su periodo anterior equivalente empezaría el 31 de diciembre del año anterior, fuera del dataset. No se muestra una comparación parcial como si fuera completa.

## Fuente de verdad

La asignación de eventos, elegibilidad y severidad se calcula en Python. `src/ico/dashboard.py` exporta `data.js`. El navegador agrega contribuciones y kilómetros, aplica la misma referencia fija y conserva los estados no calculables. No recalcula deduplicación ni permite alterar catálogos desde la interfaz.

`scripts/check_dashboard.py` compara campos calculados contra `ico.engine.calculate` para el sistema, empresas, líneas, rangos arbitrarios, selección vacía, fuentes incompletas y exposición inválida. Las pruebas verifican también que los intervalos no pierdan ni dupliquen hechos o kilómetros.

## Ejecutar y actualizar

Abre `dashboard/index.html` directamente. No hay dependencias de interfaz externas, fuentes remotas, APIs o credenciales. Para servir una vista previa opcional: `python -m http.server 8765 --directory dashboard`.

Desde la raíz y con `PYTHONPATH=src`:

```text
python scripts/build_dashboard.py
python -m unittest discover -s tests -v
python scripts/check_dashboard.py
```

La última instrucción requiere Node.js 20+. Los archivos de interfaz son HTML/CSS/JavaScript sin proceso de empaquetado. La CI comprueba que el dataset comprometido coincide con el regenerado, valida ambas implementaciones y publica el contenido de `dashboard/` en Pages desde `main`.

## Interpretación y accesibilidad

- Referencias fijas y pesos visibles; escala ilustrativa 0–1, menor es mejor.
- Conteos y tasas se etiquetan por separado. No se presenta ranking individual sin exposición.
- Se mantienen puntos por componente y evidencia de registros excluidos.
- Controles nativos, enlace de salto, estados de selección, texto alternativo de gráficos y puntos explorables mediante teclado.
- Diálogos nativos con cierre mediante Escape; navegación móvil y tablas con desplazamiento horizontal propio.
- Se respeta la preferencia de movimiento reducido.
- No se ha realizado una auditoría formal WCAG ni validación de dominio para decisiones reales.

## Exportaciones

Resumen: ámbito, fechas, puntos, tasas, ICO y estado de calidad. Eventos: filas que coinciden con los filtros de búsqueda, componente y vinculación actuales. CSV UTF-8 con BOM para facilitar apertura en hojas de cálculo; celdas entrecomilladas y neutralización de prefijos de fórmulas.

Los datos son íntegramente ficticios y se envían únicamente al propio navegador. Las descargas son locales; la interfaz no envía los filtros o selecciones a un servidor de analítica.
