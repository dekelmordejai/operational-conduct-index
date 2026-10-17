# Metodología demostrativa v1

## Unidad de evaluación

Un evento canónico representa un hecho explícitamente referenciado. Sus registros originales se conservan en la entrada. Un evento puede contribuir a un solo componente. El MVP requiere un operador, empresa, línea y fecha consistentes entre todos los registros vinculados; un conflicto detiene el cálculo y requiere revisión fuera del sistema.

## Elegibilidad y estados

Se evalúan registros `valid` con responsabilidad `operator`. `pending`, `dismissed`, responsabilidad empresarial, externa o pendiente no contribuyen. No se eliminan de la entrada ni de la explicación del evento.

La demo decide elegibilidad por registro. Una infracción desestimada no invalida por sí misma un reporte operativo distinto que siga validado; ese reporte puede contribuir a R. Una revocación de todo el hecho debe reflejarse en las revisiones de todos los registros aplicables. Esta es una política ilustrativa, pendiente de validación de dominio.

Las revisiones son ordinales positivas. Para cada `(source, source_id)` se usa la mayor revisión. Dos contenidos diferentes para la misma revisión son un error. Esta selección NO reconstruye el conocimiento disponible a una fecha pasada.

## Componentes y asignación

- R: catálogo ficticio de vueltas deducidas 1, 2, 4 u 8.
- H: catálogo ficticio de severidad 1, 2 o 3; multiplicar una sola vez por 1.5 si `injured > 0`.
- I: catálogo ficticio de severidad 1 o 2.

Entre componentes elegibles se aplica `H > I > R`. Dentro del mismo componente se aceptan registros equivalentes; alegaciones incompatibles requieren revisión. La precedencia es un supuesto de la demo, no una decisión institucional. No se suman ni comparan directamente unidades de catálogos diferentes.

Los fallecidos generan una alerta para revisión humana; no alteran puntos automáticamente. El sistema no determina sanciones ni bajas.

## Agregación y exposición

Para componente c, grupo g y periodo inclusivo t:

`P[c,g,t] = suma de puntos de eventos elegibles asignados a c`

`T[c,g,t] = 100000 × P[c,g,t] / KM[g,t]`

Los niveles empresa, empresa–línea, línea y sistema suman puntos y exposición antes de dividir. Nunca se suman tasas de empresas. Para periodos mayores se recalcula desde los hechos, no se promedian índices semanales.

La entrada declara cobertura completa de las fuentes y exposición dentro de un intervalo. Es una afirmación del productor de datos, no inferida por el motor. Debe incluir cada celda operativa empresa–línea–día; no incluye días sin operación. El motor detecta duplicados de grano, km nulos/negativos, total cero y eventos sin celda de exposición, pero no puede detectar una celda omitida sin evento si el productor declara cobertura completa incorrectamente.

Una fuente incompleta invalida conservadoramente el ICO de todos los grupos. Exposición incompleta, ausente o cero invalida el ámbito correspondiente. Los puntos observados permanecen disponibles. No se redistribuyen pesos.

## Escala y composición

`Z[c] = min(1, T[c] / reference_cap[c])`

`ICO_riesgo = 0.30 Z[R] + 0.30 Z[H] + 0.40 Z[I]`

Los caps fijos ilustrativos son R=150, H=100, I=100 puntos por 100000 km; límite inferior cero. Son arbitrarios y están versionados. No se estima min-max sobre la muestra consultada, no se representan como umbrales normativos y no justifican intervención. El JSON conserva tasas sin recortar y señala excedencias. La saturación puede ocultar diferencias en el índice, por lo que siempre deben inspeccionarse las tasas originales.

Cambiar catálogo, referencia o precedencia requiere nueva versión y recálculo; resultados de versiones distintas no son directamente comparables. Una sensibilidad formal sigue pendiente.

## Operadores

Se muestran los acumulados de cada componente para todo el padrón, incluidos operadores con cero eventos. No se compone un ICO individual ni un ranking normalizado al carecer de exposición individual. Con fuentes incompletas, los acumulados se identifican como observados incompletos.
