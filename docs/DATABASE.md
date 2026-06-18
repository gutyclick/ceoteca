# Ceoteca — Base de datos y Supabase

## 1. Objetivo

La base de datos debe soportar:

- Usuarios.
- Perfiles.
- Planes.
- Libros.
- Secciones.
- Progreso.
- Chat.
- Uso mensual.
- Suscripciones.
- Audio.
- Acceso por permisos.

## 2. Tablas

### `profiles`

```sql
id uuid primary key references auth.users(id) on delete cascade
full_name text
avatar_url text
plan text not null default 'free'
founder boolean not null default false
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Restricción de plan:

```sql
check (plan in ('free', 'pro', 'unlimited', 'founder'))
```

### `books`

```sql
id uuid primary key default gen_random_uuid()
slug text not null unique
title text not null
author text not null
category text not null
description text not null
cover_config jsonb not null default '{}'::jsonb
reading_time integer not null
difficulty text not null
tags text[] not null default '{}'
audio_url text
purchase_url text
is_published boolean not null default false
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

### `book_sections`

```sql
id uuid primary key default gen_random_uuid()
book_id uuid not null references books(id) on delete cascade
section_type text not null
title text not null
content jsonb not null
position integer not null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Índice único sugerido:

```sql
unique (book_id, position)
```

### `user_book_progress`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid not null references auth.users(id) on delete cascade
book_id uuid not null references books(id) on delete cascade
progress integer not null default 0
completed boolean not null default false
last_section_id uuid references book_sections(id) on delete set null
started_at timestamptz not null default now()
completed_at timestamptz
updated_at timestamptz not null default now()
```

Restricciones:

```sql
check (progress between 0 and 100)
unique (user_id, book_id)
```

### `chat_usage`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid not null references auth.users(id) on delete cascade
book_id uuid references books(id) on delete cascade
month date not null
question_count integer not null default 0
updated_at timestamptz not null default now()
```

Índice único sugerido:

```sql
unique (user_id, book_id, month)
```

Para un límite global mensual por usuario, considerar una tabla adicional `monthly_usage`.

### `chat_messages`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid not null references auth.users(id) on delete cascade
book_id uuid not null references books(id) on delete cascade
role text not null
content text not null
created_at timestamptz not null default now()
```

Restricción:

```sql
check (role in ('user', 'assistant'))
```

### `subscriptions`

```sql
id uuid primary key default gen_random_uuid()
user_id uuid not null references auth.users(id) on delete cascade
provider text not null
provider_customer_id text
provider_subscription_id text
plan text not null
status text not null
current_period_start timestamptz
current_period_end timestamptz
cancel_at_period_end boolean not null default false
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

### `audio_assets`

```sql
id uuid primary key default gen_random_uuid()
book_id uuid not null references books(id) on delete cascade
storage_path text not null
voice text
model text
duration_seconds integer
status text not null default 'pending'
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Estados:

```sql
check (status in ('pending', 'processing', 'ready', 'failed'))
```

## 3. Índices

Crear como mínimo:

```sql
create index books_category_idx on books(category);
create index books_published_idx on books(is_published);
create index books_tags_idx on books using gin(tags);
create index book_sections_book_position_idx on book_sections(book_id, position);
create index progress_user_updated_idx on user_book_progress(user_id, updated_at desc);
create index chat_messages_user_book_idx on chat_messages(user_id, book_id, created_at);
create index subscriptions_user_idx on subscriptions(user_id);
```

## 4. Timestamps

Crear función:

```sql
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

Añadir trigger a tablas con `updated_at`.

## 5. Creación automática de perfil

Crear función y trigger para `auth.users`.

Comportamiento:

- Insertar perfil al registrarse.
- Usar nombre de metadata si existe.
- Asignar plan `free`.
- No aceptar plan de pago directamente desde metadata no verificada.

## 6. Row Level Security

Activar RLS en todas las tablas con datos de usuario.

### `profiles`

- Usuario puede leer su perfil.
- Usuario puede actualizar campos permitidos de su perfil.
- No puede modificar su plan desde cliente.

### `books`

- Lectura pública solo para libros publicados.
- Escritura solo desde servidor o rol administrativo futuro.

### `book_sections`

- Lectura condicionada al acceso al libro.
- En MVP puede exponerse solo mediante servidor.
- No permitir escritura a usuarios finales.

### `user_book_progress`

- Usuario solo puede leer y escribir su propio progreso.

### `chat_usage`

- Usuario puede leer su consumo.
- Incrementos deben ejecutarse mediante función segura o servidor.

### `chat_messages`

- Usuario solo puede leer sus propios mensajes.
- Inserción preferiblemente mediante endpoint de servidor.

### `subscriptions`

- Usuario puede leer su suscripción.
- Solo webhooks o servidor pueden modificar estado.

## 7. Funciones seguras

Crear funciones RPC o transacciones para:

- Incrementar uso de chat de forma atómica.
- Marcar progreso.
- Completar libro.
- Obtener libros accesibles por plan.
- Sincronizar estado de suscripción.

## 8. Migraciones

Ubicación:

```text
supabase/migrations/
```

Orden sugerido:

1. Extensiones.
2. Tipos y tablas.
3. Índices.
4. Funciones.
5. Triggers.
6. RLS.
7. Policies.
8. Seed demo opcional.

## 9. Seeds

Los seeds no deben contener:

- Texto copiado de libros.
- Citas inventadas.
- Portadas oficiales.

Pueden contener:

- Metadatos.
- Descripciones editoriales demo.
- Configuración visual.
- Secciones placeholder originales.
