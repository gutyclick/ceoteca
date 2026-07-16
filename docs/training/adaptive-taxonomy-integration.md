# Integración adaptativa con la taxonomía

`TrainingAdaptiveContextService` reúne el contexto del usuario sin confiar en datos enviados por el cliente: sesión activa, ruta y módulo actuales, repasos vencidos, habilidades débiles, categorías preferidas e historial reciente de formatos visuales, escritos y conversacionales.

El orden de prioridad es:

1. sesión activa;
2. módulo en progreso;
3. repaso vencido;
4. habilidad débil;
5. siguiente nivel cognitivo;
6. objetivo del usuario;
7. variedad de formato;
8. contenido nuevo.

Antes de puntuar se descarta contenido sin renderer, bloqueado por plan, con prerrequisitos incumplidos, role-play para Free y análisis visual sin assets aprobados. La recomendación incluye categoría, habilidad, concepto, nivel cognitivo, formato, motivo, duración, elegibilidad y ruta relacionada.

El evento `adaptive_recommendation_generated` registra solo razón y plan, nunca respuestas ni texto privado.
