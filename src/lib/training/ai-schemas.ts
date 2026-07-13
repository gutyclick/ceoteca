import { z } from "zod";

export const rubricCriterionSchema = z.object({
  id: z.string().regex(/^[a-z_]+$/),
  label: z.string().min(1).max(80),
  description: z.string().min(1).max(300),
  weight: z.number().positive().max(1),
});

export const trainingRubricSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    name: z.string().min(1),
    criteria: z.array(rubricCriterionSchema).min(2).max(8),
  })
  .superRefine((rubric, ctx) => {
    const total = rubric.criteria.reduce(
      (sum, criterion) => sum + criterion.weight,
      0,
    );
    if (Math.abs(total - 1) > 0.001)
      ctx.addIssue({
        code: "custom",
        message: "Los pesos de la rúbrica deben sumar 1.",
        path: ["criteria"],
      });
  });

export const openEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  verdict: z.enum([
    "strong",
    "good_foundation",
    "needs_improvement",
    "insufficient",
  ]),
  criteria: z
    .array(
      z.object({
        criterionId: z.string(),
        score: z.number().min(0).max(100),
        feedback: z.string().min(1).max(400),
        evidence: z.string().max(250).optional(),
      }),
    )
    .max(8),
  strengths: z.array(z.string().max(180)).max(3),
  improvements: z.array(z.string().max(180)).max(3),
  summaryFeedback: z.string().min(1).max(600),
  suggestedRevision: z.string().max(800).optional(),
  nextQuestion: z.string().max(250).optional(),
  safetyFlags: z.array(z.string().max(80)).max(5),
});

export type TrainingRubric = z.infer<typeof trainingRubricSchema>;
export type OpenEvaluation = z.infer<typeof openEvaluationSchema>;
