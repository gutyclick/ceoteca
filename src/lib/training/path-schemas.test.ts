import { describe, expect, it } from "vitest";

import {
  canAccessTrainingPath,
  normalizeTrainingPlan,
} from "@/lib/training/path-access";
import {
  trainingPathFiltersSchema,
  trainingPathItemIdSchema,
  trainingPathSlugSchema,
} from "@/lib/training/path-schemas";

describe("contratos de rutas de aprendizaje", () => {
  it("normaliza filtros válidos y valores vacíos", () => {
    expect(
      trainingPathFiltersSchema.parse({
        q: "marca",
        category: "marketing",
        difficulty: "application",
        progress: "in_progress",
        plan: "pro",
      }),
    ).toEqual({
      q: "marca",
      category: "marketing",
      difficulty: "application",
      progress: "in_progress",
      plan: "pro",
    });
    expect(trainingPathFiltersSchema.parse({})).toEqual({ progress: "all" });
  });

  it("rechaza identificadores, slugs y filtros no permitidos", () => {
    expect(() => trainingPathItemIdSchema.parse("item-falso")).toThrow();
    expect(() => trainingPathSlugSchema.parse("Ruta Con Espacios")).toThrow();
    expect(() =>
      trainingPathFiltersSchema.parse({ difficulty: "admin" }),
    ).toThrow();
  });

  it("resuelve acceso por plan sin aceptar datos del cliente", () => {
    expect(canAccessTrainingPath("free", "free")).toBe(true);
    expect(canAccessTrainingPath("pro", "free")).toBe(false);
    expect(canAccessTrainingPath("pro", "unlimited")).toBe(true);
    expect(normalizeTrainingPlan("founder")).toBe("pro");
    expect(normalizeTrainingPlan("owner")).toBe("free");
  });
});
