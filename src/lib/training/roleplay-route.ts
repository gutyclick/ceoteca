import { NextRequest } from "next/server";

import { jsonError } from "@/lib/api/response";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { TrainingRoleplayService } from "@/lib/training/roleplay-service";
import { getTrainingServerSession } from "@/lib/training/server-auth";

const errorStatus: Record<string, number> = {
  UNAUTHORIZED: 401,
  PLAN_REQUIRED: 403,
  DIFFICULTY_LOCKED: 403,
  DIFFICULTY_NOT_AVAILABLE: 403,
  UNSAFE_MESSAGE: 400,
  SCENARIO_NOT_FOUND: 404,
  SESSION_NOT_FOUND: 404,
  EVALUATION_NOT_FOUND: 404,
  MONTHLY_LIMIT_REACHED: 429,
  DAILY_SAFETY_LIMIT: 429,
  RATE_LIMITED: 429,
  CONCURRENT_LIMIT: 409,
  TURN_LIMIT: 409,
  HINT_LIMIT_REACHED: 409,
  SESSION_EXPIRED: 409,
  SESSION_NOT_ACTIVE: 409,
  SESSION_NOT_PAUSABLE: 409,
  SESSION_NOT_RESUMABLE: 409,
  SESSION_NOT_FINISHABLE: 409,
  ROLEPLAY_DISABLED: 503,
  ROLEPLAY_CATALOG_DISABLED: 503,
  PROVIDER_UNAVAILABLE: 503,
  PROVIDER_EMPTY_RESPONSE: 502,
};

const errorMessages: Record<string, string> = {
  PLAN_REQUIRED:
    "Las simulaciones conversacionales están disponibles desde Pro.",
  DIFFICULTY_LOCKED: "Tu plan no incluye esta dificultad.",
  DIFFICULTY_NOT_AVAILABLE:
    "Esta dificultad no está disponible para el escenario.",
  UNSAFE_MESSAGE:
    "Ese mensaje no puede utilizarse en una simulación profesional.",
  SCENARIO_NOT_FOUND: "No encontramos ese escenario.",
  SESSION_NOT_FOUND: "No encontramos esa simulación.",
  EVALUATION_NOT_FOUND: "La evaluación todavía no está disponible.",
  MONTHLY_LIMIT_REACHED: "Ya utilizaste tus simulaciones de este mes.",
  DAILY_SAFETY_LIMIT: "Alcanzaste el límite técnico diario. Inténtalo mañana.",
  RATE_LIMITED: "Espera un momento antes de enviar otro mensaje.",
  CONCURRENT_LIMIT:
    "Ya tienes una simulación activa. Continúala o finalízala antes de iniciar otra.",
  TURN_LIMIT: "La simulación alcanzó el máximo de turnos.",
  SESSION_EXPIRED: "La simulación expiró. Puedes comenzar un nuevo intento.",
  SESSION_NOT_ACTIVE: "Esta simulación no admite nuevos mensajes.",
  HINT_LIMIT_REACHED:
    "Ya utilizaste las pistas disponibles para esta simulación.",
  ROLEPLAY_DISABLED: "Las simulaciones no están disponibles en este entorno.",
  ROLEPLAY_CATALOG_DISABLED:
    "El catálogo de simulaciones no está disponible en este entorno.",
};

export async function getRoleplayContext(request: NextRequest) {
  const auth = await getTrainingServerSession(request);
  if (!auth) return null;
  return {
    auth,
    service: new TrainingRoleplayService(createServiceSupabaseClient()),
  };
}

export function roleplayRouteError(
  error: unknown,
  fallback = "No pudimos completar esta operación.",
) {
  const code = error instanceof Error ? error.message : "ROLEPLAY_ERROR";
  return jsonError(
    { code, message: errorMessages[code] ?? fallback },
    errorStatus[code] ?? 500,
  );
}
