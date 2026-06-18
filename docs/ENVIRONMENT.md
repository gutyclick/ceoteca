# Ceoteca — Variables de entorno

## 1. Archivo `.env.example`

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=true

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=
OPENAI_CHAT_MODEL=
OPENAI_TTS_MODEL=
OPENAI_TTS_VOICE=

PAYMENTS_PROVIDER=disabled
PAYMENTS_SECRET_KEY=
PAYMENTS_WEBHOOK_SECRET=

RATE_LIMIT_PROVIDER=memory
RATE_LIMIT_SECRET=

STORAGE_PROVIDER=disabled
STORAGE_BUCKET=
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

## 2. Variables públicas

Solo pueden exponerse al navegador:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_DEMO_MODE`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

No añadir secretos con prefijo `NEXT_PUBLIC_`.

## 3. Variables privadas

Solo servidor:

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `PAYMENTS_SECRET_KEY`
- `PAYMENTS_WEBHOOK_SECRET`
- Storage secrets.
- Rate limit secrets.

## 4. Modo demo

Cuando:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

Comportamiento:

- Auth mock.
- Books mock.
- Chat mock.
- Payments disabled.
- Progress local o mock.
- No requerir Supabase.
- No requerir OpenAI.

## 5. Validación

Crear validación central de entorno con Zod.

Separar:

- `clientEnv`
- `serverEnv`

En producción:

- Fallar temprano si falta una variable requerida para una integración habilitada.
- No exigir variables de una integración deshabilitada.

## 6. OpenAI

No fijar modelos en el código.

Usar:

```env
OPENAI_CHAT_MODEL=
OPENAI_TTS_MODEL=
OPENAI_TTS_VOICE=
```

El proveedor debe manejar ausencia de credenciales con error controlado o mock según entorno.

## 7. Pagos

Inicialmente:

```env
PAYMENTS_PROVIDER=disabled
```

La aplicación no debe simular un cobro exitoso.

Debe mostrar:

> Integración de pagos pendiente.

## 8. Vercel

Configurar variables por entorno:

- Development.
- Preview.
- Production.

No subir `.env.local` al repositorio.
