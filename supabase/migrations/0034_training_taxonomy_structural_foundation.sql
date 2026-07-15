-- CEOTECA Training: contrato estructural de taxonomia.
-- Extiende 0033 sin duplicar planes, progreso, ejercicios ni roles editoriales.

alter table public.training_skills
  add column if not exists difficulty_start text,
  add column if not exists difficulty_max text;

update public.training_skills set
  difficulty_start = coalesce(difficulty_start, case initial_difficulty when 'advanced' then 'advanced' when 'intermediate' then 'application' else 'fundamentals' end),
  difficulty_max = coalesce(difficulty_max, case maximum_difficulty when 'advanced' then 'advanced' when 'intermediate' then 'application' else 'fundamentals' end);

alter table public.training_skills alter column difficulty_start set default 'fundamentals';
alter table public.training_skills alter column difficulty_start set not null;
alter table public.training_skills alter column difficulty_max set default 'advanced';
alter table public.training_skills alter column difficulty_max set not null;
alter table public.training_skills drop constraint if exists training_skills_difficulty_start_check;
alter table public.training_skills add constraint training_skills_difficulty_start_check check(difficulty_start in ('fundamentals','application','advanced','expert'));
alter table public.training_skills drop constraint if exists training_skills_difficulty_max_check;
alter table public.training_skills add constraint training_skills_difficulty_max_check check(difficulty_max in ('fundamentals','application','advanced','expert'));
alter table public.training_skills drop constraint if exists training_skills_difficulty_order_check;
alter table public.training_skills add constraint training_skills_difficulty_order_check check(
  array_position(array['fundamentals','application','advanced','expert'], difficulty_start)
  <= array_position(array['fundamentals','application','advanced','expert'], difficulty_max)
);

alter table public.training_learning_path_modules
  add column if not exists slug text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.training_learning_path_modules
set slug = trim(both '-' from regexp_replace(lower(translate(title,
  'áéíóúüñÁÉÍÓÚÜÑ','aeiouunAEIOUUN')), '[^a-z0-9]+', '-', 'g'))
where slug is null;

-- Los slugs repetidos heredados reciben su orden para conservar unicidad por ruta.
with duplicates as (
  select id, row_number() over(partition by path_id,slug order by sort_order,id) as occurrence
  from public.training_learning_path_modules
)
update public.training_learning_path_modules module
set slug = module.slug || '-' || duplicates.occurrence
from duplicates where module.id=duplicates.id and duplicates.occurrence > 1;

alter table public.training_learning_path_modules alter column slug set not null;
alter table public.training_learning_path_modules drop constraint if exists training_learning_path_modules_path_slug_key;
alter table public.training_learning_path_modules add constraint training_learning_path_modules_path_slug_key unique(path_id,slug);

alter table public.training_learning_path_module_items
  add column if not exists skill_id uuid references public.training_skills on delete restrict,
  add column if not exists concept_id uuid references public.training_concepts on delete restrict,
  add column if not exists template_id uuid references public.training_templates on delete restrict;

-- Normaliza mastery a 0..1 en items y prerrequisitos. Los servicios antiguos pueden
-- seguir usando porcentajes en las tablas de progreso, que permanecen en 0..100.
update public.training_learning_path_module_items set minimum_mastery=minimum_mastery/100 where minimum_mastery > 1;
alter table public.training_learning_path_module_items drop constraint if exists training_learning_path_module_items_minimum_mastery_check;
alter table public.training_learning_path_module_items add constraint training_learning_path_module_items_minimum_mastery_check check(minimum_mastery between 0 and 1);
alter table public.training_learning_path_module_items drop constraint if exists training_learning_path_module_items_item_type_check;
alter table public.training_learning_path_module_items add constraint training_learning_path_module_items_item_type_check check(item_type in ('exercise','skill_session','concept_session','template','roleplay','review'));
alter table public.training_learning_path_module_items drop constraint if exists training_learning_path_module_items_check;
alter table public.training_learning_path_module_items add constraint training_learning_path_module_items_reference_check check(
  (item_type in ('exercise','review') and exercise_id is not null and skill_id is null and concept_id is null and template_id is null and roleplay_scenario_id is null) or
  (item_type='skill_session' and exercise_id is null and skill_id is not null and concept_id is null and template_id is null and roleplay_scenario_id is null) or
  (item_type='concept_session' and exercise_id is null and skill_id is null and concept_id is not null and template_id is null and roleplay_scenario_id is null) or
  (item_type='template' and exercise_id is null and skill_id is null and concept_id is null and template_id is not null and roleplay_scenario_id is null) or
  (item_type='roleplay' and exercise_id is null and skill_id is null and concept_id is null and template_id is null and roleplay_scenario_id is not null)
);

update public.training_skill_prerequisites set minimum_mastery=minimum_mastery/100 where minimum_mastery > 1;
update public.training_concept_prerequisites set minimum_mastery=minimum_mastery/100 where minimum_mastery > 1;
alter table public.training_skill_prerequisites drop constraint if exists training_skill_prerequisites_minimum_mastery_check;
alter table public.training_skill_prerequisites add constraint training_skill_prerequisites_minimum_mastery_check check(minimum_mastery between 0 and 1);
alter table public.training_concept_prerequisites drop constraint if exists training_concept_prerequisites_minimum_mastery_check;
alter table public.training_concept_prerequisites add constraint training_concept_prerequisites_minimum_mastery_check check(minimum_mastery between 0 and 1);

create index if not exists training_skill_prerequisites_lookup_idx on public.training_skill_prerequisites(skill_id,prerequisite_skill_id);
create index if not exists training_concept_prerequisites_lookup_idx on public.training_concept_prerequisites(concept_id,prerequisite_concept_id);
create index if not exists training_categories_status_idx on public.training_categories(status,sort_order);
create index if not exists training_skills_category_status_idx on public.training_skills(category_id,status);
create index if not exists training_concepts_skill_status_idx on public.training_concepts(skill_id,status);
create index if not exists training_paths_status_idx on public.training_learning_paths(status,slug);
create index if not exists training_path_items_module_idx on public.training_learning_path_module_items(module_id,sort_order);
create index if not exists training_visual_assets_review_idx on public.training_visual_assets(copyright_status,source_type);

create or replace function public.training_skill_prerequisite_has_cycle(p_skill_id uuid,p_prerequisite_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  with recursive ancestors(id) as (
    select p_prerequisite_id
    union
    select prerequisite_skill_id from training_skill_prerequisites p join ancestors a on p.skill_id=a.id
  ) select exists(select 1 from ancestors where id=p_skill_id)
$$;

create or replace function public.training_concept_prerequisite_has_cycle(p_concept_id uuid,p_prerequisite_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  with recursive ancestors(id) as (
    select p_prerequisite_id
    union
    select prerequisite_concept_id from training_concept_prerequisites p join ancestors a on p.concept_id=a.id
  ) select exists(select 1 from ancestors where id=p_concept_id)
$$;

create or replace function public.prevent_training_skill_prerequisite_cycle()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if training_skill_prerequisite_has_cycle(new.skill_id,new.prerequisite_skill_id) then
    raise exception 'TRAINING_SKILL_PREREQUISITE_CYCLE';
  end if;
  return new;
end $$;

create or replace function public.prevent_training_concept_prerequisite_cycle()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if training_concept_prerequisite_has_cycle(new.concept_id,new.prerequisite_concept_id) then
    raise exception 'TRAINING_CONCEPT_PREREQUISITE_CYCLE';
  end if;
  return new;
end $$;

drop trigger if exists prevent_training_skill_prerequisite_cycle on public.training_skill_prerequisites;
create trigger prevent_training_skill_prerequisite_cycle before insert or update on public.training_skill_prerequisites for each row execute function public.prevent_training_skill_prerequisite_cycle();
drop trigger if exists prevent_training_concept_prerequisite_cycle on public.training_concept_prerequisites;
create trigger prevent_training_concept_prerequisite_cycle before insert or update on public.training_concept_prerequisites for each row execute function public.prevent_training_concept_prerequisite_cycle();

-- Ejemplos idempotentes: solo enlazan entidades existentes y nunca inventan libros.
insert into public.training_skill_prerequisites(skill_id,prerequisite_skill_id,minimum_mastery)
select target.id,source.id,0.6 from public.training_skills target cross join public.training_skills source
where target.slug='responder-objeciones' and source.slug='hacer-preguntas-de-descubrimiento'
on conflict(skill_id,prerequisite_skill_id) do update set minimum_mastery=excluded.minimum_mastery;

insert into public.training_concept_prerequisites(concept_id,prerequisite_concept_id,minimum_mastery)
select target.id,source.id,0.6 from public.training_concepts target cross join public.training_concepts source
where target.slug like 'responder-objeciones-%' and source.slug like 'hacer-preguntas-de-descubrimiento-%'
and target.slug<>source.slug limit 1
on conflict(concept_id,prerequisite_concept_id) do update set minimum_mastery=excluded.minimum_mastery;

-- Escritura editorial. Se reutiliza training_editorial_users; los usuarios normales
-- no reciben ninguna politica INSERT/UPDATE/DELETE.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'training_categories','training_subcategories','training_skills','training_concepts',
    'training_formats','training_cognitive_levels','training_exercise_formats',
    'training_learning_paths','training_learning_path_modules','training_learning_path_module_items',
    'training_path_skills','training_path_categories','training_skill_prerequisites',
    'training_concept_prerequisites','training_visual_assets','training_exercise_assets',
    'training_category_books','training_skill_books','training_concept_books'
  ] loop
    execute format('drop policy if exists %I on public.%I',table_name || '_editor_write',table_name);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_training_editor(array[''admin'',''editor''])) with check (public.is_training_editor(array[''admin'',''editor'']))',table_name || '_editor_write',table_name);
  end loop;
end $$;

-- internal_reference queda reservado al backend de servicio.
revoke select on public.training_concept_books from authenticated;
grant select(concept_id,book_id,relevance_weight) on public.training_concept_books to authenticated;
grant select on public.training_concept_books to service_role;

grant execute on function public.training_skill_prerequisite_has_cycle(uuid,uuid) to authenticated,service_role;
grant execute on function public.training_concept_prerequisite_has_cycle(uuid,uuid) to authenticated,service_role;
