# Página de categoría

`/ejercicios/categorias/[categorySlug]` obtiene un `TrainingCategoryPageViewModel`. Presenta breadcrumb, progreso, subcategorías, habilidades y filtros. Los borradores no se consultan.

`CategorySkillBrowser` permite filtrar por subcategoría, dificultad y plan. El estado vacío conserva una explicación útil. Los accesos bloqueados se muestran, pero la creación de una sesión vuelve a validar el plan en servidor.
