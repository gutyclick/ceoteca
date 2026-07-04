import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { demoUser } from "@/lib/auth/demo";
import { clientEnv } from "@/lib/env";
import { signUpSchema } from "@/lib/validation/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";

const TERMS_VERSION = "2026-07-03";
const PRIVACY_VERSION = "2026-07-03";
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const registerAttempts = new Map<string, RateLimitEntry>();

function getFieldErrors(error: ZodError) {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1]),
    ),
  );
}

function getIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getRateLimitKey(email: string, ip: string) {
  return `${email.toLowerCase()}:${ip}`;
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = registerAttempts.get(key);

  if (!current || current.resetAt <= now) {
    registerAttempts.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { limited: false };
  }

  if (current.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  registerAttempts.set(key, current);
  return { limited: false };
}

function createAnonSupabaseClient() {
  if (
    !clientEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error("Supabase no está configurado.");
  }

  return createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function translateAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("already") ||
    normalized.includes("registered") ||
    normalized.includes("exists")
  ) {
    return "Este correo ya está registrado. Inicia sesión o recupera tu acceso.";
  }

  if (
    normalized.includes("password") ||
    normalized.includes("weak") ||
    normalized.includes("characters")
  ) {
    return "La contraseña es demasiado débil. Usa al menos 10 caracteres con letras y números.";
  }

  if (
    normalized.includes("expired") ||
    normalized.includes("invalid token") ||
    normalized.includes("otp")
  ) {
    return "Tu enlace expiró. Solicita uno nuevo para continuar.";
  }

  return "No pudimos crear tu cuenta. Revisa los datos e inténtalo nuevamente.";
}

async function logAuthEvent(input: {
  userId?: string | null;
  email?: string | null;
  eventType:
    | "register_attempt"
    | "register_success"
    | "register_confirmation_required"
    | "register_error"
    | "rate_limit";
  provider?: string;
  code?: string | null;
  message?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Json;
}) {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return;
  }

  try {
    const supabase = createServiceSupabaseClient();
    await supabase.from("auth_events").insert({
      user_id: input.userId ?? null,
      email: input.email ?? null,
      event_type: input.eventType,
      provider: input.provider ?? "email",
      code: input.code ?? null,
      message: input.message ?? null,
      ip: input.ip ?? null,
      user_agent: input.userAgent ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Auth logs should never block registration.
  }
}

async function persistLegalAcceptance(input: {
  userId: string;
  fullName: string;
  acceptedAt: string;
  ip: string;
  userAgent: string;
}) {
  const supabase = createServiceSupabaseClient();

  await supabase.from("profiles").upsert({
    id: input.userId,
    full_name: input.fullName,
    plan: "free",
    onboarding_completed: false,
    terms_accepted_at: input.acceptedAt,
    terms_version: TERMS_VERSION,
    privacy_accepted_at: input.acceptedAt,
    privacy_version: PRIVACY_VERSION,
    legal_acceptance_ip: input.ip,
    legal_acceptance_user_agent: input.userAgent,
  });
}

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError(
      { code: "INVALID_INPUT", message: "El cuerpo de la solicitud no es JSON válido." },
      400,
    );
  }

  const parsed = signUpSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(
      {
        code: "INVALID_INPUT",
        message: "Revisa los campos marcados.",
        fieldErrors: getFieldErrors(parsed.error),
      },
      400,
    );
  }

  if (parsed.data.website) {
    return jsonData({
      requiresEmailConfirmation: true,
      redirectTo: null,
      message: "Revisa tu correo para confirmar tu cuenta.",
    });
  }

  const rateLimitKey = getRateLimitKey(parsed.data.email, ip);
  const rateLimit = checkRateLimit(rateLimitKey);

  if (rateLimit.limited) {
    await logAuthEvent({
      email: parsed.data.email,
      eventType: "rate_limit",
      code: "RATE_LIMIT",
      message: "Demasiados intentos de registro.",
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
      user: {
        ...demoUser,
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        plan: parsed.data.plan,
      },
      session: null,
      requiresEmailConfirmation: false,
      redirectTo: "/planes",
      message: "Cuenta demo creada. Elige tu plan para activar el acceso.",
    });
  }

  await logAuthEvent({
    email: parsed.data.email,
    eventType: "register_attempt",
    ip,
    userAgent,
  });

  try {
    const acceptedAt = new Date().toISOString();
    const supabase = createAnonSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
          requested_plan: parsed.data.plan,
          terms_accepted_at: acceptedAt,
          terms_version: TERMS_VERSION,
          privacy_accepted_at: acceptedAt,
          privacy_version: PRIVACY_VERSION,
        },
      },
    });

    if (error || !data.user) {
      throw error ?? new Error("No pudimos crear la cuenta.");
    }

    await persistLegalAcceptance({
      userId: data.user.id,
      fullName: parsed.data.fullName,
      acceptedAt,
      ip,
      userAgent,
    });

    const requiresEmailConfirmation = !data.session;

    await logAuthEvent({
      userId: data.user.id,
      email: data.user.email ?? parsed.data.email,
      eventType: requiresEmailConfirmation
        ? "register_confirmation_required"
        : "register_success",
      ip,
      userAgent,
      metadata: {
        termsVersion: TERMS_VERSION,
        privacyVersion: PRIVACY_VERSION,
      },
    });

    return jsonData({
      user: {
        id: data.user.id,
        email: data.user.email ?? parsed.data.email,
        fullName: parsed.data.fullName,
        plan: "free",
        isDemo: false,
      },
      session: data.session
        ? {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
          }
        : null,
      requiresEmailConfirmation,
      redirectTo: requiresEmailConfirmation ? null : "/planes",
      message: requiresEmailConfirmation
        ? "Revisa tu correo para confirmar tu cuenta."
        : "Cuenta creada. Elige tu plan para activar el acceso.",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? translateAuthError(error.message)
        : "No pudimos crear tu cuenta.";

    await logAuthEvent({
      email: parsed.data.email,
      eventType: "register_error",
      code: "REGISTER_FAILED",
      message,
      ip,
      userAgent,
    });

    return jsonError({ code: "REGISTER_FAILED", message }, 400);
  }
}
