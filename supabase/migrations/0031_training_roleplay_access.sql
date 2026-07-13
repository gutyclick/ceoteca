create table public.training_roleplay_scenarios (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  category text not null,
  level text not null check (level in ('fundamentals','application','advanced')),
  character_name text not null,
  character_brief text not null,
  learner_goal text not null,
  opening_message text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.training_roleplay_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_id uuid references public.training_roleplay_scenarios(id),
  custom_scenario jsonb,
  plan_snapshot text not null check (plan_snapshot in ('free','pro','unlimited','founder')),
  status text not null default 'ready' check (status in ('ready','active','completed','abandoned','failed')),
  is_editorial_preview boolean not null default false,
  is_automated_test boolean not null default false,
  turn_count integer not null default 0 check (turn_count >= 0),
  provider_responded_at timestamptz,
  first_valid_user_turn_at timestamptz,
  quota_consumed_at timestamptz,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint roleplay_scenario_source check ((scenario_id is not null) <> (custom_scenario is not null))
);

create table public.training_roleplay_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_roleplay_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_turn_id uuid,
  role text not null check (role in ('character','user')),
  content text not null check (char_length(content) between 1 and 4000),
  turn_number integer not null check (turn_number >= 0),
  provider text,
  model text,
  created_at timestamptz not null default now()
);
create unique index training_roleplay_user_turn_idempotency on public.training_roleplay_messages(user_id,client_turn_id) where client_turn_id is not null and role='user';
create index training_roleplay_sessions_user_activity on public.training_roleplay_sessions(user_id,last_activity_at desc);

create table public.training_roleplay_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null unique references public.training_roleplay_sessions(id) on delete cascade,
  usage_month date not null,
  plan text not null,
  consumed_at timestamptz not null default now()
);
create index training_roleplay_usage_month on public.training_roleplay_usage(user_id,usage_month);

alter table public.training_roleplay_scenarios enable row level security;
alter table public.training_roleplay_sessions enable row level security;
alter table public.training_roleplay_messages enable row level security;
alter table public.training_roleplay_usage enable row level security;

create or replace function public.consume_training_roleplay_quota(p_session_id uuid,p_user_id uuid,p_monthly_limit integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_session public.training_roleplay_sessions%rowtype; v_month date:=date_trunc('month',now())::date; v_used integer;
begin
  select * into v_session from public.training_roleplay_sessions where id=p_session_id and user_id=p_user_id for update;
  if not found then raise exception 'session_not_found'; end if;
  if v_session.quota_consumed_at is not null then return jsonb_build_object('consumed',false,'idempotent',true); end if;
  if v_session.is_editorial_preview or v_session.is_automated_test then return jsonb_build_object('consumed',false,'exempt',true); end if;
  if v_session.provider_responded_at is null or v_session.first_valid_user_turn_at is null then raise exception 'first_turn_incomplete'; end if;
  if v_session.plan_snapshot='free' then raise exception 'roleplay_not_available'; end if;
  if v_session.plan_snapshot='unlimited' then
    insert into public.training_roleplay_usage(user_id,session_id,usage_month,plan) values(p_user_id,p_session_id,v_month,v_session.plan_snapshot) on conflict(session_id) do nothing;
    update public.training_roleplay_sessions set quota_consumed_at=now() where id=p_session_id;
    return jsonb_build_object('consumed',true,'unlimited',true);
  end if;
  select count(*) into v_used from public.training_roleplay_usage where user_id=p_user_id and usage_month=v_month;
  if v_used >= p_monthly_limit then raise exception 'monthly_limit_reached'; end if;
  insert into public.training_roleplay_usage(user_id,session_id,usage_month,plan) values(p_user_id,p_session_id,v_month,v_session.plan_snapshot) on conflict(session_id) do nothing;
  update public.training_roleplay_sessions set quota_consumed_at=now() where id=p_session_id;
  return jsonb_build_object('consumed',true,'used',v_used+1,'remaining',greatest(0,p_monthly_limit-v_used-1));
end $$;
revoke all on function public.consume_training_roleplay_quota(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.consume_training_roleplay_quota(uuid,uuid,integer) to service_role;

insert into public.training_roleplay_scenarios(slug,title,description,category,level,character_name,character_brief,learner_goal,opening_message) values
('propuesta-cliente-indeciso','Defiende una propuesta de valor','Practica claridad y descubrimiento con un cliente que aún no percibe la diferencia.','Ventas','fundamentals','Cliente potencial','Interesado, prudente y sensible al valor.','Comprender la necesidad y explicar una propuesta concreta.','Tengo varias opciones parecidas. ¿Por qué debería considerar la tuya?'),
('feedback-equipo','Conversa sobre desempeño','Practica feedback claro, respetuoso y accionable.','Liderazgo','application','Miembro del equipo','Comprometido, pero a la defensiva ante comentarios vagos.','Dar feedback basado en hechos y acordar un siguiente paso.','Me dijiste que querías hablar sobre mi último proyecto. ¿Qué necesitas decirme?'),
('negociacion-compleja','Negocia prioridades y concesiones','Entrena una negociación con intereses contrapuestos.','Negociación','advanced','Contraparte','Experimentada, exigente y orientada a resultados.','Descubrir intereses, proponer intercambios y cerrar acuerdos verificables.','Podemos avanzar, pero necesito una reducción importante de precio y entrega inmediata.');
