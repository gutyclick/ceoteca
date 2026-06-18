# Ceoteca — Prompts cortos para Codex

## 1. Auditoría

```text
Lee `AGENTS.md` y todos los documentos relevantes de `/docs`.

Inspecciona el repositorio y reporta:

1. Stack actual.
2. Estructura.
3. Archivos que deben conservarse.
4. Dependencias existentes.
5. Riesgos.
6. Plan por fases según `docs/ROADMAP.md`.

No escribas código todavía.
```

## 2. Fase 0

```text
Lee `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/ENVIRONMENT.md`
y `docs/ROADMAP.md`.

Implementa únicamente la Fase 0.

No construyas la landing, auth, Supabase, OpenAI ni pagos todavía.

Al terminar:
- ejecuta lint;
- ejecuta typecheck;
- ejecuta build;
- corrige errores;
- resume archivos modificados.
```

## 3. Sistema visual

```text
Lee `AGENTS.md` y `docs/DESIGN_SYSTEM.md`.

Implementa únicamente la Fase 1.

Crea tokens, tipografía, paleta, layouts, logo provisional SVG,
botones, tarjetas base, PublicHeader, Footer y focus accesible.

No construyas todavía las secciones completas de la landing.
Ejecuta lint, typecheck y build.
```

## 4. Landing parte 1

```text
Implementa únicamente la Fase 2 de `docs/ROADMAP.md`.

Construye:
- header responsive;
- hero;
- badge;
- CTAs;
- composición de cinco tarjetas;
- sección “Hazle preguntas al libro”;
- estadísticas demo.

No implementes la segunda mitad de la landing.
Ejecuta lint, typecheck y build.
```

## 5. Landing parte 2

```text
Implementa únicamente la Fase 3.

Añade:
- Cómo funciona;
- vista previa de libros;
- comparativa;
- testimonios demo;
- FAQ;
- CTA final;
- footer completo.

No modifiques innecesariamente el hero.
Ejecuta lint, typecheck y build.
```

## 6. Pricing

```text
Implementa únicamente la Fase 4.

Crea `/pricing` con:
- toggle mensual/anual;
- Gratis;
- Pro;
- Ilimitado;
- Fundador;
- comparativa;
- FAQ;
- CTA por plan.

Centraliza en `src/config/plans.ts`.
No implementes pagos.
Ejecuta lint, typecheck y build.
```

## 7. Auth

```text
Implementa únicamente la Fase 5.

Crea `/registro` y `/login` con React Hook Form y Zod.
Incluye modo demo, query param de plan y abstracción para Supabase.
Google OAuth solo preparado visual y técnicamente.

No conectes pagos.
Ejecuta lint, typecheck y build.
```

## 8. Biblioteca y home

```text
Implementa únicamente la Fase 6.

Crea datos mock tipados, portadas conceptuales, `/biblioteca` y `/home`.
Incluye búsqueda, filtros, carruseles, estados loading, empty y error.

No implementes todavía la página completa del libro.
Ejecuta lint, typecheck y build.
```

## 9. Página del libro

```text
Implementa únicamente la Fase 7.

Crea `/libro/[slug]` con portada conceptual, metadatos, progreso,
audio player, bloqueo por plan, análisis interactivo, actividades,
puntos clave, conclusión, disclaimer y CTA de chat.

El chat puede abrirse visualmente, sin OpenAI todavía.
Ejecuta lint, typecheck y build.
```

## 10. Chat

```text
Implementa únicamente la Fase 8.

Consulta `docs/API_SPEC.md`.

Crea ChatDrawer, historial, sugerencias, composer, estados,
`POST /api/chat`, MockAIProvider y OpenAIProvider.

Añade validación, permisos, uso mensual y rate limiting preparado.
No expongas claves.
Ejecuta lint, typecheck y build.
```

## 11. Supabase

```text
Implementa únicamente la Fase 9.

Consulta `docs/DATABASE.md`.

Añade clientes, migraciones, RLS, repositorios, auth real,
persistencia de progreso, perfil y chat.

Mantén el modo demo funcionando.
Ejecuta lint, typecheck y build.
```

## 12. Perfil y planes

```text
Implementa únicamente la Fase 10.

Crea `/perfil` y `/planes`.
Pagos deben permanecer deshabilitados.
Incluye estados de uso, plan, historial y gestión visual.

Ejecuta lint, typecheck y build.
```

## 13. QA final

```text
Ejecuta la Fase 12 usando `docs/QA_CHECKLIST.md`.

Revisa:
- accesibilidad;
- responsive;
- SEO;
- rendimiento;
- rutas;
- permisos;
- contenido legal;
- estados;
- lint;
- typecheck;
- build.

Corrige los problemas encontrados y genera un resumen final.
```
