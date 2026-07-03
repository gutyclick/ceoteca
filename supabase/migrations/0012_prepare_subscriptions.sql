alter table public.subscriptions
drop constraint if exists subscriptions_plan_check;

alter table public.subscriptions
add constraint subscriptions_plan_check
check (plan in ('free', 'pro', 'unlimited', 'founder'));

alter table public.subscriptions
drop constraint if exists subscriptions_status_check;

alter table public.subscriptions
add constraint subscriptions_status_check
check (
  status in (
    'incomplete',
    'pending_payment',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
  )
);

create index if not exists subscriptions_user_status_updated_idx
on public.subscriptions(user_id, status, updated_at desc);

create unique index if not exists subscriptions_provider_subscription_unique_idx
on public.subscriptions(provider, provider_subscription_id)
where provider_subscription_id is not null;
