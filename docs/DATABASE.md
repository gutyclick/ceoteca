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

### `chat_usage_events`

Ledger de reservas y consumos de Chat con CEO. Cada intento usa una clave de
idempotencia única por usuario y pasa por `pending`, `consumed` o `released`.
El servidor reserva mediante `reserve_chat_usage`, confirma al primer fragmento
con `confirm_chat_usage` y libera fallos previos con `release_chat_usage`.

- El bloqueo transaccional por usuario y periodo evita sobreconsumo concurrente.
- El cliente autenticado solo puede leer sus registros mediante RLS.
- Las mutaciones se ejecutan exclusivamente con funciones protegidas para
  `service_role`.
- `chat_usage` se conserva como agregado compatible con estadísticas existentes.

### `chat_conversations`

Una conversación se crea al persistir su primer mensaje válido. Las conversaciones
generales no tienen libro; las conversaciones de libro requieren `book_id`.

```sql
id uuid primary key default gen_random_uuid()
user_id uuid not null references auth.users(id) on delete cascade
type text not null check (type in ('general', 'book'))
book_id uuid references books(id) on delete cascade
title text not null default 'Nueva conversación'
title_is_manual boolean not null default false
status text not null default 'active' check (status in ('active', 'archived'))
metadata jsonb not null default '{}'::jsonb
client_creation_key uuid
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
last_message_at timestamptz not null default now()
```

Restricciones principales:

```sql
check (
  (type = 'general' and book_id is null) or
  (type = 'book' and book_id is not null)
)
unique (user_id, client_creation_key)
```

### `chat_messages`

```sql
id uuid primary key default gen_random_uuid()
conversation_id uuid not null references chat_conversations(id) on delete cascade
user_id uuid not null references auth.users(id) on delete cascade
book_id uuid references books(id) on delete cascade
role text not null check (role in ('user', 'assistant', 'system', 'tool'))
content text not null
parts jsonb
status text not null default 'completed'
  check (status in ('pending', 'streaming', 'completed', 'stopped', 'interrupted', 'failed'))
parent_message_id uuid references chat_messages(id) on delete set null
metadata jsonb not null default '{}'::jsonb
client_message_id uuid
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

La combinación `(user_id, client_message_id)` es única cuando existe el ID de
cliente. Esto evita persistir dos veces un mensaje enviado por reintentos o doble
clic. Todas las lecturas y mutaciones deben validar `user_id` en el servidor.

Cada turno admite una sola respuesta de asistente vinculada mediante
`parent_message_id`, y cada conversación admite una sola respuesta activa en
estado `pending` o `streaming`. El contenido parcial se conserva como
`interrupted`; `stopped` se reserva para una detención voluntaria. Al cargar el
historial, las generaciones abandonadas se recuperan sin crear mensajes nuevos.

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

## 10. Adjuntos del chat

`chat_attachments` conserva metadata segura, estado de procesamiento y
la relación opcional con conversación y mensaje. `client_upload_id`
aporta idempotencia y `upload_session_id` agrupa cargas previas al envío.

`chat_attachment_extractions` mantiene el texto procesado fuera de
`chat_messages`. Solo el servidor con service role puede escribir o leer
extracciones. El usuario únicamente puede consultar metadata propia.

Los objetos viven en el bucket privado `chat-attachments`, bajo una ruta
generada por el servidor y aislada por usuario. La función
`reserve_chat_attachment` bloquea atómicamente cada sesión de carga para
aplicar cantidad y tamaño total incluso ante solicitudes concurrentes.

Retención predeterminada:

- Pro y Fundador: 30 días.
- Ilimitado: 90 días.
- Temporales sin mensaje: 24 horas.

No hay antivirus integrado. La mitigación actual usa lista cerrada de
formatos, firmas reales, bucket privado, ausencia de ejecución y
normalización de imágenes sin EXIF.
