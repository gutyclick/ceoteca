import type { SupabaseClient } from "@supabase/supabase-js";

import type { TaxonomyValidationIssue } from "@/lib/training/taxonomy-validation";
import { hasPrerequisiteCycle } from "@/lib/training/taxonomy-validation";
import { editorialPathDraftSchema } from "@/lib/training/editorial-content-schemas";

type Row = Record<string, unknown>;

const issue = (
  severity: TaxonomyValidationIssue["severity"],
  code: string,
  entityType: string,
  entityId: string,
  message: string,
): TaxonomyValidationIssue => ({
  severity,
  code,
  entity: entityId,
  entityType,
  entityId,
  message,
});

export class TrainingTaxonomyValidationService {
  constructor(private readonly db: SupabaseClient) {}

  async validateAll() {
    const [
      categories,
      subcategories,
      skills,
      concepts,
      exercises,
      formats,
      paths,
      modules,
      items,
      assets,
      skillPrerequisites,
      conceptPrerequisites,
    ] = await Promise.all([
      this.db.from("training_categories").select("id,slug,status"),
      this.db
        .from("training_subcategories")
        .select("id,slug,category_id,status"),
      this.db
        .from("training_skills")
        .select("id,slug,category_id,subcategory_id,status,minimum_plan"),
      this.db.from("training_concepts").select("id,slug,skill_id,status"),
      this.db
        .from("training_exercises")
        .select("id,concept_id,cognitive_level,status,minimum_plan,type"),
      this.db
        .from("training_exercise_formats")
        .select("exercise_id,is_primary"),
      this.db
        .from("training_learning_paths")
        .select("id,slug,status,minimum_plan"),
      this.db
        .from("training_learning_path_modules")
        .select("id,path_id,status,minimum_plan,sort_order"),
      this.db
        .from("training_learning_path_module_items")
        .select(
          "id,module_id,item_type,exercise_id,skill_id,concept_id,template_id,roleplay_scenario_id,minimum_plan,sort_order",
        ),
      this.db
        .from("training_visual_assets")
        .select("id,copyright_status,alt_text"),
      this.db
        .from("training_skill_prerequisites")
        .select("skill_id,prerequisite_skill_id"),
      this.db
        .from("training_concept_prerequisites")
        .select("concept_id,prerequisite_concept_id"),
    ]);
    const responses = [
      categories,
      subcategories,
      skills,
      concepts,
      exercises,
      formats,
      paths,
      modules,
      items,
      assets,
      skillPrerequisites,
      conceptPrerequisites,
    ];
    const failed = responses.find((response) => response.error);
    if (failed?.error) throw failed.error;
    const issues: TaxonomyValidationIssue[] = [];
    const categoryRows = (categories.data ?? []) as Row[];
    const subcategoryRows = (subcategories.data ?? []) as Row[];
    const skillRows = (skills.data ?? []) as Row[];
    const conceptRows = (concepts.data ?? []) as Row[];
    const exerciseRows = (exercises.data ?? []) as Row[];
    const formatRows = (formats.data ?? []) as Row[];
    const pathRows = (paths.data ?? []) as Row[];
    const moduleRows = (modules.data ?? []) as Row[];
    const itemRows = (items.data ?? []) as Row[];

    for (const category of categoryRows) {
      const id = String(category.id);
      if (!skillRows.some((skill) => skill.category_id === id))
        issues.push(
          issue(
            "error",
            "CATEGORY_WITHOUT_SKILLS",
            "category",
            id,
            "La categoría no tiene habilidades.",
          ),
        );
    }
    for (const subcategory of subcategoryRows) {
      const id = String(subcategory.id);
      if (!skillRows.some((skill) => skill.subcategory_id === id))
        issues.push(
          issue(
            "warning",
            "EMPTY_SUBCATEGORY",
            "subcategory",
            id,
            "La subcategoría no contiene habilidades.",
          ),
        );
    }
    for (const skill of skillRows) {
      const id = String(skill.id);
      if (!conceptRows.some((concept) => concept.skill_id === id))
        issues.push(
          issue(
            "error",
            "SKILL_WITHOUT_CONCEPTS",
            "skill",
            id,
            "La habilidad no contiene conceptos.",
          ),
        );
    }
    for (const concept of conceptRows) {
      const id = String(concept.id);
      if (
        !exerciseRows.some(
          (exercise) =>
            exercise.concept_id === id && exercise.status === "published",
        )
      )
        issues.push(
          issue(
            "warning",
            "CONCEPT_WITHOUT_EXERCISES",
            "concept",
            id,
            "El concepto no tiene ejercicios publicados.",
          ),
        );
    }
    for (const exercise of exerciseRows) {
      const id = String(exercise.id);
      const exerciseFormats = formatRows.filter(
        (format) => format.exercise_id === id,
      );
      if (!exerciseFormats.length)
        issues.push(
          issue(
            "error",
            "EXERCISE_WITHOUT_FORMAT",
            "exercise",
            id,
            "El ejercicio no tiene un formato asociado.",
          ),
        );
      if (!exercise.cognitive_level)
        issues.push(
          issue(
            "error",
            "EXERCISE_WITHOUT_COGNITIVE_LEVEL",
            "exercise",
            id,
            "El ejercicio no tiene nivel cognitivo.",
          ),
        );
    }
    for (const path of pathRows) {
      const id = String(path.id);
      const pathModules = moduleRows.filter(
        (module) => module.path_id === id && module.status !== "archived",
      );
      if (!pathModules.length)
        issues.push(
          issue(
            "error",
            "PATH_WITHOUT_MODULES",
            "path",
            id,
            "La ruta no contiene módulos.",
          ),
        );
      const pathItems = itemRows.filter((item) =>
        pathModules.some((module) => module.id === item.module_id),
      );
      if (
        path.minimum_plan === "free" &&
        pathItems.some((item) => item.item_type === "roleplay")
      )
        issues.push(
          issue(
            "error",
            "ROLEPLAY_IN_FREE_PATH",
            "path",
            id,
            "Una ruta Free no puede contener role-play.",
          ),
        );
      const levels = pathItems
        .map(
          (item) =>
            exerciseRows.find((exercise) => exercise.id === item.exercise_id)
              ?.cognitive_level,
        )
        .filter(Boolean);
      if (
        levels.length >= 4 &&
        levels.filter((level) => level === "recognition").length /
          levels.length >
          0.6
      )
        issues.push(
          issue(
            "warning",
            "EXCESS_RECOGNITION",
            "path",
            id,
            "La ruta depende demasiado de ejercicios de reconocimiento.",
          ),
        );
      if (
        levels.length &&
        !levels.some(
          (level) =>
            level === "application" ||
            level === "analysis" ||
            level === "transfer" ||
            level === "synthesis",
        )
      )
        issues.push(
          issue(
            "warning",
            "NO_HIGHER_COGNITIVE_PRACTICE",
            "path",
            id,
            "La ruta no incluye aplicación ni análisis.",
          ),
        );
    }
    // The database entity is a learning module, not Node's global `module`.
    // eslint-disable-next-line @next/next/no-assign-module-variable
    for (const module of moduleRows) {
      const id = String(module.id);
      if (!itemRows.some((item) => item.module_id === id))
        issues.push(
          issue(
            "error",
            "EMPTY_MODULE",
            "module",
            id,
            "El módulo no contiene actividades.",
          ),
        );
    }
    for (const asset of assets.data ?? []) {
      if (!asset.alt_text?.trim())
        issues.push(
          issue(
            "error",
            "ASSET_WITHOUT_ALT",
            "asset",
            asset.id,
            "El recurso no tiene texto alternativo.",
          ),
        );
      if (asset.copyright_status !== "approved")
        issues.push(
          issue(
            "warning",
            "ASSET_NOT_APPROVED",
            "asset",
            asset.id,
            "El recurso todavía no está aprobado.",
          ),
        );
    }
    const skillEdges = (skillPrerequisites.data ?? []).map((row) => ({
      item: row.skill_id,
      prerequisite: row.prerequisite_skill_id,
    }));
    const conceptEdges = (conceptPrerequisites.data ?? []).map((row) => ({
      item: row.concept_id,
      prerequisite: row.prerequisite_concept_id,
    }));
    if (hasPrerequisiteCycle(skillEdges))
      issues.push(
        issue(
          "error",
          "SKILL_PREREQUISITE_CYCLE",
          "skill",
          "graph",
          "Los prerrequisitos de habilidades contienen un ciclo.",
        ),
      );
    if (hasPrerequisiteCycle(conceptEdges))
      issues.push(
        issue(
          "error",
          "CONCEPT_PREREQUISITE_CYCLE",
          "concept",
          "graph",
          "Los prerrequisitos de conceptos contienen un ciclo.",
        ),
      );
    return issues;
  }

  async validateEntity(entityType: string, entityId: string) {
    return (await this.validateAll()).filter(
      (item) => item.entityType === entityType && item.entityId === entityId,
    );
  }

  async assertPublishable(entityType: string, entityId: string) {
    const errors = (await this.validateEntity(entityType, entityId)).filter(
      (item) => item.severity === "error",
    );
    if (errors.length)
      throw new Error(
        `EDITORIAL_VALIDATION_FAILED:${errors.map((item) => item.code).join(",")}`,
      );
  }

  validatePathDraft(raw: unknown) {
    const parsed = editorialPathDraftSchema.safeParse(raw);
    if (!parsed.success)
      return parsed.error.issues.map(
        (entry: { path: Array<string | number>; message: string }) =>
          issue(
            "error",
            "INVALID_PATH_FIELD",
            "path",
            "draft",
            `${entry.path.join(".")}: ${entry.message}`,
          ),
      );
    const input = parsed.data;
    const issues: TaxonomyValidationIssue[] = [];
    const moduleSlugs = new Set<string>();
    // The draft entity is a learning module, not Node's global `module`.
    // eslint-disable-next-line @next/next/no-assign-module-variable
    for (const module of input.modules) {
      if (moduleSlugs.has(module.slug))
        issues.push(
          issue(
            "error",
            "DUPLICATE_MODULE_SLUG",
            "path",
            "draft",
            `El slug de módulo ${module.slug} está repetido.`,
          ),
        );
      moduleSlugs.add(module.slug);
      if (!module.items.length)
        issues.push(
          issue(
            "error",
            "EMPTY_MODULE",
            "path",
            "draft",
            `El módulo ${module.title} está vacío.`,
          ),
        );
      if (
        input.minimumPlan === "free" &&
        module.items.some((item) => item.itemType === "roleplay")
      )
        issues.push(
          issue(
            "error",
            "ROLEPLAY_IN_FREE_PATH",
            "path",
            "draft",
            "Las rutas Free no pueden incluir role-play.",
          ),
        );
      if (
        module.minimumPlan === "free" &&
        module.items.some(
          (item) =>
            item.minimumPlan !== "free" &&
            !item.previewAllowed &&
            !item.alternativeItemId,
        )
      )
        issues.push(
          issue(
            "error",
            "INVALID_LOCKED_ITEM",
            "path",
            "draft",
            `El módulo ${module.title} contiene contenido bloqueado sin alternativa.`,
          ),
        );
    }
    return issues;
  }
}
