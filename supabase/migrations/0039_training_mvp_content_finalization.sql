-- CEOTECA Training: volumen exacto, acceso Free coherente y texto editorial limpio.

create or replace function public.training_fix_mvp_text(value text)
returns text language sql immutable strict as $$
 select replace(replace(replace(replace(replace(replace(replace(
        replace(replace(replace(replace(replace(replace(replace(
        value,
        U&'\00C3\00A1',U&'\00E1'),U&'\00C3\00A9',U&'\00E9'),
        U&'\00C3\00AD',U&'\00ED'),U&'\00C3\00B3',U&'\00F3'),
        U&'\00C3\00BA',U&'\00FA'),U&'\00C3\00B1',U&'\00F1'),
        U&'\00E3\00A1',U&'\00E1'),U&'\00E3\00A9',U&'\00E9'),
        U&'\00E3\00AD',U&'\00ED'),U&'\00E3\00B3',U&'\00F3'),
        U&'\00E3\00BA',U&'\00FA'),U&'\00E3\00B1',U&'\00F1'),
        U&'\00C2\00BF',U&'\00BF'),U&'\00C2\00B7',U&'\00B7')
$$;

-- Cuatro deterministas adicionales completan los 30 de Marketing y los diez Free globales.
with source as (
 select concept.id concept_id,skill.id skill_id,concept.name concept_name,
   row_number() over(order by skill.created_at,skill.id,concept.created_at,concept.id)::int n
 from public.training_concepts concept
 join public.training_skills skill on skill.id=concept.skill_id and skill.status='published'
 join public.training_categories category on category.id=skill.category_id and category.slug='marketing-y-marca'
 where concept.status='published'
), created as (
 insert into public.training_exercises(
  id,skill_id,concept_id,type,title,prompt,instruction,difficulty,estimated_seconds,hint,explanation,
  content,status,cognitive_level,minimum_plan,allowed_plans,preview_allowed,evaluation_mode
 )
 select public.training_seed_uuid('mvp-marketing-free-replacement-'||n),skill_id,concept_id,
  (array['single_choice','true_false','ordering','scenario'])[n],
  'MVP · Práctica esencial: '||concept_name,
  'La marca ficticia Faro prepara una pieza para una audiencia concreta. ¿Cómo aplicarías '||lower(concept_name)||' con claridad?',
  'Elige la alternativa sustentada por el contexto y una acción verificable.','beginner',90,
  'Prioriza función y audiencia antes que preferencia personal.',
  'La mejor respuesta usa un criterio observable, mantiene coherencia y permite comprobar si el mensaje se entendió.',
  case n
   when 1 then jsonb_build_object('options',jsonb_build_array(
     jsonb_build_object('id','criteria','label','Definir la prioridad del mensaje y comprobarla con la audiencia.'),
     jsonb_build_object('id','taste','label','Elegir solo por gusto personal.'),
     jsonb_build_object('id','noise','label','Dar el mismo peso a todos los elementos.')),
     'objective','Aplicar un criterio de marca','commonErrors',jsonb_build_array('Confundir gusto con función'),'editorialSource','CEOTECA Training, caso original 2026')
   when 2 then jsonb_build_object('statement','Una pieza es coherente solo porque repite el mismo color.','objective','Distinguir consistencia de repetición','commonErrors',jsonb_build_array('Ignorar mensaje y audiencia'),'editorialSource','CEOTECA Training, caso original 2026')
   when 3 then jsonb_build_object('items',jsonb_build_array(
     jsonb_build_object('id','audience','label','Definir audiencia'),jsonb_build_object('id','priority','label','Elegir prioridad'),
     jsonb_build_object('id','design','label','Construir la pieza'),jsonb_build_object('id','verify','label','Comprobar comprensión')),
     'objective','Ordenar una decisión de marca','commonErrors',jsonb_build_array('Diseñar antes de definir el objetivo'),'editorialSource','CEOTECA Training, caso original 2026')
   else jsonb_build_object('context','Faro debe anunciar un servicio nuevo sin perder su tono cercano.','options',jsonb_build_array(
     jsonb_build_object('id','criteria','label','Conservar el tono, explicar el beneficio y proponer una acción concreta.'),
     jsonb_build_object('id','trend','label','Copiar el estilo de una tendencia aunque contradiga la marca.'),
     jsonb_build_object('id','generic','label','Usar una promesa genérica para hablarle a todo el mundo.')),
     'correctOptionId','criteria','consequence','La pieza mantiene reconocimiento y claridad.','principle','La coherencia conecta identidad, audiencia y decisión.','practicalApplication','Comprueba el mensaje con una persona de la audiencia.','objective','Resolver un caso de coherencia','commonErrors',jsonb_build_array('Imitar sin contexto'),'editorialSource','CEOTECA Training, caso original 2026') end,
  'published',case when n<=2 then 'recognition' else 'application' end,'free',array['free','pro','unlimited'],true,'deterministic'
 from source where n<=4
 on conflict(id) do update set skill_id=excluded.skill_id,concept_id=excluded.concept_id,title=excluded.title,prompt=excluded.prompt,
  instruction=excluded.instruction,content=excluded.content,explanation=excluded.explanation,status='published',minimum_plan='free',allowed_plans=excluded.allowed_plans
 returning id,type
)
select count(*) from created;

insert into public.training_exercise_evaluation_rules(exercise_id,evaluation_config)
select public.training_seed_uuid('mvp-marketing-free-replacement-'||n),case n
 when 1 then jsonb_build_object('correctOptionId','criteria')
 when 2 then jsonb_build_object('correctValue',false)
 when 3 then jsonb_build_object('correctOrder',jsonb_build_array('audience','priority','design','verify'))
 else jsonb_build_object('correctOptionId','criteria') end
from generate_series(1,4)n on conflict(exercise_id) do update set evaluation_config=excluded.evaluation_config;
insert into public.training_exercise_formats(exercise_id,format_id,is_primary)
select public.training_seed_uuid('mvp-marketing-free-replacement-'||n),format.id,true
from generate_series(1,4)n cross join public.training_formats format where format.slug='deterministic-practice'
on conflict(exercise_id,format_id) do update set is_primary=true;

-- Las dos primeras actividades de cada ruta siempre apuntan a ejercicios Free de su categoría.
with first_modules as (
 select module.id module_id,category.id category_id
 from public.training_learning_path_modules module
 join public.training_learning_paths path on path.id=module.path_id and module.sort_order=1
 join public.training_categories category on
  (path.slug='construye-una-marca-fuerte' and category.slug='marketing-y-marca') or
  (path.slug='aprende-a-vender' and category.slug='ventas-y-persuasion')
), free_exercises as (
 select first_modules.module_id,exercise.id,
  row_number() over(partition by first_modules.module_id order by exercise.created_at,exercise.id)::int position
 from first_modules
 join public.training_skills skill on skill.category_id=first_modules.category_id and skill.status='published'
 join public.training_exercises exercise on exercise.skill_id=skill.id and exercise.status='published'
  and exercise.minimum_plan='free' and exercise.title like 'MVP%'
)
update public.training_learning_path_module_items item set
 exercise_id=free_exercises.id,minimum_plan='free',preview_allowed=true
from free_exercises where item.module_id=free_exercises.module_id
 and item.sort_order=free_exercises.position and free_exercises.position<=2;

-- Normaliza secuencias mojibake de una o dos capas en todo el contenido del paquete.
update public.training_exercises set
 title=public.training_fix_mvp_text(public.training_fix_mvp_text(title)),
 prompt=public.training_fix_mvp_text(public.training_fix_mvp_text(prompt)),
 instruction=public.training_fix_mvp_text(public.training_fix_mvp_text(instruction)),
 hint=public.training_fix_mvp_text(public.training_fix_mvp_text(hint)),
 explanation=public.training_fix_mvp_text(public.training_fix_mvp_text(explanation)),
 content=public.training_fix_mvp_text(public.training_fix_mvp_text(content::text))::jsonb,
 ai_rubric=case when ai_rubric is null then null else public.training_fix_mvp_text(public.training_fix_mvp_text(ai_rubric::text))::jsonb end
where title like 'MVP%';
update public.training_visual_assets set alt_text=public.training_fix_mvp_text(public.training_fix_mvp_text(alt_text))
where storage_path like '/images/training/mvp/%';
update public.training_roleplay_scenarios set
 title=public.training_fix_mvp_text(public.training_fix_mvp_text(title)),
 description=public.training_fix_mvp_text(public.training_fix_mvp_text(description)),
 character_name=public.training_fix_mvp_text(public.training_fix_mvp_text(character_name)),
 character_brief=public.training_fix_mvp_text(public.training_fix_mvp_text(character_brief)),
 learner_goal=public.training_fix_mvp_text(public.training_fix_mvp_text(learner_goal)),
 opening_message=public.training_fix_mvp_text(public.training_fix_mvp_text(opening_message))
where slug like 'mvp-%';

comment on function public.training_fix_mvp_text(text) is 'Normaliza secuencias mojibake comunes del paquete editorial MVP.';
