alter table public.notifications
drop constraint if exists notifications_type_check;

alter table public.notifications
add constraint notifications_type_check
check (
  type in (
    'reading_reminder', 'progress', 'recommendation', 'ai', 'account',
    'subscription', 'system', 'achievement'
  )
);

create table if not exists public.achievement_definitions (
  code text primary key,
  title text not null,
  description text not null,
  icon text not null,
  target integer not null check (target > 0),
  position integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_code text not null references public.achievement_definitions(code) on delete cascade,
  progress integer not null default 0 check (progress >= 0),
  unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, achievement_code)
);

create table if not exists public.user_activity_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (user_id, activity_date)
);

insert into public.achievement_definitions (code, title, description, icon, target, position)
values
  ('first_step', 'Primer paso', 'Inicia tu primer análisis.', 'book-open', 1, 1),
  ('first_finish', 'Primera meta', 'Completa tu primer análisis.', 'check-circle', 1, 2),
  ('curious', 'Curioso', 'Haz tu primera pregunta a CEO.', 'message-circle', 1, 3),
  ('streak_3', 'Racha de 3 días', 'Aprende durante 3 días distintos.', 'flame', 3, 4),
  ('explorer', 'Explorador', 'Inicia 5 análisis diferentes.', 'compass', 5, 5),
  ('constant_reader', 'Lector constante', 'Aprende durante 7 días distintos.', 'trophy', 7, 6),
  ('bookworm', 'Gran lector', 'Completa 5 análisis.', 'crown', 5, 7)
on conflict (code) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  target = excluded.target,
  position = excluded.position;

alter table public.achievement_definitions enable row level security;
alter table public.user_achievements enable row level security;
alter table public.user_activity_days enable row level security;

create policy "achievement_definitions_read" on public.achievement_definitions
for select using (true);

create policy "user_achievements_read_own" on public.user_achievements
for select using (auth.uid() = user_id);

create policy "user_activity_days_read_own" on public.user_activity_days
for select using (auth.uid() = user_id);

create or replace function public.evaluate_user_achievements(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  started_count integer;
  completed_count integer;
  question_count integer;
  active_days integer;
  achievement record;
  current_progress integer;
  was_unlocked timestamptz;
  unlocked_now boolean;
begin
  select count(*) into started_count
  from public.user_book_progress
  where user_id = target_user_id and progress > 0;

  select count(*) into completed_count
  from public.user_book_progress
  where user_id = target_user_id and completed = true;

  select count(*) into question_count
  from public.chat_messages
  where user_id = target_user_id and role = 'user';

  select count(*) into active_days
  from public.user_activity_days
  where user_id = target_user_id;

  for achievement in
    select * from public.achievement_definitions order by position
  loop
    current_progress := case achievement.code
      when 'first_step' then started_count
      when 'first_finish' then completed_count
      when 'curious' then question_count
      when 'streak_3' then active_days
      when 'explorer' then started_count
      when 'constant_reader' then active_days
      when 'bookworm' then completed_count
      else 0
    end;

    select unlocked_at into was_unlocked
    from public.user_achievements
    where user_id = target_user_id and achievement_code = achievement.code;

    unlocked_now := was_unlocked is null and current_progress >= achievement.target;

    insert into public.user_achievements (
      user_id, achievement_code, progress, unlocked_at, updated_at
    ) values (
      target_user_id,
      achievement.code,
      least(current_progress, achievement.target),
      case when current_progress >= achievement.target then now() else null end,
      now()
    )
    on conflict (user_id, achievement_code) do update set
      progress = excluded.progress,
      unlocked_at = coalesce(public.user_achievements.unlocked_at, excluded.unlocked_at),
      updated_at = now();

    if unlocked_now then
      insert into public.notifications (
        user_id, type, title, body, href, metadata
      ) values (
        target_user_id,
        'achievement',
        'Logro desbloqueado: ' || achievement.title,
        achievement.description,
        '/perfil',
        jsonb_build_object(
          'achievementCode', achievement.code,
          'achievementTitle', achievement.title,
          'achievementIcon', achievement.icon
        )
      );
    end if;
  end loop;
end;
$$;

create or replace function public.track_progress_achievements()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.progress > 0 then
    insert into public.user_activity_days (user_id, activity_date)
    values (new.user_id, current_date)
    on conflict do nothing;
  end if;
  perform public.evaluate_user_achievements(new.user_id);
  return new;
end;
$$;

drop trigger if exists user_progress_achievements on public.user_book_progress;
create trigger user_progress_achievements
after insert or update of progress, completed on public.user_book_progress
for each row execute function public.track_progress_achievements();

create or replace function public.track_chat_achievements()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'user' then
    insert into public.user_activity_days (user_id, activity_date)
    values (new.user_id, current_date)
    on conflict do nothing;
    perform public.evaluate_user_achievements(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists user_chat_achievements on public.chat_messages;
create trigger user_chat_achievements
after insert on public.chat_messages
for each row execute function public.track_chat_achievements();

insert into public.user_activity_days (user_id, activity_date)
select user_id, updated_at::date
from public.user_book_progress
where progress > 0
on conflict do nothing;

do $$
declare user_record record;
begin
  for user_record in select id from auth.users loop
    perform public.evaluate_user_achievements(user_record.id);
  end loop;
end;
$$;

create index if not exists user_achievements_user_unlocked_idx
on public.user_achievements(user_id, unlocked_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
