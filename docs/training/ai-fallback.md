# Fallback

Si el proveedor está deshabilitado, excede el timeout o devuelve una estructura inválida, Training conserva la respuesta y devuelve autoevaluación de baja confianza con estado `fallback_completed`. El usuario puede continuar y los ejercicios deterministas no se ven afectados.
