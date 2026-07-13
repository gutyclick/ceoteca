import { serverEnv } from "@/lib/env";
import type { EditorialJobType } from "@/lib/training/editorial-ai-schemas";

const economicalTasks = new Set<EditorialJobType>([
  "generate_distractors",
  "generate_variations",
  "review_exercise",
  "suggest_classification",
]);

export type EditorialModelRoute = {
  model: string;
  tier: "economical" | "capable";
  inputCostPerMillion: number;
  outputCostPerMillion: number;
};

export function routeEditorialModel(
  jobType: EditorialJobType,
): EditorialModelRoute {
  const economical = economicalTasks.has(jobType);
  return {
    model: economical
      ? serverEnv.TRAINING_EDITORIAL_AI_DEFAULT_MODEL
      : serverEnv.TRAINING_EDITORIAL_AI_FALLBACK_MODEL,
    tier: economical ? "economical" : "capable",
    // Configuración conservadora para estimar presupuesto; la factura real sigue siendo la autoridad.
    inputCostPerMillion: economical ? 0.4 : 0.8,
    outputCostPerMillion: economical ? 1.6 : 3.2,
  };
}

export function estimateEditorialCost(
  route: EditorialModelRoute,
  inputTokens: number,
  outputTokens: number,
) {
  return (
    (inputTokens / 1_000_000) * route.inputCostPerMillion +
    (outputTokens / 1_000_000) * route.outputCostPerMillion
  );
}
