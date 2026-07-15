# Rutas de aprendizaje en base de datos

`training_learning_paths`, `training_learning_path_modules` y `training_learning_path_module_items` contienen la estructura editorial. Los items forman una unión discriminada y solo pueden apuntar al contenido compatible con su tipo.

El progreso se separa en tres niveles:

- `user_training_path_progress`: estado global y módulo actual.
- `user_training_path_module_progress`: disponibilidad y avance de cada módulo.
- `user_training_path_item_progress`: fuente verificable, puntuación y finalización de cada item.

Las sesiones de ejercicios y role-play guardan `learning_path_id`, `learning_path_module_id` y `learning_path_item_id`. Las políticas RLS permiten al usuario leer únicamente su progreso; las escrituras y RPC de transición quedan reservadas al rol de servicio.
