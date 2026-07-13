import OpenAI from "openai";
import type { z } from "zod";

import { serverEnv } from "@/lib/env";
import { buildEditorialPrompt } from "@/lib/training/editorial-ai-prompts";
import { routeEditorialModel } from "@/lib/training/editorial-ai-model-router";
import {
  classificationSuggestionSchema,
  editorialAIReviewSchema,
  generatedDistractorsSchema,
  generatedExerciseBatchSchema,
  generatedFeedbackSchema,
  generatedRubricSchema,
  generatedTemplateSuggestionSchema,
  type EditorialJobType,
} from "@/lib/training/editorial-ai-schemas";

type ExerciseBatch = z.infer<typeof generatedExerciseBatchSchema>;
type Template = z.infer<typeof generatedTemplateSuggestionSchema>;

export type EditorialProviderResult<T> = {
  data: T;
  provider: "openai" | "mock";
  model: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  repaired: boolean;
};

export interface EditorialGenerationProvider {
  generateExercises(input: unknown): Promise<EditorialProviderResult<unknown>>;
  generateDistractors(
    input: unknown,
  ): Promise<EditorialProviderResult<unknown>>;
  improveFeedback(input: unknown): Promise<EditorialProviderResult<unknown>>;
  generateVariations(input: unknown): Promise<EditorialProviderResult<unknown>>;
  suggestRubric(input: unknown): Promise<EditorialProviderResult<unknown>>;
  reviewExercise(input: unknown): Promise<EditorialProviderResult<unknown>>;
  suggestClassification(
    input: unknown,
  ): Promise<EditorialProviderResult<unknown>>;
  suggestTemplate(input: unknown): Promise<EditorialProviderResult<unknown>>;
}

const schemaDescriptions: Record<EditorialJobType, string> = {
  generate_exercises:
    "Objeto {exercises:[GeneratedExerciseDraft]}, máximo 5. Cada ejercicio incluye type, internalTitle, instruction, prompt, difficulty, estimatedSeconds, hint opcional, explanation, content, evaluationConfig opcional, sourceReferences, warnings y confidence.",
  generate_variations:
    "Objeto {exercises:[GeneratedExerciseDraft]}, máximo 5, con la misma estructura del original y el contexto solicitado.",
  generate_distractors:
    "Objeto {distractors:[{text,misconception,whyPlausible,feedbackSuggestion}]}, máximo 6.",
  improve_feedback:
    "Objeto {feedbackCorrect,feedbackIncorrect,feedbackRetry,principleApplied,practicalApplication,hint}.",
  suggest_rubric:
    "Objeto {name,description,criteria:[{id,label,description,weight,scale,examples,commonMistakes}],threshold,usageRecommendations}. Pesos enteros suman 100.",
  review_exercise:
    "Objeto {overallStatus,issues:[{type,severity,field?,message,suggestedFix?}],strengths,recommendedDifficulty?,textualOverlapWarning?}.",
  suggest_classification:
    "Objeto con category,skill,concept,difficulty,exerciseType; cada uno {value,confidence,explanation,alternatives}; además estimatedSeconds,tags,prerequisites,recommendedAudience.",
  suggest_template:
    "Objeto {title,description,estimatedMinutes,sections:[{name,exerciseIds,rationale}],warnings}. Usa solo IDs provistos.",
};

function parseJSON(text: string) {
  const clean = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(clean) as unknown;
}

class OpenAIEditorialGenerationProvider implements EditorialGenerationProvider {
  private readonly client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });

  private async run<T>(
    jobType: EditorialJobType,
    input: unknown,
    schema: z.ZodType<T>,
  ): Promise<EditorialProviderResult<T>> {
    if (!serverEnv.OPENAI_API_KEY) throw new Error("PROVIDER_NOT_CONFIGURED");
    const modelRoute = routeEditorialModel(jobType);
    const prompt = buildEditorialPrompt(
      jobType,
      input,
      schemaDescriptions[jobType],
    );
    let repaired = false;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    const execute = async (repairText?: string) => {
      const response = await this.client.responses.create({
        model: modelRoute.model,
        max_output_tokens: 4200,
        input: [
          { role: "developer", content: prompt.developer },
          {
            role: "user",
            content: repairText
              ? `${prompt.user}\n\nSALIDA_INVALIDA_A_REPARAR\n${repairText}`
              : prompt.user,
          },
        ],
      });
      totalInputTokens += response.usage?.input_tokens ?? 0;
      totalOutputTokens += response.usage?.output_tokens ?? 0;
      return response.output_text;
    };

    let raw = await execute();
    let parsed = schema.safeParse(parseJSON(raw));
    if (!parsed.success) {
      repaired = true;
      raw = await execute(raw.slice(0, 12_000));
      parsed = schema.safeParse(parseJSON(raw));
    }
    if (!parsed.success) throw new Error("INVALID_PROVIDER_OUTPUT");
    return {
      data: parsed.data,
      provider: "openai",
      model: modelRoute.model,
      promptVersion: prompt.version,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      repaired,
    };
  }

  generateExercises(input: unknown) {
    return this.run("generate_exercises", input, generatedExerciseBatchSchema);
  }
  generateDistractors(input: unknown) {
    return this.run("generate_distractors", input, generatedDistractorsSchema);
  }
  improveFeedback(input: unknown) {
    return this.run("improve_feedback", input, generatedFeedbackSchema);
  }
  generateVariations(input: unknown) {
    return this.run("generate_variations", input, generatedExerciseBatchSchema);
  }
  suggestRubric(input: unknown) {
    return this.run("suggest_rubric", input, generatedRubricSchema);
  }
  reviewExercise(input: unknown) {
    return this.run("review_exercise", input, editorialAIReviewSchema);
  }
  suggestClassification(input: unknown) {
    return this.run(
      "suggest_classification",
      input,
      classificationSuggestionSchema,
    );
  }
  suggestTemplate(input: unknown) {
    return this.run(
      "suggest_template",
      input,
      generatedTemplateSuggestionSchema,
    );
  }
}

function mockExercise(type = "single_choice") {
  const content =
    type === "ordering"
      ? {
          items: [
            { id: "item_1", label: "Definir el cliente" },
            { id: "item_2", label: "Precisar el problema" },
            { id: "item_3", label: "Expresar el resultado" },
          ],
        }
      : type === "flashcard"
        ? {
            front: "¿Qué hace clara una propuesta de valor?",
            back: "Conecta un cliente específico con un resultado relevante y diferenciable.",
          }
        : [
              "open_response",
              "guided_builder",
              "decision_justification",
              "reflection",
            ].includes(type)
          ? { fields: [{ id: "response", label: "Tu respuesta" }] }
          : {
              options: [
                {
                  id: "option_1",
                  label: "Un resultado concreto para un cliente definido",
                },
                {
                  id: "option_2",
                  label: "Una descripción general del producto",
                },
              ],
            };
  const evaluationConfig =
    type === "ordering"
      ? { correctOrder: ["item_1", "item_2", "item_3"] }
      : ["single_choice", "scenario"].includes(type)
        ? { correctOptionId: "option_1" }
        : type === "multiple_choice"
          ? { correctOptionIds: ["option_1"] }
          : type === "true_false"
            ? { correctValue: true }
            : undefined;
  return {
    type,
    internalTitle: "Aplicación de propuesta de valor",
    instruction: "Analiza el caso y elige la respuesta más útil.",
    prompt: "¿Qué alternativa comunica mejor una propuesta de valor clara?",
    difficulty: "intermediate" as const,
    estimatedSeconds: 75,
    hint: "Busca cliente, resultado y diferencia.",
    explanation:
      "Una propuesta clara explica para quién crea valor, qué mejora y por qué resulta relevante.",
    principleApplied: "Claridad antes que amplitud.",
    practicalApplication:
      "Reescribe tu propuesta con un cliente y un resultado observables.",
    content,
    evaluationConfig,
    sourceReferences: [],
    warnings: ["Borrador generado con IA. Requiere revisión editorial."],
    confidence: 0.78,
  };
}

export class MockEditorialGenerationProvider implements EditorialGenerationProvider {
  private result<T>(
    jobType: EditorialJobType,
    data: T,
  ): EditorialProviderResult<T> {
    return {
      data,
      provider: "mock",
      model: "mock-editorial",
      promptVersion: buildEditorialPrompt(jobType, {}, "").version,
      inputTokens: 0,
      outputTokens: 0,
      repaired: false,
    };
  }
  generateExercises(input: unknown) {
    const config = input as { types?: string[]; count?: number };
    const types = config.types?.length ? config.types : ["single_choice"];
    return Promise.resolve(
      this.result("generate_exercises", {
        exercises: Array.from(
          { length: Math.min(config.count ?? 1, 5) },
          (_, index) => mockExercise(types[index % types.length]),
        ),
      } as ExerciseBatch),
    );
  }
  generateDistractors() {
    return Promise.resolve(
      this.result("generate_distractors", {
        distractors: [
          {
            text: "Describir todas las funciones del producto",
            misconception: "Confundir funciones con valor",
            whyPlausible: "Parece informativo, pero no expresa transformación",
            feedbackSuggestion:
              "Conecta la función con un resultado del cliente.",
          },
          {
            text: "Dirigirse a cualquier persona",
            misconception: "Creer que un mercado amplio siempre es mejor",
            whyPlausible: "Amplía el alcance aparente, pero reduce claridad",
            feedbackSuggestion: "Define primero un segmento observable.",
          },
        ],
      }),
    );
  }
  improveFeedback() {
    return Promise.resolve(
      this.result("improve_feedback", {
        feedbackCorrect:
          "La respuesta conecta un cliente específico con un resultado concreto.",
        feedbackIncorrect:
          "La alternativa describe el producto, pero todavía no explica el valor para el cliente.",
        feedbackRetry:
          "Prueba otra vez buscando cliente, resultado y diferencia.",
        principleApplied:
          "Una propuesta de valor prioriza la transformación del cliente.",
        practicalApplication: "Reescribe tu mensaje en una frase medible.",
        hint: "Pregunta qué mejora para quién.",
      }),
    );
  }
  generateVariations() {
    return Promise.resolve(
      this.result("generate_variations", {
        exercises: [mockExercise("scenario")],
      } as ExerciseBatch),
    );
  }
  suggestRubric() {
    return Promise.resolve(
      this.result("suggest_rubric", {
        name: "Aplicación clara",
        description: "Evalúa claridad, pertinencia y aplicación.",
        criteria: [
          {
            id: "clarity",
            label: "Claridad",
            description: "Expresa la idea sin ambigüedad.",
            weight: 40,
            scale: ["Insuficiente", "En desarrollo", "Logrado"],
            examples: [],
            commonMistakes: ["Usar términos vagos"],
          },
          {
            id: "application",
            label: "Aplicación",
            description: "Conecta el principio con una acción concreta.",
            weight: 60,
            scale: ["Insuficiente", "En desarrollo", "Logrado"],
            examples: [],
            commonMistakes: ["No definir un siguiente paso"],
          },
        ],
        threshold: 70,
        usageRecommendations: ["Revisar los pesos antes de enviar a revisión."],
      }),
    );
  }
  reviewExercise() {
    return Promise.resolve(
      this.result("review_exercise", {
        overallStatus: "needs_review",
        issues: [
          {
            type: "human_review",
            severity: "warning",
            message: "Confirma que solo exista una respuesta correcta.",
            suggestedFix: "Revisa las opciones en previsualización.",
          },
        ],
        strengths: ["El objetivo es comprensible."],
        recommendedDifficulty: "intermediate",
      }),
    );
  }
  suggestClassification() {
    const item = {
      value: "Propuesta de valor",
      confidence: 0.78,
      explanation:
        "El ejercicio se centra en comunicar una transformación concreta.",
      alternatives: ["Validación de cliente"],
    };
    return Promise.resolve(
      this.result("suggest_classification", {
        category: { ...item, value: "Emprendimiento" },
        skill: item,
        concept: item,
        difficulty: { ...item, value: "intermediate" },
        exerciseType: { ...item, value: "single_choice" },
        estimatedSeconds: 75,
        tags: ["cliente", "valor"],
        prerequisites: [],
        recommendedAudience: ["Emprendedores"],
      }),
    );
  }
  suggestTemplate(input: unknown) {
    const config = input as { eligibleExercises?: Array<{ id: string }> };
    const data: Template = {
      title: "Práctica de propuesta de valor",
      description: "Secuencia breve para reconocer y aplicar el concepto.",
      estimatedMinutes: 10,
      sections: [
        {
          name: "recognition",
          exerciseIds:
            config.eligibleExercises?.slice(0, 2).map((item) => item.id) ?? [],
          rationale: "Activa el concepto con ejercicios publicados.",
        },
      ],
      warnings: ["Confirma duración y prerrequisitos antes de guardar."],
    };
    return Promise.resolve(this.result("suggest_template", data));
  }
}

export function createEditorialGenerationProvider(): EditorialGenerationProvider {
  return serverEnv.TRAINING_EDITORIAL_AI_ENABLED && serverEnv.OPENAI_API_KEY
    ? new OpenAIEditorialGenerationProvider()
    : new MockEditorialGenerationProvider();
}
