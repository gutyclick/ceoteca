-- CEOTECA Training: progresion cognitiva explicita para las dos rutas del MVP.

-- Reserva suficientes actividades Pro de transferencia y sintesis para los modulos finales.
update public.training_exercises set cognitive_level='synthesis'
where id in(
  select public.training_seed_uuid('mvp-marketing-open-'||n) from generate_series(1,4)n
  union all select public.training_seed_uuid('mvp-sales-open-'||n) from generate_series(1,4)n
);
update public.training_exercises set cognitive_level='transfer'
where id in(
  select public.training_seed_uuid('mvp-marketing-open-'||n) from generate_series(5,7)n
  union all select public.training_seed_uuid('mvp-visual-8')
  union all select public.training_seed_uuid('mvp-sales-message-'||n) from generate_series(7,10)n
);

with modules as (
 select module.id,module.sort_order,
  case path.slug when 'construye-una-marca-fuerte' then 'marketing-y-marca' else 'ventas-y-persuasion' end category_slug,
  case
   when module.sort_order=1 then 'recognition'
   when module.sort_order=2 then 'understanding'
   when module.sort_order between 3 and 4 then 'application'
   when module.sort_order between 5 and 7 then 'analysis'
   when module.sort_order between 8 and 9 then 'transfer'
   else 'synthesis' end cognitive_level
 from public.training_learning_path_modules module
 join public.training_learning_paths path on path.id=module.path_id
 where path.slug in('construye-una-marca-fuerte','aprende-a-vender')
), positions as (
 select modules.id module_id,modules.sort_order module_number,position,
  (
   select exercise.id from public.training_exercises exercise
   join public.training_skills skill on skill.id=exercise.skill_id and skill.status='published'
   join public.training_categories category on category.id=skill.category_id and category.slug=modules.category_slug
   where exercise.status='published' and exercise.title like 'MVP%'
     and exercise.cognitive_level=modules.cognitive_level
     and exercise.minimum_plan=case when modules.sort_order=1 then 'free' else 'pro' end
   order by md5(exercise.id::text||modules.id::text)
   limit 1 offset position-1
  ) exercise_id
 from modules cross join generate_series(1,4) position
)
update public.training_learning_path_module_items item set
 exercise_id=positions.exercise_id,
 minimum_plan=case when positions.module_number=1 and positions.position<=2 then 'free' else 'pro' end,
 preview_allowed=positions.module_number=1 and positions.position<=2
from positions where item.module_id=positions.module_id and item.sort_order=positions.position
 and positions.exercise_id is not null;

comment on table public.training_learning_path_module_items is
  'Actividades de rutas con desbloqueo, plan y progresion cognitiva validados en servidor.';
