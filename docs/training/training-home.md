# Inicio de Training

`TrainingView` presenta, en orden: recomendación, continuidad cuando existe, modos, categorías, preview de rutas, progreso, repasos y simulaciones habilitadas.

La navegación registra vistas e inicios de recomendación, selección de modos y apertura de categorías mediante el endpoint autenticado de analítica. Solo se envían slugs y contexto de navegación; nunca respuestas, prompts ni datos personales.

La carga inicial usa un ViewModel público sin datos privados. Tras recuperar la sesión, `/api/training/navigation?view=home` hidrata sesiones, dominio y repasos del usuario. Un fallo parcial no bloquea el resto de la pantalla. `loading.tsx` y `error.tsx` cubren navegación y error recuperable.

La recomendación usa el motor adaptativo existente. Si no hay historial, se muestra una recomendación editorial inicial; nunca se inventa progreso.
