import { z } from "zod";

export const roleplayDifficulties = [
  "fundamentals",
  "application",
  "advanced",
  "expert",
] as const;
export const roleplayDifficultySchema = z.enum(roleplayDifficulties);
export type RoleplayDifficulty = z.infer<typeof roleplayDifficultySchema>;

export const startRoleplaySchema = z
  .object({
    scenarioId: z.string().uuid(),
    difficulty: roleplayDifficultySchema,
    clientSessionId: z.string().uuid(),
  })
  .strict();

export const roleplayMessageSchema = z
  .object({
    clientMessageId: z.string().uuid(),
    message: z.string().trim().min(2).max(1500),
  })
  .strict();

export const finishRoleplaySchema = z
  .object({
    reason: z.enum([
      "user_ended",
      "character_ended",
      "turn_limit",
      "time_limit",
    ]),
  })
  .strict();

const evaluationCriterionSchema = z.object({
  criterionId: z.string().min(1).max(80),
  score: z.number().min(0).max(100),
  maxScore: z.number().positive().max(100),
  feedback: z.string().min(1).max(600),
  evidenceMessageIds: z.array(z.string().uuid()).max(8),
});

export const roleplayEvaluationOutputSchema = z.object({
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  outcome: z.enum([
    "objective_achieved",
    "partial_progress",
    "needs_improvement",
    "incomplete",
  ]),
  criteria: z.array(evaluationCriterionSchema).min(1).max(12),
  strengths: z.array(z.string().min(1).max(300)).max(6),
  improvements: z.array(z.string().min(1).max(300)).max(6),
  missedOpportunities: z
    .array(
      z.object({
        momentMessageId: z.string().uuid(),
        explanation: z.string().min(1).max(500),
        betterApproach: z.string().min(1).max(500),
      }),
    )
    .max(6),
  keyMoments: z
    .array(
      z.object({
        messageId: z.string().uuid(),
        type: z.enum(["strong", "risk", "turning_point", "missed_opportunity"]),
        explanation: z.string().min(1).max(500),
      }),
    )
    .max(8),
  suggestedPhrases: z.array(z.string().min(1).max(300)).max(6),
  nextScenarioRecommendation: z
    .object({
      scenarioId: z.string().uuid().optional(),
      skillId: z.string().min(1).max(100),
      reason: z.string().min(1).max(500),
    })
    .optional(),
  safetyFlags: z.array(z.string().max(100)).max(10),
});
export type RoleplayEvaluationOutput = z.infer<
  typeof roleplayEvaluationOutputSchema
>;

export function assertEvaluationMessageReferences(
  output: RoleplayEvaluationOutput,
  messageIds: Set<string>,
) {
  const references = [
    ...output.criteria.flatMap((criterion) => criterion.evidenceMessageIds),
    ...output.missedOpportunities.map((item) => item.momentMessageId),
    ...output.keyMoments.map((item) => item.messageId),
  ];
  if (references.some((id) => !messageIds.has(id))) {
    throw new Error("EVALUATION_INVALID_MESSAGE_REFERENCE");
  }
}
