export const chatErrorCodes = [
  "INVALID_INPUT",
  "UNAUTHORIZED",
  "SESSION_EXPIRED",
  "CONVERSATION_NOT_FOUND",
  "CONVERSATION_FORBIDDEN",
  "CONVERSATION_ARCHIVED",
  "PLAN_LIMIT_REACHED",
  "USAGE_LIMIT_REACHED",
  "RATE_LIMITED",
  "FEATURE_LOCKED",
  "BOOK_ACCESS_DENIED",
  "USAGE_RESERVATION_FAILED",
  "NETWORK_ERROR",
  "TIMEOUT",
  "PROVIDER_UNAVAILABLE",
  "MESSAGE_SAVE_FAILED",
  "RESPONSE_SAVE_FAILED",
  "STREAM_INTERRUPTED",
  "CONFLICT",
  "UNKNOWN_ERROR",
] as const;

export type ChatErrorCode = (typeof chatErrorCodes)[number];
export type ChatErrorAction = "retry" | "sign_in" | "restore" | "upgrade" | "go_home" | "edit" | null;

export type ChatPublicError = {
  code: ChatErrorCode;
  userMessage: string;
  retryable: boolean;
  action: ChatErrorAction;
  requestId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

const definitions: Record<ChatErrorCode, Omit<ChatPublicError, "code" | "requestId" | "metadata">> = {
  INVALID_INPUT: { userMessage: "Revisa tu mensaje antes de enviarlo.", retryable: false, action: "edit" },
  UNAUTHORIZED: { userMessage: "No tienes acceso a esta conversación.", retryable: false, action: "sign_in" },
  SESSION_EXPIRED: { userMessage: "Tu sesión ha expirado. Inicia sesión para continuar.", retryable: false, action: "sign_in" },
  CONVERSATION_NOT_FOUND: { userMessage: "Esta conversación ya no está disponible.", retryable: false, action: "go_home" },
  CONVERSATION_FORBIDDEN: { userMessage: "No tienes acceso a esta conversación.", retryable: false, action: "go_home" },
  CONVERSATION_ARCHIVED: { userMessage: "Restaura esta conversación para continuar.", retryable: false, action: "restore" },
  PLAN_LIMIT_REACHED: { userMessage: "Has alcanzado el límite de consultas de tu plan.", retryable: false, action: "upgrade" },
  USAGE_LIMIT_REACHED: { userMessage: "Has alcanzado el límite de consultas de tu plan.", retryable: false, action: "upgrade" },
  RATE_LIMITED: { userMessage: "Estás enviando mensajes demasiado rápido. Espera un momento e inténtalo de nuevo.", retryable: true, action: "retry" },
  FEATURE_LOCKED: { userMessage: "Tu plan no incluye Chat con CEO.", retryable: false, action: "upgrade" },
  BOOK_ACCESS_DENIED: { userMessage: "Tu plan no incluye este análisis.", retryable: false, action: "upgrade" },
  USAGE_RESERVATION_FAILED: { userMessage: "No pudimos reservar esta consulta. Inténtalo nuevamente.", retryable: true, action: "retry" },
  NETWORK_ERROR: { userMessage: "No tienes conexión a internet.", retryable: true, action: "retry" },
  TIMEOUT: { userMessage: "CEO tardó demasiado en responder.", retryable: true, action: "retry" },
  PROVIDER_UNAVAILABLE: { userMessage: "CEO no está disponible temporalmente.", retryable: true, action: "retry" },
  MESSAGE_SAVE_FAILED: { userMessage: "No se pudo enviar.", retryable: true, action: "retry" },
  RESPONSE_SAVE_FAILED: { userMessage: "No se pudo sincronizar esta respuesta.", retryable: true, action: "retry" },
  STREAM_INTERRUPTED: { userMessage: "La respuesta se interrumpió.", retryable: true, action: "retry" },
  CONFLICT: { userMessage: "Esta conversación está activa en otra pestaña.", retryable: true, action: "retry" },
  UNKNOWN_ERROR: { userMessage: "Ocurrió un problema temporal. Inténtalo nuevamente.", retryable: true, action: "retry" },
};

export class ChatOperationError extends Error {
  readonly code: ChatErrorCode;
  readonly retryable: boolean;
  readonly action: ChatErrorAction;
  readonly status: number;
  readonly requestId?: string;

  constructor(code: ChatErrorCode, options: { status?: number; requestId?: string; cause?: unknown } = {}) {
    super(definitions[code].userMessage, { cause: options.cause });
    this.name = "ChatOperationError";
    this.code = code;
    this.retryable = definitions[code].retryable;
    this.action = definitions[code].action;
    this.status = options.status ?? statusForChatError(code);
    this.requestId = options.requestId;
  }
}

export function createChatPublicError(
  code: ChatErrorCode,
  options: { requestId?: string; metadata?: ChatPublicError["metadata"] } = {},
): ChatPublicError {
  return { code, ...definitions[code], ...options };
}

export function statusForChatError(code: ChatErrorCode) {
  if (code === "INVALID_INPUT") return 400;
  if (code === "UNAUTHORIZED" || code === "SESSION_EXPIRED") return 401;
  if (code === "CONVERSATION_FORBIDDEN" || code === "FEATURE_LOCKED" || code === "BOOK_ACCESS_DENIED") return 403;
  if (code === "CONVERSATION_NOT_FOUND") return 404;
  if (code === "CONVERSATION_ARCHIVED" || code === "CONFLICT") return 409;
  if (code === "PLAN_LIMIT_REACHED" || code === "USAGE_LIMIT_REACHED" || code === "RATE_LIMITED") return 429;
  if (code === "TIMEOUT") return 504;
  if (code === "PROVIDER_UNAVAILABLE" || code === "USAGE_RESERVATION_FAILED") return 503;
  return 500;
}

export function isChatPublicError(value: unknown): value is ChatPublicError {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ChatPublicError>;
  return typeof candidate.code === "string" && chatErrorCodes.includes(candidate.code as ChatErrorCode)
    && typeof candidate.userMessage === "string" && typeof candidate.retryable === "boolean";
}

export function normalizeClientChatError(value: unknown, fallback: ChatErrorCode = "UNKNOWN_ERROR") {
  if (value instanceof ChatOperationError) return createChatPublicError(value.code, { requestId: value.requestId });
  if (value instanceof DOMException && value.name === "TimeoutError") return createChatPublicError("TIMEOUT");
  if (value instanceof TypeError) return createChatPublicError("NETWORK_ERROR");
  return createChatPublicError(fallback);
}

export function logChatError(input: {
  error: unknown;
  code: ChatErrorCode;
  endpoint: string;
  requestId: string;
  startedAt: number;
  status: number;
  phase: string;
  conversationType?: string;
  plan?: string;
}) {
  const internalName = input.error instanceof Error ? input.error.name : typeof input.error;
  console.error("Chat operation failed", {
    code: input.code,
    endpoint: input.endpoint,
    durationMs: Date.now() - input.startedAt,
    status: input.status,
    requestId: input.requestId,
    phase: input.phase,
    conversationType: input.conversationType ?? null,
    plan: input.plan ?? null,
    internalName,
  });
}
