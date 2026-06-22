insert into public.audio_assets (
  book_id,
  storage_path,
  voice,
  model,
  duration_seconds,
  status
)
select
  books.id,
  'LA DISCIPLINA DE EMPRENDER.mp3',
  'editorial',
  'uploaded',
  null,
  'ready'
from public.books
where books.slug = 'disciplined-entrepreneurship'
and not exists (
  select 1
  from public.audio_assets
  where audio_assets.book_id = books.id
  and audio_assets.storage_path = 'LA DISCIPLINA DE EMPRENDER.mp3'
);
