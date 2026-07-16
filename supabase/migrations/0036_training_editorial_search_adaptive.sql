-- CEOTECA Training Block 4: editorial versioning, validation and secure search support.

create table if not exists public.training_editorial_versions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in (
    'category','subcategory','skill','concept','format','path'
  )),
  entity_id uuid not null,
  version integer not null check (version > 0),
  status text not null default 'draft' check (status in (
    'draft','in_review','approved','published','archived','changes_requested'
  )),
  snapshot jsonb not null,
  change_reason text,
  created_by uuid not null references auth.users on delete restrict,
  reviewed_by uuid references auth.users on delete set null,
  reviewed_at timestamptz,
  published_by uuid references auth.users on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique(entity_type, entity_id, version)
);

create index if not exists training_editorial_versions_entity_idx
  on public.training_editorial_versions(entity_type, entity_id, version desc);
create index if not exists training_editorial_versions_workflow_idx
  on public.training_editorial_versions(status, created_at desc);

alter table public.training_editorial_versions enable row level security;
drop policy if exists training_editorial_versions_read on public.training_editorial_versions;
create policy training_editorial_versions_read
  on public.training_editorial_versions for select to authenticated
  using (public.is_training_editor());

create or replace function public.prevent_training_published_version_mutation()
returns trigger language plpgsql set search_path=public as $$
begin
  if old.status = 'published' then
    raise exception 'PUBLISHED_VERSION_IMMUTABLE';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end $$;

drop trigger if exists training_editorial_versions_immutable_update on public.training_editorial_versions;
create trigger training_editorial_versions_immutable_update
before update or delete on public.training_editorial_versions
for each row execute function public.prevent_training_published_version_mutation();

alter table public.training_editorial_reviews
  drop constraint if exists training_editorial_reviews_entity_type_check;
alter table public.training_editorial_reviews
  add constraint training_editorial_reviews_entity_type_check check(entity_type in(
    'exercise','template','rubric','concept','category','subcategory','skill','format','path'
  ));

alter table public.training_categories add column if not exists editorial_version integer not null default 1;
alter table public.training_subcategories add column if not exists editorial_version integer not null default 1;
alter table public.training_skills add column if not exists editorial_version integer not null default 1;
alter table public.training_concepts add column if not exists editorial_version integer not null default 1;
alter table public.training_formats add column if not exists editorial_version integer not null default 1;

-- Published records remain readable. Drafts and private editorial notes are only
-- exposed through server-side editorial services.
drop policy if exists training_categories_read on public.training_categories;
create policy training_categories_read on public.training_categories
  for select to authenticated using(status='published' and is_active);
drop policy if exists training_skills_read on public.training_skills;
create policy training_skills_read on public.training_skills
  for select to authenticated using(status='published' and is_active);
drop policy if exists training_concepts_read on public.training_concepts;
create policy training_concepts_read on public.training_concepts
  for select to authenticated using(status='published' and is_active);

-- Editors can only mutate through reviewed server APIs. Direct authenticated
-- writes are intentionally removed; service-role calls still enforce app roles.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'training_categories','training_subcategories','training_skills',
    'training_concepts','training_formats','training_learning_paths',
    'training_learning_path_modules','training_learning_path_module_items'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_editor_write', table_name);
  end loop;
end $$;

-- Search indexes only cover fields safe to expose from published resources.
create index if not exists training_categories_search_idx on public.training_categories(status, name);
create index if not exists training_subcategories_search_idx on public.training_subcategories(status, name);
create index if not exists training_skills_search_idx on public.training_skills(status, name);
create index if not exists training_concepts_search_idx on public.training_concepts(status, name);
create index if not exists training_paths_search_idx on public.training_learning_paths(status, name);
create index if not exists training_exercises_search_idx on public.training_exercises(status, title);

alter table public.user_training_preferences
  add column if not exists preferred_category_ids uuid[] not null default '{}';

revoke all on public.training_editorial_versions from anon;
revoke insert, update, delete on public.training_editorial_versions from authenticated;
grant select on public.training_editorial_versions to authenticated;
