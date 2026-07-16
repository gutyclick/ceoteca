import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/0037_training_mvp_content_package.sql",
  ),
  "utf8",
);
const integrityMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/0038_training_mvp_content_integrity.sql",
  ),
  "utf8",
);
const finalizationMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/0039_training_mvp_content_finalization.sql",
  ),
  "utf8",
);
const progressionMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/0040_training_mvp_path_progression.sql",
  ),
  "utf8",
);
const qualityMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/0041_training_mvp_editorial_quality.sql",
  ),
  "utf8",
);
const recognitionMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/0042_training_mvp_initial_recognition.sql",
  ),
  "utf8",
);

describe("paquete editorial MVP de Training", () => {
  it("limita el paquete a Marketing y Ventas", () => {
    expect(migration).toContain("Marketing y marca");
    expect(migration).toContain("Ventas y persuasión");
    expect(migration).toContain("construye-una-marca-fuerte");
    expect(migration).toContain("aprende-a-vender");
  });

  it("crea los volúmenes editoriales solicitados", () => {
    expect(migration).toContain("generate_series(1,10)n");
    expect(migration).toContain("generate_series(1,12)n");
    expect(migration).toContain("generate_series(1,8)n");
    expect(migration).toContain("case when m.n<=10 then 2 else 1 end");
  });

  it("usa IDs estables y upserts para poder repetirse", () => {
    expect(migration).toContain("training_seed_uuid");
    expect(migration.match(/on conflict/gi)?.length ?? 0).toBeGreaterThan(15);
  });

  it("incluye metadata editorial, evaluación y fuentes", () => {
    for (const field of [
      "objective",
      "commonErrors",
      "editorialSource",
      "ai_rubric",
      "evaluation_config",
      "cognitive_level",
      "minimum_plan",
    ]) {
      expect(migration).toContain(field);
    }
  });

  it("protege Free y mantiene role-play en borrador", () => {
    expect(migration).toContain("n<=5 and variant=1 then 'free'");
    expect(migration).toContain(
      "is_active=false,status='draft',minimum_plan='pro'",
    );
    expect(migration).not.toContain("minimum_plan,'free',10,14");
  });

  it("elimina residuos previos y conserva cuatro actividades por modulo", () => {
    expect(integrityMigration).toContain(
      "'propuesta-de-valor','validacion-avanzada'",
    );
    expect(integrityMigration).toContain("where position<=4");
    expect(integrityMigration).toContain("title like 'MVP%'");
  });

  it("completa el volumen y asegura actividades Free reales", () => {
    expect(finalizationMigration).toContain("generate_series(1,4)n");
    expect(finalizationMigration).toContain("exercise.minimum_plan='free'");
    expect(finalizationMigration).toContain("training_fix_mvp_text");
  });

  it("define progresion cognitiva hasta sintesis", () => {
    for (const level of [
      "recognition",
      "understanding",
      "application",
      "analysis",
      "transfer",
      "synthesis",
    ]) {
      expect(progressionMigration).toContain(`'${level}'`);
    }
  });

  it("corrige duplicados, codificación y gates de la primera unidad", () => {
    expect(qualityMigration).toContain("Foco de esta práctica");
    expect(qualityMigration).toContain("position<=2 then 'free' else 'pro'");
    expect(qualityMigration).toContain("training_fix_mvp_text");
    expect(recognitionMigration).toContain("cognitive_level='recognition'");
  });

  it("solo referencia assets originales y aprobados", () => {
    expect(migration).toContain("'original','approved'");
    expect(migration).toContain("/images/training/mvp/");
    expect(migration).not.toContain("training_exercise_books");
  });
});
