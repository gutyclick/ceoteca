import { z } from "zod";

export const learningEventNames = [
  "training_home_viewed",
  "recommendation_viewed",
  "recommendation_started",
  "recommendation_dismissed",
  "duration_changed",
  "training_session_created",
  "training_session_started",
  "training_session_resumed",
  "training_session_abandoned",
  "training_session_completed",
  "exercise_viewed",
  "exercise_answer_started",
  "exercise_answer_submitted",
  "exercise_answer_evaluated",
  "exercise_retry_started",
  "exercise_retry_completed",
  "exercise_hint_requested",
  "exercise_solution_viewed",
  "exercise_skipped",
  "exercise_abandoned",
  "feedback_viewed",
  "feedback_expanded",
  "feedback_helpful",
  "feedback_not_helpful",
  "suggested_revision_viewed",
  "revision_started",
  "revision_submitted",
  "review_due",
  "review_started",
  "review_completed",
  "review_missed",
  "deep_ai_evaluation_offered",
  "deep_ai_evaluation_started",
  "deep_ai_evaluation_completed",
  "deep_ai_evaluation_failed",
  "deep_ai_evaluation_quota_reached",
  "deep_ai_evaluation_saved_for_later",
] as const;

export const learningEventNameSchema = z.enum(learningEventNames);
export type LearningEventName = z.infer<typeof learningEventNameSchema>;

export const serverOnlyLearningEvents = new Set<LearningEventName>([
  "training_session_created",
  "training_session_completed",
  "exercise_answer_submitted",
  "exercise_answer_evaluated",
  "exercise_retry_completed",
  "revision_submitted",
  "deep_ai_evaluation_completed",
  "deep_ai_evaluation_failed",
]);

const masteryBucketSchema = z.enum(["unknown", "low", "medium", "high"]);

export const learningEventPropertiesSchema = z
  .object({
    exercise_type: z.string().max(40).optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    is_correct: z.boolean().optional(),
    normalized_score: z.number().min(0).max(1).optional(),
    hints_used: z.number().int().min(0).max(20).optional(),
    retry_used: z.boolean().optional(),
    response_time_ms: z.number().int().min(0).max(3_600_000).optional(),
    feedback_type: z.enum(["correct", "incorrect", "retry", "ai", "fallback"]).optional(),
    plan: z.enum(["free", "pro", "unlimited", "founder"]).optional(),
    mastery_before_bucket: masteryBucketSchema.optional(),
    mastery_after_bucket: masteryBucketSchema.optional(),
    recommendation_reason: z.string().max(120).optional(),
    experiment_assignments: z
      .record(z.string().uuid())
      .refine((value) => Object.keys(value).length <= 10, "Demasiadas asignaciones experimentales.")
      .optional(),
    client_platform: z.enum(["web", "ios", "android", "unknown"]).optional(),
    app_version: z.string().max(30).optional(),
    option_ids: z.array(z.string().max(100)).max(20).optional(),
    cognitive_level: z.enum(["recognition", "recall", "application", "transfer", "synthesis"]).optional(),
    ai_evaluation_id: z.string().uuid().optional(),
  })
  .strict();

export const learningEventInputSchema = z
  .object({
    clientEventId: z.string().uuid(),
    eventName: learningEventNameSchema,
    occurredAt: z.string().datetime(),
    sessionId: z.string().uuid().optional(),
    sessionExerciseId: z.string().uuid().optional(),
    exerciseId: z.string().uuid().optional(),
    exerciseVersion: z.number().int().positive().optional(),
    templateId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    skillId: z.string().uuid().optional(),
    conceptId: z.string().uuid().optional(),
    attemptNumber: z.number().int().positive().optional(),
    properties: learningEventPropertiesSchema.default({}),
  })
  .strict();

export const analyticsFilterSchema = z
  .object({
    days: z.coerce.number().int().min(1).max(365).default(30),
    categoryId: z.string().uuid().optional(),
    skillId: z.string().uuid().optional(),
    conceptId: z.string().uuid().optional(),
    exerciseType: z.string().max(40).optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    plan: z.enum(["free", "pro", "unlimited", "founder"]).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const qualityStatuses = [
  "healthy",
  "monitor",
  "needs_review",
  "high_risk",
  "insufficient_data",
] as const;
export type ExerciseQualityStatus = (typeof qualityStatuses)[number];

export const qualityAlertActionSchema = z
  .object({
    action: z.enum(["acknowledge", "investigate", "resolve", "dismiss"]),
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

const experimentMetricSchema = z.enum([
  "review_accuracy_7d",
  "transfer_score",
  "retry_improvement",
  "exercise_completion_rate",
  "hint_usage_rate",
  "response_time_ms",
  "abandonment_rate",
  "feedback_helpfulness",
  "technical_error_rate",
  "ai_cost",
  "accessibility_report_rate",
]);

const experimentVariantSchema = z
  .object({
    key: z.string().regex(/^[a-z0-9_-]{1,40}$/),
    name: z.string().trim().min(2).max(100),
    weight: z.number().positive().max(100),
    configuration: z.record(z.string(), z.unknown()),
    isControl: z.boolean(),
  })
  .strict();

export const experimentCreateSchema = z
  .object({
    name: z.string().trim().min(4).max(140),
    description: z.string().trim().min(10).max(1000),
    hypothesis: z.string().trim().min(15).max(1000),
    entityType: z.enum(["exercise", "feedback", "distractors", "instruction", "exercise_type", "retry_flow"]),
    entityId: z.string().uuid().optional(),
    primaryMetric: experimentMetricSchema,
    secondaryMetrics: z.array(experimentMetricSchema).max(6).default([]),
    guardrailMetrics: z.array(experimentMetricSchema).min(1).max(8),
    targetAudience: z
      .object({
        plans: z.array(z.enum(["free", "pro", "unlimited", "founder"])).max(4).default([]),
        minimumAge: z.number().int().min(18).max(100).default(18),
        masteryBuckets: z.array(masteryBucketSchema).max(3).default([]),
      })
      .strict(),
    trafficPercentage: z.number().positive().max(100),
    minimumSampleSize: z.number().int().min(20).max(100_000),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    variants: z.array(experimentVariantSchema).min(2).max(5),
  })
  .strict()
  .superRefine((input, ctx) => {
    const totalWeight = input.variants.reduce((sum, variant) => sum + variant.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.001)
      ctx.addIssue({ code: "custom", path: ["variants"], message: "Los pesos de las variantes deben sumar 100 %." });
    if (input.variants.filter((variant) => variant.isControl).length !== 1)
      ctx.addIssue({ code: "custom", path: ["variants"], message: "Debe existir exactamente una variante de control." });
    if (input.endAt && input.startAt && new Date(input.endAt) <= new Date(input.startAt))
      ctx.addIssue({ code: "custom", path: ["endAt"], message: "La fecha final debe ser posterior al inicio." });
  });

export const experimentActionSchema = z
  .object({
    action: z.enum(["submit", "approve", "schedule", "start", "pause", "complete", "cancel"]),
    confirmation: z.literal(true),
  })
  .strict();
