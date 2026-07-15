# Navegación de Training

Training reutiliza el `DashboardSidebar`, el encabezado de cuenta/notificaciones y `TrainingPageShell`. No crea un segundo layout global.

Rutas visibles en español:

- `/ejercicios`: inicio.
- `/ejercicios/categorias`: categorías y modos.
- `/ejercicios/categorias/[categorySlug]`: subcategorías y habilidades.
- `/ejercicios/habilidades/[skillSlug]`: detalle de habilidad.
- `/ejercicios/rutas`: rutas, controladas por `TRAINING_LEARNING_PATHS_ENABLED`.
- `/ejercicios/simulaciones`: simulaciones, controladas por `TRAINING_ROLEPLAY_ENABLED`.
- `/ejercicios?vista=repasos` y `/perfil`: repasos y progreso existentes.

En móvil, la navegación horizontal admite desplazamiento sin provocar overflow del documento. Los slugs pasan por `taxonomySlugSchema`.
