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

Crear una conversación con el primer mensaje o continuar una conversación
existente. Admite contexto general de Ceoteca y contexto editorial de libro.

### Request

```json
{
  "conversationId": null,
  "type": "book",
  "bookId": "uuid-or-slug",
  "message": "¿Cómo aplico esta idea?",
  "clientCreationKey": "uuid",
  "clientMessageId": "uuid",
  "stream": true
}
```

### Validación

- `conversationId`: requerido para continuar; nulo en el primer envío.
- `type`: `general` o `book` al crear.
- `bookId`: requerido solo para `type=book`.
- `message`: 1 a 2000 caracteres.
- `clientCreationKey`: requerido al crear e idempotente por usuario.
- `clientMessageId`: requerido e idempotente por usuario.
- `stream`: opcional. Si es `true`, responde mediante eventos NDJSON; si es
  `false`, conserva la respuesta JSON completa para clientes existentes.

### Verificaciones de servidor

1. Sesión.
2. Propiedad de la conversación, si existe.
3. Relación válida entre tipo y libro.
4. Libro existente y publicado para conversaciones de libro.
5. Plan y acceso al chat.
6. Límite mensual.
7. Rate limit y moderación.
8. Idempotencia de conversación y mensaje.
9. Contenido editorial autorizado.

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
    "conversation": {
      "id": "uuid",
      "type": "book",
      "bookId": "uuid",
      "title": "Aplicar una idea al negocio",
      "status": "active"
    },
    "userMessage": {},
    "assistantMessage": {},
    "replayed": false,
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

### Streaming

Con `stream=true`, la respuesta usa `application/x-ndjson`. Los eventos
posibles son `conversation`, `delta`, `title`, `completed` y `failed`.
`conversation` confirma la creación persistida y permite navegar de inmediato
a la URL estable. `delta` transporta texto incremental y `completed` contiene
los mensajes finales persistidos.

### Cancelación

`DELETE /api/chat` recibe `{ "clientMessageId": "uuid", "partialContent": "..." }`.
Solo puede cancelar un turno pendiente del usuario autenticado. Si ya existe
contenido parcial, se persiste como respuesta `stopped`; la cancelación no
consume la pregunta mensual.

### Operaciones sobre mensajes

- `PATCH /api/chat/messages/:messageId` permite registrar feedback o truncar la
  conversación desde un mensaje propio antes de volver a enviarlo.
- `POST /api/chat/messages/:messageId/regenerate` reemplaza una respuesta de CEO
  mediante streaming NDJSON, conserva la versión anterior hasta recibir texto
  nuevo y almacena la versión reemplazada para soporte futuro.
- El feedback acepta `helpful` y `not_helpful`, con un motivo opcional validado.
- Todas las operaciones comprueban sesión, propiedad de la conversación, plan,
  cuota y rate limit en servidor.

### Historial paginado

`GET /api/chat/history` acepta `conversationId` y un cursor opcional `before`.
Devuelve hasta 40 mensajes, `hasMore` y las valoraciones del usuario para los
mensajes visibles. Los mensajes pueden estar en estado `pending`, `streaming`,
`completed`, `stopped` o `failed`.

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
