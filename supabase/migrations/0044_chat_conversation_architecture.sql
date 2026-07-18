alter table public.chat_conversations
  add column if not exists type text,
  add column if not exists status text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists title_is_manual boolean not null default false,
  add column if not exists client_creation_key uuid;

update public.chat_conversations
set
  type = case when context = 'book' then 'book' else 'general' end,
  status = case when archived_at is null then 'active' else 'archived' end
where type is null or status is null;

insert into public.chat_conversations (
  user_id,
  context,
  type,
  book_id,
  title,
  status,
  archived_at,
  last_message_at,
  created_at,
  updated_at
)
select
  message.user_id,
  'book',
  'book',
  message.book_id,
  book.title,
  case when preference.archived_at is null then 'active' else 'archived' end,
  preference.archived_at,
  max(message.created_at),
  min(message.created_at),
  max(message.created_at)
from public.chat_messages as message
join public.books as book on book.id = message.book_id
left join public.chat_book_preferences as preference
  on preference.user_id = message.user_id
 and preference.book_id = message.book_id
where message.context = 'book'
  and message.conversation_id is null
group by message.user_id, message.book_id, book.title, preference.archived_at;

update public.chat_messages as message
set conversation_id = conversation.id
from public.chat_conversations as conversation
where message.context = 'book'
  and message.conversation_id is null
  and conversation.user_id = message.user_id
  and conversation.book_id = message.book_id
  and conversation.type = 'book';

alter table public.chat_conversations
  alter column type set not null,
  alter column status set not null;

alter table public.chat_conversations
  drop constraint if exists chat_conversations_type_check,
  add constraint chat_conversations_type_check
    check (type in ('general', 'book')),
  drop constraint if exists chat_conversations_status_check,
  add constraint chat_conversations_status_check
    check (status in ('active', 'archived')),
  drop constraint if exists chat_conversations_type_book_check,
  add constraint chat_conversations_type_book_check
    check (
      (type = 'general' and book_id is null)
      or (type = 'book' and book_id is not null)
    );

create unique index if not exists chat_conversations_user_creation_key_idx
  on public.chat_conversations(user_id, client_creation_key)
  where client_creation_key is not null;

create index if not exists chat_conversations_user_status_recent_idx
  on public.chat_conversations(user_id, status, last_message_at desc);

create index if not exists chat_conversations_user_type_status_idx
  on public.chat_conversations(user_id, type, status);

alter table public.chat_messages
  alter column book_id drop not null,
  add column if not exists parts jsonb,
  add column if not exists status text not null default 'completed',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists parent_message_id uuid references public.chat_messages(id) on delete set null,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists client_message_id uuid;

alter table public.chat_messages
  drop constraint if exists chat_messages_role_check,
  add constraint chat_messages_role_check
    check (role in ('user', 'assistant', 'system', 'tool')),
  drop constraint if exists chat_messages_status_check,
  add constraint chat_messages_status_check
    check (status in ('pending', 'streaming', 'completed', 'failed'));

create unique index if not exists chat_messages_conversation_client_message_idx
  on public.chat_messages(conversation_id, client_message_id)
  where client_message_id is not null;

create index if not exists chat_messages_parent_idx
  on public.chat_messages(parent_message_id)
  where parent_message_id is not null;

drop trigger if exists set_chat_messages_updated_at on public.chat_messages;
create trigger set_chat_messages_updated_at
before update on public.chat_messages
for each row execute function public.set_updated_at();
