# Seguridad de role-play

Todas las operaciones exigen autenticación, ownership y resolución de permisos en servidor. Las tablas tienen RLS activo y la escritura sensible usa service role/RPC. No se exponen contexto privado, prompts, rúbricas internas ni modelos elegibles.

Se validan longitud, rate limit, concurrencia, duración, turnos, plan, dificultad e idempotencia. Intentos de inyección se registran en `training_roleplay_safety_events`.
