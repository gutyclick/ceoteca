# Dominio inicial

El modelo previsto es reemplazable: `nuevo = anterior * 0.75 + score_normalizado * 100 * 0.25`, limitado a 0–100. Reintentos y pistas reducen el score antes de actualizar dominio. Estados: discovering 0–39, developing 40–69, competent 70–84 y mastered 85–100. `needs_review` se aplica cuando vence el próximo repaso o cae la precisión reciente.
