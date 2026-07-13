# Flujo de datos

1. `create_training_session(template_id)` verifica `auth.uid()`, crea la sesión y congela snapshots públicos.
2. El cliente muestra el snapshot sin reglas de evaluación.
3. `submit_training_answer` verifica propiedad, estado e idempotencia, evalúa y devuelve feedback seguro.
4. `complete_training_session` finaliza una sola vez y actualiza derivados.

El servidor es la fuente de verdad. `localStorage` permanece como respaldo temporal y para modo mock/offline.
