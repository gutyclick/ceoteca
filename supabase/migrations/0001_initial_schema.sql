create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'unlimited', 'founder')),
  founder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  author text not null,
  category text not null,
  description text not null,
  cover_config jsonb not null default '{}'::jsonb,
  reading_time integer not null,
  difficulty text not null,
  tags text[] not null default '{}',
  audio_url text,
  purchase_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_sections (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  section_type text not null,
  title text not null,
  content jsonb not null,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (book_id, position)
);

create table if not exists public.user_book_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  progress integer not null default 0 check (progress between 0 and 100),
  completed boolean not null default false,
  last_section_id uuid references public.book_sections(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, book_id)
);

create table if not exists public.chat_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid references public.books(id) on delete cascade,
  month date not null,
  question_count integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, book_id, month)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text,
  plan text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audio_assets (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  storage_path text not null,
  voice text,
  model text,
  duration_seconds integer,
  status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_category_idx on public.books(category);
create index if not exists books_published_idx on public.books(is_published);
create index if not exists books_tags_idx on public.books using gin(tags);
create index if not exists book_sections_book_position_idx on public.book_sections(book_id, position);
create index if not exists progress_user_updated_idx on public.user_book_progress(user_id, updated_at desc);
create index if not exists chat_messages_user_book_idx on public.chat_messages(user_id, book_id, created_at);
create index if not exists subscriptions_user_idx on public.subscriptions(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists books_set_updated_at on public.books;
create trigger books_set_updated_at
before update on public.books
for each row execute function public.set_updated_at();

drop trigger if exists book_sections_set_updated_at on public.book_sections;
create trigger book_sections_set_updated_at
before update on public.book_sections
for each row execute function public.set_updated_at();

drop trigger if exists progress_set_updated_at on public.user_book_progress;
create trigger progress_set_updated_at
before update on public.user_book_progress
for each row execute function public.set_updated_at();

drop trigger if exists chat_usage_set_updated_at on public.chat_usage;
create trigger chat_usage_set_updated_at
before update on public.chat_usage
for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists audio_assets_set_updated_at on public.audio_assets;
create trigger audio_assets_set_updated_at
before update on public.audio_assets
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, plan)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'free'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.increment_chat_usage(
  target_user_id uuid,
  target_book_id uuid,
  target_month date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  if auth.uid() <> target_user_id then
    raise exception 'not allowed';
  end if;

  insert into public.chat_usage (user_id, book_id, month, question_count)
  values (target_user_id, target_book_id, target_month, 1)
  on conflict (user_id, book_id, month)
  do update set question_count = public.chat_usage.question_count + 1
  returning question_count into new_count;

  return new_count;
end;
$$;

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.book_sections enable row level security;
alter table public.user_book_progress enable row level security;
alter table public.chat_usage enable row level security;
alter table public.chat_messages enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audio_assets enable row level security;

create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

create policy "profiles_update_own_safe_fields" on public.profiles
for update using (auth.uid() = id)
with check (auth.uid() = id);

create policy "books_select_published" on public.books
for select using (is_published = true);

create policy "book_sections_select_published_books" on public.book_sections
for select using (
  exists (
    select 1 from public.books
    where books.id = book_sections.book_id
    and books.is_published = true
  )
);

create policy "progress_select_own" on public.user_book_progress
for select using (auth.uid() = user_id);

create policy "progress_insert_own" on public.user_book_progress
for insert with check (auth.uid() = user_id);

create policy "progress_update_own" on public.user_book_progress
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "chat_usage_select_own" on public.chat_usage
for select using (auth.uid() = user_id);

create policy "chat_messages_select_own" on public.chat_messages
for select using (auth.uid() = user_id);

create policy "chat_messages_insert_own" on public.chat_messages
for insert with check (auth.uid() = user_id);

create policy "subscriptions_select_own" on public.subscriptions
for select using (auth.uid() = user_id);

create policy "audio_assets_select_published_books" on public.audio_assets
for select using (
  exists (
    select 1 from public.books
    where books.id = audio_assets.book_id
    and books.is_published = true
  )
);
