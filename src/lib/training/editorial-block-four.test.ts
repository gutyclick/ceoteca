import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  editorialPathDraftSchema,
  taxonomyDraftSchema,
} from "@/lib/training/editorial-content-schemas";
import { canEditorial } from "@/lib/training/editorial-permissions";
import { TrainingTaxonomyValidationService } from "@/lib/training/editorial-validation-service";
import { trainingSearchQuerySchema } from "@/lib/training/search-schemas";

const uuid = (value: number) =>
  `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;

describe("Bloque 4 editorial", () => {
  it("mantiene permisos separados por rol", () => {
    expect(canEditorial("viewer", "read")).toBe(true);
    expect(canEditorial("viewer", "edit")).toBe(false);
    expect(canEditorial("editor", "create")).toBe(true);
    expect(canEditorial("editor", "archive")).toBe(false);
    expect(canEditorial("reviewer", "review")).toBe(true);
    expect(canEditorial("reviewer", "publish")).toBe(false);
    expect(canEditorial("admin", "publish")).toBe(true);
  });

  it("valida slugs, relaciones y planes en borradores", () => {
    expect(
      taxonomyDraftSchema.safeParse({
        name: "Venta consultiva",
        slug: "Venta Consultiva",
      }).success,
    ).toBe(false);
    expect(
      taxonomyDraftSchema.safeParse({
        name: "Venta consultiva",
        slug: "venta-consultiva",
        minimumPlan: "pro",
        bookIds: [uuid(1)],
      }).success,
    ).toBe(true);
  });

  it("bloquea módulos vacíos y role-play dentro de rutas Free", () => {
    const draft = editorialPathDraftSchema.parse({
      name: "Ruta de ventas",
      slug: "ruta-de-ventas",
      promise: "Entrena conversaciones comerciales",
      expectedOutcome: "Aplica una conversación de venta completa",
      categoryIds: [uuid(1)],
      skillIds: [uuid(2)],
      modules: [
        {
          slug: "inicio",
          title: "Inicio",
          sortOrder: 1,
          estimatedMinutes: 10,
          minimumPlan: "free",
          items: [
            {
              itemType: "roleplay",
              referenceId: uuid(3),
              sortOrder: 1,
              minimumPlan: "pro",
            },
          ],
        },
      ],
    });
    const validator = new TrainingTaxonomyValidationService({} as never);
    const issues = validator.validatePathDraft(draft);
    expect(issues.map((entry) => entry.code)).toContain(
      "ROLEPLAY_IN_FREE_PATH",
    );
  });

  it("normaliza búsqueda, filtros y paginación desde la URL", () => {
    expect(
      trainingSearchQuerySchema.parse({
        q: "ventas",
        type: "skill",
        plan: "pro",
        page: "2",
        pageSize: "12",
      }),
    ).toMatchObject({
      q: "ventas",
      type: "skill",
      plan: "pro",
      page: 2,
      pageSize: 12,
    });
    expect(
      trainingSearchQuerySchema.safeParse({ category: "slug inválido" })
        .success,
    ).toBe(false);
  });

  it("incluye RLS e inmutabilidad para versiones publicadas", () => {
    const migration = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/0036_training_editorial_search_adaptive.sql",
      ),
      "utf8",
    );
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("PUBLISHED_VERSION_IMMUTABLE");
    expect(migration).toContain("revoke insert, update, delete");
  });
});
