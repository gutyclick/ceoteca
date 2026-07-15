# RLS de taxonomía

Usuarios autenticados leen únicamente entidades publicadas y assets aprobados. Solo leen su propio progreso. No existen políticas de escritura para usuarios normales.

La escritura reutiliza `training_editorial_users` e `is_training_editor`: admin y editor pueden administrar taxonomía; operaciones sensibles deben pasar por servicios de servidor. `internal_reference` se revoca por columna para `authenticated` y queda disponible al `service_role`.

Las pruebas deben cubrir usuario normal, editor, admin, ownership y escaladas horizontal/vertical. El script `supabase/tests/0034_training_taxonomy_structural_foundation.sql` verifica constraints e índices; las políticas se inspeccionan tras `db push`.

