-- CEOTECA Training block 3: secure learning-path progress and session linkage.

alter table public.training_learning_path_module_items
  add column if not exists minimum_plan text not null default 'free'
    check (minimum_plan in ('free','pro','unlimited')),
  add column if not exists preview_allowed boolean not null default true,
  add column if not exists locked_reason text,
  add column if not exists alternative_item_id uuid references public.training_learning_path_module_items on delete set null;

alter table public.training_sessions
  add column if not exists learning_path_id uuid references public.training_learning_paths on delete set null,
  add column if not exists learning_path_module_id uuid references public.training_learning_path_modules on delete set null,
  add column if not exists learning_path_item_id uuid references public.training_learning_path_module_items on delete set null;

alter table public.training_roleplay_sessions
  add column if not exists learning_path_id uuid references public.training_learning_paths on delete set null,
  add column if not exists learning_path_module_id uuid references public.training_learning_path_modules on delete set null,
  add column if not exists learning_path_item_id uuid references public.training_learning_path_module_items on delete set null;

create index if not exists training_sessions_learning_path_item_idx
  on public.training_sessions(user_id,learning_path_item_id,status,updated_at desc)
  where learning_path_item_id is not null;

create table if not exists public.user_training_path_item_progress (
  user_id uuid not null references auth.users on delete cascade,
  item_id uuid not null references public.training_learning_path_module_items on delete cascade,
  status text not null default 'in_progress' check(status in ('in_progress','completed')),
  source_type text check(source_type in ('training_session','roleplay_session','template_completion')),
  source_id uuid,
  score numeric check(score between 0 and 100),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id,item_id),
  unique(user_id,source_type,source_id)
);

create index if not exists user_training_path_item_progress_user_status_idx
  on public.user_training_path_item_progress(user_id,status,updated_at desc);

alter table public.user_training_path_progress enable row level security;
alter table public.user_training_path_module_progress enable row level security;
alter table public.user_training_path_item_progress enable row level security;

drop policy if exists user_training_path_progress_own_read on public.user_training_path_progress;
create policy user_training_path_progress_own_read on public.user_training_path_progress
  for select to authenticated using(user_id=auth.uid());
drop policy if exists user_training_path_module_progress_own_read on public.user_training_path_module_progress;
create policy user_training_path_module_progress_own_read on public.user_training_path_module_progress
  for select to authenticated using(user_id=auth.uid());
drop policy if exists user_training_path_item_progress_own_read on public.user_training_path_item_progress;
create policy user_training_path_item_progress_own_read on public.user_training_path_item_progress
  for select to authenticated using(user_id=auth.uid());

-- Progress is derived from required completed items. The client cannot write it.
create or replace function public.recalculate_training_learning_path_progress(
  p_user_id uuid,
  p_path_id uuid
) returns public.user_training_path_progress
language plpgsql security definer set search_path=public as $$
declare
  v_module record;
  v_module_total integer;
  v_module_done integer;
  v_path_total integer;
  v_path_done integer;
  v_current_module uuid;
  v_result public.user_training_path_progress;
begin
  if auth.role()<>'service_role' and pg_trigger_depth()=0 then raise exception 'SERVER_ONLY'; end if;

  for v_module in
    select id,sort_order from public.training_learning_path_modules
    where path_id=p_path_id and status='published' order by sort_order
  loop
    select count(*) into v_module_total
    from public.training_learning_path_module_items where module_id=v_module.id and is_required;
    select count(*) into v_module_done
    from public.training_learning_path_module_items item
    join public.user_training_path_item_progress progress
      on progress.item_id=item.id and progress.user_id=p_user_id and progress.status='completed'
    where item.module_id=v_module.id and item.is_required;

    insert into public.user_training_path_module_progress(user_id,module_id,status,progress,started_at,completed_at,updated_at)
    values(
      p_user_id,v_module.id,
      case when v_module_total=0 or v_module_done>=v_module_total then 'completed' else 'in_progress' end,
      case when v_module_total=0 then 100 else round(100.0*v_module_done/v_module_total,2) end,
      now(),case when v_module_total=0 or v_module_done>=v_module_total then now() else null end,now()
    ) on conflict(user_id,module_id) do update set
      progress=excluded.progress,
      status=case
        when excluded.status='completed' then 'completed'
        when user_training_path_module_progress.status='locked' then 'locked'
        else 'in_progress'
      end,
      started_at=coalesce(user_training_path_module_progress.started_at,excluded.started_at),
      completed_at=case when excluded.status='completed' then coalesce(user_training_path_module_progress.completed_at,excluded.completed_at) else null end,
      updated_at=now();
  end loop;

  -- Unlock only the first incomplete module whose required predecessors are complete.
  select module.id into v_current_module
  from public.training_learning_path_modules module
  where module.path_id=p_path_id and module.status='published'
    and not exists(
      select 1 from public.training_learning_path_modules predecessor
      where predecessor.path_id=p_path_id and predecessor.status='published'
        and predecessor.sort_order < module.sort_order
        and exists(
          select 1 from public.training_learning_path_module_items predecessor_item
          where predecessor_item.module_id=predecessor.id and predecessor_item.is_required
            and not exists(
              select 1 from public.user_training_path_item_progress completed
              where completed.user_id=p_user_id and completed.item_id=predecessor_item.id and completed.status='completed'
            )
        )
    )
    and exists(
      select 1 from public.training_learning_path_module_items current_item
      where current_item.module_id=module.id and current_item.is_required
        and not exists(
          select 1 from public.user_training_path_item_progress completed
          where completed.user_id=p_user_id and completed.item_id=current_item.id and completed.status='completed'
        )
    )
  order by module.sort_order limit 1;

  update public.user_training_path_module_progress progress set
    status=case
      when progress.status='completed' then 'completed'
      when progress.module_id=v_current_module then 'available'
      else 'locked'
    end,
    updated_at=now()
  from public.training_learning_path_modules module
  where progress.user_id=p_user_id and progress.module_id=module.id and module.path_id=p_path_id;

  select count(*),count(*) filter(where completed.item_id is not null)
  into v_path_total,v_path_done
  from public.training_learning_path_modules module
  join public.training_learning_path_module_items item on item.module_id=module.id and item.is_required
  left join public.user_training_path_item_progress completed
    on completed.user_id=p_user_id and completed.item_id=item.id and completed.status='completed'
  where module.path_id=p_path_id and module.status='published';

  update public.user_training_path_progress set
    progress=case when v_path_total=0 then 0 else round(100.0*v_path_done/v_path_total,2) end,
    current_module_id=v_current_module,
    status=case when v_path_total>0 and v_path_done>=v_path_total then 'completed' else 'in_progress' end,
    completed_at=case when v_path_total>0 and v_path_done>=v_path_total then coalesce(completed_at,now()) else null end,
    updated_at=now()
  where user_id=p_user_id and path_id=p_path_id returning * into v_result;
  return v_result;
end $$;

revoke all on function public.recalculate_training_learning_path_progress(uuid,uuid) from public,authenticated;
grant execute on function public.recalculate_training_learning_path_progress(uuid,uuid) to service_role;

create or replace function public.start_training_learning_path_server(p_user_id uuid,p_path_id uuid)
returns public.user_training_path_progress
language plpgsql security definer set search_path=public as $$
declare v_first uuid; v_result public.user_training_path_progress;
begin
  if auth.role()<>'service_role' then raise exception 'SERVER_ONLY'; end if;
  select id into v_first from public.training_learning_path_modules
  where path_id=p_path_id and status='published' order by sort_order limit 1;
  if v_first is null then raise exception 'PATH_WITHOUT_MODULES'; end if;
  insert into public.user_training_path_progress(user_id,path_id,current_module_id,status,started_at,updated_at)
  values(p_user_id,p_path_id,v_first,'in_progress',now(),now())
  on conflict(user_id,path_id) do update set updated_at=now()
  returning * into v_result;
  insert into public.user_training_path_module_progress(user_id,module_id,status,progress,started_at,updated_at)
  select p_user_id,id,case when id=v_first then 'available' else 'locked' end,0,
    case when id=v_first then now() else null end,now()
  from public.training_learning_path_modules where path_id=p_path_id and status='published'
  on conflict(user_id,module_id) do nothing;
  return v_result;
end $$;
revoke all on function public.start_training_learning_path_server(uuid,uuid) from public,authenticated;
grant execute on function public.start_training_learning_path_server(uuid,uuid) to service_role;

create or replace function public.start_training_path_item_server(p_user_id uuid,p_item_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare
  v_item public.training_learning_path_module_items;
  v_module public.training_learning_path_modules;
  v_path public.training_learning_paths;
  v_exercise uuid;
  v_session uuid;
  v_count integer;
begin
  if auth.role()<>'service_role' then raise exception 'SERVER_ONLY'; end if;
  select * into v_item from public.training_learning_path_module_items where id=p_item_id;
  select * into v_module from public.training_learning_path_modules where id=v_item.module_id and status='published';
  select * into v_path from public.training_learning_paths where id=v_module.path_id and status='published';
  if v_item.id is null or v_module.id is null or v_path.id is null then raise exception 'ITEM_NOT_AVAILABLE'; end if;
  if not exists(select 1 from public.user_training_path_progress where user_id=p_user_id and path_id=v_path.id) then raise exception 'PATH_NOT_STARTED'; end if;
  if not exists(select 1 from public.user_training_path_module_progress where user_id=p_user_id and module_id=v_module.id and status in('available','in_progress','completed')) then raise exception 'MODULE_LOCKED'; end if;

  select id into v_session from public.training_sessions
  where user_id=p_user_id and learning_path_item_id=p_item_id and status in('not_started','in_progress')
  order by updated_at desc limit 1;
  if v_session is not null then return v_session; end if;

  if v_item.item_type='template' then
    select count(*) into v_count from public.training_template_exercises te
    join public.training_exercises exercise on exercise.id=te.exercise_id and exercise.status='published'
    where te.template_id=v_item.template_id;
    if v_count=0 or not exists(select 1 from public.training_templates where id=v_item.template_id and is_active) then raise exception 'ITEM_CONTENT_UNAVAILABLE'; end if;
    insert into public.training_sessions(user_id,template_id,title,total_exercises,estimated_minutes,status,learning_path_id,learning_path_module_id,learning_path_item_id)
    select p_user_id,template.id,template.title,v_count,template.estimated_minutes,'not_started',v_path.id,v_module.id,v_item.id
    from public.training_templates template where template.id=v_item.template_id returning id into v_session;
    insert into public.training_session_exercises(session_id,exercise_id,position,exercise_snapshot)
    select v_session,exercise.id,te.position,jsonb_build_object(
      'id',exercise.id,'type',exercise.type,'title',exercise.title,'prompt',exercise.prompt,
      'instruction',exercise.instruction,'difficulty',exercise.difficulty,'estimatedSeconds',exercise.estimated_seconds,
      'hint',exercise.hint,'explanation',exercise.explanation,'content',exercise.content,
      'skillId',exercise.skill_id,'conceptId',exercise.concept_id,'minimumLength',exercise.minimum_response_length,
      'maximumLength',exercise.maximum_response_length,'allowRevision',exercise.allow_revision,'maxRevisions',exercise.max_revisions
    ) from public.training_template_exercises te join public.training_exercises exercise on exercise.id=te.exercise_id
    where te.template_id=v_item.template_id and exercise.status='published' order by te.position;
  elsif v_item.item_type in ('exercise','review') then v_exercise:=v_item.exercise_id;
  elsif v_item.item_type='skill_session' then
    select id into v_exercise from public.training_exercises where skill_id=v_item.skill_id and status='published' order by created_at limit 1;
  elsif v_item.item_type='concept_session' then
    select id into v_exercise from public.training_exercises where concept_id=v_item.concept_id and status='published' order by created_at limit 1;
  else
    raise exception 'ITEM_RENDERER_UNAVAILABLE';
  end if;
  if v_item.item_type<>'template' and (v_exercise is null or not exists(select 1 from public.training_exercises where id=v_exercise and status='published')) then raise exception 'ITEM_CONTENT_UNAVAILABLE'; end if;

  if v_item.item_type<>'template' then
    insert into public.training_sessions(user_id,title,total_exercises,estimated_minutes,status,learning_path_id,learning_path_module_id,learning_path_item_id)
    select p_user_id,e.title,1,greatest(1,ceil(e.estimated_seconds/60.0)::int),'not_started',v_path.id,v_module.id,v_item.id
    from public.training_exercises e where e.id=v_exercise returning id into v_session;
    insert into public.training_session_exercises(session_id,exercise_id,position,exercise_snapshot)
    select v_session,e.id,1,jsonb_build_object(
      'id',e.id,'type',e.type,'title',e.title,'prompt',e.prompt,'instruction',e.instruction,
      'difficulty',e.difficulty,'estimatedSeconds',e.estimated_seconds,'hint',e.hint,
      'explanation',e.explanation,'content',e.content,'skillId',e.skill_id,'conceptId',e.concept_id,
      'minimumLength',e.minimum_response_length,'maximumLength',e.maximum_response_length,
      'allowRevision',e.allow_revision,'maxRevisions',e.max_revisions
    ) from public.training_exercises e where e.id=v_exercise;
  end if;
  insert into public.user_training_path_item_progress(user_id,item_id,status,source_type,source_id,started_at,updated_at)
  values(p_user_id,p_item_id,'in_progress','training_session',v_session,now(),now())
  on conflict(user_id,item_id) do update set
    status=case when user_training_path_item_progress.status='completed' then 'completed' else 'in_progress' end,
    source_type=case when user_training_path_item_progress.status='completed' then user_training_path_item_progress.source_type else excluded.source_type end,
    source_id=case when user_training_path_item_progress.status='completed' then user_training_path_item_progress.source_id else excluded.source_id end,
    updated_at=now();
  update public.user_training_path_module_progress set status='in_progress',started_at=coalesce(started_at,now()),updated_at=now()
  where user_id=p_user_id and module_id=v_module.id and status='available';
  return v_session;
end $$;
revoke all on function public.start_training_path_item_server(uuid,uuid) from public,authenticated;
grant execute on function public.start_training_path_item_server(uuid,uuid) to service_role;

create or replace function public.sync_training_path_item_from_completed_session()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_item public.training_learning_path_module_items; v_score numeric;
begin
  if new.status<>'completed' or old.status='completed' or new.learning_path_item_id is null then return new; end if;
  if exists(
    select 1 from public.training_session_exercises exercise
    where exercise.session_id=new.id and not exists(
      select 1 from public.training_answers answer
      where answer.session_id=new.id and answer.session_exercise_id=exercise.id and answer.user_id=new.user_id
    )
  ) then return new; end if;
  select * into v_item from public.training_learning_path_module_items where id=new.learning_path_item_id;
  v_score:=coalesce((new.result_summary->>'score')::numeric,0);
  if v_score < (v_item.minimum_mastery*100) then return new; end if;
  insert into public.user_training_path_item_progress(user_id,item_id,status,source_type,source_id,score,started_at,completed_at,updated_at)
  values(new.user_id,v_item.id,'completed','training_session',new.id,v_score,coalesce(new.started_at,new.created_at),now(),now())
  on conflict(user_id,item_id) do update set status='completed',source_type='training_session',source_id=new.id,
    score=excluded.score,completed_at=coalesce(user_training_path_item_progress.completed_at,excluded.completed_at),updated_at=now();
  perform public.recalculate_training_learning_path_progress(new.user_id,new.learning_path_id);
  return new;
end $$;

drop trigger if exists training_session_sync_path_progress on public.training_sessions;
create trigger training_session_sync_path_progress after update of status on public.training_sessions
for each row execute function public.sync_training_path_item_from_completed_session();

create or replace function public.sync_training_path_item_from_completed_roleplay_evaluation()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_session public.training_roleplay_sessions;
begin
  if new.status<>'completed' or old.status='completed' or new.overall_score is null then return new; end if;
  select * into v_session from public.training_roleplay_sessions where id=new.session_id;
  if v_session.learning_path_item_id is null then return new; end if;
  insert into public.user_training_path_item_progress(user_id,item_id,status,source_type,source_id,score,started_at,completed_at,updated_at)
  values(v_session.user_id,v_session.learning_path_item_id,'completed','roleplay_session',v_session.id,new.overall_score,coalesce(v_session.started_at,v_session.created_at),now(),now())
  on conflict(user_id,item_id) do update set status='completed',source_type='roleplay_session',source_id=v_session.id,
    score=excluded.score,completed_at=coalesce(user_training_path_item_progress.completed_at,excluded.completed_at),updated_at=now();
  perform public.recalculate_training_learning_path_progress(v_session.user_id,v_session.learning_path_id);
  return new;
end $$;

drop trigger if exists training_roleplay_sync_path_progress on public.training_roleplay_sessions;
drop trigger if exists training_roleplay_evaluation_sync_path_progress on public.training_roleplay_evaluations;
create trigger training_roleplay_evaluation_sync_path_progress after update of status on public.training_roleplay_evaluations
for each row execute function public.sync_training_path_item_from_completed_roleplay_evaluation();

-- The legacy client-callable RPC could complete modules without proving item completion.
revoke all on function public.start_training_learning_path(uuid,uuid) from authenticated;
revoke all on function public.complete_training_learning_path_module(uuid,uuid) from authenticated;
