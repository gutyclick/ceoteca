import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  serverEnv: {
    OPENAI_API_KEY: undefined,
    TRAINING_AI_ENABLED: false,
    TRAINING_AI_DEFAULT_MODEL: "mock",
  },
}));

import {
  openEvaluationSchema,
  trainingRubricSchema,
} from "@/lib/training/ai-schemas";
import { MockTrainingEvaluationProvider } from "@/lib/training/ai-provider";

const rubric = trainingRubricSchema.parse({
  id: "value",
  version: "1",
  name: "Valor",
  criteria: [
    {
      id: "clarity",
      label: "Claridad",
      description: "Es comprensible",
      weight: 0.5,
    },
    {
      id: "specificity",
      label: "Especificidad",
      description: "Es concreta",
      weight: 0.5,
    },
  ],
});

describe("evaluación abierta", () => {
  it("rechaza rúbricas cuyos pesos no suman uno", () => {
    expect(() =>
      trainingRubricSchema.parse({
        ...rubric,
        criteria: rubric.criteria.map((item) => ({ ...item, weight: 0.2 })),
      }),
    ).toThrow();
  });

  it("valida el feedback estructurado del proveedor mock", async () => {
    const output = await new MockTrainingEvaluationProvider().evaluate({
      exerciseType: "open_response",
      skill: "Propuesta de valor",
      concept: "Claridad",
      principleSummary: "Cliente y resultado",
      context: {},
      answer: {
        text: "Ayudamos a emprendedores a validar sus ideas con ejercicios prácticos.",
      },
      rubric,
      promptVersion: "training-open-response-v1",
    });
    expect(openEvaluationSchema.parse(output.evaluation).overallScore).toBe(74);
    expect(output.evaluation.criteria.map((item) => item.criterionId)).toEqual([
      "clarity",
      "specificity",
    ]);
  });

  it("rechaza puntuaciones fuera de rango", () => {
    expect(() =>
      openEvaluationSchema.parse({
        overallScore: 101,
        confidence: 1,
        verdict: "strong",
        criteria: [],
        strengths: [],
        improvements: [],
        summaryFeedback: "Texto",
        safetyFlags: [],
      }),
    ).toThrow();
  });
});
