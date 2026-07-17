import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createServiceSupabaseClient } from "@/lib/supabase/server";
import {
  canAccessTrainingPath,
  normalizeTrainingPlan,
} from "@/lib/training/path-access";
import type { TrainingAccessState } from "@/lib/training/navigation-model";
import type {
  TrainingPathCardViewModel,
  TrainingPathFilters,
  TrainingPathItemType,
  TrainingPathItemViewModel,
  TrainingPathModuleViewModel,
  TrainingPathPageViewModel,
  TrainingPathsPageViewModel,
  TrainingPathStatus,
} from "@/lib/training/path-model";
import type {
  TrainingDifficulty,
  TrainingPlan,
} from "@/lib/training/taxonomy-model";

type Row = Record<string, unknown>;
const rows = (value: unknown): Row[] =>
  Array.isArray(value) ? (value as Row[]) : [];
const text = (row: Row, key: string) => String(row[key] ?? "");
const number = (row: Row, key: string) => Number(row[key] ?? 0);
const nullableText = (row: Row, key: string) =>
  row[key] == null ? null : String(row[key]);
const normalizeDifficulty = (value: unknown): TrainingDifficulty => {
  const difficulty = String(value ?? "fundamentals");
  if (difficulty === "beginner") return "fundamentals";
  if (difficulty === "intermediate") return "application";
  return ["fundamentals", "application", "advanced", "expert"].includes(
    difficulty,
  )
    ? (difficulty as TrainingDifficulty)
    : "fundamentals";
};

export class TrainingPathEligibilityService {
  resolve(minimumPlan: TrainingPlan, plan: TrainingPlan) {
    const available = canAccessTrainingPath(minimumPlan, plan);
    return {
      accessState: (available ? "available" : "locked") as TrainingAccessState,
      available,
      lockedReason: available
        ? null
        : `Este contenido requiere el plan ${minimumPlan === "pro" ? "Pro" : "Ilimitado"}.`,
    };
  }
}

export class TrainingPathProgressService {
  constructor(private readonly db: SupabaseClient) {}

  async startPath(userId: string, pathId: string) {
    const { data, error } = await this.db.rpc(
      "start_training_learning_path_server",
      {
        p_user_id: userId,
        p_path_id: pathId,
      },
    );
    if (error) throw new Error(`PATH_START_FAILED: ${error.message}`);
    return data;
  }

  async recalculatePathProgress(userId: string, pathId: string) {
    const { data, error } = await this.db.rpc(
      "recalculate_training_learning_path_progress",
      {
        p_user_id: userId,
        p_path_id: pathId,
      },
    );
    if (error) throw new Error(`PATH_RECALCULATION_FAILED: ${error.message}`);
    return data;
  }
}

export class TrainingPathSessionService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly eligibility = new TrainingPathEligibilityService(),
  ) {}

  async startModuleItem(
    userId: string,
    itemId: string,
    plan: TrainingPlan,
    allowAlternative = true,
  ): Promise<{ sessionId: string | null; href: string }> {
    const { data: item, error } = await this.db
      .from("training_learning_path_module_items")
      .select(
        "id,item_type,minimum_plan,alternative_item_id,roleplay_scenario_id",
      )
      .eq("id", itemId)
      .maybeSingle();
    if (error || !item) throw new Error("ITEM_NOT_AVAILABLE");
    const access = this.eligibility.resolve(
      normalizeTrainingPlan(item.minimum_plan),
      plan,
    );
    if (!access.available) throw new Error("PLAN_REQUIRED");
    if (item.item_type === "roleplay") {
      const { data: scenario, error: scenarioError } = await this.db
        .from("training_roleplay_scenarios")
        .select("slug,status")
        .eq("id", item.roleplay_scenario_id)
        .eq("status", "published")
        .maybeSingle();
      if (scenarioError || !scenario) {
        if (allowAlternative && item.alternative_item_id)
          return this.startModuleItem(
            userId,
            String(item.alternative_item_id),
            plan,
            false,
          );
        throw new Error("ITEM_CONTENT_UNAVAILABLE");
      }
      return {
        sessionId: null,
        href: `/ejercicios/simulaciones/escenarios/${scenario.slug}?rutaItem=${item.id}`,
      };
    }
    const { data, error: startError } = await this.db.rpc(
      "start_training_path_item_server",
      { p_user_id: userId, p_item_id: itemId },
    );
    if (startError || !data) {
      if (
        allowAlternative &&
        item.alternative_item_id &&
        (startError?.message.includes("ITEM_RENDERER_UNAVAILABLE") ||
          startError?.message.includes("ITEM_CONTENT_UNAVAILABLE"))
      )
        return this.startModuleItem(
          userId,
          String(item.alternative_item_id),
          plan,
          false,
        );
      throw new Error(startError?.message ?? "ITEM_START_FAILED");
    }
    return { sessionId: String(data), href: `/ejercicios/${data}` };
  }

  async completeModuleItem(
    userId: string,
    itemId: string,
    sourceResult: { type: "training_session"; id: string },
  ) {
    const { data, error } = await this.db
      .from("user_training_path_item_progress")
      .select("status,source_type,source_id")
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .eq("source_type", sourceResult.type)
      .eq("source_id", sourceResult.id)
      .maybeSingle();
    if (error || data?.status !== "completed")
      throw new Error("INVALID_COMPLETION_SOURCE");
    return data;
  }
}

export class TrainingPathService {
  private readonly eligibility = new TrainingPathEligibilityService();
  private readonly progress: TrainingPathProgressService;
  private readonly sessions: TrainingPathSessionService;

  constructor(private readonly db: SupabaseClient) {
    this.progress = new TrainingPathProgressService(db);
    this.sessions = new TrainingPathSessionService(db, this.eligibility);
  }

  async getPaths(
    userId: string,
    plan: TrainingPlan,
    filters: TrainingPathFilters = { progress: "all" },
  ): Promise<TrainingPathsPageViewModel> {
    const [pathResponse, categoryResponse, progressResponse] =
      await Promise.all([
        this.db
          .from("training_learning_paths")
          .select("*")
          .eq("status", "published")
          .order("name"),
        this.db
          .from("training_categories")
          .select("id,slug,name")
          .eq("status", "published")
          .order("sort_order"),
        this.db
          .from("user_training_path_progress")
          .select("path_id,status,progress,current_module_id")
          .eq("user_id", userId),
      ]);
    if (pathResponse.error || categoryResponse.error || progressResponse.error)
      throw (
        pathResponse.error ?? categoryResponse.error ?? progressResponse.error
      );
    const paths = rows(pathResponse.data);
    const pathIds = paths.map((path) => text(path, "id"));
    const [moduleResponse, relationResponse] = await Promise.all([
      this.db
        .from("training_learning_path_modules")
        .select("id,path_id")
        .in("path_id", pathIds)
        .eq("status", "published"),
      this.db
        .from("training_path_categories")
        .select("path_id,category_id")
        .in("path_id", pathIds),
    ]);
    if (moduleResponse.error || relationResponse.error)
      throw moduleResponse.error ?? relationResponse.error;
    const categories = rows(categoryResponse.data);
    const relations = rows(relationResponse.data);
    const progressRows = rows(progressResponse.data);
    const cards = paths.map((path) => {
      const progress = progressRows.find(
        (entry) => text(entry, "path_id") === text(path, "id"),
      );
      const relation = relations.find(
        (entry) => text(entry, "path_id") === text(path, "id"),
      );
      const category = categories.find(
        (entry) => text(entry, "id") === text(relation ?? {}, "category_id"),
      );
      const minimumPlan = normalizeTrainingPlan(path.minimum_plan);
      const access = this.eligibility.resolve(minimumPlan, plan);
      const pathProgress = number(progress ?? {}, "progress");
      const status: TrainingPathStatus = !access.available
        ? "locked"
        : progress?.status === "completed"
          ? "completed"
          : progress
            ? "in_progress"
            : "available";
      return {
        slug: text(path, "slug"),
        name: text(path, "name"),
        promise: text(path, "promise"),
        category: category
          ? { slug: text(category, "slug"), name: text(category, "name") }
          : null,
        difficulty: normalizeDifficulty(path.difficulty),
        estimatedMinutes: number(path, "estimated_minutes"),
        moduleCount: rows(moduleResponse.data).filter(
          (module) => text(module, "path_id") === text(path, "id"),
        ).length,
        progress: pathProgress,
        status,
        accessState: access.accessState,
        minimumPlan,
      } satisfies TrainingPathCardViewModel;
    });
    const filtered = cards.filter((card) => this.matchesFilters(card, filters));
    return {
      recommended: filtered
        .filter((card) => card.status === "available")
        .slice(0, 3),
      inProgress: filtered.filter((card) => card.status === "in_progress"),
      paths: filtered,
      categories: categories.map((category) => ({
        slug: text(category, "slug"),
        name: text(category, "name"),
      })),
    };
  }

  async getPathBySlug(
    userId: string,
    plan: TrainingPlan,
    slug: string,
  ): Promise<TrainingPathPageViewModel | null> {
    const { data: path, error } = await this.db
      .from("training_learning_paths")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!path) return null;
    const pathRow = path as Row;
    const pathId = text(pathRow, "id");
    const [
      moduleResponse,
      pathProgressResponse,
      moduleProgressResponse,
      itemProgressResponse,
      categoryResponse,
      skillResponse,
    ] = await Promise.all([
      this.db
        .from("training_learning_path_modules")
        .select("*")
        .eq("path_id", pathId)
        .eq("status", "published")
        .order("sort_order"),
      this.db
        .from("user_training_path_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("path_id", pathId)
        .maybeSingle(),
      this.db
        .from("user_training_path_module_progress")
        .select("*")
        .eq("user_id", userId),
      this.db
        .from("user_training_path_item_progress")
        .select("*")
        .eq("user_id", userId),
      this.db
        .from("training_path_categories")
        .select("training_categories(slug,name)")
        .eq("path_id", pathId)
        .limit(1),
      this.db
        .from("training_path_skills")
        .select("training_skills(slug,name)")
        .eq("path_id", pathId)
        .order("sort_order"),
    ]);
    const queryError =
      moduleResponse.error ??
      pathProgressResponse.error ??
      moduleProgressResponse.error ??
      itemProgressResponse.error ??
      categoryResponse.error ??
      skillResponse.error;
    if (queryError) throw queryError;
    const modulesRaw = rows(moduleResponse.data);
    const moduleIds = modulesRaw.map((module) => text(module, "id"));
    const { data: itemData, error: itemError } = await this.db
      .from("training_learning_path_module_items")
      .select("*")
      .in("module_id", moduleIds)
      .order("sort_order");
    if (itemError) throw itemError;
    const itemsRaw = rows(itemData);
    const exerciseIds = itemsRaw.flatMap((item) =>
      nullableText(item, "exercise_id") ? [text(item, "exercise_id")] : [],
    );
    const { data: exerciseData, error: exerciseError } = exerciseIds.length
      ? await this.db
          .from("training_exercises")
          .select("id,title,instruction,estimated_seconds,status,minimum_plan")
          .in("id", exerciseIds)
          .eq("status", "published")
      : { data: [], error: null };
    if (exerciseError) throw exerciseError;
    const itemProgress = rows(itemProgressResponse.data);
    const moduleProgress = rows(moduleProgressResponse.data);
    const started = Boolean(pathProgressResponse.data);
    const modules = modulesRaw.map((module, index) => {
      const progress = moduleProgress.find(
        (entry) => text(entry, "module_id") === text(module, "id"),
      );
      const status = (progress?.status ??
        (started && index === 0
          ? "available"
          : "locked")) as TrainingPathModuleViewModel["status"];
      const moduleItems = itemsRaw.filter(
        (item) => text(item, "module_id") === text(module, "id"),
      );
      const items = moduleItems.map((item) =>
        this.itemViewModel(
          item,
          rows(exerciseData),
          itemProgress,
          status,
          plan,
        ),
      );
      return {
        id: text(module, "id"),
        slug: text(module, "slug"),
        title: text(module, "title"),
        description: text(module, "description"),
        progress: number(progress ?? {}, "progress"),
        status,
        estimatedMinutes: number(module, "estimated_minutes"),
        itemCount: items.length,
        items,
        lockedReason:
          status === "locked"
            ? (nullableText(module, "locked_reason") ??
              "Completa el módulo anterior para continuar.")
            : null,
      } satisfies TrainingPathModuleViewModel;
    });
    const minimumPlan = normalizeTrainingPlan(pathRow.minimum_plan);
    const access = this.eligibility.resolve(minimumPlan, plan);
    const categoryJoin = rows(categoryResponse.data)[0]?.training_categories as
      Row | undefined;
    const card: TrainingPathCardViewModel = {
      slug,
      name: text(pathRow, "name"),
      promise: text(pathRow, "promise"),
      category: categoryJoin
        ? { slug: text(categoryJoin, "slug"), name: text(categoryJoin, "name") }
        : null,
      difficulty: normalizeDifficulty(pathRow.difficulty),
      estimatedMinutes: number(pathRow, "estimated_minutes"),
      moduleCount: modules.length,
      progress: number((pathProgressResponse.data ?? {}) as Row, "progress"),
      status: !access.available
        ? "locked"
        : pathProgressResponse.data?.status === "completed"
          ? "completed"
          : started
            ? "in_progress"
            : "available",
      accessState: access.accessState,
      minimumPlan,
    };
    const currentModuleId = nullableText(
      (pathProgressResponse.data ?? {}) as Row,
      "current_module_id",
    );
    const currentModule =
      modules.find((module) => module.id === currentModuleId) ??
      modules.find(
        (module) =>
          module.status === "available" || module.status === "in_progress",
      ) ??
      null;
    const nextItem =
      currentModule?.items.find(
        (item) => item.status !== "completed" && item.status !== "locked",
      ) ?? null;
    const nextAction = !access.available
      ? ({
          label: "Ver planes",
          kind: "upgrade",
          href: "/planes",
          moduleId: null,
          itemId: null,
        } as const)
      : card.status === "completed"
        ? ({
            label: "Repasar ruta",
            kind: "review",
            href: null,
            moduleId: modules[0]?.id ?? null,
            itemId: modules[0]?.items[0]?.id ?? null,
          } as const)
        : started
          ? ({
              label: "Continuar ruta",
              kind: "continue",
              href: nextItem?.href ?? null,
              moduleId: currentModule?.id ?? null,
              itemId: nextItem?.id ?? null,
            } as const)
          : ({
              label: "Comenzar ruta",
              kind: "start",
              href: null,
              moduleId: modules[0]?.id ?? null,
              itemId: modules[0]?.items[0]?.id ?? null,
            } as const);
    return {
      path: {
        ...card,
        description: text(pathRow, "description"),
        expectedOutcome: text(pathRow, "expected_outcome"),
        requirements: [
          "Completa los ítems requeridos en orden.",
          "Algunos módulos pueden exigir dominio mínimo.",
        ],
      },
      progress: card.progress,
      currentModule,
      modules,
      relatedSkills: rows(skillResponse.data).flatMap((entry) => {
        const skill = entry.training_skills as Row | undefined;
        return skill
          ? [{ slug: text(skill, "slug"), name: text(skill, "name") }]
          : [];
      }),
      relatedBooks: [],
      accessState: access.accessState,
      nextAction,
    };
  }

  async startPath(userId: string, plan: TrainingPlan, slug: string) {
    const { data: path, error } = await this.db
      .from("training_learning_paths")
      .select("id,minimum_plan,status")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !path) throw new Error("PATH_NOT_FOUND");
    if (
      !this.eligibility.resolve(normalizeTrainingPlan(path.minimum_plan), plan)
        .available
    )
      throw new Error("PLAN_REQUIRED");
    await this.progress.startPath(userId, String(path.id));
    return this.getPathBySlug(userId, plan, slug);
  }

  async continuePath(userId: string, plan: TrainingPlan, slug: string) {
    const page = await this.getPathBySlug(userId, plan, slug);
    if (!page) throw new Error("PATH_NOT_FOUND");
    if (page.path.status === "available")
      return this.startPath(userId, plan, slug);
    return page;
  }

  async getModule(userId: string, plan: TrainingPlan, moduleId: string) {
    const { data: module, error } = await this.db
      .from("training_learning_path_modules")
      .select("path_id")
      .eq("id", moduleId)
      .eq("status", "published")
      .maybeSingle();
    if (error || !module) return null;
    const { data: path } = await this.db
      .from("training_learning_paths")
      .select("slug")
      .eq("id", module.path_id)
      .eq("status", "published")
      .maybeSingle();
    if (!path) return null;
    const page = await this.getPathBySlug(userId, plan, String(path.slug));
    return page?.modules.find((entry) => entry.id === moduleId) ?? null;
  }

  startModuleItem(userId: string, itemId: string, plan: TrainingPlan) {
    return this.sessions.startModuleItem(userId, itemId, plan);
  }

  recalculatePathProgress(userId: string, pathId: string) {
    return this.progress.recalculatePathProgress(userId, pathId);
  }

  private matchesFilters(
    card: TrainingPathCardViewModel,
    filters: TrainingPathFilters,
  ) {
    if (
      filters.query &&
      !`${card.name} ${card.promise}`
        .toLocaleLowerCase("es")
        .includes(filters.query.toLocaleLowerCase("es"))
    )
      return false;
    if (filters.category && card.category?.slug !== filters.category)
      return false;
    if (filters.difficulty && card.difficulty !== filters.difficulty)
      return false;
    if (filters.plan && card.minimumPlan !== filters.plan) return false;
    if (filters.progress && filters.progress !== "all") {
      if (
        filters.progress === "not_started" &&
        !["available", "locked"].includes(card.status)
      )
        return false;
      if (
        filters.progress !== "not_started" &&
        card.status !== filters.progress
      )
        return false;
    }
    return true;
  }

  private itemViewModel(
    item: Row,
    exercises: Row[],
    progressRows: Row[],
    moduleStatus: TrainingPathModuleViewModel["status"],
    plan: TrainingPlan,
  ): TrainingPathItemViewModel {
    const exercise = exercises.find(
      (entry) => text(entry, "id") === text(item, "exercise_id"),
    );
    const progress = progressRows.find(
      (entry) => text(entry, "item_id") === text(item, "id"),
    );
    const minimumPlan = normalizeTrainingPlan(
      item.minimum_plan ?? exercise?.minimum_plan,
    );
    const access = this.eligibility.resolve(minimumPlan, plan);
    const available =
      moduleStatus !== "locked" &&
      access.available &&
      Boolean(
        exercise ||
        item.item_type === "roleplay" ||
        item.item_type === "template",
      );
    const status =
      progress?.status === "completed"
        ? "completed"
        : progress?.status === "in_progress"
          ? "in_progress"
          : available
            ? "available"
            : "locked";
    const type = text(item, "item_type") as TrainingPathItemType;
    return {
      id: text(item, "id"),
      title: text(exercise ?? {}, "title") || this.itemTypeLabel(type),
      description:
        text(exercise ?? {}, "instruction") ||
        "Actividad práctica de este módulo.",
      type,
      estimatedMinutes: Math.max(
        1,
        Math.ceil(number(exercise ?? {}, "estimated_seconds") / 60),
      ),
      required: Boolean(item.is_required),
      status,
      accessState: available ? "available" : "locked",
      minimumPlan,
      lockedReason:
        status === "locked"
          ? (nullableText(item, "locked_reason") ??
            access.lockedReason ??
            (moduleStatus === "locked"
              ? "Completa el módulo anterior."
              : "Esta actividad no está disponible."))
          : null,
      href:
        progress?.source_id && progress.status === "in_progress"
          ? `/ejercicios/${text(progress, "source_id")}`
          : null,
    };
  }

  private itemTypeLabel(type: TrainingPathItemType) {
    const labels: Record<TrainingPathItemType, string> = {
      exercise: "Ejercicio práctico",
      review: "Repaso guiado",
      skill_session: "Sesión de habilidad",
      concept_session: "Sesión de concepto",
      template: "Plantilla aplicada",
      roleplay: "Simulación conversacional",
    };
    return labels[type];
  }
}

export function getTrainingPathService() {
  return new TrainingPathService(
    createServiceSupabaseClient() as unknown as SupabaseClient,
  );
}
