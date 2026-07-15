import "server-only";

import { clientEnv, serverEnv } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import type {
  TrainingCategoryPageViewModel,
  TrainingHomeViewModel,
  TrainingModeSlug,
  TrainingSkillPageViewModel,
} from "@/lib/training/navigation-model";
import type {
  TrainingCategoryPageFilters,
  TrainingCategoryFilters,
} from "@/lib/training/navigation-model";
import {
  taxonomyCategories,
  learningPaths,
  cognitiveLevelLabels,
} from "@/lib/training/taxonomy";
import type { TrainingPlan } from "@/lib/training/taxonomy-model";
import {
  SupabaseTrainingFormatRepository,
  SupabaseTrainingLearningPathRepository,
  SupabaseTrainingTaxonomyRepository,
} from "@/lib/training/taxonomy-repositories";
import { TrainingPlanEligibilityService } from "@/lib/training/taxonomy-services";

const modeDescriptions = {
  analiza: "Detecta problemas, compara opciones y desarrolla criterio.",
  construye: "Crea mensajes, estrategias, ofertas y soluciones.",
  practica: "Simula decisiones y situaciones reales.",
} as const;
const modeForSkill = (index: number): TrainingModeSlug[] =>
  index % 3 === 0
    ? ["analiza", "practica"]
    : index % 3 === 1
      ? ["construye"]
      : ["analiza", "construye"];
const modesForExerciseType = (type: string): TrainingModeSlug[] => {
  if (
    [
      "visual_analysis",
      "case_analysis",
      "diagnosis",
      "decision_simulation",
    ].includes(type)
  )
    return ["analiza"];
  if (["written_response", "guided_builder"].includes(type))
    return ["construye"];
  if (
    ["conversational_roleplay", "scenario", "deterministic_practice"].includes(
      type,
    )
  )
    return ["practica"];
  return [];
};
const isUserId = (value: string) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);
type ExerciseSummaryRow = { skill_id: string; type: string };
type MasterySummaryRow = { skill_id: string; mastery_score: number | string };
type SessionSummaryRow = {
  id: string;
  title: string;
  status: string;
  current_exercise_index: number;
  total_exercises: number;
  estimated_minutes: number | null;
  updated_at: string;
};
type CognitiveMasteryRow = {
  cognitive_level: string;
  mastery_score: number | string;
};
type PathContinueRow = {
  path_id: string;
  progress: number | string;
  current_module_id: string | null;
  training_learning_paths: { name: string; slug: string } | Array<{ name: string; slug: string }>;
  training_learning_path_modules: { title: string } | Array<{ title: string }> | null;
};
const relationOne = <T>(value: T | T[] | null | undefined) =>
  Array.isArray(value) ? value[0] : value;
const access = (minimumPlan: TrainingPlan, plan: TrainingPlan) =>
  new TrainingPlanEligibilityService().canView(
    { status: "published", minimumPlan },
    plan,
  )
    ? ("available" as const)
    : ("locked" as const);

export interface TrainingNavigationService {
  getHome(userId: string, plan: TrainingPlan): Promise<TrainingHomeViewModel>;
  getCategories(
    userId: string,
    plan: TrainingPlan,
    filters?: TrainingCategoryFilters,
  ): Promise<TrainingHomeViewModel["categories"]>;
  getCategoryPage(
    userId: string,
    plan: TrainingPlan,
    slug: string,
    filters?: TrainingCategoryPageFilters,
  ): Promise<TrainingCategoryPageViewModel | null>;
  getSkillPage(
    userId: string,
    plan: TrainingPlan,
    slug: string,
  ): Promise<TrainingSkillPageViewModel | null>;
}

export class SupabaseTrainingNavigationService implements TrainingNavigationService {
  private db: ReturnType<typeof createServiceSupabaseClient>;
  private taxonomy;
  private paths;
  constructor() {
    const db = createServiceSupabaseClient();
    this.db = db;
    this.taxonomy = new SupabaseTrainingTaxonomyRepository(db);
    this.paths = new SupabaseTrainingLearningPathRepository(db);
  }
  async getCategories(
    userId: string,
    plan: TrainingPlan,
    filters: TrainingCategoryFilters = {},
  ) {
    const [tree, exerciseResponse, masteryResponse] = await Promise.all([
      this.taxonomy.getTaxonomyTree(),
      this.db
        .from("training_exercises")
        .select("skill_id,type")
        .eq("status", "published"),
      isUserId(userId)
        ? this.db
            .from("user_skill_mastery")
            .select("skill_id,mastery_score")
            .eq("user_id", userId)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (exerciseResponse.error) throw exerciseResponse.error;
    if (masteryResponse.error) throw masteryResponse.error;
    const exercisesBySkill = new Map<string, Array<{ type: string }>>();
    const exerciseRows = (exerciseResponse.data ??
      []) as unknown as ExerciseSummaryRow[];
    const masteryRows = (masteryResponse.data ??
      []) as unknown as MasterySummaryRow[];
    for (const exercise of exerciseRows) {
      const list = exercisesBySkill.get(exercise.skill_id) ?? [];
      list.push({ type: exercise.type });
      exercisesBySkill.set(exercise.skill_id, list);
    }
    const masteryBySkill = new Map(
      masteryRows.map((item) => [item.skill_id, Number(item.mastery_score)]),
    );
    let result = tree.categories.map((category) => ({
      slug: category.slug,
      name: category.name,
      shortDescription:
        category.shortDescription ?? "Entrena habilidades aplicables.",
      description: category.description ?? "",
      icon: category.icon,
      progress: category.skills.length
        ? Math.round(
            category.skills.reduce(
              (sum, skill) => sum + (masteryBySkill.get(skill.id) ?? 0),
              0,
            ) / category.skills.length,
          )
        : 0,
      skillCount: category.skills.length,
      exerciseCount: category.skills.reduce(
        (sum, skill) => sum + (exercisesBySkill.get(skill.id)?.length ?? 0),
        0,
      ),
      highlightedSkills: category.skills.slice(0, 3).map((skill) => skill.name),
      availableModes: Array.from(
        new Set(
          category.skills.flatMap((skill) =>
            (exercisesBySkill.get(skill.id) ?? []).flatMap((exercise) =>
              modesForExerciseType(exercise.type),
            ),
          ),
        ),
      ) as TrainingModeSlug[],
      accessState: !category.skills.length
        ? ("coming_soon" as const)
        : category.skills.every(
              (skill) => access(skill.minimumPlan, plan) === "available",
            )
          ? ("available" as const)
          : category.skills.some(
                (skill) => access(skill.minimumPlan, plan) === "available",
              )
            ? ("partially_available" as const)
            : ("locked" as const),
      minimumPlan: category.minimumPlan,
    }));
    if (filters.mode)
      result = result.filter((item) =>
        item.availableModes.includes(filters.mode!),
      );
    if (filters.plan)
      result = result.filter((item) => item.minimumPlan === filters.plan);
    if (filters.query) {
      const query = filters.query.toLocaleLowerCase("es");
      result = result.filter((item) =>
        `${item.name} ${item.shortDescription}`
          .toLocaleLowerCase("es")
          .includes(query),
      );
    }
    if (filters.sort === "name")
      result.sort((a, b) => a.name.localeCompare(b.name, "es"));
    if (filters.sort === "progress")
      result.sort((a, b) => b.progress - a.progress);
    return result;
  }
  async getHome(
    userId: string,
    plan: TrainingPlan,
  ): Promise<TrainingHomeViewModel> {
    const categories = await this.getCategories(userId, plan);
    const paths = (await this.paths.getPaths({ status: "published" })).slice(
      0,
      3,
    );
    const first = categories.find((item) => item.accessState === "available");
    let sessions: SessionSummaryRow[] = [];
    let reviewsPending = 0;
    let skillsPracticed = 0;
    let minutesTrained = 0;
    let pathContinue: PathContinueRow[] = [];

    if (isUserId(userId)) {
      const [sessionsResponse, reviewsResponse, masteryResponse, pathResponse] =
        await Promise.all([
          this.db
            .from("training_sessions")
            .select(
              "id,title,status,current_exercise_index,total_exercises,estimated_minutes,updated_at",
            )
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(20),
          this.db
            .from("training_review_schedule")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "pending")
            .lte("scheduled_for", new Date().toISOString()),
          this.db
            .from("user_skill_mastery")
            .select("skill_id", { count: "exact", head: true })
            .eq("user_id", userId)
            .gt("total_attempts", 0),
          this.db
            .from("user_training_path_progress")
            .select("path_id,progress,current_module_id,training_learning_paths(name,slug),training_learning_path_modules(title)")
            .eq("user_id", userId)
            .eq("status", "in_progress")
            .order("updated_at", { ascending: false })
            .limit(4),
        ]);
      if (sessionsResponse.error) throw sessionsResponse.error;
      if (reviewsResponse.error) throw reviewsResponse.error;
      if (masteryResponse.error) throw masteryResponse.error;
      if (pathResponse.error) throw pathResponse.error;
      sessions = (sessionsResponse.data ??
        []) as unknown as SessionSummaryRow[];
      reviewsPending = reviewsResponse.count ?? 0;
      skillsPracticed = masteryResponse.count ?? 0;
      minutesTrained = sessions
        .filter((session) => session.status === "completed")
        .reduce((sum, session) => sum + (session.estimated_minutes ?? 0), 0);
      pathContinue = (pathResponse.data ?? []) as unknown as PathContinueRow[];
    }

    const sessionContinueItems = sessions
      .filter((session) =>
        ["not_started", "in_progress"].includes(session.status),
      )
      .slice(0, 2)
      .map((session) => ({
        id: session.id,
        title: session.title,
        progress: session.total_exercises
          ? Math.round(
              (session.current_exercise_index / session.total_exercises) * 100,
            )
          : 0,
        href: `/ejercicios/${session.id}`,
      }));
    const pathContinueItems = pathContinue.map((entry) => {
      const path = relationOne(entry.training_learning_paths);
      const currentModule = relationOne(entry.training_learning_path_modules);
      return {
        id: entry.path_id,
        title: currentModule?.title
          ? `${path?.name}: ${currentModule.title}`
          : path?.name ?? "Ruta en progreso",
        progress: Number(entry.progress),
        href: path?.slug ? `/ejercicios/rutas/${path.slug}` : "/ejercicios/rutas",
      };
    });
    const reviewContinueItems = reviewsPending
      ? [
          {
            id: "pending-reviews",
            title: `${reviewsPending} ${reviewsPending === 1 ? "repaso pendiente" : "repasos pendientes"}`,
            progress: 0,
            href: "/ejercicios?vista=repasos",
          },
        ]
      : [];
    const continueItems = [
      ...sessionContinueItems,
      ...pathContinueItems,
      ...reviewContinueItems,
    ].slice(0, 2);
    return {
      recommendation: first?.highlightedSkills[0]
        ? {
            skillSlug: "",
            title: first.highlightedSkills[0],
            category: first.name,
            reason:
              "Recomendado para empezar a construir criterio con una sesión breve.",
            durationMinutes: 7,
            exerciseCount: null,
            difficulty: "fundamentals",
            accessState: "available",
          }
        : null,
      continueItems,
      modes: (["analiza", "construye", "practica"] as const).map((slug) => ({
        slug,
        name: slug[0].toUpperCase() + slug.slice(1),
        description: modeDescriptions[slug],
        skillCount: categories
          .filter((item) => item.availableModes.includes(slug))
          .reduce((sum, item) => sum + item.skillCount, 0),
        exerciseCount: categories
          .filter((item) => item.availableModes.includes(slug))
          .reduce((sum, item) => sum + (item.exerciseCount ?? 0), 0),
        accessState: "available",
      })),
      categories,
      pathPreviews: await Promise.all(
        paths.map(async (path) => ({
          slug: path.slug,
          name: path.name,
          promise: path.promise,
          estimatedMinutes: path.estimatedMinutes,
          moduleCount: (await this.paths.getModules(path.id)).length,
          minimumPlan: path.minimumPlan,
          accessState: access(path.minimumPlan, plan),
        })),
      ),
      progressSummary: {
        skillsPracticed,
        reviewsPending,
        minutesTrained,
      },
      reviews: {
        pending: reviewsPending,
        label: reviewsPending
          ? `${reviewsPending} por completar`
          : "Estás al día",
      },
      roleplayPreview: null,
    };
  }
  async getCategoryPage(
    userId: string,
    plan: TrainingPlan,
    slug: string,
    filters: TrainingCategoryPageFilters = {},
  ) {
    const category = await this.taxonomy.getCategoryBySlug(slug);
    if (!category) return null;
    const [subcategories, skills] = await Promise.all([
      this.taxonomy.getSubcategories(category.id),
      this.taxonomy.getSkills({ categoryId: category.id, status: "published" }),
    ]);
    const concepts = await Promise.all(
      skills.map((skill) => this.taxonomy.getConcepts(skill.id)),
    );
    const card = (await this.getCategories(userId, plan)).find(
      (item) => item.slug === slug,
    );
    if (!card) return null;
    let trainingItems = skills.map((skill, index) => ({
      slug: skill.slug,
      name: skill.name,
      description:
        skill.description ?? "Entrena esta habilidad en contextos prácticos.",
      subcategoryId: skill.subcategoryId,
      concepts: concepts[index].map((item) => item.name),
      difficulty: skill.difficultyStart,
      minimumPlan: skill.minimumPlan,
      accessState: access(skill.minimumPlan, plan),
    }));
    if (filters.subcategory)
      trainingItems = trainingItems.filter(
        (item) => item.subcategoryId === filters.subcategory,
      );
    if (filters.difficulty)
      trainingItems = trainingItems.filter(
        (item) => item.difficulty === filters.difficulty,
      );
    if (filters.plan)
      trainingItems = trainingItems.filter(
        (item) => item.minimumPlan === filters.plan,
      );
    const { data: pathRelations, error: pathRelationError } = await this.db
      .from("training_path_categories")
      .select("path_id")
      .eq("category_id", category.id);
    if (pathRelationError) throw pathRelationError;
    const categoryPathRelations = (pathRelations ?? []) as unknown as Array<{ path_id: string }>;
    const relatedPaths = (await this.paths.getPaths({ status: "published" })).filter((path) =>
      categoryPathRelations.some((relation) => relation.path_id === path.id),
    );
    return {
      category: card,
      progress: card.progress,
      recommendedSkills: skills.slice(0, 3).map((item) => item.name),
      subcategories: subcategories.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        skillCount: skills.filter((skill) => skill.subcategoryId === item.id)
          .length,
      })),
      trainingItems,
      pathPreviews: await Promise.all(relatedPaths.map(async (path) => ({
        slug: path.slug, name: path.name, promise: path.promise,
        estimatedMinutes: path.estimatedMinutes,
        moduleCount: (await this.paths.getModules(path.id)).length,
        minimumPlan: path.minimumPlan,
        accessState: access(path.minimumPlan, plan),
      }))),
      relatedBooks: [],
      reviews: { pending: 0 },
      roleplays: null,
    };
  }
  async getSkillPage(userId: string, plan: TrainingPlan, slug: string) {
    const skill = await this.taxonomy.getSkillBySlug(slug);
    if (!skill) return null;
    const [concepts, categories, subcategories] = await Promise.all([
      this.taxonomy.getConcepts(skill.id),
      this.taxonomy.getCategories(),
      this.taxonomy.getSubcategories(skill.categoryId),
    ]);
    const category = categories.find((item) => item.id === skill.categoryId);
    if (!category) return null;
    const subcategory = subcategories.find(
      (item) => item.id === skill.subcategoryId,
    );
    let progress = 0;
    let cognitiveRows: CognitiveMasteryRow[] = [];
    let reviewPending = false;
    if (isUserId(userId)) {
      const [masteryResponse, cognitiveResponse, reviewResponse] =
        await Promise.all([
          this.db
            .from("user_skill_mastery")
            .select("mastery_score")
            .eq("user_id", userId)
            .eq("skill_id", skill.id)
            .maybeSingle(),
          this.db
            .from("user_skill_cognitive_mastery")
            .select("cognitive_level,mastery_score")
            .eq("user_id", userId)
            .eq("skill_id", skill.id),
          this.db
            .from("training_review_schedule")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("skill_id", skill.id)
            .eq("status", "pending")
            .lte("scheduled_for", new Date().toISOString()),
        ]);
      if (masteryResponse.error) throw masteryResponse.error;
      if (cognitiveResponse.error) throw cognitiveResponse.error;
      if (reviewResponse.error) throw reviewResponse.error;
      progress = Number(
        (
          masteryResponse.data as unknown as {
            mastery_score?: number | string;
          } | null
        )?.mastery_score ?? 0,
      );
      cognitiveRows = (cognitiveResponse.data ??
        []) as unknown as CognitiveMasteryRow[];
      reviewPending = (reviewResponse.count ?? 0) > 0;
    }
    const { data: exerciseData, error: exerciseError } = await this.db
      .from("training_exercises")
      .select("id")
      .eq("skill_id", skill.id)
      .eq("status", "published");
    if (exerciseError) throw exerciseError;
    const formatRepository = new SupabaseTrainingFormatRepository(this.db);
    const exerciseIds = (exerciseData ?? []) as unknown as Array<{
      id: string;
    }>;
    const formats = (
      await Promise.all(
        exerciseIds.map((exercise) =>
          formatRepository.getExerciseFormats(exercise.id),
        ),
      )
    ).flat();
    const uniqueFormats = Array.from(
      new Map(formats.map((format) => [format.slug, format])).values(),
    );
    const { data: pathRelations, error: pathRelationError } = await this.db
      .from("training_path_skills")
      .select("path_id")
      .eq("skill_id", skill.id);
    if (pathRelationError) throw pathRelationError;
    const skillPathRelations = (pathRelations ?? []) as unknown as Array<{ path_id: string }>;
    const relatedPaths = (await this.paths.getPaths({ status: "published" })).filter((path) =>
      skillPathRelations.some((relation) => relation.path_id === path.id),
    );
    return {
      skill: {
        slug: skill.slug,
        name: skill.name,
        description:
          skill.description ?? "Entrena esta habilidad con ejercicios breves.",
        difficultyStart: skill.difficultyStart,
        difficultyMax: skill.difficultyMax,
        minimumPlan: skill.minimumPlan,
      },
      category: { slug: category.slug, name: category.name },
      subcategory: subcategory
        ? { slug: subcategory.slug, name: subcategory.name }
        : null,
      progress,
      cognitiveProgress: Object.entries(cognitiveLevelLabels).map(
        ([level, label]) => ({
          level:
            level as TrainingSkillPageViewModel["cognitiveProgress"][number]["level"],
          label,
          progress: Number(
            cognitiveRows.find((item) => item.cognitive_level === level)
              ?.mastery_score ?? 0,
          ),
        }),
      ),
      concepts: concepts.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description:
          item.description ??
          item.editorialSummary ??
          "Concepto editorial de CEOTECA.",
      })),
      formats: uniqueFormats.map((format) => ({
        slug: format.slug,
        name: format.name,
      })),
      relatedPaths: relatedPaths.map((path) => ({ slug: path.slug, name: path.name })),
      relatedBooks: [],
      review: { pending: reviewPending },
      accessState: access(skill.minimumPlan, plan),
    };
  }
}

export class StaticTrainingNavigationService implements TrainingNavigationService {
  async getCategories(
    _userId: string,
    plan: TrainingPlan,
    filters: TrainingCategoryFilters = {},
  ) {
    let items = taxonomyCategories.map((category, index) => ({
      slug: category.slug,
      name: category.name,
      shortDescription: category.shortDescription,
      description: category.description,
      icon: category.icon,
      progress: 0,
      skillCount: category.skills.length,
      exerciseCount: null,
      highlightedSkills: category.skills.slice(0, 3).map((item) => item.name),
      availableModes: modeForSkill(index),
      accessState: access("free", plan),
      minimumPlan: "free" as const,
    }));
    if (filters.mode)
      items = items.filter((item) =>
        item.availableModes.includes(filters.mode!),
      );
    if (filters.query) {
      const q = filters.query.toLowerCase();
      items = items.filter((item) =>
        `${item.name} ${item.shortDescription}`.toLowerCase().includes(q),
      );
    }
    if (filters.sort === "name")
      items.sort((a, b) => a.name.localeCompare(b.name, "es"));
    return items;
  }
  async getHome(
    userId: string,
    plan: TrainingPlan,
  ): Promise<TrainingHomeViewModel> {
    const categories = await this.getCategories(userId, plan);
    return {
      recommendation: {
        skillSlug: taxonomyCategories[0].skills[0].slug,
        title: taxonomyCategories[0].skills[0].name,
        category: taxonomyCategories[0].name,
        reason: "Empieza con una sesión corta para descubrir tus fortalezas.",
        durationMinutes: 7,
        exerciseCount: null,
        difficulty: "fundamentals",
        accessState: "available",
      },
      continueItems: [],
      modes: (["analiza", "construye", "practica"] as const).map((slug) => ({
        slug,
        name: slug[0].toUpperCase() + slug.slice(1),
        description: modeDescriptions[slug],
        skillCount: categories
          .filter((item) => item.availableModes.includes(slug))
          .reduce((sum, item) => sum + item.skillCount, 0),
        exerciseCount: null,
        accessState: "available",
      })),
      categories,
      pathPreviews: learningPaths.slice(0, 3).map((path) => ({
        slug: path.slug,
        name: path.name,
        promise: path.promise,
        estimatedMinutes: path.minutes,
        moduleCount: path.modules.length,
        minimumPlan: path.minimumPlan,
        accessState: access(path.minimumPlan, plan),
      })),
      progressSummary: {
        skillsPracticed: 0,
        reviewsPending: 0,
        minutesTrained: 0,
      },
      reviews: { pending: 0, label: "Estás al día" },
      roleplayPreview: null,
    };
  }
  async getCategoryPage(
    userId: string,
    plan: TrainingPlan,
    slug: string,
    _filters: TrainingCategoryPageFilters = {},
  ): Promise<TrainingCategoryPageViewModel | null> {
    void _filters;
    const category = taxonomyCategories.find((item) => item.slug === slug);
    if (!category) return null;
    const card = (await this.getCategories(userId, plan)).find(
      (item) => item.slug === slug,
    )!;
    return {
      category: card,
      progress: 0,
      recommendedSkills: category.skills.slice(0, 3).map((item) => item.name),
      subcategories: category.subcategories.map((name, index) => ({
        id: String(index),
        slug: name.toLowerCase().replaceAll(" ", "-"),
        name,
        skillCount: category.skills.filter(
          (skill) => skill.subcategory === name,
        ).length,
      })),
      trainingItems: category.skills.map((item) => ({
        slug: item.slug,
        name: item.name,
        description: item.description,
        subcategoryId: String(category.subcategories.indexOf(item.subcategory)),
        concepts: item.concepts,
        difficulty: "fundamentals",
        minimumPlan: "free",
        accessState: "available",
      })),
      pathPreviews: [],
      relatedBooks: [],
      reviews: { pending: 0 },
      roleplays: null,
    };
  }
  async getSkillPage(
    _userId: string,
    plan: TrainingPlan,
    slug: string,
  ): Promise<TrainingSkillPageViewModel | null> {
    for (const category of taxonomyCategories) {
      const skill = category.skills.find((item) => item.slug === slug);
      if (skill)
        return {
          skill: {
            slug: skill.slug,
            name: skill.name,
            description: skill.description,
            difficultyStart: "fundamentals",
            difficultyMax: "advanced",
            minimumPlan: "free",
          },
          category: { slug: category.slug, name: category.name },
          subcategory: {
            slug: skill.subcategory.toLowerCase().replaceAll(" ", "-"),
            name: skill.subcategory,
          },
          progress: 0,
          cognitiveProgress: Object.entries(cognitiveLevelLabels).map(
            ([level, label]) => ({
              level:
                level as TrainingSkillPageViewModel["cognitiveProgress"][number]["level"],
              label,
              progress: 0,
            }),
          ),
          concepts: skill.concepts.map((name, index) => ({
            id: String(index),
            slug: name.toLowerCase().replaceAll(" ", "-"),
            name,
            description:
              "Comprende y aplica este concepto en situaciones distintas.",
          })),
          formats: [],
          relatedPaths: [],
          relatedBooks: [],
          review: { pending: false },
          accessState: access("free", plan),
        };
    }
    return null;
  }
}

export function getTrainingNavigationService(): TrainingNavigationService {
  return !clientEnv.NEXT_PUBLIC_DEMO_MODE &&
    clientEnv.NEXT_PUBLIC_TRAINING_DATA_SOURCE === "supabase" &&
    Boolean(serverEnv.SUPABASE_SERVICE_ROLE_KEY)
    ? new SupabaseTrainingNavigationService()
    : new StaticTrainingNavigationService();
}
