create table if not exists public.user_book_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, book_id)
);

create index if not exists favorites_user_created_idx
on public.user_book_favorites(user_id, created_at desc);

alter table public.user_book_favorites enable row level security;

drop policy if exists "favorites_select_own" on public.user_book_favorites;
create policy "favorites_select_own" on public.user_book_favorites
for select using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.user_book_favorites;
create policy "favorites_insert_own" on public.user_book_favorites
for insert with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.user_book_favorites;
create policy "favorites_delete_own" on public.user_book_favorites
for delete using (auth.uid() = user_id);
