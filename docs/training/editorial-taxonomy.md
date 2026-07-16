# Administración editorial de la taxonomía

El panel editorial se encuentra bajo `/admin/training`. Las categorías, subcategorías, habilidades, conceptos y formatos tienen listados independientes y un formulario visual con validación Zod, React Hook Form y autosave con debounce.

## Flujo

1. `editor` crea o edita un borrador y lo envía a revisión.
2. `reviewer` aprueba o solicita cambios.
3. `admin` publica o archiva.
4. `viewer` puede consultar sin modificar.

Los slugs son únicos en base de datos. Los libros relacionados y los prerrequisitos se seleccionan mediante controles explícitos. Los triggers de Supabase rechazan ciclos. El cliente nunca decide el rol ni publica directamente.

## Validación

`TrainingTaxonomyValidationService` detecta categorías sin habilidades, subcategorías vacías, habilidades sin conceptos, conceptos sin ejercicios, slugs duplicados, ciclos, formatos incompletos y assets sin aprobar. Los errores bloquean la publicación; warnings e info orientan la revisión.

Las escrituras se realizan por APIs server-side con service role después de `requireEditorialAccess`. Las políticas RLS solo permiten leer versiones a usuarios editoriales autenticados.
