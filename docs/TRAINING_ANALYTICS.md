# Analítica pedagógica de Training

## Propósito

La analítica de Training mide aprendizaje y calidad editorial. No evalúa el valor de una persona ni crea rankings públicos. Las métricas oficiales se calculan en servidor desde respuestas, sesiones, repasos y eventos validados.

## Privacidad

Se permiten identificadores técnicos, ejercicio y versión, habilidad, concepto, duración, resultado normalizado, cantidad de pistas y asignaciones experimentales. No se almacenan en eventos analíticos respuestas completas, reflexiones, nombres, correos, pagos, prompts ni feedback completo de IA.

Las tablas analíticas tienen RLS sin políticas de cliente. Solo el servicio y miembros editoriales autorizados consultan agregados. Una calidad solo se publica internamente cuando supera los umbrales `TRAINING_ANALYTICS_MIN_ATTEMPTS` y `TRAINING_ANALYTICS_MIN_USERS`.

## Métricas

- Primer intento, resultado eventual y mejora entre intentos.
- Pistas, solución, abandono y tiempo de respuesta.
- Dificultad observada ajustada por dominio previo.
- Discriminación entre dominio alto y bajo.
- Riesgo de ambigüedad y efectividad de distractores.
- Transferencia y retención a 1, 3, 7, 14 y 30 días.
- Calidad explicable de 0 a 100 con desglose y estado de evidencia.

## Operación

El agregador diario es incremental e idempotente. Los fallos de telemetría nunca bloquean un ejercicio. Las alertas no modifican ni publican contenido: un editor debe investigar y crear una nueva versión.

## Experimentos

La asignación usa un hash estable del experimento y el usuario. Solo participan adultos elegibles. Cada experimento declara hipótesis, una métrica primaria, guardrails, muestra mínima y una variante de control. No se experimenta con cuotas, privacidad, seguridad o acceso básico; el plan Gratis conserva una evaluación profunda al mes.

## Variables

Consultar `.env.example`. En producción, `TRAINING_EXPERIMENT_SALT` debe ser un secreto aleatorio de al menos 32 caracteres y nunca exponerse al cliente.
