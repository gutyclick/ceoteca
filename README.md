# CEOTECA MVP

CEOTECA transforma libros de finanzas, hábitos, productividad, emprendimiento, psicología y desarrollo personal en experiencias interactivas de aproximadamente 15 minutos.

## Instalación

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Scripts

- `npm run dev`: servidor local.
- `npm run lint`: ESLint.
- `npm run typecheck`: TypeScript estricto.
- `npm run test`: pruebas Vitest de permisos y validación.
- `npm run build`: build de producción.

## Variables

Ver `.env.example`. En modo demo (`NEXT_PUBLIC_DEMO_MODE=true`) la app funciona sin Supabase, OpenAI ni pagos.

## Supabase

1. Crea un proyecto Supabase.
2. Configura `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
3. Ejecuta `supabase/migrations/0001_initial_schema.sql`.
4. Activa Google OAuth en Supabase Auth si lo necesitas.

## OpenAI

Configura `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL`, `OPENAI_TTS_MODEL` y `OPENAI_TTS_VOICE`. Sin clave, `/api/chat` responde con mock seguro.

## Pagos

`PAYMENTS_PROVIDER=disabled` por defecto. La interfaz `PaymentsProvider` está lista para Stripe, Paddle o Lemon Squeezy. No se simulan pagos exitosos.

## Deploy en Vercel

Importa el repositorio, añade variables de entorno y despliega. Mantén secretos solo en variables server-side.

## Demo/Pendiente

- Contenido, testimonios y métricas son demo.
- Portadas generadas con CSS, no oficiales.
- Autenticación real requiere Supabase.
- Chat real requiere OpenAI.
- Audio TTS y pagos están preparados pero pendientes de proveedor.
