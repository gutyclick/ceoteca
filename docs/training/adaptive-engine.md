# Motor adaptativo

`RuleBasedAdaptiveTrainingEngine` recibe un perfil server-side y candidatos editoriales. No consulta SQL ni conoce Supabase. Puntúa, filtra prerequisitos, compone una sesión y genera una explicación pública. Recomendación y aceptación están separadas para evitar sesiones duplicadas.
