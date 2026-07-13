alter table public.training_exercises
  add column if not exists cognitive_level text not null default 'recognition'
  check (cognitive_level in ('recognition','recall','application','transfer','synthesis'));

create table public.training_analytics_settings (
  id boolean primary key default true check (id),
  minimum_attempts integer not null default 20 check (minimum_attempts between 5 and 10000),
  minimum_users integer not null default 10 check (minimum_users between 5 and 10000),
  minimum_cohort_size integer not null default 10 check (minimum_cohort_size between 5 and 1000),
  event_retention_days integer not null default 395 check (event_retention_days between 30 and 1095),
  easy_accuracy_threshold numeric not null default .90 check (easy_accuracy_threshold between 0 and 1),
  difficult_accuracy_threshold numeric not null default .45 check (difficult_accuracy_threshold between 0 and 1),
  high_abandonment_threshold numeric not null default .30 check (high_abandonment_threshold between 0 and 1),
  excessive_hint_threshold numeric not null default .45 check (excessive_hint_threshold between 0 and 1),
  updated_by uuid references auth.users on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.training_analytics_settings(id) values(true) on conflict do nothing;

create table public.training_learning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  anonymous_id text,
  event_name text not null,
  session_id uuid references public.training_sessions on delete cascade,
  session_exercise_id uuid references public.training_session_exercises on delete cascade,
  exercise_id uuid references public.training_exercises on delete set null,
  exercise_version integer,
  template_id uuid references public.training_templates on delete set null,
  category_id uuid references public.training_categories on delete set null,
  skill_id uuid references public.training_skills on delete set null,
  concept_id uuid references public.training_concepts on delete set null,
  attempt_number integer check (attempt_number is null or attempt_number > 0),
  properties jsonb not null default '{}',
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  client_event_id uuid not null,
  source text not null default 'client' check (source in ('client','server','system')),
  created_at timestamptz not null default now(),
  check ((user_id is not null) <> (anonymous_id is not null)),
  check (jsonb_typeof(properties) = 'object')
);
create unique index training_learning_events_user_client_unique on public.training_learning_events(user_id,client_event_id) where user_id is not null;
create unique index training_learning_events_anon_client_unique on public.training_learning_events(anonymous_id,client_event_id) where anonymous_id is not null;
create index training_learning_events_occurred_idx on public.training_learning_events(occurred_at desc);
create index training_learning_events_exercise_idx on public.training_learning_events(exercise_id,exercise_version,occurred_at desc);
create index training_learning_events_session_idx on public.training_learning_events(session_id,occurred_at);
create index training_learning_events_name_idx on public.training_learning_events(event_name,occurred_at desc);

create table public.training_exercise_daily_metrics (
  exercise_id uuid not null references public.training_exercises on delete cascade,
  exercise_version integer not null,
  metric_date date not null,
  attempts integer not null default 0,
  unique_users integer not null default 0,
  viewed_count integer not null default 0,
  completed_count integer not null default 0,
  abandoned_count integer not null default 0,
  first_attempt_accuracy numeric,
  eventual_accuracy numeric,
  retry_success_rate numeric,
  hint_usage_rate numeric,
  solution_view_rate numeric,
  abandonment_rate numeric,
  median_response_time_ms integer,
  p90_response_time_ms integer,
  average_score numeric,
  review_accuracy numeric,
  retention_delta numeric,
  transfer_score numeric,
  discrimination_index numeric,
  ambiguity_risk_score numeric,
  observed_difficulty_score numeric,
  observed_difficulty_status text not null default 'insufficient_data',
  quality_score numeric,
  quality_status text not null default 'insufficient_data',
  quality_breakdown jsonb not null default '{}',
  data_status text not null default 'insufficient_data',
  calculated_at timestamptz not null default now(),
  primary key(exercise_id,exercise_version,metric_date)
);
create index training_exercise_daily_quality_idx on public.training_exercise_daily_metrics(quality_status,metric_date desc);

create table public.training_exercise_version_metrics (
  exercise_id uuid not null references public.training_exercises on delete cascade,
  exercise_version integer not null,
  period_start date not null,
  period_end date not null,
  sample_size integer not null default 0,
  unique_users integer not null default 0,
  metrics jsonb not null default '{}',
  quality_score numeric,
  quality_status text not null default 'insufficient_data',
  observed_difficulty_status text not null default 'insufficient_data',
  evidence_status text not null default 'insufficient_data',
  calculated_at timestamptz not null default now(),
  primary key(exercise_id,exercise_version,period_start,period_end)
);

create table public.training_distractor_metrics (
  exercise_id uuid not null references public.training_exercises on delete cascade,
  exercise_version integer not null,
  option_id text not null,
  period_start date not null,
  period_end date not null,
  selections integer not null default 0,
  total_attempts integer not null default 0,
  selection_rate numeric,
  selected_by_high_mastery numeric,
  selected_by_low_mastery numeric,
  retry_selection_rate numeric,
  feedback_helpfulness numeric,
  suspected_issue text not null default 'insufficient_data',
  calculated_at timestamptz not null default now(),
  primary key(exercise_id,exercise_version,option_id,period_start,period_end)
);

create table public.training_feedback_metrics (
  exercise_id uuid not null references public.training_exercises on delete cascade,
  exercise_version integer not null,
  period_start date not null,
  period_end date not null,
  sample_size integer not null default 0,
  retry_improvement numeric,
  review_improvement numeric,
  hint_reduction numeric,
  helpfulness_rate numeric,
  effectiveness_score numeric,
  data_status text not null default 'insufficient_data',
  calculated_at timestamptz not null default now(),
  primary key(exercise_id,exercise_version,period_start,period_end)
);

create table public.training_retention_metrics (
  concept_id uuid not null references public.training_concepts on delete cascade,
  window_days integer not null check(window_days in (1,3,7,14,30)),
  period_start date not null,
  period_end date not null,
  sample_size integer not null default 0,
  immediate_accuracy numeric,
  delayed_accuracy numeric,
  retention_rate numeric,
  retention_decay numeric,
  review_recovery numeric,
  transfer_score numeric,
  data_status text not null default 'insufficient_data',
  calculated_at timestamptz not null default now(),
  primary key(concept_id,window_days,period_start,period_end)
);

create table public.training_aggregate_metrics (
  entity_type text not null check(entity_type in ('category','skill','concept','template','exercise_type','difficulty','plan','cohort')),
  entity_key text not null,
  period_type text not null check(period_type in ('daily','weekly','monthly')),
  period_start date not null,
  period_end date not null,
  sample_size integer not null default 0,
  unique_users integer not null default 0,
  metrics jsonb not null default '{}',
  calculated_at timestamptz not null default now(),
  primary key(entity_type,entity_key,period_type,period_start,period_end)
);

create table public.training_quality_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_type text not null,
  severity text not null check(severity in ('info','warning','high','critical')),
  entity_type text not null check(entity_type in ('exercise','exercise_version','concept','skill','template','experiment','ai_evaluation')),
  entity_id uuid,
  entity_version integer,
  related_metrics jsonb not null default '{}',
  explanation text not null,
  recommendation text not null,
  status text not null default 'open' check(status in ('open','acknowledged','investigating','resolved','dismissed')),
  assigned_to uuid references auth.users on delete set null,
  created_by uuid references auth.users on delete set null,
  acknowledged_by uuid references auth.users on delete set null,
  acknowledged_at timestamptz,
  resolved_by uuid references auth.users on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index training_quality_alerts_active_unique on public.training_quality_alerts(alert_type,entity_type,entity_id,coalesce(entity_version,0)) where status in ('open','acknowledged','investigating');
create index training_quality_alerts_status_idx on public.training_quality_alerts(status,severity,created_at desc);

create table public.training_experiments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  hypothesis text not null,
  entity_type text not null check(entity_type in ('exercise','feedback','distractors','instruction','exercise_type','retry_flow')),
  entity_id uuid,
  status text not null default 'draft' check(status in ('draft','approved','scheduled','running','paused','completed','cancelled')),
  assignment_unit text not null default 'user' check(assignment_unit='user'),
  primary_metric text not null,
  secondary_metrics jsonb not null default '[]',
  guardrail_metrics jsonb not null default '[]',
  target_audience jsonb not null default '{}',
  traffic_percentage numeric not null default 100 check(traffic_percentage > 0 and traffic_percentage <= 100),
  start_at timestamptz,
  end_at timestamptz,
  minimum_sample_size integer not null default 100 check(minimum_sample_size >= 20),
  submitted_at timestamptz,
  created_by uuid not null references auth.users on delete restrict,
  approved_by uuid references auth.users on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(end_at is null or start_at is null or end_at > start_at)
);

create table public.training_experiment_variants (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.training_experiments on delete cascade,
  key text not null,
  name text not null,
  weight numeric not null check(weight > 0 and weight <= 100),
  configuration jsonb not null default '{}',
  is_control boolean not null default false,
  created_at timestamptz not null default now(),
  unique(experiment_id,key)
);
create unique index training_experiment_control_unique on public.training_experiment_variants(experiment_id) where is_control;

create table public.training_experiment_assignments (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.training_experiments on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  variant_id uuid not null references public.training_experiment_variants on delete cascade,
  assigned_at timestamptz not null default now(),
  assignment_hash text not null,
  created_at timestamptz not null default now(),
  unique(experiment_id,user_id)
);
create index training_experiment_assignments_variant_idx on public.training_experiment_assignments(variant_id,assigned_at);

create table public.training_experiment_results (
  experiment_id uuid not null references public.training_experiments on delete cascade,
  variant_id uuid not null references public.training_experiment_variants on delete cascade,
  metric_name text not null,
  value numeric,
  sample_size integer not null default 0,
  confidence_interval jsonb,
  evidence_status text not null default 'insufficient_data' check(evidence_status in ('insufficient_data','inconclusive','promising','significant','harmful')),
  guardrails jsonb not null default '{}',
  calculated_at timestamptz not null default now(),
  primary key(experiment_id,variant_id,metric_name)
);

create table public.training_analytics_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  period_start date,
  period_end date,
  status text not null default 'running' check(status in ('running','completed','failed')),
  processed_records integer not null default 0,
  error_code text,
  duration_ms integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(job_type,period_start,period_end)
);

alter table public.training_analytics_settings enable row level security;
alter table public.training_learning_events enable row level security;
alter table public.training_exercise_daily_metrics enable row level security;
alter table public.training_exercise_version_metrics enable row level security;
alter table public.training_distractor_metrics enable row level security;
alter table public.training_feedback_metrics enable row level security;
alter table public.training_retention_metrics enable row level security;
alter table public.training_aggregate_metrics enable row level security;
alter table public.training_quality_alerts enable row level security;
alter table public.training_experiments enable row level security;
alter table public.training_experiment_variants enable row level security;
alter table public.training_experiment_assignments enable row level security;
alter table public.training_experiment_results enable row level security;
alter table public.training_analytics_jobs enable row level security;

-- No client policies: ingestion, aggregation and editorial reads are server-side only.
