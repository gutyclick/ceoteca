# Base de datos de taxonomía

La base nació en `0021` y fue ampliada por `0026`, `0028`, `0033` y `0034`. `0034` no duplica entidades: normaliza prerrequisitos a `0..1`, añade dificultad `fundamentals/application/advanced/expert`, slugs de módulo y referencias discriminadas.

Claves foráneas usan `restrict` cuando borrar rompería contenido publicado y `cascade` en tablas puente. Los índices cubren estado y orden, navegación por categoría/habilidad, módulos, prerrequisitos, progreso y revisión de assets.

El progreso de rutas permanece en `user_training_path_progress` y `user_training_path_module_progress`; mastery general continúa en las tablas existentes con dominio `0..100`.

