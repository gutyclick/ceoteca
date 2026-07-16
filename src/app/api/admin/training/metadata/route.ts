import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
import { serverEnv } from "@/lib/env";
export async function GET(request: NextRequest) {
  const access = await requireEditorialAccess(request, "read");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "No tienes acceso editorial." },
      403,
    );
  const [
    categories,
    subcategories,
    skills,
    concepts,
    formats,
    exercises,
    templates,
    scenarios,
    books,
  ] = await Promise.all([
    access.service
      .from("training_subcategories")
      .select("id,name,slug,category_id")
      .order("sort_order"),
    access.service
      .from("training_categories")
      .select("id,name,slug")
      .eq("is_active", true)
      .order("sort_order"),
    access.service
      .from("training_formats")
      .select("id,name,slug")
      .eq("status", "published")
      .order("name"),
    access.service
      .from("training_exercises")
      .select("id,title,status,minimum_plan,cognitive_level")
      .eq("status", "published")
      .order("title"),
    access.service
      .from("training_templates")
      .select("id,name,status,minimum_plan")
      .eq("status", "published")
      .order("name"),
    access.service
      .from("training_roleplay_scenarios")
      .select("id,public_title,status,minimum_plan,level")
      .eq("status", "published")
      .order("public_title"),
    access.service
      .from("training_skills")
      .select("id,name,slug,category_id")
      .eq("is_active", true)
      .order("name"),
    access.service
      .from("training_concepts")
      .select("id,name,slug,skill_id")
      .eq("is_active", true)
      .order("name"),
    access.service
      .from("books")
      .select("id,title,author")
      .eq("is_published", true)
      .order("title"),
  ]);
  return jsonData({
    categories: categories.data ?? [],
    subcategories: subcategories.data ?? [],
    skills: skills.data ?? [],
    concepts: concepts.data ?? [],
    formats: formats.data ?? [],
    exercises: exercises.data ?? [],
    templates: templates.data ?? [],
    scenarios: scenarios.data ?? [],
    books: books.data ?? [],
    editorialAI: {
      enabled: serverEnv.TRAINING_EDITORIAL_AI_ENABLED,
      exerciseGeneration:
        serverEnv.TRAINING_EDITORIAL_AI_EXERCISE_GENERATION_ENABLED,
      distractors: serverEnv.TRAINING_EDITORIAL_AI_DISTRACTORS_ENABLED,
      feedback: serverEnv.TRAINING_EDITORIAL_AI_FEEDBACK_ENABLED,
      variations: serverEnv.TRAINING_EDITORIAL_AI_VARIATIONS_ENABLED,
      rubrics: serverEnv.TRAINING_EDITORIAL_AI_RUBRICS_ENABLED,
      review: serverEnv.TRAINING_EDITORIAL_AI_REVIEW_ENABLED,
      templates: serverEnv.TRAINING_EDITORIAL_AI_TEMPLATE_SUGGESTION_ENABLED,
      maxExercisesPerJob: serverEnv.TRAINING_EDITORIAL_AI_MAX_EXERCISES_PER_JOB,
    },
  });
}
