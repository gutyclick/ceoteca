import { describe, expect, it } from "vitest";

import {
  trainingCategoryFiltersSchema,
  trainingCategoryPageFiltersSchema,
} from "@/lib/training/navigation-schemas";

describe("training navigation schemas", () => {
  it("acepta filtros públicos conocidos", () => {
    expect(
      trainingCategoryFiltersSchema.parse({
        mode: "analiza",
        progress: "in_progress",
        plan: "pro",
        sort: "progress",
      }),
    ).toEqual({
      mode: "analiza",
      progress: "in_progress",
      plan: "pro",
      sort: "progress",
    });
  });

  it("descarta una query inválida usando valores seguros", () => {
    expect(
      trainingCategoryFiltersSchema.parse({ mode: "admin", plan: "owner" }),
    ).toEqual({ sort: "recommended" });
    expect(
      trainingCategoryPageFiltersSchema.parse({ difficulty: "impossible" }),
    ).toEqual({});
  });
});
