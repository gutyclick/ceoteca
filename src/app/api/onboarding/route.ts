import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";
import { createPlanSelection } from "@/lib/subscriptions/service";

const onboardingSchema = z
  .object({
    birthDate: z.string().date().nullable(),
    occupation: z.string().trim().min(2).max(80),
    discoverySources: z.array(z.enum([
      "google",
      "instagram",
      "tiktok",
      "youtube",
      "recommendation",
      "podcast_newsletter",
      "community",
      "other",
    ])).min(1).max(8),
    plan: z.enum(["free", "pro", "unlimited", "founder"]),
    starterBookId: z.string().uuid().nullable(),
  })
  .superRefine((value, context) => {
    if (value.plan === "free" && !value.starterBookId) {
      context.addIssue({
        code: "custom",
        path: ["starterBookId"],
        message: "Elige un análisis para comenzar.",
      });
    }
  });

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para continuar." }, 401);
  }

  const authClient = createServerSupabaseClient(accessToken);
  const { data: userData, error: userError } = await authClient.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return jsonError({ code: "UNAUTHORIZED", message: "No pudimos validar tu sesión." }, 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError({ code: "INVALID_INPUT", message: "Revisa los datos enviados." }, 400);
  }

  const parsed = onboardingSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(
      {
        code: "INVALID_INPUT",
        message: parsed.error.issues[0]?.message ?? "Revisa los datos enviados.",
      },
      400,
    );
  }

  const serviceClient = createServiceSupabaseClient();
  const input = parsed.data;

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) {
    return jsonError(
      {
        code: "ONBOARDING_ALREADY_COMPLETED",
        message: "Tu registro ya está completo. Puedes administrar tu plan desde Ajustes.",
      },
      409,
    );
  }

  if (input.starterBookId) {
    const { data: starterBook } = await serviceClient
      .from("books")
      .select("id")
      .eq("id", input.starterBookId)
      .eq("is_published", true)
      .maybeSingle();

    if (!starterBook) {
      return jsonError(
        { code: "BOOK_NOT_FOUND", message: "El análisis elegido ya no está disponible." },
        404,
      );
    }
  }

  const { error: profileError } = await serviceClient
    .from("profiles")
    .update({
      birth_date: input.birthDate,
      occupation: input.occupation,
      discovery_source: input.discoverySources,
      starter_book_id: input.plan === "free" ? input.starterBookId : null,
    })
    .eq("id", userData.user.id);

  if (profileError) {
    return jsonError(
      { code: "PROFILE_UPDATE_FAILED", message: "No pudimos guardar tus preferencias." },
      500,
    );
  }

  if (input.plan === "free" && input.starterBookId) {
    const { error: progressError } = await serviceClient
      .from("user_book_progress")
      .upsert(
        {
          user_id: userData.user.id,
          book_id: input.starterBookId,
          progress: 1,
          completed: false,
        },
        { onConflict: "user_id,book_id" },
      );

    if (progressError) {
      return jsonError(
        { code: "STARTER_BOOK_FAILED", message: "No pudimos preparar tu primer análisis." },
        500,
      );
    }
  }

  try {
    const subscription = await createPlanSelection({
      userId: userData.user.id,
      plan: input.plan,
    });

    return jsonData({
      plan: input.plan,
      status: subscription.status,
      checkoutUrl: subscription.checkoutUrl,
      redirectTo: subscription.checkoutUrl ?? "/home",
    });
  } catch {
    return jsonError(
      { code: "ONBOARDING_FAILED", message: "No pudimos finalizar tu configuración." },
      500,
    );
  }
}
