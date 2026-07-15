# Gates por plan

La fuente de verdad es `getEffectiveSubscriptionForUser`. La API transforma Founder a capacidad Pro y nunca acepta `plan`, cuota o acceso desde el cliente.

La UI puede mostrar previews bloqueados, pero `/api/training/recommendations` vuelve a validar la habilidad publicada y `TrainingPlanEligibilityService` antes de crear contenido. Free, Pro y Unlimited se prueban asignando la suscripción en base de datos; no se falsifican parámetros del navegador.
