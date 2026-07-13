create or replace function public.advance_training_session(
  p_session_id uuid,
  p_session_exercise_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_position integer;
  v_next_index integer;
begin
  if v_user_id is null then raise exception 'UNAUTHORIZED'; end if;

  select tse.position into v_position
  from public.training_session_exercises tse
  join public.training_sessions ts on ts.id = tse.session_id
  where tse.id = p_session_exercise_id
    and tse.session_id = p_session_id
    and ts.user_id = v_user_id;

  if v_position is null then raise exception 'SESSION_EXERCISE_NOT_FOUND'; end if;
  v_next_index := v_position + 1;

  update public.training_sessions
  set current_exercise_index = greatest(current_exercise_index, v_next_index),
      status = case when status = 'not_started' then 'in_progress' else status end,
      started_at = coalesce(started_at, now()),
      updated_at = now()
  where id = p_session_id and user_id = v_user_id;

  return v_next_index;
end;
$$;

revoke all on function public.advance_training_session(uuid, uuid) from public;
grant execute on function public.advance_training_session(uuid, uuid) to authenticated;
