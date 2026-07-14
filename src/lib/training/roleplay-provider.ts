import OpenAI from "openai";

import { clientEnv, serverEnv } from "@/lib/env";
import {
  assertEvaluationMessageReferences,
  roleplayEvaluationOutputSchema,
  type RoleplayEvaluationOutput,
} from "@/lib/training/roleplay-schemas";

type ProviderMetrics = {
  provider: "openai" | "mock";
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
};

function estimateCost(inputTokens: number, outputTokens: number) {
  return Number(
    (inputTokens * 0.00000015 + outputTokens * 0.0000006).toFixed(6),
  );
}

async function withTimeout<T>(promise: Promise<T>) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("PROVIDER_TIMEOUT")),
          serverEnv.TRAINING_ROLEPLAY_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function withRetries<T>(operation: () => Promise<T>) {
  let lastError: unknown;
  for (
    let attempt = 0;
    attempt <= serverEnv.TRAINING_ROLEPLAY_MAX_RETRIES;
    attempt += 1
  ) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < serverEnv.TRAINING_ROLEPLAY_MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, 250 * (attempt + 1)),
        );
      }
    }
  }
  throw lastError;
}

export class TrainingRoleplayProvider {
  async character(input: {
    prompt: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
    message: string;
  }): Promise<{
    text: string;
    metrics: ProviderMetrics;
    providerMessageId?: string;
  }> {
    const started = Date.now();
    if (clientEnv.NEXT_PUBLIC_DEMO_MODE || !serverEnv.OPENAI_API_KEY) {
      return {
        text: "Entiendo tu propuesta, pero todavía necesito una razón concreta para confiar en ese enfoque. ¿Qué evidencia o siguiente paso me ofrecerías?",
        metrics: {
          provider: "mock",
          model: "roleplay-mock-v1",
          inputTokens: 0,
          outputTokens: 0,
          estimatedCostUsd: 0,
          latencyMs: Date.now() - started,
        },
      };
    }
    const openai = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });
    const response = await withRetries(() =>
      withTimeout(
        openai.responses.create({
          model: serverEnv.TRAINING_ROLEPLAY_CHARACTER_MODEL,
          instructions: input.prompt,
          input: [...input.history, { role: "user", content: input.message }],
          max_output_tokens:
            serverEnv.TRAINING_ROLEPLAY_CHARACTER_MAX_OUTPUT_TOKENS,
        }),
      ),
    );
    const text = response.output_text.trim();
    if (!text) throw new Error("PROVIDER_EMPTY_RESPONSE");
    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;
    return {
      text,
      providerMessageId: response.id,
      metrics: {
        provider: "openai",
        model: serverEnv.TRAINING_ROLEPLAY_CHARACTER_MODEL,
        inputTokens,
        outputTokens,
        estimatedCostUsd: estimateCost(inputTokens, outputTokens),
        latencyMs: Date.now() - started,
      },
    };
  }

  async evaluate(input: {
    prompt: string;
    transcript: Array<{ id: string; role: string; content: string }>;
    criterionIds: string[];
  }): Promise<{ result: RoleplayEvaluationOutput; metrics: ProviderMetrics }> {
    const started = Date.now();
    if (clientEnv.NEXT_PUBLIC_DEMO_MODE || !serverEnv.OPENAI_API_KEY) {
      const evidence = input.transcript
        .filter((item) => item.role === "user")
        .map((item) => item.id);
      const result = roleplayEvaluationOutputSchema.parse({
        overallScore: 72,
        confidence: 0.82,
        outcome: "partial_progress",
        criteria: input.criterionIds.map((criterionId) => ({
          criterionId,
          score: 14,
          maxScore: 20,
          feedback:
            "Mostraste una base clara; concreta más la evidencia y el siguiente paso.",
          evidenceMessageIds: evidence.slice(-2),
        })),
        strengths: [
          "Mantuviste un tono profesional.",
          "Buscaste avanzar hacia una decisión concreta.",
        ],
        improvements: [
          "Formula más preguntas antes de defender tu propuesta.",
          "Cierra con un acuerdo verificable.",
        ],
        missedOpportunities: [],
        keyMoments: evidence
          .slice(-1)
          .map((messageId) => ({
            messageId,
            type: "turning_point",
            explanation:
              "Aquí la conversación empezó a orientarse hacia una solución.",
          })),
        suggestedPhrases: [
          "Antes de proponerte algo, quisiera entender qué resultado necesitas proteger.",
        ],
        safetyFlags: [],
      });
      return {
        result,
        metrics: {
          provider: "mock",
          model: "roleplay-evaluation-mock-v1",
          inputTokens: 0,
          outputTokens: 0,
          estimatedCostUsd: 0,
          latencyMs: Date.now() - started,
        },
      };
    }
    const openai = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });
    const response = await withRetries(() =>
      withTimeout(
        openai.responses.create({
          model: serverEnv.TRAINING_ROLEPLAY_EVALUATION_MODEL,
          instructions: input.prompt,
          input: "Genera la evaluación estructurada solicitada.",
          max_output_tokens:
            serverEnv.TRAINING_ROLEPLAY_EVALUATION_MAX_OUTPUT_TOKENS,
        }),
      ),
    );
    let parsed: unknown;
    try {
      parsed = JSON.parse(response.output_text);
    } catch {
      throw new Error("INVALID_STRUCTURED_OUTPUT");
    }
    const result = roleplayEvaluationOutputSchema.parse(parsed);
    assertEvaluationMessageReferences(
      result,
      new Set(input.transcript.map((message) => message.id)),
    );
    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;
    return {
      result,
      metrics: {
        provider: "openai",
        model: serverEnv.TRAINING_ROLEPLAY_EVALUATION_MODEL,
        inputTokens,
        outputTokens,
        estimatedCostUsd: estimateCost(inputTokens, outputTokens),
        latencyMs: Date.now() - started,
      },
    };
  }
}
