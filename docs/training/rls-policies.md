# RLS y seguridad

- El contenido editorial activo es legible por usuarios autenticados.
- Las reglas de evaluación no tienen política `SELECT`.
- Sesiones, respuestas, dominio, repasos y racha se filtran por `auth.uid()`.
- No se permiten escrituras directas de score, mastery o racha al rol autenticado.
- Las mutaciones críticas usan RPC `security definer` con `search_path=public` y validación de propiedad.
- `client_attempt_id` es único por usuario para evitar duplicados.
