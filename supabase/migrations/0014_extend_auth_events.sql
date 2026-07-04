alter table public.auth_events
drop constraint if exists auth_events_event_type_check;

alter table public.auth_events
add constraint auth_events_event_type_check
check (
  event_type in (
    'register_attempt',
    'register_success',
    'register_confirmation_required',
    'register_error',
    'login_attempt',
    'login_success',
    'login_error',
    'resend_confirmation',
    'password_reset_requested',
    'password_reset_updated',
    'password_reset_error',
    'oauth_callback',
    'oauth_error',
    'rate_limit'
  )
);
