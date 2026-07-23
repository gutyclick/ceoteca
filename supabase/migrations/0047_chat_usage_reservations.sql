create table if not exists public.chat_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.chat_conversations(id) on delete set null,
  message_id uuid references public.chat_messages(id) on delete set null,
  book_id uuid references public.books(id) on delete set null,
  feature text not null default 'chat',
  plan text not null check (plan in ('free', 'pro', 'unlimited', 'founder')),
  usage_type text not null check (usage_type in ('message', 'regeneration', 'contextual_action', 'book_chat', 'general_chat', 'promotional', 'adjustment')),
  amount integer not null default 1 check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'consumed', 'released', 'refunded', 'failed')),
  idempotency_key uuid not null,
  period_kind text not null default 'calendar_month' check (period_kind in ('calendar_month', 'billing_cycle', 'day', 'promotional', 'total', 'unlimited')),
  period_start timestamptz not null,
  period_end timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  reserved_at timestamptz not null default now(),
  consumed_at timestamptz,
  released_at timestamptz,
  refunded_at timestamptz,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, feature, idempotency_key)
);

alter table public.chat_events drop constraint if exists chat_events_event_type_check;
alter table public.chat_events add constraint chat_events_event_type_check check (
  event_type in (
    'moderation_block', 'limit_reached', 'provider_error', 'validation_error',
    'usage_reserved', 'usage_consumed', 'usage_released', 'usage_limit_reached',
    'usage_regeneration', 'usage_contextual_action', 'usage_rate_limited'
  )
);

create index if not exists chat_usage_events_user_period_idx
  on public.chat_usage_events(user_id, feature, period_start, period_end, status);
create index if not exists chat_usage_events_conversation_idx
  on public.chat_usage_events(conversation_id, created_at desc)
  where conversation_id is not null;

alter table public.chat_usage_events enable row level security;

drop policy if exists "Users read own chat usage events" on public.chat_usage_events;
create policy "Users read own chat usage events"
  on public.chat_usage_events for select
  using (auth.uid() = user_id);

create or replace function public.chat_usage_snapshot_json(
  target_user_id uuid,
  target_plan text,
  target_limit integer,
  target_period_start timestamptz,
  target_period_end timestamptz,
  target_usage_id uuid default null,
  target_allowed boolean default true,
  target_reason text default null
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with totals as (
    select
      coalesce(sum(amount) filter (where status = 'consumed'), 0)::integer as used,
      coalesce(sum(amount) filter (where status = 'pending' and expires_at > now()), 0)::integer as reserved
    from public.chat_usage_events
    where user_id = target_user_id
      and feature = 'chat'
      and period_start = target_period_start
      and period_end = target_period_end
  )
  select jsonb_build_object(
    'allowed', target_allowed,
    'reason', target_reason,
    'plan', target_plan,
    'used', used,
    'limit', target_limit,
    'remaining', case when target_limit is null then null else greatest(target_limit - used - reserved, 0) end,
    'unlimited', target_limit is null,
    'periodStart', target_period_start,
    'periodEnd', target_period_end,
    'usageId', target_usage_id
  )
  from totals;
$$;

create or replace function public.reserve_chat_usage(
  target_user_id uuid,
  target_plan text,
  target_limit integer,
  target_period_start timestamptz,
  target_period_end timestamptz,
  target_period_kind text,
  target_idempotency_key uuid,
  target_usage_type text,
  target_book_id uuid default null,
  target_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.chat_usage_events%rowtype;
  usage_id uuid;
  unavailable boolean;
begin
  if auth.role() <> 'service_role' then raise exception 'not allowed'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_user_id::text || ':chat:' || target_period_start::text, 0));

  update public.chat_usage_events
  set status = 'released', released_at = now(), updated_at = now()
  where user_id = target_user_id and feature = 'chat' and status = 'pending' and expires_at <= now();

  select * into existing from public.chat_usage_events
  where user_id = target_user_id and feature = 'chat' and idempotency_key = target_idempotency_key;
  if found then
    return public.chat_usage_snapshot_json(
      target_user_id, target_plan, target_limit, target_period_start, target_period_end,
      existing.id, existing.status in ('pending', 'consumed'),
      case when existing.status in ('pending', 'consumed') then null else 'reservation_released' end
    ) || jsonb_build_object('usageStatus', existing.status, 'replayed', true);
  end if;

  select target_limit is not null and coalesce(sum(amount), 0) + 1 > target_limit into unavailable
  from public.chat_usage_events
  where user_id = target_user_id and feature = 'chat'
    and period_start = target_period_start and period_end = target_period_end
    and (status = 'consumed' or (status = 'pending' and expires_at > now()));

  if unavailable then
    return public.chat_usage_snapshot_json(target_user_id, target_plan, target_limit, target_period_start, target_period_end, null, false, 'usage_limit_reached')
      || jsonb_build_object('usageStatus', null, 'replayed', false);
  end if;

  insert into public.chat_usage_events (
    user_id, book_id, plan, usage_type, idempotency_key, period_kind,
    period_start, period_end, metadata
  ) values (
    target_user_id, target_book_id, target_plan, target_usage_type, target_idempotency_key,
    target_period_kind, target_period_start, target_period_end, target_metadata
  ) returning id into usage_id;

  return public.chat_usage_snapshot_json(target_user_id, target_plan, target_limit, target_period_start, target_period_end, usage_id, true, null)
    || jsonb_build_object('usageStatus', 'pending', 'replayed', false);
end;
$$;

create or replace function public.confirm_chat_usage(target_usage_id uuid, target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare event public.chat_usage_events%rowtype;
declare configured_limit integer;
begin
  if auth.role() <> 'service_role' then raise exception 'not allowed'; end if;
  select * into event from public.chat_usage_events where id = target_usage_id and user_id = target_user_id for update;
  if not found then raise exception 'usage reservation not found'; end if;
  configured_limit := nullif(event.metadata->>'limit', '')::integer;

  if event.status = 'pending' then
    update public.chat_usage_events set status = 'consumed', consumed_at = now(), updated_at = now() where id = event.id;
    if event.book_id is not null then
      insert into public.chat_usage (user_id, book_id, context, month, question_count)
      values (event.user_id, event.book_id, case when event.metadata->>'conversationType' = 'general' then 'site' else 'book' end, event.period_start::date, event.amount)
      on conflict (user_id, context, book_id, month)
      do update set question_count = public.chat_usage.question_count + excluded.question_count, updated_at = now();
    end if;
    event.status := 'consumed';
  end if;

  return public.chat_usage_snapshot_json(event.user_id, event.plan, configured_limit, event.period_start, event.period_end, event.id, true, null)
    || jsonb_build_object('usageStatus', event.status, 'replayed', false);
end;
$$;

create or replace function public.release_chat_usage(target_usage_id uuid, target_user_id uuid, target_reason text default 'generation_not_started')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare event public.chat_usage_events%rowtype;
declare configured_limit integer;
begin
  if auth.role() <> 'service_role' then raise exception 'not allowed'; end if;
  select * into event from public.chat_usage_events where id = target_usage_id and user_id = target_user_id for update;
  if not found then raise exception 'usage reservation not found'; end if;
  configured_limit := nullif(event.metadata->>'limit', '')::integer;
  if event.status = 'pending' then
    update public.chat_usage_events
    set status = 'released', released_at = now(), updated_at = now(), metadata = metadata || jsonb_build_object('releaseReason', target_reason)
    where id = event.id;
    event.status := 'released';
  end if;
  return public.chat_usage_snapshot_json(event.user_id, event.plan, configured_limit, event.period_start, event.period_end, event.id, false, target_reason)
    || jsonb_build_object('usageStatus', event.status, 'replayed', false);
end;
$$;

create or replace function public.get_chat_usage_snapshot(
  target_user_id uuid,
  target_plan text,
  target_limit integer,
  target_period_start timestamptz,
  target_period_end timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then raise exception 'not allowed'; end if;
  return public.chat_usage_snapshot_json(target_user_id, target_plan, target_limit, target_period_start, target_period_end, null, true, null)
    || jsonb_build_object('usageStatus', null, 'replayed', false);
end;
$$;

revoke all on function public.reserve_chat_usage(uuid, text, integer, timestamptz, timestamptz, text, uuid, text, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.confirm_chat_usage(uuid, uuid) from public, anon, authenticated;
revoke all on function public.release_chat_usage(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.get_chat_usage_snapshot(uuid, text, integer, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.chat_usage_snapshot_json(uuid, text, integer, timestamptz, timestamptz, uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.reserve_chat_usage(uuid, text, integer, timestamptz, timestamptz, text, uuid, text, uuid, jsonb) to service_role;
grant execute on function public.confirm_chat_usage(uuid, uuid) to service_role;
grant execute on function public.release_chat_usage(uuid, uuid, text) to service_role;
grant execute on function public.get_chat_usage_snapshot(uuid, text, integer, timestamptz, timestamptz) to service_role;
grant execute on function public.chat_usage_snapshot_json(uuid, text, integer, timestamptz, timestamptz, uuid, boolean, text) to service_role;

comment on table public.chat_usage_events is
  'Reservas y consumos de Chat con CEO. Una consulta se confirma al comenzar una respuesta valida y se libera si la generacion no inicia.';
