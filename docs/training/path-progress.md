# Progreso de rutas

El progreso se recalcula en PostgreSQL desde items obligatorios completados. Los items opcionales no bloquean ni reducen el porcentaje. Un módulo se completa cuando todos sus items obligatorios alcanzan su dominio mínimo; la ruta se completa cuando lo hacen todos sus módulos obligatorios.

La finalización solo nace de una sesión válida. En ejercicios, cada item de sesión debe tener una respuesta y superar `minimum_mastery`. En role-play, una evaluación completada y puntuada es la fuente válida. Los `upsert` por usuario e item hacen la operación idempotente.
