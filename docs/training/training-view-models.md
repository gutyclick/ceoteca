# ViewModels de navegación

`navigation-model.ts` define contratos seguros para inicio, tarjeta de categoría, página de categoría y página de habilidad. No contienen notas editoriales, referencias internas, assets restringidos ni datos de otros usuarios.

`SupabaseTrainingNavigationService` compone repositorios, ejercicios publicados, dominio, sesiones y repasos. `StaticTrainingNavigationService` mantiene el proyecto navegable sin credenciales. Los componentes consumen estos contratos y no consultan tablas directamente.
