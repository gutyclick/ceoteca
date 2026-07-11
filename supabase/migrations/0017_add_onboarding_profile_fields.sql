alter table public.profiles
add column if not exists occupation text,
add column if not exists discovery_source text,
add column if not exists starter_book_id uuid references public.books(id) on delete set null;

create index if not exists profiles_starter_book_idx
on public.profiles(starter_book_id)
where starter_book_id is not null;
