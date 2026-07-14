# Arquitectura de role-play

La presentación vive en `/ejercicios/simulaciones`; las rutas API autentican el bearer token y llaman a `TrainingRoleplayService`. React nunca llama a OpenAI ni decide plan, cuota, dificultad, versión, rúbrica o modelo.

Capas: schemas Zod, seguridad, prompts, proveedor, servicio, RPC transaccional y tablas Supabase. Las sesiones guardan snapshots para preservar el escenario practicado aunque el contenido editorial evolucione.
