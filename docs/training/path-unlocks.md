# Desbloqueo de módulos

Al iniciar una ruta se crea el progreso global, se bloquean sus módulos y se habilita el primero. Al recalcular, el servidor recorre los módulos por `sort_order`: completa los satisfechos, habilita el siguiente y mantiene bloqueados los posteriores.

No se permite saltar módulos mediante URL o llamadas directas. `start_training_path_item_server` verifica que la ruta y el módulo estén publicados, que exista progreso del usuario y que el módulo esté disponible o en curso.
