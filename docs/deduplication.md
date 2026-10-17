# Vinculación y deduplicación

## Implementado

1. Colapsar reintentos idénticos mediante fuente/ID/revisión.
2. Rechazar versiones con el mismo identificador y contenido contradictorio.
3. Seleccionar la última revisión disponible.
4. Agrupar por referencia explícita del hecho.
5. Verificar consistencia de operador, empresa, línea y fecha.
6. Rechazar alegaciones incompatibles dentro del mismo componente.
7. Aplicar elegibilidad y precedencia de componentes.
8. Conservar selección y vínculos en las contribuciones del resultado.

Dos eventos con IDs de hecho distintos permanecen distintos aunque sucedan el mismo día al mismo operador. Si una fuente asigna IDs diferentes al mismo hecho, el MVP no puede detectarlo. Una referencia errónea compartida tampoco demuestra identidad; los controles de consistencia solo detectan algunos errores.

## Pendiente

Generación de candidatos con hora, vehículo y ubicación; confianza; cola de revisión; fusiones reversibles; separación de incidentes y alegaciones; medición de precisión/recobrado sobre una verdad sintética reservada al evaluador. No se reportan métricas de entity resolution antes de implementar esa evaluación.
