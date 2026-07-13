# Flujo de respuestas abiertas

1. El usuario completa `open_response`, `guided_builder`, `decision_justification` o `reflection`.
2. El cliente valida formato y longitud visible.
3. El servidor guarda respuesta y evaluación pendiente.
4. El servicio aplica cuota, idempotencia y rúbrica.
5. El proveedor devuelve JSON validado con Zod.
6. Se guardan feedback y score normalizado.
7. XState reutiliza los estados de envío, validación y feedback.

Para añadir otro tipo: amplía la unión discriminada, el esquema Zod, el renderer, el seed editorial y una versión de prompt. En local puede usarse el proveedor mock dejando la clave ausente; para desactivar IA usa los feature flags del entorno.
