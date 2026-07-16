-- CEOTECA Training: integridad final del primer paquete editorial.
-- Corrige residuos de semillas previas y normaliza textos insertados por 0037.

create or replace function public.training_repair_utf8(value text)
returns text language plpgsql immutable strict as $$
begin
  if position(chr(195) in value) > 0 or position(chr(194) in value) > 0 then
    return convert_from(convert_to(value,'LATIN1'),'UTF8');
  end if;
  return value;
exception when others then
  return value;
end $$;

-- Estas habilidades pertenecen a semillas de desarrollo anteriores, no al paquete MVP.
update public.training_skills set status='archived',is_active=false
where category_id=(select id from public.training_categories where slug='marketing-y-marca')
  and slug in('propuesta-de-valor','validacion-avanzada');
update public.training_concepts set status='archived',is_active=false
where skill_id in(select id from public.training_skills where slug in('propuesta-de-valor','validacion-avanzada'));

-- Conserva los formatos visuales/abiertos ya creados reasignándolos a una habilidad oficial.
update public.training_exercises exercise set
  skill_id=target.id,
  concept_id=(select id from public.training_concepts where skill_id=target.id and status='published' order by created_at,id limit 1)
from public.training_skills legacy, public.training_skills target
where exercise.skill_id=legacy.id and legacy.slug in('propuesta-de-valor','validacion-avanzada')
  and target.slug=case when exercise.type like 'visual_%' then 'analizar-jerarquia-visual' else 'crear-propuestas-de-valor' end
  and exercise.title like 'MVP%'
  and exercise.type not in('single_choice','multiple_choice','true_false','ordering','scenario');

-- Retira solo los cuatro deterministas MVP generados sobre habilidades archivadas.
delete from public.training_learning_path_module_items item
using public.training_learning_path_modules module, public.training_learning_paths path,
      public.training_exercises exercise, public.training_skills skill
where item.module_id=module.id and module.path_id=path.id
  and item.exercise_id=exercise.id and exercise.skill_id=skill.id
  and path.slug in('construye-una-marca-fuerte','aprende-a-vender')
  and skill.slug in('propuesta-de-valor','validacion-avanzada')
  and exercise.title like 'MVP%'
  and exercise.type in('single_choice','multiple_choice','true_false','ordering','scenario');
delete from public.training_exercises exercise
using public.training_skills skill
where exercise.skill_id=skill.id and skill.slug in('propuesta-de-valor','validacion-avanzada')
  and exercise.title like 'MVP%'
  and exercise.type in('single_choice','multiple_choice','true_false','ordering','scenario');

-- Reconstruye los cuatro puestos de cada modulo con ejercicios del paquete oficial.
delete from public.training_learning_path_module_items item
using public.training_learning_path_modules module, public.training_learning_paths path
where item.module_id=module.id and module.path_id=path.id
  and path.slug in('construye-una-marca-fuerte','aprende-a-vender');

with module_source as (
 select module.id module_id,path.slug path_slug,module.sort_order module_n,category.id category_id
 from public.training_learning_path_modules module
 join public.training_learning_paths path on path.id=module.path_id
 join public.training_categories category on
  (path.slug='construye-una-marca-fuerte' and category.slug='marketing-y-marca') or
  (path.slug='aprende-a-vender' and category.slug='ventas-y-persuasion')
 where path.slug in('construye-una-marca-fuerte','aprende-a-vender')
), ranked as (
 select source.*,exercise.id exercise_id,
   row_number() over(partition by source.module_id order by md5(exercise.id::text||source.module_id::text))::int position
 from module_source source
 join public.training_skills skill on skill.category_id=source.category_id and skill.status='published'
 join public.training_exercises exercise on exercise.skill_id=skill.id and exercise.status='published' and exercise.title like 'MVP%'
)
insert into public.training_learning_path_module_items(
 id,module_id,item_type,exercise_id,sort_order,is_required,unlock_rule,minimum_mastery,minimum_plan,preview_allowed
)
select public.training_seed_uuid('mvp-final-item-'||module_id||'-'||position),module_id,'exercise',exercise_id,position,true,
 case when module_n=1 then '{}'::jsonb else jsonb_build_object('previousModuleRequired',true) end,
 case when module_n<=2 then 0 when module_n<=5 then 0.45 when module_n<=8 then 0.6 else 0.7 end,
 case when module_n=1 and position<=2 then 'free' else 'pro' end,module_n=1 and position<=2
from ranked where position<=4;

-- El ranking visual usa tres recursos reales y IDs que el renderer puede ordenar.
with ranking(exercise_number,asset_numbers) as (values (4,array[4,5,6]),(8,array[7,8,9])), payload as (
 select exercise_number,
  jsonb_agg(jsonb_build_object(
    'id',asset.id::text,'label','Alternativa visual '||ordinality,
    'imageUrl',asset.storage_path,'altText',asset.alt_text
  ) order by ordinality) assets,
  jsonb_agg(to_jsonb(asset.id::text) order by ordinality) correct_order
 from ranking cross join lateral unnest(asset_numbers) with ordinality numbers(asset_number,ordinality)
 join public.training_visual_assets asset on asset.id=public.training_seed_uuid('mvp-asset-'||asset_number)
 group by exercise_number
)
update public.training_exercises exercise set content=
  (exercise.content-'assets'-'correctOrder')||jsonb_build_object('assets',payload.assets,'correctOrder',payload.correct_order)
from payload where exercise.id=public.training_seed_uuid('mvp-visual-'||payload.exercise_number);

update public.training_exercise_evaluation_rules rule set evaluation_config=jsonb_build_object('correctOrder',payload.correct_order)
from (
 select exercise_number,jsonb_agg(to_jsonb(public.training_seed_uuid('mvp-asset-'||asset_number)::text) order by ordinality) correct_order
 from (values (4,array[4,5,6]),(8,array[7,8,9])) ranking(exercise_number,asset_numbers)
 cross join lateral unnest(asset_numbers) with ordinality numbers(asset_number,ordinality)
 group by exercise_number
) payload where rule.exercise_id=public.training_seed_uuid('mvp-visual-'||payload.exercise_number);

insert into public.training_exercise_assets(exercise_id,asset_id,label,sort_order)
select public.training_seed_uuid('mvp-visual-'||exercise_number),public.training_seed_uuid('mvp-asset-'||asset_number),
  'Alternativa visual '||ordinality,ordinality::int
from (values (4,array[4,5,6]),(8,array[7,8,9])) ranking(exercise_number,asset_numbers)
cross join lateral unnest(asset_numbers) with ordinality numbers(asset_number,ordinality)
on conflict(exercise_id,asset_id) do update set label=excluded.label,sort_order=excluded.sort_order;

-- Repara mojibake solo en entidades del paquete 0037.
update public.training_exercises set
 title=public.training_repair_utf8(title),prompt=public.training_repair_utf8(prompt),
 instruction=public.training_repair_utf8(instruction),hint=public.training_repair_utf8(hint),
 explanation=public.training_repair_utf8(explanation),
 content=public.training_repair_utf8(content::text)::jsonb,
 ai_rubric=case when ai_rubric is null then null else public.training_repair_utf8(ai_rubric::text)::jsonb end
where title like 'MVP%';
update public.training_visual_assets set alt_text=public.training_repair_utf8(alt_text)
where storage_path like '/images/training/mvp/%';
update public.training_roleplay_scenarios set
 title=public.training_repair_utf8(title),description=public.training_repair_utf8(description),
 character_name=public.training_repair_utf8(character_name),character_brief=public.training_repair_utf8(character_brief),
 learner_goal=public.training_repair_utf8(learner_goal),opening_message=public.training_repair_utf8(opening_message),
 internal_title=public.training_repair_utf8(internal_title),public_title=public.training_repair_utf8(public_title),
 short_description=public.training_repair_utf8(short_description)
where slug like 'mvp-%';

comment on function public.training_repair_utf8(text) is 'Repara texto UTF-8 mal interpretado como Latin-1 en migraciones editoriales heredadas.';
