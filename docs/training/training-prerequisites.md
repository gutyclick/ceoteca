# Prerrequisitos

`training_skill_prerequisites` y `training_concept_prerequisites` almacenan relaciones únicas y mastery entre `0` y `1`. Checks impiden autorreferencias. Funciones recursivas y triggers bloquean ciclos incluso si una escritura evita el servicio.

El servicio vuelve a comprobar ciclos antes del `upsert`; esta defensa duplicada evita errores editoriales y carreras simples. La migración `0034` convierte valores heredados `0..100` a `0..1`.
