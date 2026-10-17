# Diccionario de datos v1

Todos los identificadores y códigos son ficticios. Fechas ISO `YYYY-MM-DD`; representan fecha operativa local sin inferir horas o zona horaria. El MVP no tiene precisión suficiente para vinculación temporal aproximada.

| Colección/campo | Tipo y significado |
|---|---|
| `operators` | Lista única de IDs; padrón para incluir ceros |
| `records.source, source_id, revision` | Identidad y revisión positiva de un registro de origen |
| `records.incident_ref` | Identificador explícito compartido del mismo hecho |
| `records.date` | Fecha de ocurrencia, no de ingesta ni validación |
| `records.operator, company, line` | Adscripción en el momento del evento |
| `records.component` | R, H o I |
| `records.code` | Código presente en catálogo ficticio de ese componente |
| `records.status` | valid / pending / dismissed |
| `records.responsibility` | operator / company / external / pending |
| `records.injured, fatalities` | Enteros no negativos |
| `exposure.date, company, line` | Clave única de celda operativa diaria |
| `exposure.km` | Número no negativo o null cuando falta |
| `source_complete` | Tres booleanos: cobertura de R, H e I para la entrada |
| `exposure_coverage` | Inicio, fin inclusivos y declaración de completitud |
| `results.level, entity` | company / company_line / line / system |
| `results.points` | Sumas de puntos exclusivos por componente |
| `results.km` | Suma de exposición del ámbito |
| `results.rates_per_100k_km` | Tasas por componente o null si no calculable |
| `results.scaled, ico_risk` | Valores con referencia fija o null |
| `results.reference_exceeded` | Componentes cuya tasa supera el cap ilustrativo |
| `results.quality_issues` | Razones que impiden calcular |
| `contributions` | Hecho, componente elegido, puntos, registros vinculados, motivo y alerta |
| `input_sha256, config_sha256` | Huellas de entrada y configuración canonicalizadas |

La entrada admite campos adicionales, pero estos no cambian el cálculo salvo que se incorporen explícitamente al motor. No introducir datos personales o texto libre real.

## Modelo futuro (no implementado)

Separar operadores, empresas, líneas y vehículos; asignaciones con intervalos; registros originales; eventos canónicos; vínculos; historial de validaciones; catálogos con vigencia; exposición conciliada y sus revisiones; ejecuciones y resultados por versión. Añadir occurred_at/ingested_at/validated_at y fecha de corte para reconstrucción histórica.
