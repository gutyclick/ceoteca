# Esquema de CEOTECA Training

Flujo de entidades: `categories -> skills -> concepts -> exercises -> template_exercises -> sessions -> session_exercises -> answers`. El contenido público se congela en `training_session_exercises`; las reglas privadas viven en `training_exercise_evaluation_rules` y no tienen política de lectura.

Las tablas `user_skill_mastery`, `user_concept_mastery`, `training_review_schedule` y `user_training_streaks` almacenan resultados derivados en servidor. `books` se reutiliza mediante `training_exercise_books`.

# Extensión editorial con IA

La migración `0029_training_editorial_ai.sql` añade jobs, resultados, uso editorial, variantes y provenance. Consulta `editorial-ai-generation.md` para estados, RLS y flujo humano obligatorio.
