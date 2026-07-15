# Filtros de Training

Categorías admite `mode`, `progress`, `plan`, `query` y `sort`. La página de categoría admite `subcategory`, `mode`, `format`, `cognitiveLevel`, `difficulty`, `duration` y `plan`.

Los query params se validan con Zod en `navigation-schemas.ts`. Para añadir un filtro: ampliar el tipo, el schema, el servicio y el control accesible; después añadir una prueba de valor válido, inválido y sin resultados.
