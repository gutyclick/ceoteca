import { NextRequest } from "next/server";

import { jsonData, jsonError } from "@/lib/api/response";
import { demoUser } from "@/lib/auth/demo";
import {
  checkAuthRateLimit,
  createAnonSupabaseClient,
  getAuthFieldErrors,
  getRequestIp,
  getRequestUserAgent,
  logAuthEvent,
} from "@/lib/auth/server";
import { clientEnv } from "@/lib/env";
import { signInSchema } from "@/lib/validation/auth";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 6;

function translateLoginError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return {
      code: "INVALID_CREDENTIALS",
      message: "El email o la contraseña no coinciden.",
    };
  }

  if (normalized.includes("email not confirmed")) {
    return {
      code: "EMAIL_NOT_CONFIRMED",
      message: "Tu correo aún no está confirmado.",
    };
  }

  if (normalized.includes("too many")) {
    return {
      code: "RATE_LIMIT",
      message: "Has realizado varios intentos. Espera unos minutos antes de volver a intentarlo.",
    };
  }

  if (normalized.includes("provider") || normalized.includes("oauth")) {
    return {
      code: "OAUTH_ACCOUNT",
      message: "Esta cuenta usa un proveedor externo. Continúa con Google.",
    };
  }

  return {
    code: "LOGIN_FAILED",
    message: "No pudimos iniciar sesión. Revisa tus datos e inténtalo nuevamente.",
  };
}

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

  const parsed = signInSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(
      {
        code: "INVALID_INPUT",
        message: "Revisa los campos marcados.",
        fieldErrors: getAuthFieldErrors(parsed.error),
      },
      400,
    );
  }

  const rateLimitKey = `login:${parsed.data.email.toLowerCase()}:${ip}`;
  const rateLimit = checkAuthRateLimit({
    key: rateLimitKey,
    maxAttempts: RATE_LIMIT_MAX_ATTEMPTS,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (rateLimit.limited) {
    await logAuthEvent({
      email: parsed.data.email,
      eventType: "rate_limit",
      code: "LOGIN_RATE_LIMIT",
      message: "Demasiados intentos de inicio de sesión.",
      ip,
      userAgent,
      metadata: { retryAfterSeconds: rateLimit.retryAfterSeconds },
    });

    return jsonError(
      {
        code: "RATE_LIMIT",
        message: "Has realizado varios intentos. Espera unos minutos antes de volver a intentarlo.",
      },
      429,
    );
  }

  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return jsonData({
      user: demoUser,
      session: null,
      redirectTo: "/home",
      message: "Sesión demo iniciada.",
    });
  }

  await logAuthEvent({
    email: parsed.data.email,
    eventType: "login_attempt",
    ip,
    userAgent,
  });

  const supabase = createAnonSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user || !data.session) {
    const translated = translateLoginError(error?.message ?? "Login failed");

    await logAuthEvent({
      email: parsed.data.email,
      eventType: "login_error",
      code: translated.code,
      message: translated.message,
      ip,
      userAgent,
    });

    return jsonError(translated, translated.code === "EMAIL_NOT_CONFIRMED" ? 403 : 400);
  }

  await logAuthEvent({
    userId: data.user.id,
    email: data.user.email ?? parsed.data.email,
    eventType: "login_success",
    ip,
    userAgent,
  });

  return jsonData({
    user: {
      id: data.user.id,
      email: data.user.email ?? parsed.data.email,
      fullName:
        typeof data.user.user_metadata.full_name === "string"
          ? data.user.user_metadata.full_name
          : "Usuario",
      plan: "free",
      isDemo: false,
    },
    session: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
    redirectTo: "/home",
    message: "Sesión iniciada.",
  });
}
