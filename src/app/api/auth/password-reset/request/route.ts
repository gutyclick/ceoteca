import { NextRequest } from "next/server";

import { jsonData, jsonError } from "@/lib/api/response";
import {
  checkAuthRateLimit,
  createAnonSupabaseClient,
  getAuthFieldErrors,
  getRequestIp,
  getRequestUserAgent,
  logAuthEvent,
} from "@/lib/auth/server";
import { clientEnv } from "@/lib/env";
import { passwordResetRequestSchema } from "@/lib/validation/auth";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 3;

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const userAgent = getRequestUserAgent(request);
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError(
      { code: "INVALID_INPUT", message: "El cuerpo de la solicitud no es JSON válido." },
      400,
    );
  }

  const parsed = passwordResetRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(
      {
        code: "INVALID_INPUT",
        message: "Ingresa un email válido.",
        fieldErrors: getAuthFieldErrors(parsed.error),
      },
      400,
    );
  }

  const rateLimit = checkAuthRateLimit({
    key: `password-reset:${parsed.data.email.toLowerCase()}:${ip}`,
    maxAttempts: RATE_LIMIT_MAX_ATTEMPTS,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (rateLimit.limited) {
    return jsonError(
      {
        code: "RATE_LIMIT",
        message: "Espera unos minutos antes de solicitar otro enlace.",
      },
      429,
    );
  }

  if (!clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    const supabase = createAnonSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${clientEnv.NEXT_PUBLIC_SITE_URL}/nueva-password`,
    });

    await logAuthEvent({
      email: parsed.data.email,
      eventType: error ? "password_reset_error" : "password_reset_requested",
      code: error ? "PASSWORD_RESET_REQUEST_FAILED" : "PASSWORD_RESET_REQUESTED",
      message: error?.message ?? null,
      ip,
      userAgent,
    });
  }

  return jsonData({
    message: "Si existe una cuenta con ese correo, enviaremos un enlace para restablecer la contraseña.",
  });
}
