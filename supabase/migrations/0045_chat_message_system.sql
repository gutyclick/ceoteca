alter table public.chat_messages
  drop constraint if exists chat_messages_status_check;

alter table public.chat_messages
  add constraint chat_messages_status_check
  check (status in ('pending', 'streaming', 'completed', 'stopped', 'failed'));

create table if not exists public.chat_message_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  rating text not null check (rating in ('helpful', 'not_helpful')),
  reason text check (reason in ('not_answered', 'too_generic', 'incorrect', 'hard_to_understand', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, message_id)
);

create table if not exists public.chat_message_versions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  content text not null,
  parts jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (message_id, version_number)
);

create index if not exists chat_message_feedback_user_idx
  on public.chat_message_feedback(user_id, updated_at desc);
create index if not exists chat_message_versions_message_idx
  on public.chat_message_versions(message_id, version_number desc);

alter table public.chat_message_feedback enable row level security;
alter table public.chat_message_versions enable row level security;

create policy "chat_message_feedback_select_own" on public.chat_message_feedback
  for select using (auth.uid() = user_id);
create policy "chat_message_feedback_insert_own" on public.chat_message_feedback
  for insert with check (auth.uid() = user_id);
create policy "chat_message_feedback_update_own" on public.chat_message_feedback
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "chat_message_feedback_delete_own" on public.chat_message_feedback
  for delete using (auth.uid() = user_id);

create policy "chat_message_versions_select_own" on public.chat_message_versions
  for select using (auth.uid() = user_id);

drop trigger if exists set_chat_message_feedback_updated_at on public.chat_message_feedback;
create trigger set_chat_message_feedback_updated_at
before update on public.chat_message_feedback
for each row execute function public.set_updated_at();
