-- Phase 7: private, user-scoped attachments for Chat with CEO.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  false,
  8388608,
  array[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.chat_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.chat_conversations(id) on delete cascade,
  message_id uuid references public.chat_messages(id) on delete set null,
  upload_session_id uuid not null,
  client_upload_id uuid not null,
  original_name text not null check (char_length(original_name) between 1 and 240),
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  category text not null check (category in ('document', 'data', 'image')),
  status text not null default 'pending'
    check (status in ('pending', 'uploaded', 'processing', 'ready', 'failed', 'deleted')),
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending', 'processing', 'ready', 'failed', 'not_applicable')),
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_attachment_extractions (
  attachment_id uuid primary key references public.chat_attachments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null default '',
  truncated boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_attachments_user_session_idx
  on public.chat_attachments(user_id, upload_session_id, status);
create unique index if not exists chat_attachments_user_client_upload_idx
  on public.chat_attachments(user_id, client_upload_id);
create index if not exists chat_attachments_conversation_idx
  on public.chat_attachments(user_id, conversation_id, created_at);
create index if not exists chat_attachments_message_idx
  on public.chat_attachments(message_id) where message_id is not null;
create index if not exists chat_attachments_cleanup_idx
  on public.chat_attachments(expires_at)
  where message_id is null and status not in ('deleted', 'processing');

alter table public.chat_attachments enable row level security;
alter table public.chat_attachment_extractions enable row level security;

drop policy if exists "Users can read own chat attachments" on public.chat_attachments;
create policy "Users can read own chat attachments"
  on public.chat_attachments for select
  using (auth.uid() = user_id and status <> 'deleted');

-- Mutation and extracted content are service-role only. Signed URLs are produced
-- by authenticated server routes after an ownership check.
drop policy if exists "Users can read own chat attachment objects" on storage.objects;
create policy "Users can read own chat attachment objects"
  on storage.objects for select
  using (
    bucket_id = 'chat-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create or replace function public.set_chat_attachment_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_chat_attachments_updated_at on public.chat_attachments;
create trigger set_chat_attachments_updated_at
before update on public.chat_attachments
for each row execute function public.set_chat_attachment_updated_at();

drop trigger if exists set_chat_attachment_extractions_updated_at on public.chat_attachment_extractions;
create trigger set_chat_attachment_extractions_updated_at
before update on public.chat_attachment_extractions
for each row execute function public.set_chat_attachment_updated_at();

create or replace function public.reserve_chat_attachment(
  p_user_id uuid,
  p_conversation_id uuid,
  p_upload_session_id uuid,
  p_client_upload_id uuid,
  p_attachment_id uuid,
  p_original_name text,
  p_storage_path text,
  p_mime_type text,
  p_size_bytes bigint,
  p_category text,
  p_extraction_status text,
  p_expires_at timestamptz,
  p_metadata jsonb,
  p_max_files integer,
  p_max_total_bytes bigint
)
returns table (
  attachment_id uuid,
  attachment_status text,
  reserved_storage_path text,
  was_created boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing public.chat_attachments%rowtype;
  current_count integer;
  current_bytes bigint;
begin
  perform pg_advisory_xact_lock(
    hashtextextended(p_user_id::text || ':' || p_upload_session_id::text, 0)
  );

  if p_conversation_id is not null and not exists (
    select 1
    from public.chat_conversations
    where id = p_conversation_id and user_id = p_user_id
  ) then
    raise exception using errcode = '42501', message = 'ATTACHMENT_ACCESS_DENIED';
  end if;

  select *
  into existing
  from public.chat_attachments
  where user_id = p_user_id and client_upload_id = p_client_upload_id;

  if found and existing.status <> 'failed' then
    return query select existing.id, existing.status, existing.storage_path, false;
    return;
  end if;

  select count(*)::integer, coalesce(sum(size_bytes), 0)::bigint
  into current_count, current_bytes
  from public.chat_attachments
  where user_id = p_user_id
    and upload_session_id = p_upload_session_id
    and status not in ('deleted', 'failed');

  if current_count >= p_max_files then
    raise exception using errcode = 'P0001', message = 'ATTACHMENT_FILE_LIMIT';
  end if;
  if current_bytes + p_size_bytes > p_max_total_bytes then
    raise exception using errcode = 'P0001', message = 'ATTACHMENT_TOTAL_SIZE_LIMIT';
  end if;

  if existing.id is not null then
    delete from public.chat_attachment_extractions where attachment_id = existing.id;
    update public.chat_attachments
    set
      conversation_id = p_conversation_id,
      upload_session_id = p_upload_session_id,
      original_name = p_original_name,
      mime_type = p_mime_type,
      size_bytes = p_size_bytes,
      category = p_category,
      status = 'processing',
      extraction_status = p_extraction_status,
      expires_at = p_expires_at,
      deleted_at = null,
      metadata = p_metadata
    where id = existing.id;
    return query select existing.id, 'processing'::text, existing.storage_path, true;
    return;
  end if;

  insert into public.chat_attachments (
    id, user_id, conversation_id, upload_session_id, client_upload_id,
    original_name, storage_path, mime_type, size_bytes, category, status,
    extraction_status, expires_at, metadata
  ) values (
    p_attachment_id, p_user_id, p_conversation_id, p_upload_session_id,
    p_client_upload_id, p_original_name, p_storage_path, p_mime_type,
    p_size_bytes, p_category, 'processing', p_extraction_status,
    p_expires_at, p_metadata
  );

  return query select p_attachment_id, 'processing'::text, p_storage_path, true;
end;
$$;

revoke all on function public.reserve_chat_attachment(
  uuid, uuid, uuid, uuid, uuid, text, text, text, bigint, text, text,
  timestamptz, jsonb, integer, bigint
) from public, anon, authenticated;
grant execute on function public.reserve_chat_attachment(
  uuid, uuid, uuid, uuid, uuid, text, text, text, bigint, text, text,
  timestamptz, jsonb, integer, bigint
) to service_role;

alter table public.chat_events drop constraint if exists chat_events_event_type_check;
alter table public.chat_events add constraint chat_events_event_type_check check (
  event_type in (
    'moderation_block', 'limit_reached', 'provider_error', 'validation_error',
    'usage_reserved', 'usage_consumed', 'usage_released', 'usage_limit_reached',
    'usage_regeneration', 'usage_contextual_action', 'usage_rate_limited',
    'attachment_selected', 'attachment_upload_started', 'attachment_upload_completed',
    'attachment_upload_failed', 'attachment_removed',
    'attachment_processing_completed', 'attachment_processing_failed',
    'message_sent_with_attachment'
  )
);
