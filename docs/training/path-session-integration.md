# Integración de rutas con sesiones

Los ejercicios, habilidades, conceptos y plantillas se convierten en `training_sessions`. Una plantilla copia todos sus ejercicios publicados; los demás tipos crean una sesión con el ejercicio correspondiente. Reabrir un item en curso recupera su sesión en lugar de duplicarla.

Los role-play conservan el `rutaItem` hasta el servidor y enlazan la simulación a ruta, módulo e item. La evaluación completada actualiza el item y recalcula la ruta. Fallos del proveedor o evaluaciones incompletas no conceden progreso.

La Home prioriza una sesión activa, luego el módulo o ruta activa y finalmente un repaso. Categorías y habilidades muestran rutas relacionadas sin duplicar la lógica de elegibilidad.
