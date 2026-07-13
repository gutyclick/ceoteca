# Generación editorial asistida por IA

## Alcance

La asistencia editorial vive en `/admin/training/ai-generator`. Reutiliza OpenAI Responses API, Zod, roles editoriales, auditoría y el cliente de servicio de Supabase. La IA solo produce propuestas; no publica ni modifica contenido publicado.

Flujo obligatorio:

1. El editor configura fuente, objetivo, formato y cantidad.
2. El servidor valida rol, feature flag, longitud, límite diario y presupuesto mensual.
3. Se muestra una estimación antes de confirmar.
4. El proveedor devuelve JSON estructurado.
5. Zod valida y permite una sola reparación.
6. Cada resultado queda separado y puede guardarse únicamente como `draft`.
7. El editor revisa y envía a revisión.
8. Un reviewer confirma derechos, exactitud, feedback, respuesta correcta y rúbrica.
9. Solo un admin publica.

Mensaje visible en todos los resultados: `Borrador generado con IA. Requiere revisión editorial.`

## Arquitectura

- `editorial-ai-schemas.ts`: entradas y salidas estrictas.
- `editorial-ai-prompts.ts`: ocho prompts versionados y reglas contra prompt injection.
- `editorial-ai-model-router.ts`: asigna modelo económico o capaz en servidor.
- `editorial-ai-provider.ts`: proveedor OpenAI y mock con la misma interfaz.
- `editorial-ai-service.ts`: jobs, cuotas, costos, idempotencia, timeout, validación y uso.
- `editorial-ai-results.ts`: descarte y persistencia explícita como borrador.
- `editorial-ai-route.ts`: autorización y errores seguros compartidos.

Servicios especializados (`ExerciseGenerationService`, `DistractorGenerationService`, `FeedbackGenerationService`, `RubricSuggestionService`, `EditorialAIReviewService`, `ExerciseVariationService` y `TemplateSuggestionService`) comparten la infraestructura central.

## Casos de uso

- Ejercicios desde concepto o secciones seleccionadas de un análisis CEOTECA.
- Cinco formatos desde un mismo concepto mediante selección múltiple.
- Distractores plausibles con error conceptual y feedback sugerido.
- Comparación de feedback actual y propuesta.
- Variaciones enlazadas a un ejercicio fuente.
- Rúbricas draft con pesos que suman 100 %.
- Revisión de claridad y advertencia de solapamiento textual no legal.
- Clasificación sugerida, nunca aplicada automáticamente.
- Plantillas con ejercicios publicados y elegibles; IDs inventados invalidan el resultado.

## Datos y estados

La migración `0029_training_editorial_ai.sql` crea:

- `training_editorial_ai_jobs`
- `training_editorial_ai_results`
- `training_editorial_ai_usage`
- `training_exercise_variants`

Los jobs usan estados `queued`, `processing`, `validating`, `partial`, `completed`, `failed`, `timed_out` y `cancelled`. Los resultados usan `generated`, `valid`, `invalid`, `selected`, `saved` y `discarded`. No se mezclan con los estados editoriales de publicación.

La provenance añade `origin`, `ai_job_id`, `ai_result_id`, `human_reviewed`, reviewer, fecha, fuente y versión de prompt. No se muestra al usuario final.

## Seguridad y propiedad intelectual

- Todas las rutas requieren bearer token y rol en servidor.
- Viewer no genera; reviewer solo usa revisión; editor genera; admin además consulta costos globales y publica.
- El modelo nunca llega desde el cliente.
- El contexto tiene límite configurable y no admite documentos completos.
- Los inputs no aceptan HTML.
- Los logs guardan resumen, hash y metadata, no prompts internos ni documentos.
- La restricción de base de datos bloquea publicar contenido IA sin revisión humana y confirmaciones.
- La comprobación de posible solapamiento es una advertencia editorial, no un dictamen legal.

## Costos, cuota e idempotencia

La cuota editorial es independiente de `training_ai_evaluations` y de la evaluación profunda mensual de usuarios. Se controla mediante presupuesto mensual, límite diario, cantidad máxima de cinco y regeneraciones por resultado.

Cada job usa `client_job_id` único por editor. El `input_hash` detecta resultados idénticos y deja constancia de caché disponible sin reutilizar contenido privado automáticamente.

## API

- `POST /api/admin/training/ai/generate-exercises`
- `POST /api/admin/training/ai/generate-distractors`
- `POST /api/admin/training/ai/improve-feedback`
- `POST /api/admin/training/ai/generate-variations`
- `POST /api/admin/training/ai/suggest-rubric`
- `POST /api/admin/training/ai/review-exercise`
- `POST /api/admin/training/ai/suggest-classification`
- `POST /api/admin/training/ai/suggest-template`
- `POST /api/admin/training/ai/estimate`
- `GET /api/admin/training/ai/jobs/:jobId`
- `POST /api/admin/training/ai/jobs/:jobId/cancel`
- `POST /api/admin/training/ai/results/:resultId/save-draft`
- `POST /api/admin/training/ai/results/:resultId/discard`
- `POST /api/admin/training/ai/results/:resultId/regenerate`
- `GET /api/admin/training/ai/usage`

## Prueba manual

1. Asigna rol `editor` en `training_editorial_users`.
2. Activa los flags editoriales y configura `OPENAI_API_KEY`; sin clave se usa mock.
3. Abre `/admin/training/ai-generator`.
4. Configura tres ejercicios, prepara la estimación y confirma.
5. Revisa, regenera o descarta un resultado.
6. Guarda un ejercicio como borrador y comprueba `origin = ai_generated`.
7. Envíalo a revisión.
8. Apruébalo con las cinco confirmaciones usando rol reviewer.
9. Publica usando rol admin.
10. Comprueba jobs, uso, auditoría y provenance en Supabase.

## Limitaciones iniciales

- El procesamiento es síncrono con estados preparados para polling; no hay cola distribuida.
- La estimación usa tarifas conservadoras configuradas en código y no sustituye la factura del proveedor.
- No se cargan PDF, libros completos, imágenes, voz ni traducción masiva.
- La revisión de solapamiento no es un detector legal definitivo.
