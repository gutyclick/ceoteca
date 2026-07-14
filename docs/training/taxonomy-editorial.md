# Operación editorial de la taxonomía

El panel `/admin/training/taxonomy` reutiliza la autorización editorial existente. Su validador detecta slugs repetidos, ramas vacías, habilidades sin conceptos, rutas sin módulos, ciclos, ejercicios sin nivel o formato y assets visuales incompletos.

Los errores bloquean publicación; las advertencias permiten revisión. El flujo recomendado es borrador → revisión → publicación → archivo. Todas las mutaciones futuras deben registrar actor, entidad, versión y motivo en la auditoría editorial existente.
