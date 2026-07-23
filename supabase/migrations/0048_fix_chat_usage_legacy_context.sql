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
      values (
        event.user_id,
        event.book_id,
        case when event.metadata->>'conversationType' = 'general' then 'site' else 'book' end,
        event.period_start::date,
        event.amount
      )
      on conflict (user_id, context, book_id, month)
      do update set question_count = public.chat_usage.question_count + excluded.question_count, updated_at = now();
    end if;
    event.status := 'consumed';
  end if;

  return public.chat_usage_snapshot_json(event.user_id, event.plan, configured_limit, event.period_start, event.period_end, event.id, true, null)
    || jsonb_build_object('usageStatus', event.status, 'replayed', false);
end;
$$;

revoke all on function public.confirm_chat_usage(uuid, uuid) from public, anon, authenticated;
grant execute on function public.confirm_chat_usage(uuid, uuid) to service_role;
