alter table public.chat_conversations
add column if not exists archived_at timestamptz;

create table if not exists public.chat_book_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

alter table public.chat_book_preferences enable row level security;

create policy "chat_book_preferences_select_own" on public.chat_book_preferences
for select using (auth.uid() = user_id);

create policy "chat_book_preferences_insert_own" on public.chat_book_preferences
for insert with check (auth.uid() = user_id);

create policy "chat_book_preferences_update_own" on public.chat_book_preferences
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "chat_book_preferences_delete_own" on public.chat_book_preferences
for delete using (auth.uid() = user_id);

drop trigger if exists set_chat_book_preferences_updated_at on public.chat_book_preferences;
create trigger set_chat_book_preferences_updated_at
before update on public.chat_book_preferences
for each row execute function public.set_updated_at();
