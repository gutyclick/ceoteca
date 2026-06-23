alter table public.chat_usage
add column if not exists context text not null default 'book'
check (context in ('book', 'site'));

alter table public.chat_messages
add column if not exists context text not null default 'book'
check (context in ('book', 'site'));

drop index if exists public.chat_messages_user_book_idx;
create index if not exists chat_messages_user_context_book_idx
on public.chat_messages(user_id, context, book_id, created_at);

alter table public.chat_usage
drop constraint if exists chat_usage_user_id_book_id_month_key;

alter table public.chat_usage
add constraint chat_usage_user_context_book_month_key
unique (user_id, context, book_id, month);

create or replace function public.increment_chat_usage(
  target_user_id uuid,
  target_book_id uuid,
  target_month date,
  target_context text default 'book'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  if auth.uid() <> target_user_id then
    raise exception 'not allowed';
  end if;

  insert into public.chat_usage (user_id, book_id, context, month, question_count)
  values (target_user_id, target_book_id, target_context, target_month, 1)
  on conflict (user_id, context, book_id, month)
  do update set question_count = public.chat_usage.question_count + 1
  returning question_count into new_count;

  return new_count;
end;
$$;
