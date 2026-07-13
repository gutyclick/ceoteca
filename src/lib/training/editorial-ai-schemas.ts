import { z } from "zod";

export const editorialJobTypes = [
  "generate_exercises",
  "generate_distractors",
  "improve_feedback",
  "generate_variations",
  "suggest_rubric",
  "review_exercise",
  "suggest_classification",
  "suggest_template",
] as const;

export const editorialJobTypeSchema = z.enum(editorialJobTypes);
export type EditorialJobType = z.infer<typeof editorialJobTypeSchema>;

export const trainingDifficultySchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

export const exerciseTypeSchema = z.enum([
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
]);

const safeText = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine(
      (value) => !/<\/?[a-z][\s\S]*>/i.test(value),
      "No se permite HTML.",
    );

export const sourceReferenceSchema = z
  .object({
    bookTitle: safeText(180),
    author: safeText(140),
    internalReference: safeText(180).optional(),
  })
  .strict();

export const editorialGenerationContextSchema = z
  .object({
    category: safeText(100),
    skill: safeText(100),
    concept: safeText(140),
    learningObjective: safeText(500),
    principleSummary: safeText(7000),
    commonMistakes: z.array(safeText(240)).max(8).default([]),
    approvedExamples: z.array(safeText(600)).max(5).default([]),
    sourceReferences: z.array(sourceReferenceSchema).max(5).default([]),
    editorialNotes: safeText(1200).optional(),
  })
  .strict();

const optionSchema = z
  .object({ id: z.string().regex(/^option_[1-9]\d*$/), label: safeText(280) })
  .strict();
const itemSchema = z
  .object({ id: z.string().regex(/^item_[1-9]\d*$/), label: safeText(280) })
  .strict();

const choiceContentSchema = z
  .object({ options: z.array(optionSchema).min(2).max(8) })
  .strict();
const orderingContentSchema = z
  .object({ items: z.array(itemSchema).min(3).max(8) })
  .strict();
const flashcardContentSchema = z
  .object({ front: safeText(500), back: safeText(900) })
  .strict();
const openContentSchema = z
  .object({
    fields: z
      .array(
        z
          .object({
            id: z.string().regex(/^[a-z][a-z0-9_]*$/),
            label: safeText(120),
            placeholder: safeText(240).optional(),
          })
          .strict(),
      )
      .max(8)
      .default([]),
  })
  .strict();

export const generatedExerciseDraftSchema = z
  .object({
    type: exerciseTypeSchema,
    internalTitle: safeText(140),
    visibleTitle: safeText(180).optional(),
    context: safeText(1000).optional(),
    instruction: safeText(600),
    prompt: safeText(1000),
    difficulty: trainingDifficultySchema,
    estimatedSeconds: z.number().int().min(15).max(1800),
    skillId: z.string().uuid().optional(),
    conceptId: z.string().uuid().optional(),
    hint: safeText(500).optional(),
    explanation: safeText(1800),
    principleApplied: safeText(600).optional(),
    practicalApplication: safeText(800).optional(),
    content: z.union([
      choiceContentSchema,
      orderingContentSchema,
      flashcardContentSchema,
      openContentSchema,
      z.object({}).strict(),
    ]),
    evaluationConfig: z.record(z.string(), z.unknown()).optional(),
    sourceReferences: z.array(sourceReferenceSchema).max(5).default([]),
    warnings: z.array(safeText(240)).max(5).default([]),
    confidence: z.number().min(0).max(1),
  })
  .strict()
  .superRefine((draft, ctx) => {
    if (["single_choice", "multiple_choice", "scenario"].includes(draft.type)) {
      const parsed = choiceContentSchema.safeParse(draft.content);
      if (!parsed.success)
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "El tipo requiere opciones válidas.",
        });
    }
    if (
      draft.type === "ordering" &&
      !orderingContentSchema.safeParse(draft.content).success
    )
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "Ordering requiere elementos ordenables.",
      });
    if (
      draft.type === "flashcard" &&
      !flashcardContentSchema.safeParse(draft.content).success
    )
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "Flashcard requiere frente y reverso.",
      });
  });

export const generatedExerciseBatchSchema = z
  .object({ exercises: z.array(generatedExerciseDraftSchema).min(1).max(5) })
  .strict();

export const generatedDistractorsSchema = z
  .object({
    distractors: z
      .array(
        z
          .object({
            text: safeText(280),
            misconception: safeText(300),
            whyPlausible: safeText(400),
            feedbackSuggestion: safeText(500),
          })
          .strict(),
      )
      .min(1)
      .max(6),
  })
  .strict();

export const generatedFeedbackSchema = z
  .object({
    feedbackCorrect: safeText(600),
    feedbackIncorrect: safeText(600),
    feedbackRetry: safeText(500),
    principleApplied: safeText(500),
    practicalApplication: safeText(700),
    hint: safeText(400),
  })
  .strict();

export const generatedRubricSchema = z
  .object({
    name: safeText(140),
    description: safeText(500),
    criteria: z
      .array(
        z
          .object({
            id: z.string().regex(/^[a-z_]+$/),
            label: safeText(100),
            description: safeText(400),
            weight: z.number().int().min(5).max(100),
            scale: z.array(safeText(240)).min(3).max(5),
            examples: z.array(safeText(400)).max(3),
            commonMistakes: z.array(safeText(240)).max(3),
          })
          .strict(),
      )
      .min(2)
      .max(6),
    threshold: z.number().int().min(0).max(100),
    usageRecommendations: z.array(safeText(300)).max(5),
  })
  .strict()
  .superRefine((rubric, ctx) => {
    const ids = rubric.criteria.map((criterion) => criterion.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        path: ["criteria"],
        message: "Los criterios no pueden repetirse.",
      });
    if (
      rubric.criteria.reduce((sum, criterion) => sum + criterion.weight, 0) !==
      100
    )
      ctx.addIssue({
        code: "custom",
        path: ["criteria"],
        message: "Los pesos deben sumar 100 %.",
      });
  });

export const editorialAIReviewSchema = z
  .object({
    overallStatus: z.enum(["clear", "needs_review", "high_risk"]),
    issues: z
      .array(
        z
          .object({
            type: safeText(80),
            severity: z.enum(["info", "warning", "error"]),
            field: safeText(80).optional(),
            message: safeText(400),
            suggestedFix: safeText(500).optional(),
          })
          .strict(),
      )
      .max(12),
    strengths: z.array(safeText(240)).max(5),
    recommendedDifficulty: trainingDifficultySchema.optional(),
    textualOverlapWarning: safeText(500).optional(),
  })
  .strict();

const classificationItemSchema = z
  .object({
    value: safeText(140),
    confidence: z.number().min(0).max(1),
    explanation: safeText(300),
    alternatives: z.array(safeText(140)).max(3),
  })
  .strict();
export const classificationSuggestionSchema = z
  .object({
    category: classificationItemSchema,
    skill: classificationItemSchema,
    concept: classificationItemSchema,
    difficulty: classificationItemSchema,
    exerciseType: classificationItemSchema,
    estimatedSeconds: z.number().int().min(15).max(1800),
    tags: z.array(safeText(60)).max(8),
    prerequisites: z.array(safeText(140)).max(5),
    recommendedAudience: z.array(safeText(120)).max(5),
  })
  .strict();

export const generatedTemplateSuggestionSchema = z
  .object({
    title: safeText(140),
    description: safeText(500),
    estimatedMinutes: z.number().int().min(3).max(60),
    sections: z
      .array(
        z
          .object({
            name: z.enum([
              "warmup",
              "recognition",
              "application",
              "decision",
              "construction",
              "final_challenge",
            ]),
            exerciseIds: z.array(z.string().uuid()).max(10),
            rationale: safeText(500),
          })
          .strict(),
      )
      .min(2)
      .max(6),
    warnings: z.array(safeText(240)).max(5),
  })
  .strict();

export const generateExercisesInputSchema = z
  .object({
    clientJobId: z.string().uuid(),
    sourceType: z.enum(["concept", "analysis", "manual"]).default("concept"),
    sourceId: z.string().uuid().optional(),
    context: editorialGenerationContextSchema,
    difficulty: trainingDifficultySchema,
    types: z.array(exerciseTypeSchema).min(1).max(5),
    count: z.number().int().min(1).max(5),
    tone: z
      .enum(["professional", "direct", "encouraging"])
      .default("professional"),
    estimatedSeconds: z.number().int().min(15).max(1800),
    categoryId: z.string().uuid().optional(),
    skillId: z.string().uuid(),
    conceptId: z.string().uuid(),
    copyrightConfirmed: z.literal(true),
    noFullBookConfirmed: z.literal(true),
    noLongQuotesConfirmed: z.literal(true),
  })
  .strict();

export const generateDistractorsInputSchema = z
  .object({
    clientJobId: z.string().uuid(),
    exerciseId: z.string().uuid().optional(),
    question: safeText(1000),
    correctAnswer: safeText(500),
    concept: safeText(140),
    difficulty: trainingDifficultySchema,
    commonMistakes: z.array(safeText(240)).max(8).default([]),
    count: z.number().int().min(1).max(6),
  })
  .strict();

export const improveFeedbackInputSchema = z
  .object({
    clientJobId: z.string().uuid(),
    exerciseId: z.string().uuid().optional(),
    prompt: safeText(1000),
    options: z.array(safeText(300)).max(8),
    correctAnswer: safeText(500),
    concept: safeText(140),
    principle: safeText(600),
    commonMistake: safeText(400).optional(),
    currentFeedback: safeText(1000).optional(),
  })
  .strict();

export const variationInputSchema = z
  .object({
    clientJobId: z.string().uuid(),
    exerciseId: z.string().uuid(),
    variationType: z.enum([
      "new_context",
      "same_difficulty",
      "easier",
      "harder",
      "new_sector",
      "entrepreneur",
      "salesperson",
      "student",
      "leader",
    ]),
    count: z.number().int().min(1).max(5).default(1),
  })
  .strict();

export const rubricInputSchema = z
  .object({
    clientJobId: z.string().uuid(),
    exerciseId: z.string().uuid().optional(),
    objective: safeText(600),
    skill: safeText(140),
    concept: safeText(140),
    difficulty: trainingDifficultySchema,
    prompt: safeText(1200),
    approvedExamples: z.array(safeText(600)).max(5).default([]),
    expectedOutcome: safeText(800),
  })
  .strict();

export const reviewExerciseInputSchema = z
  .object({
    clientJobId: z.string().uuid(),
    exerciseId: z.string().uuid().optional(),
    exercise: generatedExerciseDraftSchema,
  })
  .strict();

export const classificationInputSchema = z
  .object({
    clientJobId: z.string().uuid(),
    exercise: generatedExerciseDraftSchema,
  })
  .strict();

export const templateInputSchema = z
  .object({
    clientJobId: z.string().uuid(),
    skillId: z.string().uuid(),
    durationMinutes: z.number().int().min(3).max(60),
    difficulty: trainingDifficultySchema,
    audience: safeText(180),
    objective: safeText(600),
    approximateExerciseCount: z.number().int().min(2).max(20),
    reviewPercentage: z.number().int().min(0).max(60),
    allowsAI: z.boolean(),
    plan: z.enum(["free", "pro", "unlimited", "founder"]),
  })
  .strict();

export type GeneratedExerciseDraft = z.infer<
  typeof generatedExerciseDraftSchema
>;
export type EditorialGenerationContext = z.infer<
  typeof editorialGenerationContextSchema
>;
