-- CEOTECA Training phase 9: structured conversational simulations.

create table public.training_roleplay_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  icon text not null,
  skill_slugs text[] not null default '{}',
  minimum_plan text not null default 'pro' check (minimum_plan in ('free','pro','unlimited')),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.training_roleplay_categories
  (slug,name,description,icon,skill_slugs,display_order)
values
  ('ventas','Ventas','Practica descubrimiento, valor, objeciones y cierre.','badge-dollar-sign',array['descubrimiento','objeciones','cierre'],10),
  ('liderazgo','Liderazgo','Entrena conversaciones de desempeño, delegación y acuerdos.','crown',array['feedback','delegacion','claridad'],20),
  ('negociacion','Negociación','Practica intereses, concesiones y acuerdos verificables.','handshake',array['negociacion','escucha','criterio'],30),
  ('atencion-al-cliente','Atención al cliente','Resuelve reclamos con empatía, límites y próximos pasos.','headphones',array['empatia','resolucion','comunicacion'],40),
  ('comunicacion-profesional','Comunicación profesional','Ensaya conversaciones difíciles y presentaciones claras.','messages-square',array['claridad','feedback','influencia'],50),
  ('emprendimiento','Emprendimiento','Valida ideas y presenta oportunidades con evidencia.','rocket',array['validacion','pitch','propuesta-de-valor'],60),
  ('finanzas-decisiones','Finanzas y decisiones empresariales','Defiende decisiones financieras con supuestos y prioridades.','chart-no-axes-combined',array['presupuesto','flujo-de-caja','priorizacion'],70)
on conflict (slug) do update set
  name=excluded.name, description=excluded.description, icon=excluded.icon,
  skill_slugs=excluded.skill_slugs, display_order=excluded.display_order;

alter table public.training_roleplay_scenarios
  drop constraint if exists training_roleplay_scenarios_level_check;
alter table public.training_roleplay_scenarios
  add constraint training_roleplay_scenarios_level_check
  check (level in ('fundamentals','application','advanced','expert'));
alter table public.training_roleplay_scenarios
  add column if not exists category_id uuid references public.training_roleplay_categories(id),
  add column if not exists internal_title text,
  add column if not exists public_title text,
  add column if not exists short_description text,
  add column if not exists status text not null default 'draft' check (status in ('draft','review','published','archived')),
  add column if not exists current_version integer not null default 1,
  add column if not exists minimum_plan text not null default 'pro' check (minimum_plan in ('free','pro','unlimited')),
  add column if not exists estimated_minutes integer not null default 10 check (estimated_minutes between 3 and 30),
  add column if not exists max_turns integer not null default 16 check (max_turns between 4 and 40),
  add column if not exists skill_slugs text[] not null default '{}',
  add column if not exists created_by uuid references auth.users(id);

update public.training_roleplay_scenarios s set
  category_id=c.id,
  internal_title=coalesce(s.internal_title,s.title),
  public_title=coalesce(s.public_title,s.title),
  short_description=coalesce(s.short_description,s.description),
  status=case when s.is_active then 'archived' else 'draft' end
from public.training_roleplay_categories c
where lower(c.name)=lower(s.category) and s.category_id is null;

create table public.training_roleplay_scenario_versions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.training_roleplay_scenarios(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  public_config jsonb not null default '{}',
  character_private_context jsonb not null default '{}',
  state_machine_config jsonb not null default '{}',
  safety_rules jsonb not null default '{}',
  prompt_version text not null default 'roleplay-character-v1',
  rubric_version_id uuid,
  validation_report jsonb not null default '{}',
  published_at timestamptz,
  published_by uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(scenario_id,version)
);

create table public.training_roleplay_rubrics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  category_id uuid references public.training_roleplay_categories(id),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  current_version integer not null default 1,
  created_at timestamptz not null default now()
);

create table public.training_roleplay_rubric_versions (
  id uuid primary key default gen_random_uuid(),
  rubric_id uuid not null references public.training_roleplay_rubrics(id) on delete cascade,
  version integer not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  criteria jsonb not null,
  total_points integer not null default 100 check (total_points > 0),
  published_at timestamptz,
  published_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(rubric_id,version)
);

alter table public.training_roleplay_scenario_versions
  add constraint training_roleplay_scenario_versions_rubric_fk
  foreign key (rubric_version_id) references public.training_roleplay_rubric_versions(id);

alter table public.training_roleplay_sessions
  drop constraint if exists training_roleplay_sessions_status_check;
alter table public.training_roleplay_sessions
  add constraint training_roleplay_sessions_status_check check (status in (
    'preparing','opening','ready','active','paused','finishing','evaluating',
    'completed','abandoned','expired','failed','safety_stopped'
  ));
alter table public.training_roleplay_sessions
  add column if not exists scenario_version_id uuid references public.training_roleplay_scenario_versions(id),
  add column if not exists scenario_snapshot jsonb not null default '{}',
  add column if not exists difficulty text not null default 'fundamentals' check (difficulty in ('fundamentals','application','advanced','expert')),
  add column if not exists max_turns integer not null default 16,
  add column if not exists resume_expires_at timestamptz,
  add column if not exists paused_at timestamptz,
  add column if not exists finished_at timestamptz,
  add column if not exists finish_reason text,
  add column if not exists conversation_summary text not null default '',
  add column if not exists scenario_state jsonb not null default '{}',
  add column if not exists evaluation_status text not null default 'pending' check (evaluation_status in ('pending','processing','completed','failed','not_required')),
  add column if not exists hints_used integer not null default 0,
  add column if not exists client_consumption_id uuid,
  add column if not exists updated_at timestamptz not null default now();
create unique index if not exists training_roleplay_session_start_idempotency
  on public.training_roleplay_sessions(user_id,client_consumption_id)
  where client_consumption_id is not null;

alter table public.training_roleplay_messages
  drop constraint if exists training_roleplay_messages_role_check;
alter table public.training_roleplay_messages
  add constraint training_roleplay_messages_role_check check (role in ('character','user','system_summary'));
alter table public.training_roleplay_messages
  drop constraint if exists training_roleplay_messages_content_check;
alter table public.training_roleplay_messages
  add constraint training_roleplay_messages_content_check check (char_length(content) between 1 and 8000);
alter table public.training_roleplay_messages
  add column if not exists provider_message_id text,
  add column if not exists input_tokens integer,
  add column if not exists output_tokens integer,
  add column if not exists estimated_cost_usd numeric(12,6),
  add column if not exists latency_ms integer,
  add column if not exists safety_flags text[] not null default '{}',
  add column if not exists metadata jsonb not null default '{}';

create table public.training_roleplay_evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.training_roleplay_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rubric_version_id uuid not null references public.training_roleplay_rubric_versions(id),
  status text not null default 'processing' check (status in ('processing','completed','failed')),
  overall_score numeric(5,2),
  confidence numeric(4,3),
  outcome text check (outcome in ('objective_achieved','partial_progress','needs_improvement','incomplete')),
  result jsonb,
  provider text,
  model text,
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric(12,6),
  latency_ms integer,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.training_roleplay_quota_consumptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null unique references public.training_roleplay_sessions(id) on delete cascade,
  client_consumption_id uuid not null,
  usage_month date not null,
  plan text not null,
  status text not null default 'consumed' check (status in ('consumed','reversed','exempt')),
  consumed_at timestamptz not null default now(),
  reversed_at timestamptz,
  reversal_reason text,
  reversed_by text,
  unique(user_id,client_consumption_id)
);
create index training_roleplay_quota_month_idx on public.training_roleplay_quota_consumptions(user_id,usage_month,status);

create table public.training_roleplay_safety_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.training_roleplay_sessions(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.training_roleplay_cost_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.training_roleplay_sessions(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  operation text not null,
  provider text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_usd numeric(12,6) not null default 0,
  latency_ms integer,
  plan text,
  category_slug text,
  difficulty text,
  created_at timestamptz not null default now()
);

alter table public.training_roleplay_categories enable row level security;
alter table public.training_roleplay_scenario_versions enable row level security;
alter table public.training_roleplay_rubrics enable row level security;
alter table public.training_roleplay_rubric_versions enable row level security;
alter table public.training_roleplay_evaluations enable row level security;
alter table public.training_roleplay_quota_consumptions enable row level security;
alter table public.training_roleplay_safety_events enable row level security;
alter table public.training_roleplay_cost_events enable row level security;

create or replace function public.training_roleplay_immutable_published()
returns trigger language plpgsql as $$
begin
  if old.status='published' then raise exception 'published_version_is_immutable'; end if;
  return new;
end $$;
create trigger training_roleplay_scenario_version_immutable before update or delete on public.training_roleplay_scenario_versions for each row execute function public.training_roleplay_immutable_published();
create trigger training_roleplay_rubric_version_immutable before update or delete on public.training_roleplay_rubric_versions for each row execute function public.training_roleplay_immutable_published();

create or replace function public.consume_training_roleplay_quota(
  p_session_id uuid,
  p_user_id uuid,
  p_monthly_limit integer
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_session public.training_roleplay_sessions%rowtype;
  v_month date:=date_trunc('month',now())::date;
  v_used integer;
  v_consumption_id uuid;
begin
  select * into v_session from public.training_roleplay_sessions where id=p_session_id and user_id=p_user_id for update;
  if not found then raise exception 'session_not_found'; end if;
  if v_session.quota_consumed_at is not null then return jsonb_build_object('consumed',false,'idempotent',true); end if;
  if v_session.is_editorial_preview or v_session.is_automated_test then return jsonb_build_object('consumed',false,'exempt',true); end if;
  if v_session.provider_responded_at is null or v_session.first_valid_user_turn_at is null then raise exception 'first_turn_incomplete'; end if;
  if v_session.plan_snapshot='free' then raise exception 'roleplay_not_available'; end if;
  v_consumption_id:=coalesce(v_session.client_consumption_id,gen_random_uuid());
  if v_session.plan_snapshot not in ('unlimited') then
    select count(*) into v_used from public.training_roleplay_quota_consumptions
    where user_id=p_user_id and usage_month=v_month and status='consumed';
    if v_used >= p_monthly_limit then raise exception 'monthly_limit_reached'; end if;
  else v_used:=0;
  end if;
  insert into public.training_roleplay_quota_consumptions(user_id,session_id,client_consumption_id,usage_month,plan)
  values(p_user_id,p_session_id,v_consumption_id,v_month,v_session.plan_snapshot)
  on conflict(session_id) do nothing;
  insert into public.training_roleplay_usage(user_id,session_id,usage_month,plan)
  values(p_user_id,p_session_id,v_month,v_session.plan_snapshot) on conflict(session_id) do nothing;
  update public.training_roleplay_sessions set quota_consumed_at=now(),client_consumption_id=v_consumption_id,updated_at=now() where id=p_session_id;
  return jsonb_build_object('consumed',true,'unlimited',v_session.plan_snapshot='unlimited','used',v_used+1,'remaining',case when v_session.plan_snapshot='unlimited' then null else greatest(0,p_monthly_limit-v_used-1) end);
end $$;

create or replace function public.reverse_training_roleplay_quota(
  p_session_id uuid,
  p_reason text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare v_consumption public.training_roleplay_quota_consumptions%rowtype;
begin
  select * into v_consumption from public.training_roleplay_quota_consumptions where session_id=p_session_id for update;
  if not found then return jsonb_build_object('reversed',false,'reason','not_consumed'); end if;
  if v_consumption.status='reversed' then return jsonb_build_object('reversed',false,'idempotent',true); end if;
  update public.training_roleplay_quota_consumptions set status='reversed',reversed_at=now(),reversal_reason=p_reason,reversed_by='system' where id=v_consumption.id;
  delete from public.training_roleplay_usage where session_id=p_session_id;
  update public.training_roleplay_sessions set quota_consumed_at=null,updated_at=now() where id=p_session_id;
  return jsonb_build_object('reversed',true);
end $$;
revoke all on function public.reverse_training_roleplay_quota(uuid,text) from public,anon,authenticated;
grant execute on function public.reverse_training_roleplay_quota(uuid,text) to service_role;

-- One rubric per category. Scenario-specific versions can fork these later.
insert into public.training_roleplay_rubrics(slug,name,description,category_id,status)
select c.slug||'-v1', 'Rúbrica de '||c.name, 'Evalúa desempeño conversacional aplicado en '||lower(c.name)||'.', c.id, 'published'
from public.training_roleplay_categories c on conflict(slug) do nothing;

insert into public.training_roleplay_rubric_versions(rubric_id,version,status,criteria,published_at)
select r.id,1,'published',jsonb_build_array(
  jsonb_build_object('id','claridad','label','Claridad','weight',20,'maxScore',20),
  jsonb_build_object('id','escucha','label','Escucha y comprensión','weight',20,'maxScore',20),
  jsonb_build_object('id','criterio','label','Criterio aplicado','weight',25,'maxScore',25),
  jsonb_build_object('id','respuesta','label','Calidad de respuesta','weight',20,'maxScore',20),
  jsonb_build_object('id','cierre','label','Próximo paso o cierre','weight',15,'maxScore',15)
),now() from public.training_roleplay_rubrics r
where not exists(select 1 from public.training_roleplay_rubric_versions rv where rv.rubric_id=r.id and rv.version=1);

with scenario_seed(slug,title,description,category_slug,level,character_name,character_brief,learner_goal,opening_message,skills) as (values
('cliente-esceptico','Cliente escéptico','Defiende valor sin presionar ni prometer de más.','ventas','fundamentals','Andrea, cliente potencial','Prudente y escéptica ante afirmaciones vagas.','Descubrir prioridades y explicar valor con evidencia.','He visto ofertas muy parecidas. ¿Qué hace que esta opción merezca mi tiempo?',array['descubrimiento','objeciones']),
('descubrimiento-necesidades','Descubrimiento de necesidades','Practica preguntas útiles antes de ofrecer una solución.','ventas','application','Carlos, prospecto','Tiene una necesidad, pero aún no la formula con claridad.','Comprender problema, impacto y criterio de decisión.','Cuéntame qué necesitas saber antes de recomendarme algo.',array['descubrimiento','escucha']),
('colaborador-bajo-rendimiento','Colaborador con bajo rendimiento','Conversa sobre desempeño con hechos y respeto.','liderazgo','fundamentals','Marina, colaboradora','Comprometida, pero defensiva ante comentarios generales.','Acordar una mejora observable y apoyo concreto.','Me comentaste que querías hablar de mis últimos resultados.',array['feedback','claridad']),
('delegar-tarea','Delegar una tarea importante','Delega con contexto, autonomía y criterios claros.','liderazgo','application','Diego, miembro del equipo','Capaz, aunque duda del alcance y las prioridades.','Alinear resultado, límites, recursos y seguimiento.','Puedo tomar la tarea, pero necesito entender qué esperas exactamente.',array['delegacion','claridad']),
('proveedor-aumenta-precios','Proveedor aumenta precios','Negocia intereses y concesiones sin deteriorar la relación.','negociacion','application','Lucía, proveedora','Firme por aumentos de costos, abierta a intercambios.','Entender restricciones y construir un acuerdo sostenible.','La nueva tarifa entra en vigor este mes y no puedo mantener el precio anterior.',array['negociacion','escucha']),
('socio-prioridades-distintas','Socio con prioridades distintas','Busca acuerdos cuando dos prioridades compiten.','negociacion','advanced','Mateo, socio','Directo, impaciente y orientado al crecimiento.','Identificar intereses y acordar criterios de decisión.','Creo que debemos invertir todo en crecimiento; esperar nos hará perder la oportunidad.',array['negociacion','criterio']),
('cliente-molesto-error','Cliente molesto por un error','Responde a un reclamo sin evadir responsabilidad.','atencion-al-cliente','fundamentals','Sofía, cliente','Molesta, necesita reconocimiento y solución concreta.','Desescalar, aclarar y acordar resolución.','Este error me hizo perder tiempo. No quiero una disculpa genérica.',array['empatia','resolucion']),
('solicitud-devolucion','Solicitud de devolución','Aplica políticas con empatía y alternativas legítimas.','atencion-al-cliente','application','Javier, cliente','Insatisfecho y decidido a pedir devolución.','Comprender el caso, explicar límites y ofrecer una salida justa.','Quiero que me devuelvan el dinero hoy. El servicio no fue lo que esperaba.',array['empatia','resolucion']),
('conversacion-dificil-companero','Conversación difícil con un compañero','Aborda una fricción laboral sin acusaciones.','comunicacion-profesional','fundamentals','Paula, compañera','Se siente cuestionada y quiere ser escuchada.','Describir hechos, impacto y petición concreta.','Siento que últimamente cuestionas mi trabajo frente al equipo.',array['comunicacion','feedback']),
('presentar-idea-equipo','Presentar una idea al equipo','Explica una propuesta y facilita preguntas.','comunicacion-profesional','application','Comité interno','Curioso, con poco tiempo y criterios diversos.','Lograr comprensión, resolver dudas y pedir un siguiente paso.','Tienes cinco minutos. ¿Qué propones y por qué deberíamos considerarlo?',array['claridad','influencia']),
('entrevista-validacion','Entrevista de validación','Aprende del problema sin vender durante la entrevista.','emprendimiento','fundamentals','Elena, usuaria potencial','Amable, pero responde de forma superficial si la guían.','Descubrir comportamientos reales y señales del problema.','Claro, puedo contarte cómo resuelvo esto actualmente.',array['validacion','escucha']),
('pitch-inversionista','Pitch ante inversionista','Presenta oportunidad, evidencia y riesgos con precisión.','emprendimiento','advanced','Tomás, inversionista','Analítico, directo y escéptico ante métricas débiles.','Explicar problema, tracción, modelo y uso de recursos.','Entiendo la idea. Ahora dime por qué este mercado, por qué ustedes y por qué ahora.',array['pitch','propuesta-de-valor']),
('defender-presupuesto','Defender un presupuesto','Argumenta una inversión con supuestos y alternativas.','finanzas-decisiones','application','Comité financiero','Cuida liquidez y exige evidencia de retorno.','Justificar prioridad, riesgos, métricas y puntos de control.','El presupuesto es mayor que el trimestre anterior. ¿Qué retorno concreto esperas?',array['presupuesto','priorizacion']),
('flujo-de-caja','Decidir ante presión de flujo de caja','Prioriza acciones cuando la liquidez es limitada.','finanzas-decisiones','expert','Directora financiera','Serena, rigurosa y poco tolerante a supuestos ocultos.','Proponer decisiones responsables con escenarios y límites.','Tenemos caja para ocho semanas. ¿Qué recortas, qué proteges y qué evidencia usarás?',array['flujo-de-caja','priorizacion'])
)
insert into public.training_roleplay_scenarios
  (slug,title,description,category,level,character_name,character_brief,learner_goal,opening_message,is_active,category_id,internal_title,public_title,short_description,status,current_version,minimum_plan,estimated_minutes,max_turns,skill_slugs)
select s.slug,s.title,s.description,c.name,s.level,s.character_name,s.character_brief,s.learner_goal,s.opening_message,true,c.id,s.title,s.title,s.description,'published',1,case when s.level in ('advanced','expert') then 'unlimited' else 'pro' end,10,16,s.skills
from scenario_seed s join public.training_roleplay_categories c on c.slug=s.category_slug
on conflict(slug) do update set
  title=excluded.title,description=excluded.description,category=excluded.category,level=excluded.level,
  character_name=excluded.character_name,character_brief=excluded.character_brief,learner_goal=excluded.learner_goal,
  opening_message=excluded.opening_message,is_active=true,category_id=excluded.category_id,public_title=excluded.public_title,
  short_description=excluded.short_description,status='published',minimum_plan=excluded.minimum_plan,skill_slugs=excluded.skill_slugs;

insert into public.training_roleplay_scenario_versions
  (scenario_id,version,status,public_config,character_private_context,state_machine_config,safety_rules,prompt_version,rubric_version_id,published_at)
select s.id,1,'published',
  jsonb_build_object('title',s.public_title,'description',s.short_description,'characterName',s.character_name,'learnerGoal',s.learner_goal,'openingMessage',s.opening_message,'estimatedMinutes',s.estimated_minutes,'maxTurns',s.max_turns,'skills',s.skill_slugs),
  jsonb_build_object('characterBrief',s.character_brief,'objectives',jsonb_build_array('Mantener un diálogo realista','Revelar información de forma gradual'),'hiddenInformation',jsonb_build_array('No entregar la solución al participante')),
  jsonb_build_object('initialPhase','opening','phases',jsonb_build_array('opening','discovery','tension','resolution','closing')),
  jsonb_build_object('ethicalPersuasion',true,'forbidFraud',true,'forbidCoercion',true,'forbidProfessionalSubstitution',true),
  'roleplay-character-v1',rv.id,now()
from public.training_roleplay_scenarios s
join public.training_roleplay_rubrics r on r.category_id=s.category_id
join public.training_roleplay_rubric_versions rv on rv.rubric_id=r.id and rv.version=1
where s.status='published' and not exists(select 1 from public.training_roleplay_scenario_versions v where v.scenario_id=s.id and v.version=1);

update public.training_roleplay_sessions s set
  scenario_version_id=v.id,
  scenario_snapshot=jsonb_build_object('scenarioId',sc.id,'title',sc.public_title,'category',sc.category,'level',sc.level),
  difficulty=sc.level,
  max_turns=sc.max_turns,
  resume_expires_at=coalesce(s.resume_expires_at,s.last_activity_at+interval '24 hours')
from public.training_roleplay_scenarios sc
join public.training_roleplay_scenario_versions v on v.scenario_id=sc.id and v.version=sc.current_version
where s.scenario_id=sc.id and s.scenario_version_id is null;
