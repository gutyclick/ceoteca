create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (
    type in (
      'reading_reminder',
      'progress',
      'recommendation',
      'ai',
      'account',
      'subscription',
      'system'
    )
  ),
  title text not null,
  body text not null,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
on public.notifications(user_id, created_at desc);

create index if not exists notifications_user_unread_idx
on public.notifications(user_id, created_at desc)
where read_at is null;

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
for select using (auth.uid() = user_id);

create policy "notifications_update_own_read_at" on public.notifications
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);
