# Desarrollo local

## Proyecto remoto enlazado

El esquema de Training puede aplicarse al proyecto Supabase ya enlazado sin
levantar la pila local:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Docker solo es necesario para ejecutar Supabase completamente en local. La
aplicación puede trabajar contra el proyecto remoto usando las variables de
Supabase existentes.

Para activar la fuente real de Training en desarrollo o Vercel:

```env
NEXT_PUBLIC_TRAINING_DATA_SOURCE=supabase
```

Mantén `mock` mientras se prueban componentes sin una sesión autenticada.

Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_TRAINING_DATA_SOURCE` (`mock` o `supabase`).

Comandos:

```bash
npx supabase start
npx supabase db reset
npx supabase test db
npm test
```

Usa `mock` para pruebas visuales u offline. Cambia a `supabase` solo después de aplicar `0021` y `0022`. Para revisar cambios remotos sin aplicarlos: `npx supabase db push --dry-run`.
