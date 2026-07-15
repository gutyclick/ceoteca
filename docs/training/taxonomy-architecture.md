# Arquitectura de taxonomía

La jerarquía canónica es `categoría -> subcategoría -> habilidad -> concepto`. Las rutas reutilizan habilidades y categorías mediante tablas de relación; sus módulos contienen items discriminados que apuntan a un único ejercicio, habilidad, concepto, plantilla o role-play.

El código se divide en `taxonomy-model.ts` (contratos), `taxonomy-schemas.ts` (entrada), `taxonomy-repositories.ts` (persistencia), `taxonomy-services.ts` (reglas) y `taxonomy-validation.ts` (integridad editorial). Ningún componente debe consultar Supabase directamente.

Los planes se leen del sistema existente. `minimum_plan` expresa elegibilidad, pero no sustituye a suscripciones ni cuotas. El servidor resuelve visibilidad y desbloqueo.

