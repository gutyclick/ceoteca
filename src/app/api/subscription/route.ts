import { NextRequest } from "next/server";
import { z, ZodError } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { demoUser } from "@/lib/auth/demo";
import { clientEnv } from "@/lib/env";
import { parsePlanKey } from "@/lib/plans/parse";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createPlanSelection,
  getEffectiveSubscriptionForUser,
} from "@/lib/subscriptions/service";

const subscriptionSelectionSchema = z.object({
  plan: z.enum(["free", "pro", "unlimited", "founder"]),
});

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function getFieldErrors(error: ZodError) {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1]),
    ),
  );
}

async function getAuthenticatedUser(request: NextRequest) {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return demoUser;
  }

  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return null;
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName:
      typeof data.user.user_metadata.full_name === "string"
        ? data.user.user_metadata.full_name
        : "Usuario",
    plan: "free" as const,
    isDemo: false,
  };
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return jsonError(
      { code: "UNAUTHORIZED", message: "Inicia sesión para ver tu suscripción." },
      401,
    );
  }

  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return jsonData({
      plan: demoUser.plan,
      source: "profile",
      subscription: null,
    });
  }

  const effectiveSubscription = await getEffectiveSubscriptionForUser(user.id);

  return jsonData(effectiveSubscription);
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return jsonError(
      { code: "UNAUTHORIZED", message: "Inicia sesión para elegir un plan." },
      401,
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError(
      { code: "INVALID_INPUT", message: "El cuerpo de la solicitud no es JSON válido." },
      400,
    );
  }

  const parsed = subscriptionSelectionSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(
      {
        code: "INVALID_INPUT",
        message: "Selecciona un plan válido.",
        fieldErrors: getFieldErrors(parsed.error),
      },
      400,
    );
  }

  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return jsonData({
      plan: parsePlanKey(parsed.data.plan),
      status: parsed.data.plan === "free" ? "active" : "pending_payment",
      checkoutUrl: null,
      message: "Selección registrada en modo demo.",
    });
  }

  try {
    const result = await createPlanSelection({
      userId: user.id,
      plan: parsePlanKey(parsed.data.plan),
    });

    return jsonData(result);
  } catch {
    return jsonError(
      {
        code: "SUBSCRIPTION_UPDATE_FAILED",
        message: "No pudimos actualizar tu suscripción.",
      },
      500,
    );
  }
}
