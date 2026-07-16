-- CEOTECA Training: cierre de calidad editorial del primer paquete MVP.

-- Normaliza el texto visible de taxonomía y rutas que se creó en migraciones
-- antiguas con una interpretación incorrecta de UTF-8.
update public.training_skills skill set
 name=public.training_fix_mvp_text(public.training_fix_mvp_text(skill.name)),
 description=public.training_fix_mvp_text(public.training_fix_mvp_text(skill.description)),
 learning_objectives=array(
  select public.training_fix_mvp_text(public.training_fix_mvp_text(value))
  from unnest(skill.learning_objectives) value
 )
where skill.category_id in(
 select id from public.training_categories
 where slug in('marketing-y-marca','ventas-y-persuasion')
) and skill.status='published';

update public.training_concepts concept set
 name=public.training_fix_mvp_text(public.training_fix_mvp_text(concept.name)),
 description=public.training_fix_mvp_text(public.training_fix_mvp_text(concept.description)),
 editorial_summary=public.training_fix_mvp_text(public.training_fix_mvp_text(concept.editorial_summary)),
 explanation=public.training_fix_mvp_text(public.training_fix_mvp_text(concept.explanation)),
 common_mistakes=public.training_fix_mvp_text(public.training_fix_mvp_text(concept.common_mistakes::text))::jsonb,
 approved_examples=public.training_fix_mvp_text(public.training_fix_mvp_text(concept.approved_examples::text))::jsonb
where concept.skill_id in(
 select skill.id from public.training_skills skill
 join public.training_categories category on category.id=skill.category_id
 where category.slug in('marketing-y-marca','ventas-y-persuasion')
   and skill.status='published'
) and concept.status='published';

update public.training_learning_paths path set
 name=public.training_fix_mvp_text(public.training_fix_mvp_text(path.name)),
 promise=public.training_fix_mvp_text(public.training_fix_mvp_text(path.promise)),
 description=public.training_fix_mvp_text(public.training_fix_mvp_text(path.description)),
 expected_outcome=public.training_fix_mvp_text(public.training_fix_mvp_text(path.expected_outcome))
where path.slug in('construye-una-marca-fuerte','aprende-a-vender');

update public.training_learning_path_modules module set
 title=public.training_fix_mvp_text(public.training_fix_mvp_text(module.title)),
 description=public.training_fix_mvp_text(public.training_fix_mvp_text(module.description))
where module.path_id in(
 select id from public.training_learning_paths
 where slug in('construye-una-marca-fuerte','aprende-a-vender')
);

-- Cada consigna conserva su caso, pero incorpora el foco concreto de la
-- habilidad. Así no hay dos prompts idénticos aunque compartan concepto base.
update public.training_exercises exercise set prompt=
 trim(trailing '.' from exercise.prompt)||'. Foco de esta práctica: '||
 lower(skill.name)||' mediante '||lower(exercise.title)||'.'
from public.training_skills skill
where exercise.skill_id=skill.id
  and exercise.title like 'MVP%'
  and exercise.prompt not like '%Foco de esta práctica:%';

-- Reconstruye las actividades de ruta con el nivel cognitivo y el plan que
-- corresponde a cada posición. Las dos primeras del módulo inicial son Free.
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
  case when modules.sort_order=1 and position<=2 then 'free' else 'pro' end desired_plan,
  (
   select exercise.id from public.training_exercises exercise
   join public.training_skills skill on skill.id=exercise.skill_id and skill.status='published'
   join public.training_categories category on category.id=skill.category_id and category.slug=modules.category_slug
   where exercise.status='published' and exercise.title like 'MVP%'
     and exercise.cognitive_level=modules.cognitive_level
     and exercise.minimum_plan=case when modules.sort_order=1 and position<=2 then 'free' else 'pro' end
   order by md5(exercise.id::text||modules.id::text)
   limit 1 offset case when modules.sort_order=1 and position>2 then position-3 else position-1 end
  ) exercise_id
 from modules cross join generate_series(1,4) position
)
update public.training_learning_path_module_items item set
 exercise_id=positions.exercise_id,
 minimum_plan=positions.desired_plan,
 preview_allowed=positions.desired_plan='free'
from positions
where item.module_id=positions.module_id
  and item.sort_order=positions.position
  and positions.exercise_id is not null;

comment on function public.training_fix_mvp_text(text) is
  'Normaliza texto editorial heredado; el paquete MVP se valida después de sembrarse.';
