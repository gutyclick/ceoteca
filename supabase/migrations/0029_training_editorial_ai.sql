create table public.training_editorial_ai_jobs (
  id uuid primary key default gen_random_uuid(),
  client_job_id uuid not null,
  created_by uuid not null references auth.users on delete cascade,
  job_type text not null check (job_type in (
    'generate_exercises','generate_distractors','improve_feedback',
    'generate_variations','suggest_rubric','review_exercise',
    'suggest_classification','suggest_template'
  )),
  status text not null default 'queued' check (status in (
    'queued','processing','validating','partial','completed','failed','timed_out','cancelled'
  )),
  source_type text not null default 'concept' check (source_type in ('concept','exercise','analysis','manual')),
  source_id uuid,
  input_hash text not null,
  input_summary jsonb not null default '{}',
  provider text,
  model text,
  prompt_version text not null,
  requested_count integer not null default 1 check (requested_count between 1 and 5),
  generated_count integer not null default 0,
  valid_count integer not null default 0,
  invalid_count integer not null default 0,
  input_tokens integer,
  output_tokens integer,
  estimated_cost numeric(12,6) not null default 0,
  latency_ms integer,
  error_code text,
  error_message_safe text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (created_by, client_job_id)
);

create index training_editorial_ai_jobs_owner_created_idx
  on public.training_editorial_ai_jobs(created_by, created_at desc);
create index training_editorial_ai_jobs_hash_idx
  on public.training_editorial_ai_jobs(created_by, input_hash, status);

create table public.training_editorial_ai_results (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.training_editorial_ai_jobs on delete cascade,
  result_index integer not null,
  result_type text not null,
  status text not null default 'generated' check (status in (
    'generated','valid','invalid','selected','saved','discarded'
  )),
  output jsonb not null,
  validation_issues jsonb not null default '[]',
  confidence numeric(5,4) check (confidence between 0 and 1),
  regeneration_count integer not null default 0,
  saved_entity_type text,
  saved_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, result_index)
);

create table public.training_editorial_ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  job_id uuid not null references public.training_editorial_ai_jobs on delete cascade,
  usage_type text not null,
  provider text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost numeric(12,6) not null default 0,
  created_at timestamptz not null default now(),
  unique (job_id)
);

create index training_editorial_ai_usage_month_idx
  on public.training_editorial_ai_usage(created_at, user_id);

create table public.training_exercise_variants (
  id uuid primary key default gen_random_uuid(),
  parent_exercise_id uuid not null references public.training_exercises on delete cascade,
  variant_exercise_id uuid not null references public.training_exercises on delete cascade,
  variation_type text not null,
  ai_job_id uuid references public.training_editorial_ai_jobs on delete set null,
  created_by uuid not null references auth.users,
  created_at timestamptz not null default now(),
  unique (parent_exercise_id, variant_exercise_id)
);

alter table public.training_exercises
  add column if not exists origin text not null default 'manual'
    check (origin in ('manual','ai_generated','ai_assisted','imported')),
  add column if not exists ai_job_id uuid references public.training_editorial_ai_jobs on delete set null,
  add column if not exists ai_result_id uuid references public.training_editorial_ai_results on delete set null,
  add column if not exists human_reviewed boolean not null default false,
  add column if not exists reviewed_by uuid references auth.users,
  add column if not exists reviewed_at timestamptz,
  add column if not exists source_context_type text,
  add column if not exists generation_prompt_version text;

alter table public.training_rubrics
  add column if not exists origin text not null default 'manual'
    check (origin in ('manual','ai_generated','ai_assisted','imported')),
  add column if not exists ai_job_id uuid references public.training_editorial_ai_jobs on delete set null,
  add column if not exists ai_result_id uuid references public.training_editorial_ai_results on delete set null;

alter table public.training_templates
  add column if not exists origin text not null default 'manual'
    check (origin in ('manual','ai_generated','ai_assisted','imported')),
  add column if not exists ai_job_id uuid references public.training_editorial_ai_jobs on delete set null,
  add column if not exists ai_result_id uuid references public.training_editorial_ai_results on delete set null;

alter table public.training_editorial_ai_jobs enable row level security;
alter table public.training_editorial_ai_results enable row level security;
alter table public.training_editorial_ai_usage enable row level security;
alter table public.training_exercise_variants enable row level security;

create policy "editorial_ai_jobs_owner_read" on public.training_editorial_ai_jobs
  for select using (created_by = auth.uid() or public.is_training_editor(array['admin']));
create policy "editorial_ai_results_owner_read" on public.training_editorial_ai_results
  for select using (exists (
    select 1 from public.training_editorial_ai_jobs job
    where job.id = job_id and (job.created_by = auth.uid() or public.is_training_editor(array['admin']))
  ));
create policy "editorial_ai_usage_owner_or_admin" on public.training_editorial_ai_usage
  for select using (user_id = auth.uid() or public.is_training_editor(array['admin']));
create policy "exercise_variants_editor_read" on public.training_exercise_variants
  for select using (public.is_training_editor());

create or replace function public.enforce_training_ai_human_review()
returns trigger language plpgsql as $$
begin
  if new.status = 'published' and new.origin in ('ai_generated','ai_assisted') then
    if not new.human_reviewed or new.reviewed_by is null or new.reviewed_at is null then
      raise exception 'ai_content_requires_human_review';
    end if;
    if coalesce((new.editorial_compliance->>'ownWords')::boolean, false) is not true
      or coalesce((new.editorial_compliance->>'noLongExcerpts')::boolean, false) is not true
      or coalesce((new.editorial_compliance->>'citationsIdentified')::boolean, false) is not true
      or coalesce((new.editorial_compliance->>'examplesAuthorized')::boolean, false) is not true then
      raise exception 'ai_content_requires_editorial_compliance';
    end if;
    if coalesce((new.editorial_compliance->>'rightsConfirmed')::boolean, false) is not true
      or coalesce((new.editorial_compliance->>'accuracyConfirmed')::boolean, false) is not true
      or coalesce((new.editorial_compliance->>'feedbackConfirmed')::boolean, false) is not true
      or coalesce((new.editorial_compliance->>'correctAnswerConfirmed')::boolean, false) is not true
      or coalesce((new.editorial_compliance->>'rubricConfirmed')::boolean, false) is not true then
      raise exception 'ai_content_requires_review_confirmations';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists training_ai_human_review_guard on public.training_exercises;
create trigger training_ai_human_review_guard
before insert or update of status on public.training_exercises
for each row execute function public.enforce_training_ai_human_review();
