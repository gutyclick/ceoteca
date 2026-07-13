# Evaluación educativa con IA

Los ejercicios abiertos guardan primero la respuesta y después solicitan una evaluación estructurada mediante `TrainingEvaluationService`. El servicio autentica propiedad, aplica cuota, genera un hash idempotente, carga una rúbrica privada y llama a `TrainingEvaluationProvider`. OpenAI usa Responses API; desarrollo y pruebas usan el proveedor mock.

El score se normaliza entre 0 y 1. Una evaluación fallida usa autoevaluación y no bloquea la sesión. Para desactivar el proveedor usa `TRAINING_AI_ENABLED=false`.
