alter table public.profiles
alter column discovery_source type text[]
using case
  when discovery_source is null or discovery_source = '' then null
  else array[discovery_source]
end;
