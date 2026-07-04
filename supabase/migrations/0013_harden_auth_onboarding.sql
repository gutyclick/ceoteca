alter table public.profiles
add column if not exists onboarding_completed boolean not null default false,
add column if not exists plan_selected_at timestamptz,
add column if not exists terms_accepted_at timestamptz,
add column if not exists terms_version text,
add column if not exists privacy_accepted_at timestamptz,
add column if not exists privacy_version text,
add column if not exists legal_acceptance_ip text,
add column if not exists legal_acceptance_user_agent text;

update public.profiles
set
  onboarding_completed = true,
  plan_selected_at = coalesce(plan_selected_at, created_at)
where onboarding_completed = false;

create table if not exists public.auth_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  event_type text not null check (
    event_type in (
      'register_attempt',
      'register_success',
      'register_confirmation_required',
      'register_error',
      'oauth_callback',
      'oauth_error',
      'rate_limit'
    )
  ),
  provider text not null default 'email',
  code text,
  message text,
  ip text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists auth_events_user_created_idx
on public.auth_events(user_id, created_at desc);

create index if not exists auth_events_email_created_idx
on public.auth_events(lower(email), created_at desc)
where email is not null;

alter table public.auth_events enable row level security;

create policy "auth_events_select_own" on public.auth_events
for select using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    plan,
    onboarding_completed,
    terms_accepted_at,
    terms_version,
    privacy_accepted_at,
    privacy_version
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'free',
    false,
    case
      when new.raw_user_meta_data ? 'terms_accepted_at'
      then (new.raw_user_meta_data->>'terms_accepted_at')::timestamptz
      else null
    end,
    new.raw_user_meta_data->>'terms_version',
    case
      when new.raw_user_meta_data ? 'privacy_accepted_at'
      then (new.raw_user_meta_data->>'privacy_accepted_at')::timestamptz
      else null
    end,
    new.raw_user_meta_data->>'privacy_version'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
