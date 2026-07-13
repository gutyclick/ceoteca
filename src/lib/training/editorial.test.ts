import { describe, expect, it } from "vitest";
import { canEditorial } from "@/lib/training/editorial-permissions";
import {
  validateForPublication,
  exerciseImportSchema,
} from "@/lib/training/editorial-validation";
const valid = {
  title: "Propuesta de valor concreta",
  type: "single_choice",
  skillId: "11111111-1111-4111-8111-111111111111",
  conceptId: "22222222-2222-4222-8222-222222222222",
  prompt: "¿Qué propuesta comunica mejor el resultado?",
  instruction: "Selecciona la opción con mayor claridad.",
  difficulty: "intermediate",
  estimatedSeconds: 60,
  explanation:
    "La mejor alternativa conecta al cliente con un resultado concreto.",
  content: {
    options: [
      { id: "option_1", label: "Resultado concreto" },
      { id: "option_2", label: "Mensaje genérico" },
    ],
  },
  evaluationConfig: { correctOptionId: "option_1" },
  evaluationMode: "deterministic",
  compliance: {
    ownWords: true,
    noLongExcerpts: true,
    citationsIdentified: true,
    examplesAuthorized: true,
  },
};
describe("CMS editorial", () => {
  it("impide escalada de permisos", () => {
    expect(canEditorial("viewer", "edit")).toBe(false);
    expect(canEditorial("editor", "publish")).toBe(false);
    expect(canEditorial("reviewer", "publish")).toBe(true);
    expect(canEditorial("admin", "manage_roles")).toBe(true);
  });
  it("valida un ejercicio publicable", () => {
    expect(validateForPublication(valid).valid).toBe(true);
  });
  it("bloquea IA sin rúbrica y cumplimiento incompleto", () => {
    const result = validateForPublication({
      ...valid,
      type: "open_response",
      evaluationMode: "ai",
      evaluationConfig: undefined,
      rubric: undefined,
      compliance: { ...valid.compliance, ownWords: false },
    });
    expect(result.valid).toBe(false);
  });
  it("limita importaciones y nunca publica automáticamente", () => {
    const parsed = exerciseImportSchema.parse({
      version: 1,
      exercises: [valid],
    });
    expect(parsed.exercises).toHaveLength(1);
    expect(parsed.exercises[0]).not.toHaveProperty("status");
  });
});
