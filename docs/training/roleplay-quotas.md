# Cuotas de role-play

Crear una sesión y recibir la apertura no consume. La RPC consume una vez cuando ya existen primera respuesta válida del usuario y respuesta del personaje. `session_id` y `(user_id, client_consumption_id)` hacen el consumo idempotente.

Pausar, restaurar y continuar no consumen. Repetir o reiniciar crea otra sesión y consume al primer intercambio completo. `reverse_training_roleplay_quota` permite una reversión server-side, idempotente y auditada ante fallo técnico no atribuible al usuario.
