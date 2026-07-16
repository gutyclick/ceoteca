-- CEOTECA Training: garantiza dos prácticas Pro de reconocimiento en la
-- primera unidad de Marketing sin alterar volumen, formato ni acceso.

update public.training_exercises
set cognitive_level='recognition'
where id=public.training_seed_uuid('mvp-det-marketing-y-marca-7-1')
  and minimum_plan='pro'
  and status='published';

with target as (
 select item.id item_id,exercise.id exercise_id
 from public.training_learning_path_module_items item
 join public.training_learning_path_modules module on module.id=item.module_id
 join public.training_learning_paths path on path.id=module.path_id
 join public.training_exercises exercise
   on exercise.id=public.training_seed_uuid('mvp-det-marketing-y-marca-7-1')
 where path.slug='construye-una-marca-fuerte'
   and module.sort_order=1
   and item.sort_order=4
)
update public.training_learning_path_module_items item
set exercise_id=target.exercise_id,minimum_plan='pro',preview_allowed=false
from target where item.id=target.item_id;
