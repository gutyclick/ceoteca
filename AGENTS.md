# Ceoteca — Instrucciones para agentes de código

## Propósito

Ceoteca es una plataforma web en español que transforma libros de finanzas, hábitos, productividad, emprendimiento, psicología, liderazgo y desarrollo personal en experiencias de aprendizaje interactivas de aproximadamente 15 minutos.

Propuesta de valor principal:

> Aprende las mejores ideas del mundo en 15 minutos.

El producto permite:

- Explorar una biblioteca de análisis editoriales propios.
- Leer experiencias interactivas.
- Completar actividades y ejercicios.
- Escuchar versiones en audio según el plan.
- Conversar con un asistente de IA limitado al contenido autorizado de cada análisis.

## Stack obligatorio

- Next.js con App Router.
- React.
- TypeScript estricto.
- Tailwind CSS.
- Supabase para base de datos, autenticación y sesiones.
- OpenAI API para chat y TTS.
- Vercel para despliegue.
- Zod para validación.
- React Hook Form para formularios.
- Lucide React para iconos.
- `next/font` para tipografías.

No crear un backend separado.

## Reglas generales

- Inspecciona el repositorio antes de modificarlo.
- Conserva código existente que siga siendo útil.
- Trabaja únicamente en la tarea solicitada.
- No avances a fases posteriores sin indicación explícita.
- Usa Server Components por defecto.
- Usa Client Components solo cuando exista interacción.
- No uses `any` salvo justificación técnica documentada.
- No construyas páginas monolíticas.
- Extrae componentes y lógica reutilizable.
- Mantén la interfaz visible completamente en español.
- Los nombres internos del código pueden estar en inglés.
- Centraliza la configuración de planes, navegación, permisos y sitio.
- No expongas secretos al cliente.
- Valida entradas en servidor con Zod.
- Verifica permisos en servidor; no confíes en valores enviados por el cliente.
- Implementa estados de loading, success, error, empty, locked y unauthorized.
- El proyecto debe funcionar sin credenciales externas mediante modo demo.
- No afirmes que una integración funciona si continúa simulada.
- Al terminar cada tarea, ejecuta lint, typecheck y build.
- Corrige los errores encontrados antes de finalizar.

## Modo demo

Usar:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

En modo demo:

- Debe existir una sesión de usuario simulada.
- La biblioteca debe ser navegable.
- El buscador y los filtros deben funcionar.
- La página de libro debe mostrar contenido demo.
- El chat debe devolver respuestas mock.
- Los pagos deben permanecer deshabilitados.
- Las funciones bloqueadas deben respetar el plan demo elegido.

## Diseño

Dirección visual:

- Fondo casi negro.
- Apariencia premium, tecnológica y editorial.
- Gradientes azul, violeta, púrpura y rosa.
- Bordes finos con transparencias.
- Glow moderado.
- Glassmorphism sutil.
- Titulares grandes.
- Tipografía limpia.
- Espacio negativo amplio.
- Animaciones discretas.
- Diseño responsive desde 360 px.

Inspiración conceptual:

- Netflix: catálogo y navegación.
- Spotify: experiencia de contenido.
- Duolingo: interacción y progreso.
- SaaS premium: presentación comercial.

No copiar interfaces, logotipos, ilustraciones ni componentes de terceros.

Consultar:

- `docs/DESIGN_SYSTEM.md`
- `docs/reference-home.png`

## Propiedad intelectual

- No copiar textos de libros.
- No reproducir capítulos.
- No utilizar portadas oficiales.
- No inventar citas textuales.
- No atribuir al autor conclusiones escritas por Ceoteca.
- Usar descripciones editoriales propias y breves.
- Mostrar el disclaimer legal en cada libro.

Disclaimer base:

> Contenido educativo y editorial propio. Ceoteca no está afiliada al autor ni a la editorial. Este análisis no reemplaza la obra original.

## Rutas

### Públicas

- `/`
- `/pricing`
- `/biblioteca`
- `/registro`
- `/login`
- `/terminos`
- `/privacidad`

### Privadas

- `/home`
- `/libro/[slug]`
- `/perfil`
- `/planes`

### API

- `/api/chat`
- `/api/audio`
- `/api/books`
- `/api/profile`
- `/api/subscription`

## Documentación obligatoria

Antes de implementar, consulta los documentos relevantes:

- `docs/PRODUCT_BRIEF.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/ARCHITECTURE.md`
- `docs/DATABASE.md`
- `docs/API_SPEC.md`
- `docs/CONTENT_GUIDELINES.md`
- `docs/ROADMAP.md`
- `docs/QA_CHECKLIST.md`
- `docs/ENVIRONMENT.md`

## Definición de terminado

Una tarea se considera terminada cuando:

- La funcionalidad solicitada está implementada.
- No se añadieron funciones fuera del alcance.
- El diseño funciona en móvil y escritorio.
- Existen estados de error y carga cuando correspondan.
- No hay errores de TypeScript.
- `npm run lint` pasa.
- `npm run typecheck` pasa.
- `npm run build` pasa.
- Se documentan brevemente los archivos modificados.
