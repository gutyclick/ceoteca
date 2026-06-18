# Ceoteca — Roadmap de desarrollo

## Regla principal

Cada fase se implementa por separado.

No avanzar a la siguiente fase sin aprobación o instrucción explícita.

## Fase 0 — Auditoría e inicialización

Objetivos:

- Inspeccionar repositorio.
- Confirmar stack.
- Configurar Next.js App Router.
- TypeScript estricto.
- Tailwind.
- Geist.
- ESLint.
- Prettier.
- Zod.
- Lucide.
- React Hook Form.
- `.env.example`.
- Estructura base.
- Modo demo.
- Configuración central.

Criterios:

- Dev funciona.
- Build funciona.
- Sin errores de TypeScript.

## Fase 1 — Sistema visual

Objetivos:

- Tokens.
- Tipografía.
- Paleta.
- Layouts.
- Logo SVG provisional.
- Botones.
- Tarjetas.
- Header público.
- Footer.
- Focus.
- Reduced motion.

No construir todavía toda la landing.

## Fase 2 — Landing, parte 1

- Header responsive.
- Hero.
- Badge.
- Titular.
- CTAs.
- Cinco tarjetas visuales.
- Demo “Hazle preguntas al libro”.
- Estadísticas demo.

## Fase 3 — Landing, parte 2

- Cómo funciona.
- Vista previa de libros.
- Comparativa.
- Testimonios demo.
- FAQ.
- CTA final.
- Footer completo.

## Fase 4 — Pricing

- Toggle mensual/anual.
- Gratis.
- Pro.
- Ilimitado.
- Fundador.
- Comparativa.
- FAQ.
- CTA por plan.
- Configuración central.

## Fase 5 — Registro y login

- Formularios.
- Zod.
- React Hook Form.
- Query param de plan.
- Google OAuth preparado.
- Modo demo.
- Abstracción Supabase.
- Estados.

## Fase 6 — Biblioteca y home

- Datos mock.
- Portadas conceptuales.
- Home privada.
- Hero destacado.
- Carruseles.
- Buscador.
- Filtros.
- Estados vacíos y errores.
- Biblioteca pública parcial.

## Fase 7 — Página del libro

- Hero del libro.
- Metadatos.
- Progreso.
- Audio player.
- Bloqueo por plan.
- Análisis interactivo.
- Puntos clave.
- Conclusión.
- Disclaimer.
- CTA de chat.

## Fase 8 — Chat

- Drawer.
- Composer.
- Historial.
- Sugerencias.
- Endpoint.
- Mock provider.
- OpenAI provider.
- Validación.
- Rate limiting preparado.
- Control de plan.
- Uso mensual.

## Fase 9 — Supabase

- Clientes.
- Auth real.
- Migraciones.
- RLS.
- Repositorios.
- Persistencia de progreso.
- Persistencia de chat.
- Perfil automático.

## Fase 10 — Perfil y planes

- Perfil.
- Historial.
- Uso.
- Configuración.
- Plan actual.
- Upgrade/downgrade visual.
- Proveedor de pagos deshabilitado.

## Fase 11 — Pagos

Solo cuando se defina proveedor:

- Checkout.
- Portal.
- Webhooks.
- Sincronización.
- Seguridad.
- Estados de suscripción.

## Fase 12 — SEO, QA y rendimiento

- Metadata.
- Open Graph.
- Sitemap.
- Robots.
- JSON-LD.
- Accesibilidad.
- Rendimiento.
- Pruebas.
- Error boundaries.
- Revisión móvil.
- Build final.

## Plantilla de prompt por fase

```text
Lee `AGENTS.md` y la documentación relevante de `/docs`.

Implementa únicamente la Fase X descrita en `docs/ROADMAP.md`.

No avances a otra fase.
No reestructures archivos ajenos salvo que sea imprescindible.
Mantén modo demo funcional.
Ejecuta lint, typecheck y build.
Corrige todos los errores antes de terminar.

Al finalizar, resume:
- archivos modificados;
- decisiones técnicas;
- funcionalidades demo;
- pendientes reales.
```
