begin;

do $$
begin
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='training_skills' and column_name='difficulty_start') then raise exception 'missing difficulty_start'; end if;
  if not exists(select 1 from pg_indexes where schemaname='public' and indexname='training_skill_prerequisites_lookup_idx') then raise exception 'missing prerequisite index'; end if;
  if not exists(select 1 from pg_trigger where tgname='prevent_training_skill_prerequisite_cycle' and not tgisinternal) then raise exception 'missing cycle trigger'; end if;
  if exists(select 1 from public.training_skill_prerequisites where minimum_mastery not between 0 and 1) then raise exception 'invalid skill mastery domain'; end if;
  if exists(select 1 from public.training_concept_prerequisites where minimum_mastery not between 0 and 1) then raise exception 'invalid concept mastery domain'; end if;
  if (select count(*) from public.training_categories where status='published' and slug in ('marketing-y-marca','ventas-y-persuasion','comunicacion-profesional','emprendimiento','estrategia-y-toma-de-decisiones','liderazgo-y-gestion-de-equipos','finanzas-y-criterio-economico','productividad-y-desarrollo-personal-aplicado')) <> 8 then raise exception 'official categories seed mismatch'; end if;
  if exists(select slug from public.training_categories group by slug having count(*)>1) then raise exception 'duplicate category slugs'; end if;
  if exists(select path_id,slug from public.training_learning_path_modules group by path_id,slug having count(*)>1) then raise exception 'duplicate module slugs'; end if;
end $$;

-- La transacción confirma que los seeds son reejecutables sin dejar datos de prueba.
insert into public.training_formats(slug,name,description,icon,status)
values('visual-analysis','Análisis visual','Prueba de idempotencia','image','published')
on conflict(slug) do update set name=excluded.name;

rollback;
