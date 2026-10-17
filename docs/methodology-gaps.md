# Decisiones y diferencias de la especificación conceptual

Este resumen original no reproduce ni redistribuye documentación institucional. Referencias a páginas corresponden al PDF conceptual revisado privadamente (16 páginas, versión recibida en octubre de 2026), no a una norma verificada.

| Tema | Problema | Decisión de demo | Estado |
|---|---|---|---|
| Tasas agregadas, p. 5 | Se propone sumar tasas empresariales | Sumar puntos y km antes de dividir | Implementado; desviación explícita |
| Exposición individual, pp. 5, 8, 15 | La narrativa no dispone de denominador individual; después menciona normalización | Acumulados separados sin ICO individual | Implementado |
| Min-max, pp. 15–16 | No define población, periodo o caso constante | Referencia fija cero/cap ilustrativo, versionada | Implementado; calibración pendiente |
| Dirección, pp. 10–11 | ICO bajo es favorable; gráficas SCORE alto es favorable | Una sola variable ICO_riesgo, menor es mejor | Implementado |
| Duplicados, p. 13 | Exige contar una vez, sin precedencia | Referencias explícitas y H > I > R | Hipótesis implementada; validación pendiente |
| Reportes e infracciones, pp. 6–9 | Catálogos solapados | Evidencia múltiple, contribución única | Implementado con catálogo ficticio |
| Regla 999-1, pp. 7–9 | Obligación afirmativa; transferencia no demuestra infracción | No automatizar equivalencias normativas | Catálogo real excluido |
| Responsabilidad, pp. 7–8 y 13 | Institución y operador no son equivalentes | operator/company/external/pending separados | Implementado |
| Lesionados, p. 8 | Factor 1.5 no especifica tratamiento por persona | Multiplicación única si hay lesionados | Hipótesis implementada |
| Fallecidos, pp. 7–8 | Falta campo de entrada y hay alerta para baja | Campo y alerta de revisión humana; sin decisión laboral | Implementado |
| No procedentes, p. 9 | No define efecto sobre otro registro validado del hecho | Elegibilidad independiente, exclusividad posterior | Hipótesis implementada |
| Severidades, p. 7 | Orden requiere justificación empírica | Catálogo ficticio configurable; no declarar validación | Pendiente de validación |
| Fechas y correcciones | No cierra periodos ni reconstrucción histórica | Rango inclusivo y última revisión disponible | Histórico as-of pendiente |

Las hipótesis permiten ejecutar una demo honesta; no convierten la metodología conceptual en una metodología aprobada. Toda extensión debe documentar evidencia, alternativas, impactos y versión.
