-- CEOTECA Training: taxonomia, formatos y rutas practicas.
-- Amplia el modelo existente sin duplicar sesiones, mastery, repasos o cuotas.

alter table public.training_categories
  add column if not exists short_description text,
  add column if not exists status text not null default 'published',
  add column if not exists minimum_plan text not null default 'free',
  add column if not exists allowed_plans text[] not null default array['free','pro','unlimited'],
  add column if not exists preview_allowed boolean not null default true,
  add column if not exists locked_reason text,
  add column if not exists semantic_color text,
  add column if not exists image_path text;
alter table public.training_categories drop constraint if exists training_categories_status_check;
alter table public.training_categories add constraint training_categories_status_check check(status in ('draft','published','archived'));
alter table public.training_categories drop constraint if exists training_categories_minimum_plan_check;
alter table public.training_categories add constraint training_categories_minimum_plan_check check(minimum_plan in ('free','pro','unlimited'));

create table if not exists public.training_subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.training_categories on delete restrict,
  slug text not null unique check(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  description text,
  sort_order integer not null default 0,
  status text not null default 'published' check(status in ('draft','published','archived')),
  minimum_plan text not null default 'free' check(minimum_plan in ('free','pro','unlimited')),
  allowed_plans text[] not null default array['free','pro','unlimited'],
  preview_allowed boolean not null default true,
  locked_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_skills
  add column if not exists subcategory_id uuid references public.training_subcategories on delete restrict,
  add column if not exists learning_objectives text[] not null default '{}',
  add column if not exists maximum_difficulty text not null default 'advanced',
  add column if not exists status text not null default 'published',
  add column if not exists minimum_plan text not null default 'free',
  add column if not exists allowed_plans text[] not null default array['free','pro','unlimited'],
  add column if not exists preview_allowed boolean not null default true,
  add column if not exists locked_reason text,
  add column if not exists compatible_formats text[] not null default '{}',
  add column if not exists compatible_exercise_types text[] not null default '{}';
alter table public.training_skills drop constraint if exists training_skills_maximum_difficulty_check;
alter table public.training_skills add constraint training_skills_maximum_difficulty_check check(maximum_difficulty in ('beginner','intermediate','advanced'));
alter table public.training_skills drop constraint if exists training_skills_status_check;
alter table public.training_skills add constraint training_skills_status_check check(status in ('draft','published','archived'));
alter table public.training_skills drop constraint if exists training_skills_minimum_plan_check;
alter table public.training_skills add constraint training_skills_minimum_plan_check check(minimum_plan in ('free','pro','unlimited'));

alter table public.training_concepts
  add column if not exists editorial_summary text,
  add column if not exists explanation text,
  add column if not exists common_mistakes jsonb not null default '[]',
  add column if not exists approved_examples jsonb not null default '[]',
  add column if not exists recommended_cognitive_level text not null default 'understanding',
  add column if not exists compatible_formats text[] not null default '{}',
  add column if not exists status text not null default 'published',
  add column if not exists minimum_plan text not null default 'free',
  add column if not exists allowed_plans text[] not null default array['free','pro','unlimited'],
  add column if not exists preview_allowed boolean not null default true,
  add column if not exists locked_reason text;
alter table public.training_concepts drop constraint if exists training_concepts_cognitive_level_check;
alter table public.training_concepts add constraint training_concepts_cognitive_level_check check(recommended_cognitive_level in ('recognition','understanding','application','analysis','transfer','synthesis'));
alter table public.training_concepts drop constraint if exists training_concepts_status_check;
alter table public.training_concepts add constraint training_concepts_status_check check(status in ('draft','published','archived'));

update public.training_exercises set cognitive_level='understanding' where cognitive_level='recall';
alter table public.training_exercises drop constraint if exists training_exercises_cognitive_level_check;
alter table public.training_exercises add constraint training_exercises_cognitive_level_check check(cognitive_level in ('recognition','understanding','application','analysis','transfer','synthesis'));
alter table public.training_exercises drop constraint if exists training_exercises_type_check;
alter table public.training_exercises add constraint training_exercises_type_check check(type in(
  'single_choice','multiple_choice','true_false','ordering','flashcard','scenario',
  'open_response','guided_builder','decision_justification','reflection',
  'visual_single_choice','visual_comparison','visual_diagnosis','visual_annotation','visual_ranking',
  'message_response','message_comparison','tone_adjustment','objection_response','email_rewrite','conversation_diagnosis'
));
alter table public.training_exercises
  add column if not exists minimum_plan text not null default 'free',
  add column if not exists allowed_plans text[] not null default array['free','pro','unlimited'],
  add column if not exists preview_allowed boolean not null default true,
  add column if not exists locked_reason text,
  add column if not exists visual_alternative text;
alter table public.training_exercises drop constraint if exists training_exercises_minimum_plan_check;
alter table public.training_exercises add constraint training_exercises_minimum_plan_check check(minimum_plan in ('free','pro','unlimited'));

create table if not exists public.training_formats (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  description text not null,
  icon text not null,
  status text not null default 'published' check(status in ('draft','published','archived')),
  created_at timestamptz not null default now()
);
create table if not exists public.training_cognitive_levels (
  slug text primary key check(slug in ('recognition','understanding','application','analysis','transfer','synthesis')),
  name text not null,
  description text not null,
  sort_order integer not null unique,
  status text not null default 'published' check(status in ('draft','published','archived'))
);
create table if not exists public.training_exercise_formats (
  exercise_id uuid not null references public.training_exercises on delete cascade,
  format_id uuid not null references public.training_formats on delete restrict,
  is_primary boolean not null default false,
  primary key(exercise_id,format_id)
);
create unique index if not exists training_exercise_primary_format_unique on public.training_exercise_formats(exercise_id) where is_primary;

create table if not exists public.training_modes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check(slug in ('analiza','construye','practica')),
  name text not null,
  description text not null,
  icon text not null,
  sort_order integer not null,
  status text not null default 'published' check(status in ('draft','published','archived'))
);
create table if not exists public.training_mode_formats (
  mode_id uuid not null references public.training_modes on delete cascade,
  format_id uuid not null references public.training_formats on delete cascade,
  primary key(mode_id,format_id)
);

create table if not exists public.training_learning_paths (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  promise text not null,
  description text not null,
  expected_outcome text not null,
  estimated_minutes integer not null check(estimated_minutes > 0),
  difficulty text not null check(difficulty in ('beginner','intermediate','advanced')),
  minimum_plan text not null default 'free' check(minimum_plan in ('free','pro','unlimited')),
  allowed_plans text[] not null default array['free','pro','unlimited'],
  preview_allowed boolean not null default true,
  locked_reason text,
  status text not null default 'draft' check(status in ('draft','in_review','published','archived')),
  cover_asset_id uuid,
  version integer not null default 1 check(version > 0),
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.training_learning_path_modules (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.training_learning_paths on delete cascade,
  title text not null,
  description text not null,
  sort_order integer not null check(sort_order > 0),
  estimated_minutes integer not null check(estimated_minutes > 0),
  minimum_plan text not null default 'free' check(minimum_plan in ('free','pro','unlimited')),
  allowed_plans text[] not null default array['free','pro','unlimited'],
  preview_allowed boolean not null default true,
  locked_reason text,
  status text not null default 'published' check(status in ('draft','published','archived')),
  unique(path_id,sort_order)
);
create table if not exists public.training_learning_path_module_items (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.training_learning_path_modules on delete cascade,
  item_type text not null check(item_type in ('exercise','roleplay','review')),
  exercise_id uuid references public.training_exercises on delete restrict,
  roleplay_scenario_id uuid references public.training_roleplay_scenarios on delete restrict,
  sort_order integer not null check(sort_order > 0),
  is_required boolean not null default true,
  unlock_rule jsonb not null default '{}',
  minimum_mastery numeric not null default 0 check(minimum_mastery between 0 and 100),
  created_at timestamptz not null default now(),
  unique(module_id,sort_order),
  check(
    (item_type='exercise' and exercise_id is not null and roleplay_scenario_id is null) or
    (item_type='roleplay' and roleplay_scenario_id is not null and exercise_id is null) or
    (item_type='review' and exercise_id is not null and roleplay_scenario_id is null)
  )
);
create table if not exists public.training_path_skills (
  path_id uuid not null references public.training_learning_paths on delete cascade,
  skill_id uuid not null references public.training_skills on delete restrict,
  sort_order integer not null default 0,
  primary key(path_id,skill_id)
);
create table if not exists public.training_path_categories (
  path_id uuid not null references public.training_learning_paths on delete cascade,
  category_id uuid not null references public.training_categories on delete restrict,
  primary key(path_id,category_id)
);

create table if not exists public.user_training_path_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  path_id uuid not null references public.training_learning_paths on delete cascade,
  status text not null default 'in_progress' check(status in ('in_progress','completed','paused')),
  progress numeric not null default 0 check(progress between 0 and 100),
  current_module_id uuid references public.training_learning_path_modules on delete set null,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(user_id,path_id)
);
create table if not exists public.user_training_path_module_progress (
  user_id uuid not null references auth.users on delete cascade,
  module_id uuid not null references public.training_learning_path_modules on delete cascade,
  status text not null default 'available' check(status in ('locked','available','in_progress','completed')),
  progress numeric not null default 0 check(progress between 0 and 100),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id,module_id)
);
create table if not exists public.user_skill_cognitive_mastery (
  user_id uuid not null references auth.users on delete cascade,
  skill_id uuid not null references public.training_skills on delete cascade,
  cognitive_level text not null check(cognitive_level in ('recognition','understanding','application','analysis','transfer','synthesis')),
  mastery_score numeric not null default 0 check(mastery_score between 0 and 100),
  attempts integer not null default 0,
  last_practiced_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id,skill_id,cognitive_level)
);

create table if not exists public.training_visual_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  mime_type text not null check(mime_type in ('image/png','image/jpeg','image/webp','image/avif')),
  width integer not null check(width > 0),
  height integer not null check(height > 0),
  alt_text text not null check(length(trim(alt_text)) >= 8),
  source_type text not null check(source_type in ('original','licensed','generated','editorial','user_provided')),
  copyright_status text not null default 'needs_review' check(copyright_status in ('approved','needs_review','restricted','rejected')),
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
alter table public.training_learning_paths drop constraint if exists training_learning_paths_cover_asset_id_fkey;
alter table public.training_learning_paths add constraint training_learning_paths_cover_asset_id_fkey foreign key(cover_asset_id) references public.training_visual_assets on delete set null;
create table if not exists public.training_exercise_assets (
  exercise_id uuid not null references public.training_exercises on delete cascade,
  asset_id uuid not null references public.training_visual_assets on delete restrict,
  label text,
  sort_order integer not null default 0,
  primary key(exercise_id,asset_id)
);
create table if not exists public.training_slug_aliases (
  entity_type text not null check(entity_type in ('category','subcategory','skill','concept','path')),
  old_slug text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(entity_type,old_slug)
);

create table if not exists public.training_category_books(category_id uuid not null references public.training_categories on delete cascade,book_id uuid not null references public.books on delete cascade,relevance_weight numeric not null default 1 check(relevance_weight between 0 and 1),primary key(category_id,book_id));
create table if not exists public.training_skill_books(skill_id uuid not null references public.training_skills on delete cascade,book_id uuid not null references public.books on delete cascade,relevance_weight numeric not null default 1 check(relevance_weight between 0 and 1),primary key(skill_id,book_id));
create table if not exists public.training_concept_books(concept_id uuid not null references public.training_concepts on delete cascade,book_id uuid not null references public.books on delete cascade,relevance_weight numeric not null default 1 check(relevance_weight between 0 and 1),internal_reference text,primary key(concept_id,book_id));

create index if not exists training_subcategories_category_idx on public.training_subcategories(category_id,sort_order);
create index if not exists training_skills_subcategory_idx on public.training_skills(subcategory_id);
create index if not exists training_path_modules_path_idx on public.training_learning_path_modules(path_id,sort_order);
create index if not exists user_training_path_progress_user_idx on public.user_training_path_progress(user_id,updated_at desc);

alter table public.training_subcategories enable row level security;
alter table public.training_formats enable row level security;
alter table public.training_cognitive_levels enable row level security;
alter table public.training_exercise_formats enable row level security;
alter table public.training_modes enable row level security;
alter table public.training_mode_formats enable row level security;
alter table public.training_learning_paths enable row level security;
alter table public.training_learning_path_modules enable row level security;
alter table public.training_learning_path_module_items enable row level security;
alter table public.training_path_skills enable row level security;
alter table public.training_path_categories enable row level security;
alter table public.user_training_path_progress enable row level security;
alter table public.user_training_path_module_progress enable row level security;
alter table public.user_skill_cognitive_mastery enable row level security;
alter table public.training_visual_assets enable row level security;
alter table public.training_exercise_assets enable row level security;
alter table public.training_slug_aliases enable row level security;
alter table public.training_category_books enable row level security;
alter table public.training_skill_books enable row level security;
alter table public.training_concept_books enable row level security;

create policy training_subcategories_read on public.training_subcategories for select to authenticated using(status='published');
create policy training_formats_read on public.training_formats for select to authenticated using(status='published');
create policy training_cognitive_levels_read on public.training_cognitive_levels for select to authenticated using(status='published');
create policy training_exercise_formats_read on public.training_exercise_formats for select to authenticated using(true);
create policy training_modes_read on public.training_modes for select to authenticated using(status='published');
create policy training_mode_formats_read on public.training_mode_formats for select to authenticated using(true);
create policy training_paths_read on public.training_learning_paths for select to authenticated using(status='published');
create policy training_path_modules_read on public.training_learning_path_modules for select to authenticated using(status='published');
create policy training_path_items_read on public.training_learning_path_module_items for select to authenticated using(true);
create policy training_path_skills_read on public.training_path_skills for select to authenticated using(true);
create policy training_path_categories_read on public.training_path_categories for select to authenticated using(true);
create policy training_path_progress_own on public.user_training_path_progress for select to authenticated using(user_id=auth.uid());
create policy training_path_module_progress_own on public.user_training_path_module_progress for select to authenticated using(user_id=auth.uid());
create policy training_cognitive_mastery_own on public.user_skill_cognitive_mastery for select to authenticated using(user_id=auth.uid());
create policy training_assets_approved_read on public.training_visual_assets for select to authenticated using(copyright_status='approved');
create policy training_exercise_assets_read on public.training_exercise_assets for select to authenticated using(exists(select 1 from public.training_visual_assets a where a.id=asset_id and a.copyright_status='approved'));
create policy training_slug_aliases_read on public.training_slug_aliases for select to authenticated using(true);
create policy training_category_books_read on public.training_category_books for select to authenticated using(true);
create policy training_skill_books_read on public.training_skill_books for select to authenticated using(true);
create policy training_concept_books_read on public.training_concept_books for select to authenticated using(true);

-- Catalogos base.
insert into public.training_formats(slug,name,description,icon) values
('visual-analysis','Análisis visual','Compara, identifica y diagnostica elementos visuales.','image'),
('case-analysis','Análisis de casos','Examina decisiones y consecuencias en contextos concretos.','briefcase'),
('written-response','Respuesta escrita','Formula respuestas y argumentos con claridad.','pen-line'),
('conversational-roleplay','Role-play conversacional','Practica conversaciones con un personaje guiado.','messages-square'),
('guided-builder','Constructor guiado','Construye una solución por componentes.','blocks'),
('diagnosis','Diagnóstico','Detecta causas, riesgos y oportunidades.','scan-search'),
('decision-simulation','Simulación de decisiones','Elige y justifica decisiones bajo restricciones.','git-branch'),
('deterministic-practice','Práctica determinista','Refuerza conceptos con respuestas verificables.','check-circle')
on conflict(slug) do update set name=excluded.name,description=excluded.description,icon=excluded.icon;

insert into public.training_cognitive_levels(slug,name,description,sort_order) values
('recognition','Reconocimiento','Identifica señales, elementos y patrones relevantes.',1),
('understanding','Comprensión','Explica una idea y distingue sus partes esenciales.',2),
('application','Aplicación','Usa una idea en una situación concreta y guiada.',3),
('analysis','Análisis','Compara alternativas, diagnostica causas y justifica criterios.',4),
('transfer','Transferencia','Adapta lo aprendido a un contexto nuevo o ambiguo.',5),
('synthesis','Síntesis','Integra varias ideas para construir una solución original.',6)
on conflict(slug) do update set name=excluded.name,description=excluded.description,sort_order=excluded.sort_order,status='published';

insert into public.training_modes(slug,name,description,icon,sort_order) values
('analiza','Analiza','Diagnostica, compara y comprende situaciones.','scan-search',1),
('construye','Construye','Crea propuestas, mensajes y sistemas aplicables.','blocks',2),
('practica','Practica','Refuerza decisiones y conversaciones con feedback.','target',3)
on conflict(slug) do update set name=excluded.name,description=excluded.description,icon=excluded.icon,sort_order=excluded.sort_order;

insert into public.training_mode_formats(mode_id,format_id)
select m.id,f.id from public.training_modes m join public.training_formats f on
 (m.slug='analiza' and f.slug in ('visual-analysis','case-analysis','diagnosis')) or
 (m.slug='construye' and f.slug in ('written-response','guided-builder')) or
 (m.slug='practica' and f.slug in ('conversational-roleplay','decision-simulation','deterministic-practice'))
on conflict do nothing;

-- Ocho categorias editoriales principales.
insert into public.training_categories(slug,name,short_description,description,icon,sort_order,status,minimum_plan,is_active) values
('marketing-y-marca','Marketing y marca','Construye marcas relevantes y mensajes claros.','Entrena posicionamiento, identidad, contenido, publicidad y experiencia de marca con criterio práctico.','megaphone',1,'published','free',true),
('ventas-y-persuasion','Ventas y persuasión','Vende con claridad, escucha y ética.','Practica descubrimiento, presentación de valor, objeciones, negociación, seguimiento y cierre.','badge-dollar-sign',2,'published','free',true),
('comunicacion-profesional','Comunicación profesional','Expresa ideas con claridad e intención.','Mejora escritura, presentaciones, escucha, storytelling y conversaciones profesionales difíciles.','messages-square',3,'published','free',true),
('emprendimiento','Emprendimiento','Convierte oportunidades en negocios validados.','Entrena investigación, validación, oferta, modelo de negocio, canales, precios y operaciones iniciales.','rocket',4,'published','free',true),
('estrategia-y-toma-de-decisiones','Estrategia y toma de decisiones','Decide mejor bajo restricciones reales.','Desarrolla priorización, análisis competitivo, resolución de problemas, métricas y ejecución estratégica.','git-branch',5,'published','free',true),
('liderazgo-y-gestion-de-equipos','Liderazgo y gestión de equipos','Lidera conversaciones, decisiones y desempeño.','Practica delegación, feedback, motivación, reuniones, conflictos, cultura y contratación.','users',6,'published','free',true),
('finanzas-y-criterio-economico','Finanzas y criterio económico','Comprende números para decidir con criterio.','Entrena flujo de caja, costos, márgenes, presupuestos, inversión, riesgo y rentabilidad.','chart-no-axes-combined',7,'published','free',true),
('productividad-y-desarrollo-personal-aplicado','Productividad y desarrollo personal aplicado','Crea sistemas personales que sí se sostienen.','Convierte objetivos en hábitos, enfoque, energía, aprendizaje y ejecución consistente.','calendar-check',8,'published','free',true)
on conflict(slug) do update set name=excluded.name,short_description=excluded.short_description,description=excluded.description,icon=excluded.icon,sort_order=excluded.sort_order,status='published',is_active=true;

-- Conserva el contenido previo, pero lo integra en la taxonomia oficial.
update public.training_skills set category_id=(select id from public.training_categories where slug='marketing-y-marca')
where category_id=(select id from public.training_categories where slug='marketing');
update public.training_skills set category_id=(select id from public.training_categories where slug='productividad-y-desarrollo-personal-aplicado')
where category_id=(select id from public.training_categories where slug='desarrollo-personal');
update public.training_skills set category_id=(select id from public.training_categories where slug='liderazgo-y-gestion-de-equipos')
where category_id=(select id from public.training_categories where slug='liderazgo');
update public.training_skills set category_id=(select id from public.training_categories where slug='finanzas-y-criterio-economico')
where category_id=(select id from public.training_categories where slug='finanzas');
update public.training_templates set category_id=(select id from public.training_categories where slug='marketing-y-marca')
where category_id=(select id from public.training_categories where slug='marketing');
update public.training_templates set category_id=(select id from public.training_categories where slug='productividad-y-desarrollo-personal-aplicado')
where category_id=(select id from public.training_categories where slug='desarrollo-personal');
update public.training_templates set category_id=(select id from public.training_categories where slug='liderazgo-y-gestion-de-equipos')
where category_id=(select id from public.training_categories where slug='liderazgo');
update public.training_templates set category_id=(select id from public.training_categories where slug='finanzas-y-criterio-economico')
where category_id=(select id from public.training_categories where slug='finanzas');
update public.training_categories set status='archived',is_active=false
where slug in ('marketing','desarrollo-personal','liderazgo','finanzas');

-- Subcategorias oficiales. Se insertan por nombre de categoria para conservar IDs existentes.
with source(category_slug,items) as (values
('marketing-y-marca',array['Branding','Identidad visual','Posicionamiento','Propuesta de valor','Segmentación','Psicología del consumidor','Publicidad','Contenido','Copywriting','Embudos','Experiencia de marca']),
('ventas-y-persuasion',array['Prospección','Descubrimiento de necesidades','Presentación de valor','Manejo de objeciones','Negociación comercial','Seguimiento','Cierre','Ventas escritas','Ventas consultivas','Persuasión ética']),
('comunicacion-profesional',array['Escritura profesional','Comunicación clara','Storytelling','Presentaciones','Mensajería','Conversaciones difíciles','Persuasión','Escucha','Comunicación ejecutiva','Comunicación digital']),
('emprendimiento',array['Detección de oportunidades','Validación','Investigación de clientes','Modelo de negocio','Producto mínimo viable','Oferta','Precios','Canales','Crecimiento','Operaciones iniciales']),
('estrategia-y-toma-de-decisiones',array['Priorización','Pensamiento estratégico','Análisis competitivo','Posicionamiento estratégico','Modelos mentales','Resolución de problemas','Riesgo','Decisiones bajo incertidumbre','Métricas','Ejecución']),
('liderazgo-y-gestion-de-equipos',array['Delegación','Feedback','Motivación','Cultura','Reuniones','Conflictos','Desempeño','Comunicación de liderazgo','Toma de decisiones','Contratación']),
('finanzas-y-criterio-economico',array['Finanzas personales','Flujo de caja','Costos','Márgenes','Presupuestos','Precios','Inversión','Riesgo financiero','Rentabilidad','Métricas financieras']),
('productividad-y-desarrollo-personal-aplicado',array['Hábitos','Disciplina','Enfoque','Gestión del tiempo','Sistemas','Energía','Aprendizaje','Toma de decisiones personal','Autoconocimiento','Ejecución'])
), expanded as (
 select c.id category_id, item name, ord::int sort_order,
   s.category_slug||'-'||trim(both '-' from regexp_replace(lower(translate(item,'áéíóúüñ','aeiouun')),'[^a-z0-9]+','-','g')) slug
 from source s join public.training_categories c on c.slug=s.category_slug,
 unnest(s.items) with ordinality as x(item,ord)
)
insert into public.training_subcategories(category_id,slug,name,description,sort_order,status)
select category_id,slug,name,'Área de práctica de '||name||'.',sort_order,'published' from expanded
on conflict(slug) do update set category_id=excluded.category_id,name=excluded.name,sort_order=excluded.sort_order,status='published';

-- Cinco habilidades medibles por categoria. Cada fila incluye tres conceptos base originales.
with skill_seed(category_slug,subcategory_name,skill_name,objectives,concepts) as (values
('marketing-y-marca','Branding','Evaluar coherencia de marca',array['Reconocer señales consistentes','Diagnosticar rupturas de identidad'],array['Coherencia visual','Consistencia verbal','Reconocimiento de marca']),
('marketing-y-marca','Propuesta de valor','Identificar una propuesta de valor débil',array['Distinguir beneficio y característica','Detectar falta de especificidad'],array['Relevancia para el cliente','Diferenciación clara','Resultado observable']),
('marketing-y-marca','Identidad visual','Analizar jerarquía visual',array['Reconocer prioridades visuales','Justificar cambios de composición'],array['Contraste funcional','Orden de lectura','Legibilidad']),
('marketing-y-marca','Copywriting','Escribir titulares claros',array['Reducir ambigüedad','Conectar promesa y audiencia'],array['Promesa principal','Especificidad','Claridad inmediata']),
('marketing-y-marca','Propuesta de valor','Diseñar una oferta',array['Combinar valor y riesgo','Definir una acción clara'],array['Valor percibido','Reducción de riesgo','Llamada a la acción']),
('ventas-y-persuasion','Descubrimiento de necesidades','Hacer preguntas de descubrimiento',array['Abrir conversaciones útiles','Profundizar sin dirigir'],array['Pregunta abierta','Impacto del problema','Prioridad del cliente']),
('ventas-y-persuasion','Manejo de objeciones','Responder objeciones',array['Aclarar antes de responder','Reencuadrar con evidencia'],array['Objeción real','Pregunta de clarificación','Reencuadre']),
('ventas-y-persuasion','Presentación de valor','Defender precio',array['Conectar precio y resultado','Evitar descuentos prematuros'],array['Valor percibido','Coste de inacción','Diferenciación']),
('ventas-y-persuasion','Seguimiento','Escribir seguimiento',array['Mantener contexto','Proponer siguiente paso'],array['Recapitulación','Próximo paso','Persistencia útil']),
('ventas-y-persuasion','Cierre','Cerrar sin presión',array['Confirmar disposición','Facilitar una decisión'],array['Señal de compra','Compromiso claro','Cierre ético']),
('comunicacion-profesional','Escritura profesional','Escribir con claridad',array['Eliminar ruido','Ordenar ideas'],array['Idea principal','Estructura','Economía verbal']),
('comunicacion-profesional','Comunicación clara','Resumir ideas',array['Conservar lo esencial','Adaptar la extensión'],array['Síntesis','Jerarquía de información','Contexto mínimo']),
('comunicacion-profesional','Mensajería','Adaptar tono',array['Reconocer contexto','Ajustar formalidad'],array['Intención','Registro','Empatía']),
('comunicacion-profesional','Conversaciones difíciles','Responder mensajes difíciles',array['Regular la respuesta','Resolver sin escalar'],array['Validación','Límite claro','Próximo paso']),
('comunicacion-profesional','Presentaciones','Presentar una idea',array['Construir una narrativa','Cerrar con una petición'],array['Apertura','Argumento','Cierre']),
('emprendimiento','Detección de oportunidades','Evaluar una oportunidad',array['Identificar dolor real','Estimar atractivo inicial'],array['Problema relevante','Cliente específico','Ventana de oportunidad']),
('emprendimiento','Validación','Diseñar una hipótesis',array['Redactar supuestos verificables','Definir evidencia'],array['Supuesto crítico','Métrica de validación','Umbral de decisión']),
('emprendimiento','Investigación de clientes','Crear entrevistas',array['Evitar sesgos','Obtener hechos'],array['Pregunta neutral','Comportamiento pasado','Señal de demanda']),
('emprendimiento','Producto mínimo viable','Elegir un MVP',array['Reducir alcance','Probar el riesgo principal'],array['Hipótesis central','Prototipo mínimo','Aprendizaje válido']),
('emprendimiento','Oferta','Validar una oferta',array['Probar disposición','Interpretar señales'],array['Promesa','Compromiso','Evidencia comercial']),
('estrategia-y-toma-de-decisiones','Priorización','Priorizar',array['Comparar impacto y esfuerzo','Explicitar renuncias'],array['Impacto','Costo de oportunidad','Secuencia']),
('estrategia-y-toma-de-decisiones','Resolución de problemas','Identificar causa raíz',array['Separar síntoma y causa','Probar explicaciones'],array['Síntoma','Causa raíz','Evidencia']),
('estrategia-y-toma-de-decisiones','Riesgo','Evaluar riesgos',array['Estimar probabilidad e impacto','Diseñar mitigaciones'],array['Probabilidad','Impacto','Mitigación']),
('estrategia-y-toma-de-decisiones','Decisiones bajo incertidumbre','Comparar alternativas',array['Definir criterios','Evitar falsa precisión'],array['Criterio','Escenario','Reversibilidad']),
('estrategia-y-toma-de-decisiones','Métricas','Interpretar métricas',array['Leer tendencias','Evitar métricas vanidosas'],array['Señal','Tendencia','Decisión asociada']),
('liderazgo-y-gestion-de-equipos','Feedback','Dar feedback',array['Describir conductas','Acordar mejora'],array['Observación','Impacto','Acuerdo']),
('liderazgo-y-gestion-de-equipos','Delegación','Delegar',array['Definir resultado','Ajustar autonomía'],array['Resultado esperado','Autoridad','Seguimiento']),
('liderazgo-y-gestion-de-equipos','Conflictos','Resolver conflictos',array['Separar posiciones e intereses','Construir acuerdos'],array['Interés','Tensión','Acuerdo verificable']),
('liderazgo-y-gestion-de-equipos','Desempeño','Comunicar expectativas',array['Definir estándares','Confirmar comprensión'],array['Estándar','Evidencia','Responsabilidad']),
('liderazgo-y-gestion-de-equipos','Reuniones','Liderar reuniones',array['Preparar decisiones','Cerrar compromisos'],array['Objetivo','Agenda','Compromiso']),
('finanzas-y-criterio-economico','Flujo de caja','Interpretar flujo de caja',array['Distinguir utilidad y caja','Anticipar faltantes'],array['Entrada de efectivo','Salida de efectivo','Ciclo de caja']),
('finanzas-y-criterio-economico','Márgenes','Calcular margen',array['Relacionar precio y costo','Interpretar el resultado'],array['Ingreso','Costo variable','Margen de contribución']),
('finanzas-y-criterio-economico','Rentabilidad','Evaluar rentabilidad',array['Comparar retorno y recursos','Reconocer horizonte'],array['Retorno','Capital empleado','Horizonte']),
('finanzas-y-criterio-economico','Presupuestos','Priorizar gastos',array['Proteger lo esencial','Evaluar retorno esperado'],array['Gasto esencial','Inversión','Recorte reversible']),
('finanzas-y-criterio-economico','Precios','Analizar precios',array['Estimar sensibilidad','Relacionar precio y valor'],array['Precio de referencia','Elasticidad','Unidad económica']),
('productividad-y-desarrollo-personal-aplicado','Hábitos','Diseñar hábitos',array['Reducir la acción inicial','Crear señales'],array['Señal','Respuesta mínima','Recompensa']),
('productividad-y-desarrollo-personal-aplicado','Sistemas','Reducir fricción',array['Detectar obstáculos','Rediseñar el entorno'],array['Fricción','Entorno','Automatización']),
('productividad-y-desarrollo-personal-aplicado','Gestión del tiempo','Priorizar tareas',array['Distinguir urgencia e impacto','Limitar trabajo activo'],array['Impacto','Urgencia','Trabajo en curso']),
('productividad-y-desarrollo-personal-aplicado','Sistemas','Crear sistemas',array['Convertir metas en procesos','Medir consistencia'],array['Proceso repetible','Indicador de proceso','Revisión']),
('productividad-y-desarrollo-personal-aplicado','Enfoque','Mantener enfoque',array['Proteger atención','Recuperar concentración'],array['Bloque de enfoque','Distracción','Ritual de retorno'])
), inserted as (
 insert into public.training_skills(category_id,subcategory_id,slug,name,description,learning_objectives,initial_difficulty,maximum_difficulty,status,minimum_plan,compatible_formats,compatible_exercise_types,is_active)
 select c.id,s.id,trim(both '-' from regexp_replace(lower(translate(ss.skill_name,'áéíóúüñ','aeiouun')),'[^a-z0-9]+','-','g')),ss.skill_name,
   'Habilidad práctica para '||lower(ss.skill_name)||'.',ss.objectives,'beginner','advanced','published','free',
   array['deterministic-practice','case-analysis','written-response'],array['single_choice','scenario','open_response'],true
 from skill_seed ss join public.training_categories c on c.slug=ss.category_slug
 join public.training_subcategories s on s.category_id=c.id and s.name=ss.subcategory_name
 on conflict(slug) do update set category_id=excluded.category_id,subcategory_id=excluded.subcategory_id,name=excluded.name,learning_objectives=excluded.learning_objectives,status='published',is_active=true
 returning id,slug,name
)
select count(*) from inserted;

-- Tres conceptos editoriales por cada habilidad sembrada.
with concept_seed(skill_name,concepts) as (values
('Evaluar coherencia de marca',array['Coherencia visual','Consistencia verbal','Reconocimiento de marca']),('Identificar una propuesta de valor débil',array['Relevancia para el cliente','Diferenciación clara','Resultado observable']),('Analizar jerarquía visual',array['Contraste funcional','Orden de lectura','Legibilidad']),('Escribir titulares claros',array['Promesa principal','Especificidad','Claridad inmediata']),('Diseñar una oferta',array['Valor percibido','Reducción de riesgo','Llamada a la acción']),
('Hacer preguntas de descubrimiento',array['Pregunta abierta','Impacto del problema','Prioridad del cliente']),('Responder objeciones',array['Objeción real','Pregunta de clarificación','Reencuadre']),('Defender precio',array['Valor percibido','Coste de inacción','Diferenciación']),('Escribir seguimiento',array['Recapitulación','Próximo paso','Persistencia útil']),('Cerrar sin presión',array['Señal de compra','Compromiso claro','Cierre ético']),
('Escribir con claridad',array['Idea principal','Estructura','Economía verbal']),('Resumir ideas',array['Síntesis','Jerarquía de información','Contexto mínimo']),('Adaptar tono',array['Intención','Registro','Empatía']),('Responder mensajes difíciles',array['Validación','Límite claro','Próximo paso']),('Presentar una idea',array['Apertura','Argumento','Cierre']),
('Evaluar una oportunidad',array['Problema relevante','Cliente específico','Ventana de oportunidad']),('Diseñar una hipótesis',array['Supuesto crítico','Métrica de validación','Umbral de decisión']),('Crear entrevistas',array['Pregunta neutral','Comportamiento pasado','Señal de demanda']),('Elegir un MVP',array['Hipótesis central','Prototipo mínimo','Aprendizaje válido']),('Validar una oferta',array['Promesa','Compromiso','Evidencia comercial']),
('Priorizar',array['Impacto','Costo de oportunidad','Secuencia']),('Identificar causa raíz',array['Síntoma','Causa raíz','Evidencia']),('Evaluar riesgos',array['Probabilidad','Impacto','Mitigación']),('Comparar alternativas',array['Criterio','Escenario','Reversibilidad']),('Interpretar métricas',array['Señal','Tendencia','Decisión asociada']),
('Dar feedback',array['Observación','Impacto','Acuerdo']),('Delegar',array['Resultado esperado','Autoridad','Seguimiento']),('Resolver conflictos',array['Interés','Tensión','Acuerdo verificable']),('Comunicar expectativas',array['Estándar','Evidencia','Responsabilidad']),('Liderar reuniones',array['Objetivo','Agenda','Compromiso']),
('Interpretar flujo de caja',array['Entrada de efectivo','Salida de efectivo','Ciclo de caja']),('Calcular margen',array['Ingreso','Costo variable','Margen de contribución']),('Evaluar rentabilidad',array['Retorno','Capital empleado','Horizonte']),('Priorizar gastos',array['Gasto esencial','Inversión','Recorte reversible']),('Analizar precios',array['Precio de referencia','Elasticidad','Unidad económica']),
('Diseñar hábitos',array['Señal','Respuesta mínima','Recompensa']),('Reducir fricción',array['Fricción','Entorno','Automatización']),('Priorizar tareas',array['Impacto','Urgencia','Trabajo en curso']),('Crear sistemas',array['Proceso repetible','Indicador de proceso','Revisión']),('Mantener enfoque',array['Bloque de enfoque','Distracción','Ritual de retorno'])
), expanded as (
 select s.id skill_id,concept_name,ord,
  s.slug||'-'||trim(both '-' from regexp_replace(lower(translate(concept_name,'áéíóúüñ','aeiouun')),'[^a-z0-9]+','-','g')) slug
 from concept_seed cs join public.training_skills s on s.name=cs.skill_name,
 unnest(cs.concepts) with ordinality as x(concept_name,ord)
)
insert into public.training_concepts(skill_id,slug,name,description,difficulty,is_active,editorial_summary,explanation,common_mistakes,approved_examples,recommended_cognitive_level,compatible_formats,status)
select skill_id,slug,concept_name,'Unidad práctica sobre '||lower(concept_name)||'.','intermediate',true,
 'Idea esencial para aplicar '||lower(concept_name)||'.','Se aprende al reconocerla, explicarla y usarla en una decisión concreta.',
 jsonb_build_array('Aplicarlo sin contexto','Confundir la señal con el resultado'),jsonb_build_array('Caso editorial breve y original'),
 case ord when 1 then 'understanding' when 2 then 'application' else 'analysis' end,
 array['deterministic-practice','case-analysis','written-response'],'published'
from expanded on conflict(slug) do update set name=excluded.name,editorial_summary=excluded.editorial_summary,explanation=excluded.explanation,status='published',is_active=true;

-- Ocho rutas practicas. Los modulos se completan con ejercicios editoriales publicados.
insert into public.training_learning_paths(slug,name,promise,description,expected_outcome,estimated_minutes,difficulty,minimum_plan,status) values
('aprende-a-vender','Aprende a vender','Conduce una conversación comercial con claridad y sin presión.','Ruta para descubrir necesidades, presentar valor, responder objeciones y acordar próximos pasos.','Una conversación de venta estructurada y ética.',55,'beginner','free','published'),
('construye-una-marca-fuerte','Construye una marca fuerte','Convierte una propuesta en una identidad coherente y reconocible.','Ruta de posicionamiento, propuesta de valor, identidad y mensajes de marca.','Un criterio claro para evaluar y construir marca.',60,'intermediate','free','published'),
('lanza-tu-primera-idea','Lanza tu primera idea','Valida una oportunidad antes de invertir de más.','Ruta para investigar clientes, formular hipótesis, elegir un MVP y probar una oferta.','Una prueba de mercado pequeña y medible.',65,'beginner','free','published'),
('habla-y-escribe-con-claridad','Habla y escribe con claridad','Expresa decisiones e ideas para que otros puedan actuar.','Ruta práctica de síntesis, tono, estructura y presentaciones.','Mensajes breves, claros y adecuados al contexto.',50,'beginner','free','published'),
('lidera-mejores-conversaciones','Lidera mejores conversaciones','Da feedback, delega y resuelve tensiones con acuerdos claros.','Ruta para conversaciones de liderazgo con práctica progresiva.','Conversaciones difíciles conducidas con respeto y responsabilidad.',70,'intermediate','pro','published'),
('mejora-tu-criterio-de-negocio','Mejora tu criterio de negocio','Compara opciones y toma decisiones con mejores preguntas.','Ruta de causa raíz, riesgo, métricas, priorización y escenarios.','Decisiones justificadas con criterios explícitos.',65,'intermediate','free','published'),
('domina-tus-finanzas-empresariales','Domina tus finanzas empresariales','Lee los números esenciales antes de decidir.','Ruta de caja, margen, rentabilidad, presupuesto y precios.','Un diagnóstico financiero sencillo y accionable.',70,'intermediate','pro','published'),
('crea-sistemas-para-ejecutar-mejor','Crea sistemas para ejecutar mejor','Convierte objetivos en procesos que puedas sostener.','Ruta de hábitos, fricción, enfoque, priorización y revisión.','Un sistema personal de ejecución con métricas de proceso.',50,'beginner','free','published')
on conflict(slug) do update set name=excluded.name,promise=excluded.promise,description=excluded.description,expected_outcome=excluded.expected_outcome,estimated_minutes=excluded.estimated_minutes,difficulty=excluded.difficulty,minimum_plan=excluded.minimum_plan,status='published';

with path_modules(path_slug,titles) as (values
('aprende-a-vender',array['Descubre','Presenta valor','Responde y acuerda']),
('construye-una-marca-fuerte',array['Define','Alinea','Evalúa']),
('lanza-tu-primera-idea',array['Investiga','Prueba','Decide']),
('habla-y-escribe-con-claridad',array['Ordena','Adapta','Comunica']),
('lidera-mejores-conversaciones',array['Prepara','Conversa','Da seguimiento']),
('mejora-tu-criterio-de-negocio',array['Diagnostica','Compara','Decide']),
('domina-tus-finanzas-empresariales',array['Comprende','Calcula','Decide']),
('crea-sistemas-para-ejecutar-mejor',array['Diseña','Protege','Revisa'])
), expanded as (
 select p.id path_id,title,ord::int sort_order,ceil(p.estimated_minutes/3.0)::int minutes,p.minimum_plan
 from path_modules pm join public.training_learning_paths p on p.slug=pm.path_slug,
 unnest(pm.titles) with ordinality as x(title,ord)
)
insert into public.training_learning_path_modules(path_id,title,description,sort_order,estimated_minutes,minimum_plan,status)
select path_id,title,'Módulo práctico: '||lower(title)||'.',sort_order,minutes,minimum_plan,'published' from expanded
on conflict(path_id,sort_order) do update set title=excluded.title,description=excluded.description,estimated_minutes=excluded.estimated_minutes,minimum_plan=excluded.minimum_plan,status='published';

-- Relaciones de rutas con categorias y habilidades por afinidad editorial.
insert into public.training_path_categories(path_id,category_id)
select p.id,c.id from public.training_learning_paths p join public.training_categories c on
 (p.slug='aprende-a-vender' and c.slug='ventas-y-persuasion') or
 (p.slug='construye-una-marca-fuerte' and c.slug='marketing-y-marca') or
 (p.slug='lanza-tu-primera-idea' and c.slug='emprendimiento') or
 (p.slug='habla-y-escribe-con-claridad' and c.slug='comunicacion-profesional') or
 (p.slug='lidera-mejores-conversaciones' and c.slug='liderazgo-y-gestion-de-equipos') or
 (p.slug='mejora-tu-criterio-de-negocio' and c.slug='estrategia-y-toma-de-decisiones') or
 (p.slug='domina-tus-finanzas-empresariales' and c.slug='finanzas-y-criterio-economico') or
 (p.slug='crea-sistemas-para-ejecutar-mejor' and c.slug='productividad-y-desarrollo-personal-aplicado')
on conflict do nothing;
insert into public.training_path_skills(path_id,skill_id,sort_order)
select pc.path_id,s.id,row_number() over(partition by pc.path_id order by s.created_at)::int
from public.training_path_categories pc join public.training_skills s on s.category_id=pc.category_id
on conflict do nothing;

-- Una práctica determinista original por habilidad garantiza un catálogo utilizable.
with first_concept as (
  select distinct on (skill_id) id,skill_id,name from public.training_concepts
  where status='published' order by skill_id,created_at
), created as (
  insert into public.training_exercises(
    skill_id,concept_id,type,title,prompt,instruction,difficulty,estimated_seconds,
    hint,explanation,content,status,cognitive_level,minimum_plan
  )
  select s.id,c.id,'single_choice','Práctica: '||s.name,
    '¿Qué acción demuestra mejor la habilidad de '||lower(s.name)||'?',
    'Elige la opción que aplica el concepto con un criterio observable.',
    'beginner',75,'Busca una acción específica que permita aprender o decidir.',
    'La mejor opción convierte el concepto en una acción concreta y verificable.',
    jsonb_build_object('options',jsonb_build_array(
      jsonb_build_object('id','apply','label','Definir una acción concreta y comprobar su resultado.'),
      jsonb_build_object('id','assume','label','Confiar en una impresión sin buscar evidencia.'),
      jsonb_build_object('id','delay','label','Posponer la decisión sin definir el siguiente paso.')
    )),'published','application','free'
  from public.training_skills s join first_concept c on c.skill_id=s.id
  where s.status='published' and not exists(
    select 1 from public.training_exercises e where e.skill_id=s.id and e.title='Práctica: '||s.name
  ) returning id
)
insert into public.training_exercise_evaluation_rules(exercise_id,evaluation_config)
select id,'{"correctOptionId":"apply"}'::jsonb from created on conflict(exercise_id) do nothing;

insert into public.training_exercise_formats(exercise_id,format_id,is_primary)
select e.id,f.id,true from public.training_exercises e cross join public.training_formats f
where e.title like 'Práctica:%' and f.slug='deterministic-practice'
on conflict(exercise_id,format_id) do update set is_primary=true;

-- Casos y mensajes originales; la evaluación escrita usa el sistema de IA existente.
with targets as (
 select s.id skill_id,c.id concept_id,s.slug from public.training_skills s
 join lateral(select id from public.training_concepts where skill_id=s.id order by created_at limit 1)c on true
 where s.slug in('responder-objeciones','escribir-con-claridad','evaluar-una-oportunidad')
), created as (
 insert into public.training_exercises(skill_id,concept_id,type,title,prompt,instruction,difficulty,estimated_seconds,hint,explanation,content,status,cognitive_level,minimum_plan,evaluation_mode,minimum_response_length,maximum_response_length,allow_revision,max_revisions)
 select skill_id,concept_id,
  case slug when 'responder-objeciones' then 'objection_response' when 'escribir-con-claridad' then 'email_rewrite' else 'scenario' end,
  case slug when 'responder-objeciones' then 'Responde una objeción de precio' when 'escribir-con-claridad' then 'Aclara este correo' else 'Evalúa una oportunidad' end,
  case slug when 'responder-objeciones' then 'Un cliente responde: "Su propuesta parece útil, pero ahora mismo está muy cara". ¿Cómo responderías?' when 'escribir-con-claridad' then 'Reescribe un correo que mezcla contexto, decisión y petición para que el siguiente paso sea evidente.' else 'Una comunidad profesional repite manualmente una tarea costosa cada semana. ¿Cuál es la primera prueba adecuada?' end,
  'Responde con claridad, contexto suficiente y un siguiente paso verificable.','intermediate',180,
  'Evita asumir. Aclara, concreta y propone una acción.','Una respuesta sólida conecta contexto, criterio y próximo paso.',
  case when slug='evaluar-una-oportunidad' then '{"context":"La necesidad se repite, pero todavía no existe evidencia de pago.","options":[{"id":"interview","label":"Entrevistar y pedir un compromiso pequeño."},{"id":"build","label":"Construir el producto completo."},{"id":"ignore","label":"Esperar a tener certeza total."}],"correctOptionId":"interview","consequence":"La prueba obtiene evidencia con bajo costo.","principle":"Valida el supuesto más riesgoso primero.","practicalApplication":"Define una prueba con un umbral de decisión."}'::jsonb else jsonb_build_object('context','Caso editorial ficticio de CEOTECA.','placeholder','Escribe una respuesta breve y profesional...') end,
  'published',case when slug='evaluar-una-oportunidad' then 'analysis' else 'application' end,'free',
  case when slug='evaluar-una-oportunidad' then 'deterministic' else 'ai' end,40,800,true,1
 from targets where not exists(select 1 from public.training_exercises e where e.skill_id=targets.skill_id and e.title in('Responde una objeción de precio','Aclara este correo','Evalúa una oportunidad'))
 returning id,type
)
insert into public.training_exercise_formats(exercise_id,format_id,is_primary)
select c.id,f.id,true from created c join public.training_formats f on f.slug=case when c.type='scenario' then 'case-analysis' else 'written-response' end
on conflict do nothing;

insert into public.training_exercise_evaluation_rules(exercise_id,evaluation_config)
select e.id,'{"correctOptionId":"interview"}'::jsonb from public.training_exercises e
where e.title='Evalúa una oportunidad' on conflict(exercise_id) do nothing;

-- Ejemplo visual en borrador: no se publica hasta que el asset sea aprobado y exista en Storage.
with asset as (
 insert into public.training_visual_assets(storage_path,mime_type,width,height,alt_text,source_type,copyright_status)
 values('training/editorial/coherencia-marca-ejemplo.webp','image/webp',1200,900,'Dos composiciones editoriales ficticias para comparar coherencia visual.','editorial','needs_review')
 on conflict(storage_path) do update set alt_text=excluded.alt_text returning id
), target as (
 select s.id skill_id,c.id concept_id from public.training_skills s
 join lateral(select id from public.training_concepts where skill_id=s.id order by created_at limit 1)c on true
 where s.slug='evaluar-coherencia-de-marca'
), exercise as (
 insert into public.training_exercises(skill_id,concept_id,type,title,prompt,instruction,difficulty,estimated_seconds,hint,explanation,content,status,cognitive_level,minimum_plan,visual_alternative)
 select skill_id,concept_id,'visual_comparison','Compara coherencia visual','¿Qué composición mantiene mejor una identidad consistente?','Compara tipografía, espaciado y jerarquía. No dependas solo del color.','intermediate',120,'Revisa si las decisiones visuales se repiten con intención.','La coherencia surge de reglas consistentes, no de que todos los elementos sean iguales.',
 '{"assets":[{"id":"a","label":"Composición A","assetRef":"editorial"},{"id":"b","label":"Composición B","assetRef":"editorial"}],"options":[{"id":"a","label":"Composición A"},{"id":"b","label":"Composición B"}],"correctOptionId":"a"}'::jsonb,
 'draft','analysis','free','Dos composiciones ficticias muestran diferencias de jerarquía, tipografía y espaciado.' from target
 on conflict do nothing returning id
)
insert into public.training_exercise_assets(exercise_id,asset_id,label,sort_order)
select e.id,a.id,'Comparación editorial',1 from exercise e cross join asset a on conflict do nothing;

-- Cada módulo recibe un ejercicio publicado de una habilidad asociada a su ruta.
with ranked as (
 select m.id module_id,e.id exercise_id,
  row_number() over(partition by m.id order by e.created_at,e.id) rn
 from public.training_learning_path_modules m
 join public.training_path_skills ps on ps.path_id=m.path_id
 join public.training_exercises e on e.skill_id=ps.skill_id and e.status='published'
)
insert into public.training_learning_path_module_items(module_id,item_type,exercise_id,sort_order,is_required,minimum_mastery)
select module_id,'exercise',exercise_id,1,true,0 from ranked where rn=1
on conflict(module_id,sort_order) do nothing;

-- Inicio de ruta transaccional: el plan siempre se deriva en servidor antes de llamar este RPC.
create or replace function public.start_training_learning_path(p_user_id uuid,p_path_id uuid)
returns public.user_training_path_progress language plpgsql security definer set search_path=public as $$
declare result public.user_training_path_progress; first_module uuid;
begin
  if p_user_id is distinct from auth.uid() and auth.role()<>'service_role' then raise exception 'UNAUTHORIZED'; end if;
  select id into first_module from public.training_learning_path_modules where path_id=p_path_id and status='published' order by sort_order limit 1;
  if first_module is null then raise exception 'PATH_WITHOUT_MODULES'; end if;
  insert into public.user_training_path_progress(user_id,path_id,current_module_id)
  values(p_user_id,p_path_id,first_module)
  on conflict(user_id,path_id) do update set updated_at=now()
  returning * into result;
  insert into public.user_training_path_module_progress(user_id,module_id,status,started_at)
  values(p_user_id,first_module,'available',now()) on conflict do nothing;
  return result;
end $$;
revoke all on function public.start_training_learning_path(uuid,uuid) from public;
grant execute on function public.start_training_learning_path(uuid,uuid) to authenticated,service_role;

create or replace function public.complete_training_learning_path_module(p_user_id uuid,p_module_id uuid)
returns public.user_training_path_progress language plpgsql security definer set search_path=public as $$
declare v_path_id uuid; v_next uuid; v_total integer; v_done integer; result public.user_training_path_progress;
begin
  if p_user_id is distinct from auth.uid() and auth.role()<>'service_role' then raise exception 'UNAUTHORIZED'; end if;
  select path_id into v_path_id from public.training_learning_path_modules where id=p_module_id and status='published';
  if v_path_id is null then raise exception 'MODULE_NOT_FOUND'; end if;
  insert into public.user_training_path_module_progress(user_id,module_id,status,progress,started_at,completed_at)
  values(p_user_id,p_module_id,'completed',100,now(),now())
  on conflict(user_id,module_id) do update set status='completed',progress=100,completed_at=coalesce(user_training_path_module_progress.completed_at,now()),updated_at=now();
  select id into v_next from public.training_learning_path_modules
   where path_id=v_path_id and status='published' and sort_order>(select sort_order from public.training_learning_path_modules where id=p_module_id)
   order by sort_order limit 1;
  if v_next is not null then
    insert into public.user_training_path_module_progress(user_id,module_id,status)
    values(p_user_id,v_next,'available') on conflict do nothing;
  end if;
  select count(*) into v_total from public.training_learning_path_modules where path_id=v_path_id and status='published';
  select count(*) into v_done from public.user_training_path_module_progress ump
   join public.training_learning_path_modules m on m.id=ump.module_id
   where ump.user_id=p_user_id and m.path_id=v_path_id and ump.status='completed';
  update public.user_training_path_progress set
    progress=round(100.0*v_done/greatest(v_total,1),2),current_module_id=v_next,
    status=case when v_done>=v_total then 'completed' else 'in_progress' end,
    completed_at=case when v_done>=v_total then coalesce(completed_at,now()) else null end,updated_at=now()
  where user_id=p_user_id and path_id=v_path_id returning * into result;
  return result;
end $$;
revoke all on function public.complete_training_learning_path_module(uuid,uuid) from public;
grant execute on function public.complete_training_learning_path_module(uuid,uuid) to authenticated,service_role;

create or replace function public.update_training_cognitive_mastery()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_skill uuid; v_level text;
begin
  select e.skill_id,e.cognitive_level into v_skill,v_level
  from public.training_session_exercises se join public.training_exercises e on e.id=se.exercise_id
  where se.id=new.session_exercise_id;
  if v_skill is null then return new; end if;
  insert into public.user_skill_cognitive_mastery(user_id,skill_id,cognitive_level,mastery_score,attempts,last_practiced_at)
  values(new.user_id,v_skill,v_level,new.score,1,new.created_at)
  on conflict(user_id,skill_id,cognitive_level) do update set
    mastery_score=round((user_skill_cognitive_mastery.mastery_score*0.7)+(excluded.mastery_score*0.3),2),
    attempts=user_skill_cognitive_mastery.attempts+1,last_practiced_at=excluded.last_practiced_at,updated_at=now();
  return new;
end $$;
drop trigger if exists training_answers_cognitive_mastery on public.training_answers;
create trigger training_answers_cognitive_mastery after insert on public.training_answers for each row execute function public.update_training_cognitive_mastery();

-- Una vista agregada evita guardar porcentajes derivados y desactualizados.
create or replace view public.training_category_catalog
with (security_invoker = true) as
select c.id,c.slug,c.name,c.short_description,c.description,c.icon,c.sort_order,c.minimum_plan,
 count(distinct s.id)::int skill_count,count(distinct e.id)::int exercise_count,count(distinct pc.path_id)::int path_count
from public.training_categories c
left join public.training_skills s on s.category_id=c.id and s.status='published'
left join public.training_exercises e on e.skill_id=s.id and e.status='published'
left join public.training_path_categories pc on pc.category_id=c.id
where c.status='published' and c.is_active
group by c.id;
grant select on public.training_category_catalog to authenticated,service_role;
