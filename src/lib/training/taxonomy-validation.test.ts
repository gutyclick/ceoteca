import { describe, expect, it } from "vitest";

import { learningPaths, taxonomyCategories } from "@/lib/training/taxonomy";
import {
  hasPrerequisiteCycle,
  validateTaxonomy,
} from "@/lib/training/taxonomy-validation";

describe("taxonomía de Training", () => {
  it("incluye ocho categorías, cinco habilidades y tres conceptos por habilidad", () => {
    expect(taxonomyCategories).toHaveLength(8);
    expect(taxonomyCategories.every((item) => item.skills.length >= 5)).toBe(
      true,
    );
    expect(
      taxonomyCategories.every((item) =>
        item.skills.every((skill) => skill.concepts.length >= 3),
      ),
    ).toBe(true);
  });

  it("incluye ocho rutas válidas", () => {
    expect(learningPaths).toHaveLength(8);
    expect(
      validateTaxonomy(taxonomyCategories, learningPaths).filter(
        (issue) => issue.severity === "error",
      ),
    ).toEqual([]);
  });

  it("detecta ciclos de prerrequisitos", () => {
    expect(
      hasPrerequisiteCycle([
        { item: "b", prerequisite: "a" },
        { item: "c", prerequisite: "b" },
        { item: "a", prerequisite: "c" },
      ]),
    ).toBe(true);
    expect(
      hasPrerequisiteCycle([
        { item: "b", prerequisite: "a" },
        { item: "c", prerequisite: "b" },
      ]),
    ).toBe(false);
  });
});
