# Categorías

Las ocho categorías oficiales se identifican por slug estable y se publican mediante seed idempotente. Cada una conserva nombre, descripciones, icono, orden, estado y plan mínimo. Para añadir una categoría: crear migración, usar `on conflict(slug)`, asignar orden único editorial y ejecutar el validador antes de publicar.

Estados: `draft`, `published`, `archived`. Los usuarios autenticados solo leen `published`; editor y admin gestionan el ciclo editorial.

Training usa ocho categorías oficiales: Marketing y marca, Ventas y persuasión, Comunicación profesional, Emprendimiento, Estrategia y toma de decisiones, Liderazgo y gestión de equipos, Finanzas y criterio económico, y Productividad y desarrollo personal aplicado.

Cada categoría tiene descripción editorial, icono, orden, estado y acceso mínimo. Los totales de habilidades, ejercicios y rutas son derivados mediante `training_category_catalog`; no se guardan como contadores desactualizables.

Para crear una categoría, usa un slug español estable, una descripción propia, un icono Lucide existente y ejecuta el validador antes de publicar.
