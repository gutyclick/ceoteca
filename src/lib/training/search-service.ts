import type { SupabaseClient } from "@supabase/supabase-js";

import type { TrainingPlan } from "@/lib/training/taxonomy-model";
import type {
  TrainingSearchQuery,
  TrainingSearchResultViewModel,
} from "@/lib/training/search-schemas";

type Row = Record<string, unknown>;
const ranks: Record<TrainingPlan, number> = { free: 0, pro: 1, unlimited: 2 };
const text = (value: unknown) => (typeof value === "string" ? value : "");
const plan = (value: unknown): TrainingPlan =>
  value === "unlimited" ? "unlimited" : value === "pro" ? "pro" : "free";
const safeTerm = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s\-'$]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);

function nested(value: unknown): Row | null {
  if (Array.isArray(value)) return (value[0] as Row | undefined) ?? null;
  return value && typeof value === "object" ? (value as Row) : null;
}

export class TrainingSearchService {
  constructor(private readonly db: SupabaseClient) {}

  async search(input: TrainingSearchQuery, userPlan: TrainingPlan) {
    const term = safeTerm(input.q);
    const match = `%${term}%`;
    const include = (type: TrainingSearchResultViewModel["type"]) =>
      !input.type || input.type === type;
    const queries: Array<
      PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>
    > = [];
    const types: TrainingSearchResultViewModel["type"][] = [];
    const add = (
      type: TrainingSearchResultViewModel["type"],
      query: PromiseLike<{
        data: unknown[] | null;
        error: { message: string } | null;
      }>,
    ) => {
      if (include(type)) {
        types.push(type);
        queries.push(query);
      }
    };

    add(
      "category",
      this.db
        .from("training_categories")
        .select("id,slug,name,short_description,description,minimum_plan")
        .eq("status", "published")
        .or(`name.ilike.${match},description.ilike.${match}`)
        .limit(60),
    );
    add(
      "subcategory",
      this.db
        .from("training_subcategories")
        .select(
          "id,slug,name,description,minimum_plan,training_categories!inner(slug,name)",
        )
        .eq("status", "published")
        .or(`name.ilike.${match},description.ilike.${match}`)
        .limit(60),
    );
    add(
      "skill",
      this.db
        .from("training_skills")
        .select(
          "id,slug,name,description,minimum_plan,difficulty_start,training_categories!inner(slug,name)",
        )
        .eq("status", "published")
        .or(`name.ilike.${match},description.ilike.${match}`)
        .limit(60),
    );
    add(
      "concept",
      this.db
        .from("training_concepts")
        .select(
          "id,slug,name,description,editorial_summary,minimum_plan,recommended_cognitive_level,training_skills!inner(slug,name,training_categories(slug,name))",
        )
        .eq("status", "published")
        .or(`name.ilike.${match},description.ilike.${match}`)
        .limit(60),
    );
    add(
      "path",
      this.db
        .from("training_learning_paths")
        .select(
          "id,slug,name,promise,description,minimum_plan,difficulty,estimated_minutes,training_path_categories(training_categories(slug,name))",
        )
        .eq("status", "published")
        .or(
          `name.ilike.${match},description.ilike.${match},promise.ilike.${match}`,
        )
        .limit(60),
    );
    add(
      "exercise",
      this.db
        .from("training_exercises")
        .select(
          "id,title,instruction,minimum_plan,difficulty,estimated_seconds,type,training_skills!inner(slug,name,training_categories(slug,name)),training_exercise_formats(is_primary,training_formats(slug,name,training_mode_formats(training_modes(slug,name))))",
        )
        .eq("status", "published")
        .or(`title.ilike.${match},instruction.ilike.${match}`)
        .limit(60),
    );
    add(
      "book",
      this.db
        .from("books")
        .select("id,slug,title,author,description,category,reading_time")
        .eq("is_published", true)
        .or(
          `title.ilike.${match},author.ilike.${match},description.ilike.${match}`,
        )
        .limit(60),
    );
    add(
      "simulation",
      this.db
        .from("training_roleplay_scenarios")
        .select(
          "id,slug,public_title,short_description,minimum_plan,level,estimated_minutes,training_roleplay_categories(slug,name)",
        )
        .eq("status", "published")
        .or(`public_title.ilike.${match},short_description.ilike.${match}`)
        .limit(60),
    );

    const responses = await Promise.all(queries);
    const failed = responses.find((response) => response.error);
    if (failed?.error)
      throw new Error(`TRAINING_SEARCH_ERROR:${failed.error.message}`);
    const results: TrainingSearchResultViewModel[] = [];

    responses.forEach((response, index) => {
      const type = types[index];
      for (const raw of response.data ?? []) {
        const row = raw as Row;
        const required = plan(row.minimum_plan);
        const available = ranks[userPlan] >= ranks[required];
        const categoryRelation =
          nested(row.training_categories) ??
          nested(nested(row.training_skills)?.training_categories) ??
          nested(nested(row.training_roleplay_categories));
        const pathCategory = nested(
          nested(row.training_path_categories)?.training_categories,
        );
        const category =
          text(categoryRelation?.slug || pathCategory?.slug || row.category) ||
          null;
        const formats = Array.isArray(row.training_exercise_formats)
          ? (row.training_exercise_formats as Row[])
          : [];
        const primaryFormat = nested(
          formats.find((item) => item.is_primary)?.training_formats ??
            formats[0]?.training_formats,
        );
        const modeRelation = nested(
          nested(primaryFormat?.training_mode_formats)?.training_modes,
        );
        const slug = text(row.slug) || text(row.id);
        const title =
          text(row.name) || text(row.public_title) || text(row.title);
        const description =
          text(row.short_description) ||
          text(row.promise) ||
          text(row.editorial_summary) ||
          text(row.description) ||
          text(row.instruction) ||
          text(row.author);
        const href =
          type === "category"
            ? `/ejercicios/categorias/${slug}`
            : type === "skill"
              ? `/ejercicios/habilidades/${slug}`
              : type === "path"
                ? `/ejercicios/rutas/${slug}`
                : type === "book"
                  ? `/libro/${slug}`
                  : type === "simulation"
                    ? `/ejercicios/simulaciones/escenarios/${slug}`
                    : type === "exercise"
                      ? `/ejercicios?ejercicio=${slug}`
                      : `/training/search?tipo=${type}&q=${encodeURIComponent(title)}`;
        results.push({
          id: text(row.id),
          type,
          title,
          description: available
            ? description
            : "Contenido disponible al mejorar tu plan.",
          preview: description.slice(0, available ? 220 : 90),
          href,
          category,
          mode: text(modeRelation?.slug) || null,
          format:
            text(primaryFormat?.slug) ||
            (type === "simulation" ? "conversational-roleplay" : null),
          difficulty:
            text(row.difficulty_start) ||
            text(row.recommended_cognitive_level) ||
            text(row.difficulty) ||
            text(row.level) ||
            null,
          minimumPlan: required,
          access: available ? "available" : "locked",
        });
      }
    });

    const filtered = results.filter((result) => {
      if (input.category && result.category !== input.category) return false;
      if (input.mode && result.mode !== input.mode) return false;
      if (input.format && result.format !== input.format) return false;
      if (input.difficulty && result.difficulty !== input.difficulty)
        return false;
      if (input.plan && result.minimumPlan !== input.plan) return false;
      return true;
    });
    const start = (input.page - 1) * input.pageSize;
    return {
      results: filtered.slice(start, start + input.pageSize),
      total: filtered.length,
      page: input.page,
      pageSize: input.pageSize,
      pages: Math.max(1, Math.ceil(filtered.length / input.pageSize)),
    };
  }
}
