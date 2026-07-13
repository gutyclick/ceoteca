alter table public.training_exercises drop constraint if exists training_exercises_type_check;
alter table public.training_exercises add constraint training_exercises_type_check check(type in('single_choice','multiple_choice','true_false','ordering','flashcard','scenario','open_response','guided_builder','decision_justification','reflection'));
alter table public.training_exercises add column if not exists evaluation_mode text not null default 'deterministic' check(evaluation_mode in('deterministic','ai','hybrid','self_assessment'));
alter table public.training_exercises add column if not exists ai_rubric jsonb;
alter table public.training_exercises add column if not exists ai_prompt_version text;
alter table public.training_exercises add column if not exists minimum_response_length integer not null default 40 check(minimum_response_length > 0);
alter table public.training_exercises add column if not exists maximum_response_length integer not null default 2500 check(maximum_response_length >= minimum_response_length);
alter table public.training_exercises add column if not exists allow_revision boolean not null default false;
alter table public.training_exercises add column if not exists max_revisions integer not null default 0 check(max_revisions between 0 and 5);

create table if not exists public.training_ai_evaluations(
 id uuid primary key default gen_random_uuid(), answer_id uuid not null references public.training_answers on delete cascade,
 user_id uuid not null references auth.users on delete cascade, session_id uuid not null references public.training_sessions on delete cascade,
 session_exercise_id uuid not null references public.training_session_exercises on delete cascade,
 status text not null check(status in('pending','processing','completed','failed','timed_out','fallback_completed','cancelled')),
 provider text, model text, rubric_version text not null, prompt_version text not null, input_hash text not null,
 evaluation jsonb, normalized_score numeric check(normalized_score between 0 and 1), latency_ms integer,
 input_tokens integer, output_tokens integer, estimated_cost numeric, cache_hit boolean not null default false,
 error_code text, error_message_safe text, started_at timestamptz, completed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists training_ai_evaluations_input_hash_idx on public.training_ai_evaluations(input_hash);
create unique index if not exists training_ai_evaluations_active_unique on public.training_ai_evaluations(answer_id,rubric_version) where status in('pending','processing','completed','fallback_completed');

create table if not exists public.training_answer_revisions(
 id uuid primary key default gen_random_uuid(), original_answer_id uuid not null references public.training_answers on delete cascade,
 user_id uuid not null references auth.users on delete cascade, revision_number integer not null check(revision_number > 0),
 content jsonb not null, evaluation_id uuid references public.training_ai_evaluations on delete set null, created_at timestamptz not null default now(),
 unique(original_answer_id,revision_number)
);

alter table public.training_ai_evaluations enable row level security;
alter table public.training_answer_revisions enable row level security;
create policy "training_ai_evaluations_select_own" on public.training_ai_evaluations for select using(auth.uid()=user_id);
create policy "training_answer_revisions_select_own" on public.training_answer_revisions for select using(auth.uid()=user_id);

do $$ begin
 alter table public.training_answers add column if not exists evaluation_status text;
 alter table public.training_answers add column if not exists normalized_score numeric check(normalized_score between 0 and 1);
exception when duplicate_column then null; end $$;

-- Add four authored open exercises to the existing value-proposition template.
do $$
declare v_skill uuid; v_concept uuid; v_template uuid; v_exercise uuid; v_position integer;
begin
 select id into v_skill from public.training_skills where slug='propuesta-de-valor';
 select id into v_concept from public.training_concepts where slug='beneficio-claro';
 select id into v_template from public.training_templates where slug='propuestas-de-valor';
 select coalesce(max(position),0) into v_position from public.training_template_exercises where template_id=v_template;

 insert into public.training_exercises(skill_id,concept_id,type,title,prompt,instruction,difficulty,hint,explanation,content,status,evaluation_mode,ai_rubric,ai_prompt_version,minimum_response_length,maximum_response_length,allow_revision,max_revisions)
 values
 (v_skill,v_concept,'open_response','Propuesta de valor','Construye una propuesta de valor para CEOTECA','Escribe una o dos frases específicas y accionables.','intermediate','Incluye cliente, resultado y diferencia.','Una propuesta clara conecta a un cliente concreto con un resultado relevante.',jsonb_build_object('context','CEOTECA ayuda a convertir ideas de negocios en acciones aplicables.','placeholder','Ayudamos a...'), 'published','ai','{"id":"value-proposition","version":"1","name":"Propuesta de valor","criteria":[{"id":"clarity","label":"Claridad","description":"Se entiende con facilidad","weight":0.25},{"id":"specificity","label":"Especificidad","description":"Define cliente y resultado","weight":0.25},{"id":"customer_relevance","label":"Relevancia","description":"Responde a una necesidad real","weight":0.2},{"id":"differentiation","label":"Diferenciación","description":"Explica por qué es distinta","weight":0.2},{"id":"actionability","label":"Aplicación","description":"Permite actuar","weight":0.1}]}'::jsonb,'training-open-response-v1',40,500,true,1)
 returning id into v_exercise;
 insert into public.training_template_exercises(template_id,exercise_id,position) values(v_template,v_exercise,v_position+1);

 insert into public.training_exercises(skill_id,concept_id,type,title,prompt,instruction,difficulty,hint,explanation,content,status,evaluation_mode,ai_rubric,ai_prompt_version,minimum_response_length,maximum_response_length,allow_revision,max_revisions)
 select v_skill,v_concept,t.type,t.title,t.prompt,t.instruction,'intermediate','Sé concreto y usa el contexto.','El criterio mejora cuando conectas evidencia, decisión y aplicación.',t.content,'published','ai',(select ai_rubric from public.training_exercises where id=v_exercise),t.prompt_version,30,800,true,1
 from (values
 ('guided_builder','Construye por partes','Completa los componentes de una propuesta de valor','Responde cada campo antes de evaluar.','{"fields":[{"id":"customer","label":"Cliente","prompt":"¿A quién ayudas?"},{"id":"problem","label":"Problema","prompt":"¿Qué dificultad resuelves?"},{"id":"result","label":"Resultado","prompt":"¿Qué transformación obtiene?"},{"id":"difference","label":"Diferenciador","prompt":"¿Por qué es diferente?"}],"template":"Ayudamos a [customer] a [result] ante [problem], mediante [difference]."}'::jsonb,'training-guided-builder-v1'),
 ('decision_justification','Decide y justifica','Prioriza la acción con mayor impacto','Elige una opción y explica tu razonamiento.','{"context":"Hay más tráfico, pero las ventas no aumentan.","options":[{"id":"ads","label":"Aumentar publicidad"},{"id":"brand","label":"Rediseñar el logotipo"},{"id":"conversion","label":"Analizar oferta y conversión"},{"id":"content","label":"Publicar más contenido"}]}'::jsonb,'training-decision-justification-v1'),
 ('reflection','Reflexión aplicada','Reduce la fricción de un hábito','Describe una señal actual y un cambio pequeño que puedas probar.','{"context":"No incluyas información personal sensible.","placeholder":"La señal que activa mi hábito es..."}'::jsonb,'training-reflection-v1')
 ) as t(type,title,prompt,instruction,content,prompt_version);

 insert into public.training_template_exercises(template_id,exercise_id,position)
 select v_template,e.id,v_position+row_number() over(order by e.created_at,e.id)+1
 from public.training_exercises e where e.type in('guided_builder','decision_justification','reflection') and e.skill_id=v_skill and e.created_at > now()-interval '1 minute';
end $$;

create or replace function public.create_training_session(p_template_id uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_id uuid; v_count int;
begin
 if v_user is null then raise exception 'unauthenticated'; end if;
 select count(*) into v_count from training_template_exercises where template_id=p_template_id;
 if v_count=0 then raise exception 'template_empty'; end if;
 insert into training_sessions(user_id,template_id,title,total_exercises,estimated_minutes) select v_user,id,title,v_count,estimated_minutes from training_templates where id=p_template_id and is_active returning id into v_id;
 if v_id is null then raise exception 'template_not_found'; end if;
 insert into training_session_exercises(session_id,exercise_id,position,exercise_snapshot)
 select v_id,e.id,te.position,jsonb_build_object('id',e.id,'type',e.type,'title',e.title,'prompt',e.prompt,'instruction',e.instruction,'difficulty',e.difficulty,'estimatedSeconds',e.estimated_seconds,'hint',e.hint,'explanation',e.explanation,'content',e.content,'skillId',e.skill_id,'conceptId',e.concept_id,'minimumLength',e.minimum_response_length,'maximumLength',e.maximum_response_length,'allowRevision',e.allow_revision,'maxRevisions',e.max_revisions)
 from training_template_exercises te join training_exercises e on e.id=te.exercise_id where te.template_id=p_template_id order by te.position;
 return v_id;
end $$;
