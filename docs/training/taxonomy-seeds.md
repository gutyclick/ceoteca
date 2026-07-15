# Seeds de taxonomía

Los seeds viven dentro de migraciones y usan `on conflict`, por lo que son idempotentes. Incluyen ocho categorías, subcategorías, al menos cinco habilidades por categoría, conceptos, formatos, niveles, rutas, módulos, ejercicios y prerrequisitos de ejemplo.

Las relaciones con libros solo se insertan mediante joins a libros existentes. El asset de desarrollo es editorial, ficticio y queda `needs_review`, por lo que RLS no lo expone. Ejecutar dos veces el SQL de prueba confirma ausencia de duplicados.

