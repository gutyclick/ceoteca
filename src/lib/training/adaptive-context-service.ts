import type { SupabaseClient } from "@supabase/supabase-js";

export type TrainingAdaptiveContext = {
  activeSessionId: string | null;
  activeExerciseIds: Set<string>;
  activePathId: string | null;
  currentModuleId: string | null;
  currentModuleExerciseIds: Set<string>;
  dueReviewKeys: Set<string>;
  weakSkillIds: Set<string>;
  preferredCategoryIds: Set<string>;
  recentFormats: string[];
  interactionHistory: {
    visual: number;
    written: number;
    conversational: number;
  };
};

export class TrainingAdaptiveContextService {
  constructor(private readonly db: SupabaseClient) {}

  async build(userId: string): Promise<TrainingAdaptiveContext> {
    const now = new Date().toISOString();
    const [session, path, reviews, mastery, preferences, answers, roleplays] =
      await Promise.all([
        this.db
          .from("training_sessions")
          .select("id,training_session_exercises(exercise_id)")
          .eq("user_id", userId)
          .eq("status", "in_progress")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        this.db
          .from("user_training_path_progress")
          .select("path_id,current_module_id")
          .eq("user_id", userId)
          .eq("status", "in_progress")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        this.db
          .from("training_review_schedule")
          .select("skill_id,concept_id")
          .eq("user_id", userId)
          .eq("status", "pending")
          .lte("scheduled_for", now),
        this.db
          .from("user_skill_mastery")
          .select("skill_id,mastery_score")
          .eq("user_id", userId)
          .lt("mastery_score", 55),
        this.db
          .from("user_training_preferences")
          .select("preferred_category_ids,preferred_exercise_types")
          .eq("user_id", userId)
          .maybeSingle(),
        this.db
          .from("training_answers")
          .select(
            "created_at,answer,training_session_exercises!inner(exercise_id,exercise_snapshot)",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(40),
        this.db
          .from("training_roleplay_sessions")
          .select("id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(40),
      ]);
    const failed = [
      session,
      path,
      reviews,
      mastery,
      preferences,
      answers,
      roleplays,
    ].find((response) => response.error);
    if (failed?.error) throw failed.error;
    const currentModuleId = path.data?.current_module_id ?? null;
    const moduleItems = currentModuleId
      ? await this.db
          .from("training_learning_path_module_items")
          .select("exercise_id")
          .eq("module_id", currentModuleId)
      : { data: [], error: null };
    if (moduleItems.error) throw moduleItems.error;
    const answerRows = answers.data ?? [];
    const recentFormats: string[] = [];
    let visual = 0;
    let written = 0;
    for (const answer of answerRows) {
      const relation = answer.training_session_exercises as unknown as {
        exercise_snapshot?: { type?: string; format?: string };
      };
      const type = relation.exercise_snapshot?.type ?? "";
      const format = relation.exercise_snapshot?.format;
      if (format) recentFormats.push(format);
      if (type.startsWith("visual_")) visual += 1;
      if (
        [
          "open_response",
          "guided_builder",
          "decision_justification",
          "reflection",
          "message_response",
          "email_rewrite",
        ].includes(type)
      )
        written += 1;
    }
    const activeExercises = (session.data?.training_session_exercises ??
      []) as unknown as Array<{ exercise_id: string }>;
    return {
      activeSessionId: session.data?.id ?? null,
      activeExerciseIds: new Set(
        activeExercises.map((item) => item.exercise_id),
      ),
      activePathId: path.data?.path_id ?? null,
      currentModuleId,
      currentModuleExerciseIds: new Set(
        (moduleItems.data ?? [])
          .map((item) => item.exercise_id)
          .filter(Boolean) as string[],
      ),
      dueReviewKeys: new Set(
        (reviews.data ?? []).map(
          (item) => `${item.skill_id}:${item.concept_id}`,
        ),
      ),
      weakSkillIds: new Set((mastery.data ?? []).map((item) => item.skill_id)),
      preferredCategoryIds: new Set(
        (preferences.data?.preferred_category_ids ?? []) as string[],
      ),
      recentFormats: recentFormats.slice(0, 10),
      interactionHistory: {
        visual,
        written,
        conversational: roleplays.data?.length ?? 0,
      },
    };
  }
}
