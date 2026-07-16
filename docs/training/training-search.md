# Búsqueda global de Training

`/training/search` consulta en servidor categorías, subcategorías, habilidades, conceptos, rutas, ejercicios, libros y simulaciones publicadas.

La consulta se valida con Zod, se normaliza antes de construir filtros PostgREST y conserva sus parámetros en la URL. Incluye debounce, paginación y filtros por tipo, categoría, modo, formato, dificultad, plan y duración.

## Privacidad y acceso

- Solo se seleccionan campos públicos y editoriales seguros.
- Nunca se devuelven drafts, respuestas correctas, notas privadas ni assets restringidos.
- El plan efectivo se obtiene en servidor.
- Un resultado bloqueado conserva título y preview reducido, pero no revela el contenido completo.
- Los eventos `training_search_used` y `training_search_result_clicked` no contienen el texto privado del usuario.

El buscador del header abre esta vista al presionar Enter.
