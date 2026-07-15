# Migraciones de taxonomía

Orden relevante: `0021` fundación, `0026` adaptación/prerrequisitos, `0028` roles editoriales, `0033` taxonomía/rutas y `0034` contrato estructural. No editar migraciones ya aplicadas.

Ejecutar `npx supabase db push --yes`, luego `npx supabase migration list`. `0034` es aditiva salvo la normalización controlada de mastery. Rollback operativo: restaurar backup y revertir `0034`; no se incluye down migration automática porque eliminar columnas podría perder datos editoriales.

