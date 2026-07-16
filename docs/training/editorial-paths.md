# Editor de rutas

Las rutas se administran en `/admin/training/paths` y `/admin/training/paths/[pathId]`.

El editor permite configurar nombre, slug, promesa, resultado, duración, plan, categorías y habilidades. Los módulos se pueden crear, ordenar y archivar. Cada ítem define tipo, referencia publicada, orden, obligatoriedad, mastery mínimo, plan y disponibilidad de preview.

## Publicación segura

- Una ruta publicada no se edita directamente: se crea un nuevo snapshot editorial.
- Los módulos existentes conservan su ID durante una nueva publicación para no invalidar progreso.
- Un módulo eliminado se archiva. Si tiene progreso de usuarios, la publicación se rechaza.
- Los ítems se validan contra contenido publicado obtenido por metadata server-side.
- Una ruta Free no puede contener role-play.
- Los errores editoriales bloquean el cambio a `published`.

La previsualización abre la ruta pública en otra pestaña y nunca incluye notas editoriales privadas.
