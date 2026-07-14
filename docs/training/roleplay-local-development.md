# Desarrollo local de role-play

1. Aplica migraciones hasta `0032_training_roleplay_phase_nine.sql`.
2. Configura las variables `TRAINING_ROLEPLAY_*` de `.env.example`.
3. Usa `NEXT_PUBLIC_DEMO_MODE=true` para proveedor mock sin consumo externo.
4. Prueba Free, Pro y Unlimited cambiando el plan efectivo en Supabase.
5. Revisa cuota en `training_roleplay_quota_consumptions`; nunca edites el saldo desde cliente.
6. Para desactivar, usa `TRAINING_ROLEPLAY_ENABLED=false`; Training tradicional seguirá activo.

Depuración: verifica sesión, `client_consumption_id`, mensajes, consumo y eventos de seguridad. Las reversiones se ejecutan exclusivamente mediante `reverse_training_roleplay_quota` desde service role.
