import { NextRequest } from "next/server";

import { jsonData, jsonError } from "@/lib/api/response";
import { planKeys, type PlanKey } from "@/config/plans";
import { serverEnv } from "@/lib/env";
import { resolvePlanFromSubscriptions } from "@/lib/subscriptions/resolve";
import { getTrainingServerSession } from "@/lib/training/server-auth";
import { taxonomySlugSchema } from "@/lib/training/taxonomy";

const planRank: Record<PlanKey, number> = {
  free: 0,
  pro: 1,
  founder: 1,
  unlimited: 2,
};

function asPlan(value: unknown): PlanKey {
  return typeof value === "string" && planKeys.includes(value as PlanKey)
    ? (value as PlanKey)
    : "free";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pathSlug: string }> },
) {
  if (
    !serverEnv.TRAINING_TAXONOMY_ENABLED ||
    !serverEnv.TRAINING_LEARNING_PATHS_ENABLED
  )
    return jsonError(
      {
        code: "FEATURE_DISABLED",
        message: "Las rutas de Training no están disponibles.",
      },
      404,
    );
  const auth = await getTrainingServerSession(request);
  if (!auth)
    return jsonError(
      {
        code: "UNAUTHORIZED",
        message: "Inicia sesión para comenzar esta ruta.",
      },
      401,
    );
  const parsed = taxonomySlugSchema.safeParse((await params).pathSlug);
  if (!parsed.success)
    return jsonError(
      { code: "INVALID_PATH", message: "La ruta solicitada no es válida." },
      400,
    );

  const [{ data: path }, { data: profile }, { data: subscriptions }] =
    await Promise.all([
      auth.client
        .from("training_learning_paths")
        .select("id,slug,minimum_plan,status")
        .eq("slug", parsed.data)
        .eq("status", "published")
        .maybeSingle(),
      auth.client
        .from("profiles")
        .select("plan")
        .eq("id", auth.user.id)
        .single(),
      auth.client
        .from("subscriptions")
        .select("plan,status,updated_at")
        .eq("user_id", auth.user.id)
        .order("updated_at", { ascending: false }),
    ]);
  if (!path)
    return jsonError(
      { code: "PATH_NOT_FOUND", message: "Esta ruta no está disponible." },
      404,
    );

  const effectivePlan = resolvePlanFromSubscriptions({
    profilePlan: asPlan(profile?.plan),
    subscriptions: (subscriptions ?? []).map((item) => ({
      plan: asPlan(item.plan),
      status: item.status,
      updated_at: item.updated_at,
    })),
  }).plan;
  const minimumPlan = asPlan(path.minimum_plan);
  if (planRank[effectivePlan] < planRank[minimumPlan])
    return jsonError(
      {
        code: "PLAN_REQUIRED",
        message: `Esta ruta requiere el plan ${minimumPlan === "pro" ? "Pro" : "Ilimitado"}.`,
      },
      403,
    );

  const { error } = await auth.client.rpc("start_training_learning_path", {
    p_user_id: auth.user.id,
    p_path_id: path.id,
  });
  if (error)
    return jsonError(
      { code: "PATH_START_FAILED", message: "No pudimos iniciar la ruta." },
      500,
    );
  return jsonData({
    pathId: path.id,
    nextHref: `/ejercicios/rutas/${encodeURIComponent(path.slug)}?iniciada=1`,
  });
}
