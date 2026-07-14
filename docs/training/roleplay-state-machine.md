# Máquina de estados de role-play

La UI usa XState: `loading -> ready -> characterThinking`, además de `pausing`, `paused`, `resuming`, `finishing`, `evaluating` y `providerFailed`. El servidor mantiene la autoridad con estados persistidos: ready, active, paused, evaluating, completed, expired, failed y safety_stopped.

La máquina bloquea dobles envíos; la idempotencia de base de datos protege incluso ante reintentos o pestañas duplicadas.
