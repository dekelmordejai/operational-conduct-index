# Caso de estudio reproducible · v0.1.0

## Problema

Integrar reportes operativos, infracciones y hechos viales sin contar repetidamente un mismo hecho y sin comparar empresas únicamente por sus volúmenes brutos.

## Implementación

Se conservan registros de origen, se colapsan reintentos, se seleccionan revisiones vigentes, se vinculan referencias explícitas y se genera una sola contribución por evento. El cálculo agrega puntos y kilómetros antes de obtener tasas. Las decisiones no cerradas por la especificación se documentan como hipótesis.

## Ejecución verificada

Comando: `python -m ico.cli demo --seed 42 --days 365 --output generated`, con `PYTHONPATH=src`, desde la raíz. Verificado localmente con Python 3.12.14.

| Resultado | Valor |
|---|---:|
| Empresas ficticias | 17 |
| Rutas ficticias | 8 |
| Operadores | 136 |
| Celdas empresa–línea–día | 6205 |
| Registros de entrada | 1769 |
| Registros vigentes tras reintentos/revisiones | 1494 |
| Eventos canónicos | 1376 |
| Eventos elegibles | 886 |
| Exposición total sintética | 7495894 km |
| ICO_riesgo del sistema | 0.0774023752 |

Las diferencias entre registros, eventos y contribuciones son resultados técnicos de la integración. No son estimaciones de incidentes evitados ni mejoras de seguridad real.

La suite inicial contiene 29 pruebas aprobadas localmente. La generación repetida conserva exactamente los resultados. La CI vuelve a comprobar pruebas y demo; consultar Actions para el estado remoto efectivo.

## Límites de la evidencia

La identidad del evento se entrega explícitamente y no se estima mediante un clasificador. Los caps de escalamiento son ilustrativos. No hay inferencia causal, validación normativa, conexión institucional o medición de desempeño de personas reales.
