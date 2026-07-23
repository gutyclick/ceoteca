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

## 9. Supabase Auth y Resend

### Variables

En producción, `NEXT_PUBLIC_SITE_URL` debe ser:

```env
NEXT_PUBLIC_SITE_URL=https://www.ceoteca.com
```

`RESEND_API_KEY` se usa solo como secreto SMTP en Supabase local o en el panel de Supabase. No debe exponerse al cliente ni llevar prefijo `NEXT_PUBLIC_`.

### Resend

1. Verificar el dominio de envío en Resend.
2. Configurar los registros DNS que Resend indique para SPF, DKIM y tracking si aplica.
3. Crear una API key para SMTP.
4. Usar un remitente del dominio verificado, por ejemplo:

```txt
Ceoteca <no-reply@ceoteca.com>
```

### Supabase Auth

En Supabase Dashboard configurar:

- Auth > URL Configuration > Site URL: `https://www.ceoteca.com`
- Auth > URL Configuration > Redirect URLs:
  - `https://www.ceoteca.com/auth/callback`
  - `https://www.ceoteca.com/nueva-password`

En Auth > SMTP Settings:

- Host: `smtp.resend.com`
- Port: `587`
- Username: `resend`
- Password: API key de Resend
- Sender email: `no-reply@ceoteca.com`
- Sender name: `Ceoteca`

En Auth > Email Templates:

- Confirm signup:
  - Subject: `Confirma tu cuenta en Ceoteca`
  - Template source: `supabase/templates/confirm_signup.html`
- Reset password:
  - Subject: `Restablece tu contraseña de Ceoteca`
  - Template source: `supabase/templates/recovery.html`

Las plantillas usan `{{ .ConfirmationURL }}` para que Supabase genere el enlace seguro. En producción, Supabase hosted no toma estas plantillas con `db push`; hay que pegarlas en el Dashboard o sincronizarlas con la Management API.

### Flujos esperados

- Registro con correo: envía confirmación y, al confirmar, vuelve por `/auth/callback`.
- Reenvío de confirmación: usa `/auth/callback?next=/planes`.
- Recuperación de contraseña: envía al usuario a `/nueva-password`.
- Google OAuth: vuelve por `/auth/callback` y la app decide si va a `/planes` o `/home`.

## 10. Limpieza de adjuntos

Definir `CRON_SECRET` en Vercel para autorizar la limpieza de cargas
temporales. `vercel.json` invoca diariamente
`/api/cron/chat-attachments`; el endpoint utiliza el mismo secreto que
el cron de recordatorios.
