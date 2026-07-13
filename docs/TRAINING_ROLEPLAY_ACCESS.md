# Acceso a simulaciones conversacionales

El plan efectivo se obtiene en servidor desde la suscripción activa. Los endpoints rechazan propiedades de plan, cuota o acceso enviadas por el cliente.

- Gratis: catálogo y ejercicios deterministas; no puede crear sesiones.
- Pro y Fundador: límite configurable, por defecto dos sesiones consumidas por mes; niveles Fundamentals y Application.
- Ilimitado: todos los niveles y escenarios personalizados cuando la bandera esté activa. No muestra contador, pero respeta duración, turnos, concurrencia, rate limit y corte diario.

Crear o restaurar una sesión no consume. El consumo transaccional ocurre después de guardar el primer mensaje válido y una respuesta exitosa del personaje. `clientTurnId` y la restricción única por sesión hacen el proceso idempotente. Fallos del proveedor, abandonos antes del primer turno, pruebas y previsualizaciones no consumen.
