# Ceoteca — Especificación de API

## 1. Convenciones

Base:

```text
/api
```

Formato JSON.

Respuesta exitosa:

```json
{
  "data": {}
}
```

Respuesta de error:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje legible",
    "fieldErrors": {}
  }
}
```

Nunca incluir detalles sensibles.

## 2. `POST /api/chat`

### Objetivo

Responder preguntas relacionadas con el análisis autorizado de un libro.

### Request

```json
{
  "bookId": "uuid-or-slug",
  "message": "¿Cómo aplico esta idea?",
  "conversation": [
    {
      "role": "user",
      "content": "Mensaje anterior"
    },
    {
      "role": "assistant",
      "content": "Respuesta anterior"
    }
  ]
}
```

### Validación

- `bookId`: requerido.
- `message`: 1 a 2000 caracteres.
- `conversation`: máximo configurable.
- Roles permitidos: `user`, `assistant`.
- Longitud total limitada.

### Verificaciones de servidor

1. Sesión.
2. Libro existente.
3. Libro publicado.
4. Plan.
5. Acceso al chat.
6. Límite mensual.
7. Rate limit.
8. Contenido editorial autorizado.

### System prompt base

```text
Eres un asistente especializado únicamente en el análisis editorial
suministrado por Ceoteca para este libro.

Responde solo usando el contenido autorizado recibido.
Si la pregunta no está relacionada, explica que solo puedes ayudar
con las ideas de este análisis.

No inventes citas, páginas, capítulos, hechos biográficos ni afirmaciones
atribuidas al autor.

Responde siempre en español de manera clara, útil, breve y aplicada
a la situación del usuario.
```

### Response

```json
{
  "data": {
    "message": "Respuesta del asistente",
    "remainingQuestions": 42,
    "usage": {
      "questionCount": 8,
      "limit": 50
    }
  }
}
```

Modo demo:

- Retornar respuesta mock contextual.
- No llamar a OpenAI.
- Mantener la misma forma de respuesta.

### Errores

- `UNAUTHORIZED`
- `BOOK_NOT_FOUND`
- `CHAT_NOT_INCLUDED`
- `MONTHLY_LIMIT_REACHED`
- `RATE_LIMITED`
- `INVALID_INPUT`
- `AI_PROVIDER_ERROR`

## 3. `GET /api/books`

### Query params

- `q`
- `category`
- `tag`
- `page`
- `limit`

### Response

```json
{
  "data": {
    "items": [],
    "page": 1,
    "limit": 20,
    "total": 10
  }
}
```

## 4. `GET /api/books/[slug]`

Retorna:

- Metadatos.
- Cover config.
- Acceso calculado.
- Secciones autorizadas.
- Progreso.
- Estado de audio.
- Permisos de chat.

No devolver secciones bloqueadas completas a usuarios sin acceso.

## 5. `GET /api/profile`

Retorna:

- Perfil.
- Plan.
- Uso.
- Resumen de progreso.
- Estado de suscripción.

## 6. `PATCH /api/profile`

Campos editables:

- `fullName`
- `avatarUrl`

No permitir:

- `plan`
- `founder`
- `subscriptionStatus`

## 7. `POST /api/audio`

Uso futuro para generación administrativa o acceso firmado.

No generar audio en cada reproducción.

Para reproducción:

- Devolver URL firmada o pública controlada.
- Verificar plan.
- Verificar libro.

## 8. `POST /api/subscription/checkout`

Estado inicial:

- Deshabilitado cuando `PAYMENTS_PROVIDER=disabled`.

Respuesta:

```json
{
  "error": {
    "code": "PAYMENTS_DISABLED",
    "message": "La integración de pagos está pendiente."
  }
}
```

## 9. `POST /api/subscription/portal`

Mismo comportamiento hasta configurar proveedor.

## 10. Rate limiting

Aplicar como mínimo a:

- Chat.
- Login.
- Registro.
- Recuperación de contraseña.
- Checkout.

Configurable por entorno.

## 11. Logging

Registrar en servidor:

- Código de error.
- Request ID.
- Endpoint.
- Duración.
- Provider.

No registrar:

- Contraseñas.
- Tokens.
- Claves.
- Conversaciones completas salvo política explícita.
