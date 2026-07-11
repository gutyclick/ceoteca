alter table public.profiles
alter column avatar_url set default '/images/AVATARES/cerebrolector.png';

update public.profiles
set avatar_url = '/images/AVATARES/cerebrolector.png',
    updated_at = now()
where avatar_url is null
   or avatar_url = ''
   or avatar_url like 'http://%'
   or avatar_url like 'https://%';
