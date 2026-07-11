create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context text not null default 'site' check (context in ('book', 'site')),
  book_id uuid references public.books(id) on delete cascade,
  title text not null default 'Nueva conversación' check (char_length(title) between 1 and 120),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chat_messages
add column if not exists conversation_id uuid references public.chat_conversations(id) on delete cascade;

create index if not exists chat_conversations_user_recent_idx
on public.chat_conversations(user_id, last_message_at desc);

create index if not exists chat_messages_conversation_created_idx
on public.chat_messages(conversation_id, created_at);

insert into public.chat_conversations (user_id, context, title, last_message_at, created_at, updated_at)
select
  user_id,
  'site',
  'Conversación general',
  max(created_at),
  min(created_at),
  max(created_at)
from public.chat_messages
where context = 'site' and conversation_id is null
group by user_id;

update public.chat_messages as message
set conversation_id = conversation.id
from public.chat_conversations as conversation
where message.context = 'site'
  and message.conversation_id is null
  and conversation.user_id = message.user_id
  and conversation.context = 'site'
  and conversation.title = 'Conversación general';

alter table public.chat_conversations enable row level security;

create policy "chat_conversations_select_own" on public.chat_conversations
for select using (auth.uid() = user_id);

create policy "chat_conversations_insert_own" on public.chat_conversations
for insert with check (auth.uid() = user_id);

create policy "chat_conversations_update_own" on public.chat_conversations
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "chat_conversations_delete_own" on public.chat_conversations
for delete using (auth.uid() = user_id);

drop trigger if exists set_chat_conversations_updated_at on public.chat_conversations;
create trigger set_chat_conversations_updated_at
before update on public.chat_conversations
for each row execute function public.set_updated_at();
