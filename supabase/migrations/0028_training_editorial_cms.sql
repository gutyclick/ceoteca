create table public.training_editorial_users(user_id uuid primary key references auth.users on delete cascade,role text not null check(role in('admin','editor','reviewer','viewer')),is_active boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.training_exercises drop constraint if exists training_exercises_status_check;
alter table public.training_exercises add constraint training_exercises_status_check check(status in('draft','in_review','approved','published','archived','rejected'));
alter table public.training_exercises add column if not exists created_by uuid references auth.users;
alter table public.training_exercises add column if not exists editorial_compliance jsonb not null default '{}';
alter table public.training_exercises add column if not exists internal_tags text[] not null default '{}';
alter table public.training_exercises add column if not exists language text not null default 'es';

alter table public.training_exercise_books add column if not exists internal_reference text;
alter table public.training_exercise_books add column if not exists editorial_note text;
create table public.training_exercise_versions(id uuid primary key default gen_random_uuid(),exercise_id uuid not null references training_exercises on delete cascade,version integer not null,snapshot jsonb not null,status text not null,change_reason text,created_by uuid not null references auth.users,created_at timestamptz not null default now(),unique(exercise_id,version));
alter table public.training_templates add column if not exists editorial_status text not null default 'draft' check(editorial_status in('draft','in_review','approved','published','archived','rejected'));
alter table public.training_templates add column if not exists version integer not null default 1;
alter table public.training_templates add column if not exists created_by uuid references auth.users;
create table public.training_template_versions(id uuid primary key default gen_random_uuid(),template_id uuid not null references training_templates on delete cascade,version integer not null,snapshot jsonb not null,status text not null,change_reason text,created_by uuid not null references auth.users,created_at timestamptz not null default now(),unique(template_id,version));
create table public.training_rubrics(id uuid primary key default gen_random_uuid(),slug text unique not null,name text not null,description text,status text not null default 'draft' check(status in('draft','in_review','approved','published','archived','rejected')),created_by uuid not null references auth.users,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.training_rubric_versions(id uuid primary key default gen_random_uuid(),rubric_id uuid not null references training_rubrics on delete cascade,version integer not null,schema jsonb not null,status text not null,change_reason text,created_by uuid not null references auth.users,created_at timestamptz not null default now(),unique(rubric_id,version));
create table public.training_editorial_reviews(id uuid primary key default gen_random_uuid(),entity_type text not null check(entity_type in('exercise','template','rubric','concept')),entity_id uuid not null,version_id uuid,status text not null default 'pending' check(status in('pending','approved','changes_requested','rejected','published')),reviewer_id uuid references auth.users,review_notes text,requested_changes text[] not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.training_editorial_audit_log(id uuid primary key default gen_random_uuid(),actor_id uuid not null references auth.users,action text not null,entity_type text not null,entity_id uuid,entity_version integer,metadata jsonb not null default '{}',request_id text,created_at timestamptz not null default now());
create table public.training_import_jobs(id uuid primary key default gen_random_uuid(),created_by uuid not null references auth.users,filename text not null,status text not null check(status in('pending','processing','completed','failed')),total_items integer not null default 0,valid_items integer not null default 0,invalid_items integer not null default 0,errors jsonb not null default '[]',created_at timestamptz not null default now(),completed_at timestamptz);

alter table public.training_editorial_users enable row level security; alter table public.training_exercise_books enable row level security; alter table public.training_exercise_versions enable row level security; alter table public.training_template_versions enable row level security; alter table public.training_rubrics enable row level security; alter table public.training_rubric_versions enable row level security; alter table public.training_editorial_reviews enable row level security; alter table public.training_editorial_audit_log enable row level security; alter table public.training_import_jobs enable row level security;
create or replace function public.is_training_editor(p_roles text[] default array['admin','editor','reviewer','viewer']) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from training_editorial_users where user_id=auth.uid() and is_active and role=any(p_roles)) $$;
grant execute on function public.is_training_editor(text[]) to authenticated;
create policy "editorial_users_self_or_admin" on training_editorial_users for select using(user_id=auth.uid() or is_training_editor(array['admin']));
create policy "exercise_books_editor_read" on training_exercise_books for select using(is_training_editor());
create policy "exercise_versions_editor_read" on training_exercise_versions for select using(is_training_editor());
create policy "template_versions_editor_read" on training_template_versions for select using(is_training_editor());
create policy "rubrics_editor_read" on training_rubrics for select using(is_training_editor());
create policy "rubric_versions_editor_read" on training_rubric_versions for select using(is_training_editor());
create policy "reviews_editor_read" on training_editorial_reviews for select using(is_training_editor());
create policy "audit_admin_read" on training_editorial_audit_log for select using(is_training_editor(array['admin']));
create policy "imports_own_or_admin" on training_import_jobs for select using(created_by=auth.uid() or is_training_editor(array['admin']));

-- No production role seeds. Bootstrap the first admin explicitly with a reviewed SQL insert.
