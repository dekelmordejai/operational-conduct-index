# Datos sintéticos

`samples/synthetic-week.json` contiene una semana pequeña generada con semilla 42 y dos empresas ficticias. No procede de anonimizar datos reales.

La ejecución completa se genera localmente y se excluye de Git mediante `generated/`. El esquema efectivo y las restricciones están documentados en `docs/data-dictionary.md` y comprobados por `validate_dataset`.

La muestra conserva IDs explícitos de incidente para probar vinculación exacta. No constituye una evaluación de vinculación aproximada. La cobertura declarada es parte del contrato del productor.
