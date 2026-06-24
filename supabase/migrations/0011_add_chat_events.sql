create table if not exists public.chat_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid references public.books(id) on delete set null,
  context text not null default 'book' check (context in ('book', 'site')),
  event_type text not null check (
    event_type in (
      'moderation_block',
      'limit_reached',
      'provider_error',
      'validation_error'
    )
  ),
  code text not null,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_events_user_created_idx
on public.chat_events(user_id, created_at desc);

alter table public.chat_events enable row level security;

drop policy if exists "Users can read own chat events" on public.chat_events;
create policy "Users can read own chat events"
on public.chat_events
for select
using (auth.uid() = user_id);

