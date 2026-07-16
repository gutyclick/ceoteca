import type { SupabaseClient } from "@supabase/supabase-js";

import { TrainingAuditService } from "@/lib/training/editorial-audit-service";
import {
  editorialPathDraftSchema,
  type EditorialPathDraft,
} from "@/lib/training/editorial-content-schemas";
import { TrainingVersioningService } from "@/lib/training/editorial-versioning-service";

type Row = Record<string, unknown>;

function pathRow(
  input: EditorialPathDraft,
  status: "draft" | "published" = "draft",
) {
  return {
    name: input.name,
    slug: input.slug,
    promise: input.promise,
    description: input.description,
    expected_outcome: input.expectedOutcome,
    estimated_minutes: input.estimatedMinutes,
    difficulty:
      input.difficulty === "fundamentals"
        ? "beginner"
        : input.difficulty === "application"
          ? "intermediate"
          : "advanced",
    minimum_plan: input.minimumPlan,
    status,
    updated_at: new Date().toISOString(),
  };
}

function referenceColumns(
  item: EditorialPathDraft["modules"][number]["items"][number],
) {
  return {
    exercise_id:
      item.itemType === "exercise" || item.itemType === "review"
        ? item.referenceId
        : null,
    skill_id: item.itemType === "skill_session" ? item.referenceId : null,
    concept_id: item.itemType === "concept_session" ? item.referenceId : null,
    template_id: item.itemType === "template" ? item.referenceId : null,
    roleplay_scenario_id:
      item.itemType === "roleplay" ? item.referenceId : null,
  };
}

export class TrainingEditorialPathService {
  private readonly versions: TrainingVersioningService;
  private readonly audit: TrainingAuditService;

  constructor(
    private readonly db: SupabaseClient,
    private readonly actorId: string,
  ) {
    this.versions = new TrainingVersioningService(db, actorId);
    this.audit = new TrainingAuditService(db, actorId);
  }

  async list() {
    const { data, error } = await this.db
      .from("training_learning_paths")
      .select(
        "id,name,slug,promise,status,minimum_plan,difficulty,estimated_minutes,version,updated_at",
      )
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  private async sourceSnapshot(
    id: string,
    row: Row,
  ): Promise<EditorialPathDraft> {
    const [
      { data: modules, error: moduleError },
      { data: categories },
      { data: skills },
    ] = await Promise.all([
      this.db
        .from("training_learning_path_modules")
        .select("*,training_learning_path_module_items(*)")
        .eq("path_id", id)
        .order("sort_order"),
      this.db
        .from("training_path_categories")
        .select("category_id")
        .eq("path_id", id),
      this.db
        .from("training_path_skills")
        .select("skill_id")
        .eq("path_id", id)
        .order("sort_order"),
    ]);
    if (moduleError) throw moduleError;
    return editorialPathDraftSchema.parse({
      name: row.name,
      slug: row.slug,
      description: row.description,
      shortDescription: "",
      icon: "route",
      sortOrder: 0,
      minimumPlan: row.minimum_plan,
      promise: row.promise,
      expectedOutcome: row.expected_outcome,
      estimatedMinutes: row.estimated_minutes,
      difficulty: String(row.difficulty)
        .replace("beginner", "fundamentals")
        .replace("intermediate", "application"),
      categoryIds: (categories ?? []).map((item) => item.category_id),
      skillIds: (skills ?? []).map((item) => item.skill_id),
      modules: (modules ?? []).map((module) => ({
        id: module.id,
        slug: module.slug,
        title: module.title,
        description: module.description ?? "",
        sortOrder: module.sort_order,
        estimatedMinutes: module.estimated_minutes ?? 1,
        minimumPlan: module.minimum_plan,
        items: ((module.training_learning_path_module_items ?? []) as Row[])
          .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
          .map((item) => ({
            id: String(item.id),
            itemType: item.item_type,
            referenceId:
              item.exercise_id ??
              item.skill_id ??
              item.concept_id ??
              item.template_id ??
              item.roleplay_scenario_id,
            sortOrder: item.sort_order,
            isRequired: item.is_required,
            minimumMastery: item.minimum_mastery,
            minimumPlan: item.minimum_plan ?? "free",
            previewAllowed: item.preview_allowed ?? false,
            alternativeItemId: item.alternative_item_id ?? null,
          })),
      })),
      bookIds: [],
      prerequisiteIds: [],
      changeReason: "",
    });
  }

  async detail(id: string) {
    const { data, error } = await this.db
      .from("training_learning_paths")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) throw error ?? new Error("NOT_FOUND");
    const draft = await this.versions.latestDraft("path", id);
    return {
      id,
      sourceStatus: data.status,
      draft: draft?.snapshot ?? (await this.sourceSnapshot(id, data as Row)),
      version: draft,
      history: await this.versions.history("path", id),
    };
  }

  async create(raw: unknown) {
    const input = editorialPathDraftSchema.parse(raw);
    const { data, error } = await this.db
      .from("training_learning_paths")
      .insert({ ...pathRow(input), created_by: this.actorId })
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error("CREATE_FAILED");
    const version = await this.versions.createDraft({
      entityType: "path",
      entityId: String(data.id),
      snapshot: input,
      reason: input.changeReason,
    });
    await this.audit.record({
      action: "editorial_path_created",
      entityType: "path",
      entityId: String(data.id),
      version: version.version,
    });
    return { id: data.id, version };
  }

  async save(id: string, raw: unknown) {
    const input = editorialPathDraftSchema.parse(raw);
    const { data, error } = await this.db
      .from("training_learning_paths")
      .select("id,status")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) throw error ?? new Error("NOT_FOUND");
    if (data.status !== "published") {
      const { error: updateError } = await this.db
        .from("training_learning_paths")
        .update(pathRow(input))
        .eq("id", id)
        .neq("status", "published");
      if (updateError) throw updateError;
    }
    const version = await this.versions.createDraft({
      entityType: "path",
      entityId: id,
      snapshot: input,
      reason: input.changeReason,
    });
    await this.audit.record({
      action: "editorial_path_updated",
      entityType: "path",
      entityId: id,
      version: version.version,
      metadata: { moduleCount: input.modules.length },
    });
    return version;
  }

  async applyPublished(id: string, versionId: string) {
    const { data: version, error } = await this.db
      .from("training_editorial_versions")
      .select("*")
      .eq("id", versionId)
      .eq("entity_type", "path")
      .eq("entity_id", id)
      .eq("status", "approved")
      .single();
    if (error || !version) throw error ?? new Error("VERSION_NOT_APPROVED");
    const input = editorialPathDraftSchema.parse(version.snapshot);
    const { error: pathError } = await this.db
      .from("training_learning_paths")
      .update({ ...pathRow(input, "published"), version: version.version })
      .eq("id", id);
    if (pathError) throw pathError;
    const { data: oldModules, error: oldError } = await this.db
      .from("training_learning_path_modules")
      .select("id")
      .eq("path_id", id);
    if (oldError) throw oldError;
    const retainedIds = new Set(
      input.modules.flatMap((module) => (module.id ? [module.id] : [])),
    );
    const removedIds = (oldModules ?? [])
      .map((module) => String(module.id))
      .filter((moduleId) => !retainedIds.has(moduleId));
    if (removedIds.length) {
      const [{ count: moduleProgress }, { count: currentProgress }] =
        await Promise.all([
          this.db
            .from("user_training_path_module_progress")
            .select("module_id", { count: "exact", head: true })
            .in("module_id", removedIds),
          this.db
            .from("user_training_path_progress")
            .select("current_module_id", { count: "exact", head: true })
            .in("current_module_id", removedIds),
        ]);
      if ((moduleProgress ?? 0) > 0 || (currentProgress ?? 0) > 0)
        throw new Error("MODULE_WITH_USER_PROGRESS");
      const { error: archiveError } = await this.db
        .from("training_learning_path_modules")
        .update({ status: "archived" })
        .in("id", removedIds);
      if (archiveError) throw archiveError;
    }
    for (const pathModule of input.modules.sort(
      (
        a: EditorialPathDraft["modules"][number],
        b: EditorialPathDraft["modules"][number],
      ) => a.sortOrder - b.sortOrder,
    )) {
      const moduleRow = {
        path_id: id,
        slug: pathModule.slug,
        title: pathModule.title,
        description: pathModule.description,
        sort_order: pathModule.sortOrder,
        estimated_minutes: pathModule.estimatedMinutes,
        minimum_plan: pathModule.minimumPlan,
        status: "published",
      };
      const moduleResult = pathModule.id
        ? await this.db
            .from("training_learning_path_modules")
            .update(moduleRow)
            .eq("id", pathModule.id)
            .eq("path_id", id)
            .select("id")
            .single()
        : await this.db
            .from("training_learning_path_modules")
            .insert(moduleRow)
            .select("id")
            .single();
      const { data: createdModule, error: moduleError } = moduleResult;
      if (moduleError || !createdModule)
        throw moduleError ?? new Error("MODULE_CREATE_FAILED");
      const { error: clearItemError } = await this.db
        .from("training_learning_path_module_items")
        .delete()
        .eq("module_id", createdModule.id);
      if (clearItemError) throw clearItemError;
      if (pathModule.items.length) {
        const { error: itemError } = await this.db
          .from("training_learning_path_module_items")
          .insert(
            pathModule.items.map(
              (
                item: EditorialPathDraft["modules"][number]["items"][number],
              ) => ({
                module_id: createdModule.id,
                item_type: item.itemType,
                sort_order: item.sortOrder,
                is_required: item.isRequired,
                minimum_mastery: item.minimumMastery,
                minimum_plan: item.minimumPlan,
                preview_allowed: item.previewAllowed,
                alternative_item_id: item.alternativeItemId ?? null,
                unlock_rule: {},
                ...referenceColumns(item),
              }),
            ),
          );
        if (itemError) throw itemError;
      }
    }
    const relationDeletes = await Promise.all([
      this.db.from("training_path_categories").delete().eq("path_id", id),
      this.db.from("training_path_skills").delete().eq("path_id", id),
    ]);
    const relationDeleteError = relationDeletes.find(
      (result) => result.error,
    )?.error;
    if (relationDeleteError) throw relationDeleteError;
    if (input.categoryIds.length) {
      const { error: categoryError } = await this.db
        .from("training_path_categories")
        .insert(
          input.categoryIds.map((categoryId: string) => ({
            path_id: id,
            category_id: categoryId,
          })),
        );
      if (categoryError) throw categoryError;
    }
    if (input.skillIds.length) {
      const { error: skillError } = await this.db
        .from("training_path_skills")
        .insert(
          input.skillIds.map((skillId: string, index: number) => ({
            path_id: id,
            skill_id: skillId,
            sort_order: index + 1,
          })),
        );
      if (skillError) throw skillError;
    }
    await this.versions.markPublished(versionId);
  }

  async archive(id: string) {
    const { error } = await this.db
      .from("training_learning_paths")
      .update({ status: "archived" })
      .eq("id", id);
    if (error) throw error;
    await this.audit.record({
      action: "editorial_content_archived",
      entityType: "path",
      entityId: id,
    });
  }

  async duplicate(id: string) {
    const detail = await this.detail(id);
    const input = editorialPathDraftSchema.parse(detail.draft);
    return this.create({
      ...input,
      name: `Copia de ${input.name}`,
      slug: `${input.slug}-copia-${Date.now().toString().slice(-6)}`,
      changeReason: "Duplicación editorial",
    });
  }
}
