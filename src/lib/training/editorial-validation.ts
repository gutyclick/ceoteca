import { z } from "zod";
import { trainingRubricSchema } from "@/lib/training/ai-schemas";

export const exerciseDraftSchema = z
  .object({
    title: z.string().min(3).max(140),
    type: z.enum([
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
    ]),
    skillId: z.string().uuid(),
    conceptId: z.string().uuid(),
    prompt: z.string().min(10).max(1000),
    instruction: z.string().min(8).max(600),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    estimatedSeconds: z.number().int().min(15).max(1800),
    hint: z.string().max(500).optional(),
    explanation: z.string().min(20).max(1800),
    content: z.record(z.string(), z.unknown()),
    evaluationConfig: z.record(z.string(), z.unknown()).optional(),
    evaluationMode: z.enum([
      "deterministic",
      "ai",
      "hybrid",
      "self_assessment",
    ]),
    rubric: trainingRubricSchema.optional(),
    compliance: z.object({
      ownWords: z.boolean(),
      noLongExcerpts: z.boolean(),
      citationsIdentified: z.boolean(),
      examplesAuthorized: z.boolean(),
    }),
    changeReason: z.string().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.evaluationMode === "ai" && !value.rubric)
      ctx.addIssue({
        code: "custom",
        path: ["rubric"],
        message: "Los ejercicios con IA necesitan una rúbrica.",
      });
    if (value.evaluationMode === "deterministic" && !value.evaluationConfig)
      ctx.addIssue({
        code: "custom",
        path: ["evaluationConfig"],
        message: "Configura la respuesta correcta.",
      });
    if (Object.values(value.compliance).some((item) => !item))
      ctx.addIssue({
        code: "custom",
        path: ["compliance"],
        message: "Confirma el cumplimiento editorial antes de publicar.",
      });
    if (/^pregunta\s*\d*$/i.test(value.prompt.trim()))
      ctx.addIssue({
        code: "custom",
        path: ["prompt"],
        message: "Utiliza un prompt editorial específico.",
      });
  });
export type ExerciseDraft = z.infer<typeof exerciseDraftSchema>;
export function validateForPublication(input: unknown) {
  const parsed = exerciseDraftSchema.safeParse(input);
  return parsed.success
    ? { valid: true as const, errors: [] }
    : {
        valid: false as const,
        errors: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      };
}

export const exerciseImportSchema = z.object({
  version: z.literal(1),
  exercises: z.array(exerciseDraftSchema).min(1).max(100),
});
