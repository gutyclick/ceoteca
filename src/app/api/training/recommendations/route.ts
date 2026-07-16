import { NextRequest } from "next/server";
import { z } from "zod";
import { type PlanKey } from "@/config/plans";
import { jsonData, jsonError } from "@/lib/api/response";
import { RuleBasedAdaptiveTrainingEngine } from "@/lib/training/adaptive-engine";
import { getTrainingServerSession } from "@/lib/training/server-auth";
import { getEffectiveSubscriptionForUser } from "@/lib/subscriptions/service";
import type { AdaptiveCandidate } from "@/lib/training/adaptive-types";
import { TrainingAdaptiveContextService } from "@/lib/training/adaptive-context-service";
import { TrainingAnalyticsService } from "@/lib/training/analytics-service";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const schema = z.object({
  durationMinutes: z
    .union([
      z.literal(3),
      z.literal(5),
      z.literal(7),
      z.literal(10),
      z.literal(15),
    ])
    .default(7),
  skillSlug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
});
export async function POST(request: NextRequest) {
  const auth = await getTrainingServerSession(request);
  if (!auth)
    return jsonError(
      {
        code: "UNAUTHORIZED",
        message: "Inicia sesión para recibir una recomendación.",
      },
      401,
    );
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return jsonError(
      {
        code: "INVALID_DURATION",
        message: "Selecciona una duración disponible.",
      },
      400,
    );
  const requestedSkill = parsed.data.skillSlug
    ? await auth.client
        .from("training_skills")
        .select("id,minimum_plan,status")
        .eq("slug", parsed.data.skillSlug)
        .eq("status", "published")
        .maybeSingle()
    : null;
  if (requestedSkill?.error || (parsed.data.skillSlug && !requestedSkill?.data))
    return jsonError(
      {
        code: "SKILL_NOT_FOUND",
        message: "Esta habilidad no está disponible.",
      },
      404,
    );
  const effectiveSubscription = await getEffectiveSubscriptionForUser(
    auth.user.id,
  );
  const planRank: Record<PlanKey, number> = {
    free: 0,
    pro: 1,
    founder: 1,
    unlimited: 2,
  };
  const requiredPlan =
    requestedSkill?.data?.minimum_plan === "unlimited"
      ? "unlimited"
      : requestedSkill?.data?.minimum_plan === "pro"
        ? "pro"
        : "free";
  if (
    requestedSkill?.data &&
    planRank[effectiveSubscription.plan] < planRank[requiredPlan]
  )
    return jsonError(
      {
        code: "PLAN_REQUIRED",
        message: "Esta habilidad requiere un plan superior.",
      },
      403,
    );

  const [
    { data: profile },
    { data: exercises },
    { data: mastery },
    { data: reviews },
    { data: answers },
    { data: preferences },
    { data: usage },
  ] = await Promise.all([
    auth.client
      .from("profiles")
      .select("plan,occupation")
      .eq("id", auth.user.id)
      .single(),
    auth.client
      .from("training_exercises")
      .select(
        "id,skill_id,concept_id,type,difficulty,estimated_seconds,cognitive_level,minimum_plan,training_skills(category_id),training_exercise_formats(is_primary,training_formats(slug)),training_exercise_assets(asset_id,training_visual_assets(copyright_status))",
      )
      .eq("status", "published"),
    auth.client
      .from("user_skill_mastery")
      .select("skill_id,mastery_score,last_practiced_at")
      .eq("user_id", auth.user.id),
    auth.client
      .from("training_review_schedule")
      .select("skill_id,concept_id,scheduled_for,status")
      .eq("user_id", auth.user.id)
      .eq("status", "pending"),
    auth.client
      .from("training_answers")
      .select(
        "session_exercise_id,is_correct,created_at,training_session_exercises!inner(exercise_id)",
      )
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    auth.client
      .from("user_training_preferences")
      .select("preferred_exercise_types,disliked_exercise_types")
      .eq("user_id", auth.user.id)
      .maybeSingle(),
    auth.client.rpc("get_training_ai_monthly_usage", {
      p_user_id: auth.user.id,
      p_month: new Date().toISOString().slice(0, 10),
    }),
  ]);
  const adaptiveContext = await new TrainingAdaptiveContextService(
    auth.client,
  ).build(auth.user.id);
  const masteryMap = new Map(
    (mastery ?? []).map((item) => [item.skill_id, item]),
  );
  const due = adaptiveContext.dueReviewKeys.size
    ? adaptiveContext.dueReviewKeys
    : new Set(
        (reviews ?? [])
          .filter((item) => Date.parse(item.scheduled_for) <= Date.now())
          .map((item) => `${item.skill_id}:${item.concept_id}`),
      );
  const errorMap = new Map<string, number>();
  for (const item of answers ?? []) {
    if (!item.is_correct) {
      const relation = item.training_session_exercises as unknown as {
        exercise_id: string;
      };
      errorMap.set(
        relation.exercise_id,
        (errorMap.get(relation.exercise_id) ?? 0) + 1,
      );
    }
  }
  const disliked = new Set(preferences?.disliked_exercise_types ?? []);
  const renderers = new Set([
    "single_choice",
    "multiple_choice",
    "true_false",
    "ordering",
    "flashcard",
    "scenario",
    "open_response",
    "guided_builder",
    "decision_justification",
    "reflection",
    "visual_single_choice",
    "visual_comparison",
    "visual_diagnosis",
    "visual_annotation",
    "visual_ranking",
    "message_response",
    "message_comparison",
    "tone_adjustment",
    "objection_response",
    "email_rewrite",
    "conversation_diagnosis",
  ]);
  const candidates: AdaptiveCandidate[] = (exercises ?? [])
    .filter(
      (item) =>
        !requestedSkill?.data || item.skill_id === requestedSkill.data.id,
    )
    .filter((item) => !disliked.has(item.type))
    .map((item) => {
      const skillRelation = item.training_skills as unknown as {
        category_id?: string;
      } | null;
      const formatRelations =
        item.training_exercise_formats as unknown as Array<{
          is_primary?: boolean;
          training_formats?: { slug?: string } | Array<{ slug?: string }>;
        }> | null;
      const primary =
        formatRelations?.find((entry) => entry.is_primary) ??
        formatRelations?.[0];
      const formatRelation = Array.isArray(primary?.training_formats)
        ? primary?.training_formats[0]
        : primary?.training_formats;
      const format = formatRelation?.slug as
        AdaptiveCandidate["format"] | undefined;
      const assetRelations = item.training_exercise_assets as unknown as Array<{
        training_visual_assets?:
          { copyright_status?: string } | Array<{ copyright_status?: string }>;
      }> | null;
      const hasApprovedVisualAssets = Boolean(
        assetRelations?.some((entry) => {
          const asset = Array.isArray(entry.training_visual_assets)
            ? entry.training_visual_assets[0]
            : entry.training_visual_assets;
          return asset?.copyright_status === "approved";
        }),
      );
      return {
        id: item.id,
        skillId: item.skill_id,
        conceptId: item.concept_id,
        type: item.type,
        difficulty: item.difficulty,
        estimatedSeconds: item.estimated_seconds ?? 50,
        mastery: Number(masteryMap.get(item.skill_id)?.mastery_score ?? 50),
        dueReview: due.has(`${item.skill_id}:${item.concept_id}`),
        recentErrors: errorMap.get(item.id) ?? 0,
        alignedWithGoal: Boolean(
          profile?.occupation && item.type !== "flashcard",
        ),
        lastPracticedAt:
          masteryMap.get(item.skill_id)?.last_practiced_at ?? undefined,
        isNew: !masteryMap.has(item.skill_id),
        prerequisiteEligible: true,
        categoryId: skillRelation?.category_id,
        cognitiveLevel: item.cognitive_level,
        format,
        pathId: adaptiveContext.currentModuleExerciseIds.has(item.id)
          ? (adaptiveContext.activePathId ?? undefined)
          : undefined,
        minimumPlan: item.minimum_plan,
        activeSession: adaptiveContext.activeExerciseIds.has(item.id),
        activePathModule: adaptiveContext.currentModuleExerciseIds.has(item.id),
        preferredCategory: Boolean(
          skillRelation?.category_id &&
          adaptiveContext.preferredCategoryIds.has(skillRelation.category_id),
        ),
        weakSkill: adaptiveContext.weakSkillIds.has(item.skill_id),
        nextCognitiveLevel:
          Number(masteryMap.get(item.skill_id)?.mastery_score ?? 0) >= 60 &&
          ["application", "analysis", "transfer", "synthesis"].includes(
            item.cognitive_level,
          ),
        rendererAvailable: renderers.has(item.type),
        hasApprovedVisualAssets,
        recentlyUsedFormat: Boolean(
          format && adaptiveContext.recentFormats.includes(format),
        ),
      };
    });
  let recommendation;
  try {
    recommendation =
      await new RuleBasedAdaptiveTrainingEngine().buildRecommendation({
        userId: auth.user.id,
        plan: effectiveSubscription.plan,
        requestedDurationMinutes: parsed.data.durationMinutes,
        preferredExerciseTypes: preferences?.preferred_exercise_types ?? [],
        now: new Date().toISOString(),
        aiQuotaRemaining:
          effectiveSubscription.plan === "free"
            ? Math.max(0, 1 - Number(usage ?? 0))
            : 30,
        candidates,
      });
  } catch {
    return jsonError(
      {
        code: "NO_CONTENT",
        message:
          "No encontramos suficiente contenido para esta duración. Prueba una sesión más corta.",
      },
      409,
    );
  }

  const key = `${new Date().toISOString().slice(0, 13)}:${parsed.data.durationMinutes}:${recommendation.primarySkillId}`;
  const { data, error } = await auth.client
    .from("training_recommendations")
    .upsert(
      {
        user_id: auth.user.id,
        primary_skill_id: recommendation.primarySkillId,
        secondary_skill_ids: recommendation.secondarySkillIds,
        selected_concept_ids: [
          ...new Set(
            candidates
              .filter((item) => recommendation.exerciseIds.includes(item.id))
              .map((item) => item.conceptId),
          ),
        ],
        selected_exercise_ids: recommendation.exerciseIds,
        requested_duration_minutes: recommendation.requestedDurationMinutes,
        calculated_duration_minutes: recommendation.calculatedDurationMinutes,
        priority_snapshot: { candidateCount: candidates.length },
        explanation: recommendation.explanation,
        includes_deep_ai_evaluation: recommendation.includesDeepAIEvaluation,
        idempotency_key: key,
        expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
      },
      { onConflict: "user_id,idempotency_key" },
    )
    .select("id")
    .single();
  if (error || !data) {
    console.error("No se pudo guardar la recomendación de Training", {
      code: error?.code,
    });
    return jsonError(
      {
        code: "RECOMMENDATION_SAVE_FAILED",
        message:
          "No pudimos preparar tu sesión en este momento. Inténtalo nuevamente.",
      },
      500,
    );
  }

  try {
    await new TrainingAnalyticsService(
      createServiceSupabaseClient(),
    ).recordServerEvent(auth.user.id, {
      clientEventId: crypto.randomUUID(),
      eventName: "adaptive_recommendation_generated",
      properties: {
        recommendation_reason: recommendation.explanation.reasonCode,
        plan: effectiveSubscription.plan,
      },
    });
  } catch (analyticsError) {
    console.error("No se pudo registrar la recomendación en Analytics", {
      message:
        analyticsError instanceof Error
          ? analyticsError.message
          : "UNKNOWN_ANALYTICS_ERROR",
    });
  }

  return jsonData({ id: data.id, ...recommendation });
}
