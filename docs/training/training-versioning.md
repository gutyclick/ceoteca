# Versionado editorial de Training

`training_editorial_versions` almacena snapshots de categoría, subcategoría, habilidad, concepto, formato y ruta. Cada versión sigue los estados `draft`, `in_review`, `approved`, `published`, `changes_requested` o `archived`.

## Inmutabilidad

Un trigger de base de datos impide actualizar o eliminar una versión publicada. Restaurar una publicación crea un borrador nuevo con un número de versión superior; nunca modifica el snapshot histórico.

Las transiciones válidas son:

- `draft` o `changes_requested` → `in_review`;
- `in_review` → `approved` o `changes_requested`;
- `approved` → `published`, solo por admin.

## Auditoría

Se registran creación, autosave, revisión, aprobación, publicación, archivo, duplicación, restauración y cambios estructurales. La metadata se limita a IDs, versión y conteos; no guarda secretos, notas privadas ni datos de usuarios finales.
