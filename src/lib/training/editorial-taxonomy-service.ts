import type { SupabaseClient } from "@supabase/supabase-js";

import { TrainingAuditService } from "@/lib/training/editorial-audit-service";
import type {
  EditorialResourceType,
  TaxonomyDraft,
} from "@/lib/training/editorial-content-schemas";
import { taxonomyDraftSchema } from "@/lib/training/editorial-content-schemas";
import { TrainingVersioningService } from "@/lib/training/editorial-versioning-service";

type Row = Record<string, unknown>;
type TaxonomyResource = Exclude<EditorialResourceType, "paths">;

const resourceConfig: Record<
  TaxonomyResource,
  { table: string; entityType: string }
> = {
  categories: { table: "training_categories", entityType: "category" },
  subcategories: { table: "training_subcategories", entityType: "subcategory" },
  skills: { table: "training_skills", entityType: "skill" },
  concepts: { table: "training_concepts", entityType: "concept" },
  formats: { table: "training_formats", entityType: "format" },
};

function toDraft(
  resource: TaxonomyResource,
  row: Row,
  relations: { bookIds: string[]; prerequisiteIds: string[] },
): TaxonomyDraft {
  return taxonomyDraftSchema.parse({
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    shortDescription: row.short_description ?? "",
    icon: row.icon ?? "book-open",
    sortOrder: row.sort_order ?? 0,
    minimumPlan: row.minimum_plan ?? "free",
    categoryId: row.category_id ?? null,
    subcategoryId: row.subcategory_id ?? null,
    skillId: row.skill_id ?? null,
    learningObjectives: row.learning_objectives ?? [],
    difficultyStart: row.difficulty_start ?? "fundamentals",
    difficultyMax: row.difficulty_max ?? "advanced",
    recommendedCognitiveLevel:
      row.recommended_cognitive_level ?? "understanding",
    promise: "",
    expectedOutcome: "",
    estimatedMinutes: 15,
    difficulty: "fundamentals",
    bookIds: relations.bookIds,
    prerequisiteIds: relations.prerequisiteIds,
    changeReason: "",
    ...(resource === "formats" ? { minimumPlan: "free" } : {}),
  });
}

function toRow(resource: TaxonomyResource, input: TaxonomyDraft): Row {
  const common: Row = {
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    status: "draft",
  };
  if (resource === "categories")
    return {
      ...common,
      is_active: false,
      short_description: input.shortDescription || null,
      icon: input.icon,
      sort_order: input.sortOrder,
      minimum_plan: input.minimumPlan,
    };
  if (resource === "subcategories")
    return {
      ...common,
      category_id: input.categoryId,
      sort_order: input.sortOrder,
      minimum_plan: input.minimumPlan,
    };
  if (resource === "skills")
    return {
      ...common,
      is_active: false,
      category_id: input.categoryId,
      subcategory_id: input.subcategoryId,
      learning_objectives: input.learningObjectives,
      difficulty_start: input.difficultyStart,
      difficulty_max: input.difficultyMax,
      initial_difficulty:
        input.difficultyStart === "advanced" ||
        input.difficultyStart === "expert"
          ? "advanced"
          : input.difficultyStart === "application"
            ? "intermediate"
            : "beginner",
      maximum_difficulty:
        input.difficultyMax === "advanced" || input.difficultyMax === "expert"
          ? "advanced"
          : input.difficultyMax === "application"
            ? "intermediate"
            : "beginner",
      minimum_plan: input.minimumPlan,
    };
  if (resource === "concepts")
    return {
      ...common,
      is_active: false,
      skill_id: input.skillId,
      editorial_summary: input.shortDescription || null,
      recommended_cognitive_level: input.recommendedCognitiveLevel,
      difficulty:
        input.difficulty === "advanced" || input.difficulty === "expert"
          ? "advanced"
          : input.difficulty === "application"
            ? "intermediate"
            : "beginner",
      minimum_plan: input.minimumPlan,
    };
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    icon: input.icon,
    status: "draft",
  };
}

export class TrainingEditorialTaxonomyService {
  private readonly versions: TrainingVersioningService;
  private readonly audit: TrainingAuditService;

  constructor(
    private readonly db: SupabaseClient,
    private readonly actorId: string,
  ) {
    this.versions = new TrainingVersioningService(db, actorId);
    this.audit = new TrainingAuditService(db, actorId);
  }

  async list(resource: TaxonomyResource) {
    const config = resourceConfig[resource];
    const { data, error } = await this.db
      .from(config.table)
      .select("*")
      .order(
        resource === "categories" || resource === "subcategories"
          ? "sort_order"
          : "name",
      );
    if (error) throw error;
    return data ?? [];
  }

  private async relations(resource: TaxonomyResource, id: string) {
    const bookConfig =
      resource === "categories"
        ? ["training_category_books", "category_id"]
        : resource === "skills"
          ? ["training_skill_books", "skill_id"]
          : resource === "concepts"
            ? ["training_concept_books", "concept_id"]
            : null;
    const prerequisiteConfig =
      resource === "skills"
        ? ["training_skill_prerequisites", "skill_id", "prerequisite_skill_id"]
        : resource === "concepts"
          ? [
              "training_concept_prerequisites",
              "concept_id",
              "prerequisite_concept_id",
            ]
          : null;
    const [books, prerequisites] = await Promise.all([
      bookConfig
        ? this.db.from(bookConfig[0]).select("book_id").eq(bookConfig[1], id)
        : Promise.resolve({ data: [], error: null }),
      prerequisiteConfig
        ? this.db
            .from(prerequisiteConfig[0])
            .select(prerequisiteConfig[2])
            .eq(prerequisiteConfig[1], id)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (books.error) throw books.error;
    if (prerequisites.error) throw prerequisites.error;
    return {
      bookIds: ((books.data ?? []) as Row[]).map((entry) =>
        String(entry.book_id),
      ),
      prerequisiteIds: ((prerequisites.data ?? []) as Row[]).map((entry) =>
        String(entry[prerequisiteConfig?.[2] ?? "id"]),
      ),
    };
  }

  private async syncRelations(
    resource: TaxonomyResource,
    id: string,
    input: TaxonomyDraft,
  ) {
    const bookConfig =
      resource === "categories"
        ? ["training_category_books", "category_id"]
        : resource === "skills"
          ? ["training_skill_books", "skill_id"]
          : resource === "concepts"
            ? ["training_concept_books", "concept_id"]
            : null;
    const prerequisiteConfig =
      resource === "skills"
        ? ["training_skill_prerequisites", "skill_id", "prerequisite_skill_id"]
        : resource === "concepts"
          ? [
              "training_concept_prerequisites",
              "concept_id",
              "prerequisite_concept_id",
            ]
          : null;
    if (bookConfig) {
      const { error: deleteError } = await this.db
        .from(bookConfig[0])
        .delete()
        .eq(bookConfig[1], id);
      if (deleteError) throw deleteError;
      if (input.bookIds.length) {
        const { error } = await this.db
          .from(bookConfig[0])
          .insert(
            input.bookIds.map((bookId) => ({
              [bookConfig[1]]: id,
              book_id: bookId,
            })) as never,
          );
        if (error) throw error;
      }
    }
    if (prerequisiteConfig) {
      const { error: deleteError } = await this.db
        .from(prerequisiteConfig[0])
        .delete()
        .eq(prerequisiteConfig[1], id);
      if (deleteError) throw deleteError;
      if (input.prerequisiteIds.length) {
        const { error } = await this.db
          .from(prerequisiteConfig[0])
          .insert(
            input.prerequisiteIds.map((prerequisiteId) => ({
              [prerequisiteConfig[1]]: id,
              [prerequisiteConfig[2]]: prerequisiteId,
              minimum_mastery: 0.6,
            })) as never,
          );
        if (error) throw error;
      }
    }
  }

  async detail(resource: TaxonomyResource, id: string) {
    const config = resourceConfig[resource];
    const { data, error } = await this.db
      .from(config.table)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) throw error ?? new Error("NOT_FOUND");
    const draft = await this.versions.latestDraft(config.entityType, id);
    return {
      id,
      sourceStatus: data.status,
      draft:
        draft?.snapshot ??
        toDraft(resource, data as Row, await this.relations(resource, id)),
      version: draft,
      history: await this.versions.history(config.entityType, id),
    };
  }

  async create(resource: TaxonomyResource, raw: unknown) {
    const input = taxonomyDraftSchema.parse(raw);
    const config = resourceConfig[resource];
    const { data, error } = await this.db
      .from(config.table)
      .insert(toRow(resource, input) as never)
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error("CREATE_FAILED");
    await this.syncRelations(resource, String(data.id), input);
    const version = await this.versions.createDraft({
      entityType: config.entityType,
      entityId: String(data.id),
      snapshot: input,
      reason: input.changeReason,
    });
    await this.audit.record({
      action: "editorial_taxonomy_created",
      entityType: config.entityType,
      entityId: String(data.id),
      version: version.version,
    });
    return { id: data.id, version };
  }

  async save(resource: TaxonomyResource, id: string, raw: unknown) {
    const input = taxonomyDraftSchema.parse(raw);
    const config = resourceConfig[resource];
    const { data: source, error } = await this.db
      .from(config.table)
      .select("id,status")
      .eq("id", id)
      .maybeSingle();
    if (error || !source) throw error ?? new Error("NOT_FOUND");
    if (source.status !== "published") {
      const { error: updateError } = await this.db
        .from(config.table)
        .update(toRow(resource, input))
        .eq("id", id)
        .neq("status", "published");
      if (updateError) throw updateError;
      await this.syncRelations(resource, id, input);
    }
    const version = await this.versions.createDraft({
      entityType: config.entityType,
      entityId: id,
      snapshot: input,
      reason: input.changeReason,
    });
    await this.audit.record({
      action: "editorial_taxonomy_updated",
      entityType: config.entityType,
      entityId: id,
      version: version.version,
    });
    return version;
  }

  async applyPublished(
    resource: TaxonomyResource,
    id: string,
    versionId: string,
  ) {
    const config = resourceConfig[resource];
    const { data: version, error } = await this.db
      .from("training_editorial_versions")
      .select("*")
      .eq("id", versionId)
      .eq("entity_type", config.entityType)
      .eq("entity_id", id)
      .eq("status", "approved")
      .single();
    if (error || !version) throw error ?? new Error("VERSION_NOT_APPROVED");
    const input = taxonomyDraftSchema.parse(version.snapshot);
    const row = {
      ...toRow(resource, input),
      status: "published",
      editorial_version: version.version,
      ...(["categories", "skills", "concepts"].includes(resource)
        ? { is_active: true }
        : {}),
    };
    const { error: updateError } = await this.db
      .from(config.table)
      .update(row)
      .eq("id", id);
    if (updateError) throw updateError;
    await this.syncRelations(resource, id, input);
    await this.versions.markPublished(versionId);
  }

  async archive(resource: TaxonomyResource, id: string) {
    const config = resourceConfig[resource];
    const { error } = await this.db
      .from(config.table)
      .update({
        status: "archived",
        ...(["categories", "skills", "concepts"].includes(resource)
          ? { is_active: false }
          : {}),
      })
      .eq("id", id);
    if (error) throw error;
    await this.audit.record({
      action: "editorial_content_archived",
      entityType: config.entityType,
      entityId: id,
    });
  }

  async duplicate(resource: TaxonomyResource, id: string) {
    const detail = await this.detail(resource, id);
    const draft = taxonomyDraftSchema.parse(detail.draft);
    return this.create(resource, {
      ...draft,
      name: `Copia de ${draft.name}`,
      slug: `${draft.slug}-copia-${Date.now().toString().slice(-6)}`,
      changeReason: "Duplicación editorial",
    });
  }
}
