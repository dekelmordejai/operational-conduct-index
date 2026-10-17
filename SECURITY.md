# Seguridad

Esta demo procesa únicamente datos sintéticos y no requiere secretos. No introduzcas credenciales ni datos operativos reales.

Para comunicar una vulnerabilidad, utiliza el canal privado de reporte de GitHub si está habilitado. Si no lo está, abre un issue solicitando un canal privado, sin publicar detalles explotables ni información sensible. No se garantiza un plazo de respuesta.

Antes de publicar: revisar contenido e historial, omitir documentos de origen y comprobar que los ejemplos sean ficticios. Los reportes HTML escapan nombres de entidades. El motor no ejecuta contenido de entrada ni realiza llamadas de red.

La CI usa permisos de lectura y no recibe secretos. No usar `pull_request_target` para ejecutar código de contribuciones externas. Las acciones se fijan por commit; los cambios de dependencias deben revisarse.

El trabajo de publicación en GitHub Pages tiene permisos `pages: write` e `id-token: write`, limitados a ese trabajo y a `main` después de pruebas exitosas. Solo publica la carpeta `dashboard/`. La interfaz no hace solicitudes a APIs ni a CDNs. Los CSV neutralizan prefijos interpretables como fórmulas; los valores de evidencia se escapan antes de insertarse en HTML. El dashboard no acepta cargas de datos reales.
