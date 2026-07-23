alter table public.chat_messages
  drop constraint if exists chat_messages_status_check;

alter table public.chat_messages
  add constraint chat_messages_status_check
  check (status in ('pending', 'streaming', 'completed', 'stopped', 'interrupted', 'failed'));

-- A turn owns a single visible CEO response. This also prevents duplicate
-- responses when a client retries the same idempotent user message.
delete from public.chat_messages duplicate
using public.chat_messages canonical
where duplicate.role = 'assistant'
  and canonical.role = 'assistant'
  and duplicate.parent_message_id = canonical.parent_message_id
  and duplicate.id > canonical.id;

create unique index if not exists chat_messages_one_assistant_per_turn_idx
  on public.chat_messages(parent_message_id)
  where role = 'assistant' and parent_message_id is not null;

-- Reconcile old concurrent generations before enforcing one active response per
-- conversation. Keep the newest generation active and preserve older partials.
with ranked_active_generations as (
  select
    id,
    row_number() over (
      partition by conversation_id
      order by updated_at desc, created_at desc, id desc
    ) as active_rank
  from public.chat_messages
  where role = 'assistant'
    and status in ('pending', 'streaming')
)
update public.chat_messages message
set
  status = case when btrim(message.content) = '' then 'failed' else 'interrupted' end,
  metadata = coalesce(message.metadata, '{}'::jsonb) || jsonb_build_object(
    'recoveredAt', now(),
    'interruptionReason', 'migration_concurrency_cleanup'
  )
from ranked_active_generations ranked
where message.id = ranked.id
  and ranked.active_rank > 1;

create unique index if not exists chat_messages_one_active_generation_idx
  on public.chat_messages(conversation_id)
  where role = 'assistant' and status in ('pending', 'streaming');

create index if not exists chat_messages_recoverable_idx
  on public.chat_messages(user_id, conversation_id, updated_at)
  where status in ('pending', 'streaming', 'interrupted', 'failed');
