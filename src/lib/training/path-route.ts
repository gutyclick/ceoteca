import type { NextRequest } from "next/server";

import { getEffectiveSubscriptionForUser } from "@/lib/subscriptions/service";
import { getTrainingServerSession } from "@/lib/training/server-auth";
import type { TrainingPlan } from "@/lib/training/taxonomy-model";

export const asTrainingPlan = (plan: string): TrainingPlan =>
  plan === "unlimited" ? "unlimited" : plan === "pro" || plan === "founder" ? "pro" : "free";

export async function getTrainingPathRequestContext(request: NextRequest) {
  const auth = await getTrainingServerSession(request);
  if (!auth) return null;
  const subscription = await getEffectiveSubscriptionForUser(auth.user.id);
  return { userId: auth.user.id, plan: asTrainingPlan(subscription.plan) };
}

export function trainingPathError(error: unknown) {
  const message = error instanceof Error ? error.message : "PATH_ERROR";
  if (message.includes("PLAN_REQUIRED")) return { status: 403, code: "PLAN_REQUIRED", message: "Tu plan no incluye este contenido." };
  if (message.includes("MODULE_LOCKED")) return { status: 403, code: "MODULE_LOCKED", message: "Completa el módulo anterior para continuar." };
  if (message.includes("PATH_NOT_STARTED")) return { status: 409, code: "PATH_NOT_STARTED", message: "Comienza la ruta antes de abrir esta actividad." };
  if (message.includes("ITEM_RENDERER_UNAVAILABLE")) return { status: 409, code: "ITEM_UNAVAILABLE", message: "Esta actividad todavía no tiene un formato disponible. Prueba la alternativa indicada." };
  if (message.includes("NOT_FOUND") || message.includes("NOT_AVAILABLE")) return { status: 404, code: "NOT_FOUND", message: "Este contenido no está disponible." };
  return { status: 500, code: "PATH_ERROR", message: "No pudimos actualizar la ruta. Inténtalo de nuevo." };
}
