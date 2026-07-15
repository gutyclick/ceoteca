# Subcategorías

Pertenecen obligatoriamente a una categoría. Su identidad editorial es `(category_id, slug)`; el esquema heredado mantiene además slug globalmente único. Una subcategoría vacía es válida durante borrador, pero el validador la marca antes de publicar.

Las subcategorías agrupan habilidades relacionadas dentro de una categoría. No son formatos ni rutas. Se almacenan en `training_subcategories` y se archivan cuando dejan de utilizarse.

Una subcategoría publicable debe pertenecer a una categoría publicada y contener al menos una habilidad activa. El orden es editorial y puede cambiar sin afectar el historial del usuario.
