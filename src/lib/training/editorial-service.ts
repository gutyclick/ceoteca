import type { SupabaseClient } from "@supabase/supabase-js";
import { auditEditorial } from "@/lib/training/editorial-audit";
import type { ExerciseDraft } from "@/lib/training/editorial-validation";

export class ExerciseEditorService {
  constructor(
    private db: SupabaseClient,
    private actorId: string,
  ) {}
  async list() {
    const { data, error } = await this.db
      .from("training_exercises")
      .select(
        "id,title,type,difficulty,status,version,updated_at,training_skills(name),training_concepts(name)",
      )
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  async create(input: ExerciseDraft) {
    const { data, error } = await this.db
      .from("training_exercises")
      .insert({
        title: input.title,
        type: input.type,
        skill_id: input.skillId,
        concept_id: input.conceptId,
        prompt: input.prompt,
        instruction: input.instruction,
        difficulty: input.difficulty,
        estimated_seconds: input.estimatedSeconds,
        hint: input.hint ?? null,
        explanation: input.explanation,
        content: input.content,
        evaluation_mode: input.evaluationMode,
        ai_rubric: input.rubric ?? null,
        status: "draft",
        created_by: this.actorId,
        editorial_compliance: input.compliance,
      })
      .select("*")
      .single();
    if (error || !data) throw error ?? new Error("CREATE_FAILED");
    if (input.evaluationConfig)
      await this.db
        .from("training_exercise_evaluation_rules")
        .insert({
          exercise_id: data.id,
          evaluation_config: input.evaluationConfig,
        });
    await this.snapshot(data.id, 1, "draft", input.changeReason);
    await auditEditorial(this.db, {
      actorId: this.actorId,
      action: "exercise_created",
      entityType: "exercise",
      entityId: data.id,
      version: 1,
    });
    return data;
  }
  async snapshot(id: string, version: number, status: string, reason?: string) {
    const { data } = await this.db
      .from("training_exercises")
      .select("*")
      .eq("id", id)
      .single();
    if (data)
      await this.db
        .from("training_exercise_versions")
        .insert({
          exercise_id: id,
          version,
          snapshot: data,
          status,
          change_reason: reason ?? null,
          created_by: this.actorId,
        });
  }
  async changeStatus(
    id: string,
    status: "in_review" | "published" | "archived",
  ) {
    const { data: exercise } = await this.db
      .from("training_exercises")
      .select("*")
      .eq("id", id)
      .single();
    if (!exercise) throw new Error("NOT_FOUND");
    if (
      status === "published" &&
      (!exercise.explanation || !exercise.concept_id)
    )
      throw new Error("INVALID_CONTENT");
    const nextVersion =
      status === "published" ? exercise.version + 1 : exercise.version;
    const { error } = await this.db
      .from("training_exercises")
      .update({
        status,
        version: nextVersion,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;
    await this.snapshot(id, nextVersion, status);
    await auditEditorial(this.db, {
      actorId: this.actorId,
      action: `exercise_${status}`,
      entityType: "exercise",
      entityId: id,
      version: nextVersion,
    });
  }
  async duplicate(id: string) {
    const { data } = await this.db
      .from("training_exercises")
      .select("*")
      .eq("id", id)
      .single();
    if (!data) throw new Error("NOT_FOUND");
    const {
      id: _id,
      created_at: _created,
      updated_at: _updated,
      ...copy
    } = data;
    void _id;
    void _created;
    void _updated;
    return this.create({
      title: `Copia de ${copy.title ?? "ejercicio"}`,
      type: copy.type,
      skillId: copy.skill_id,
      conceptId: copy.concept_id,
      prompt: copy.prompt,
      instruction: copy.instruction,
      difficulty: copy.difficulty,
      estimatedSeconds: copy.estimated_seconds ?? 60,
      hint: copy.hint ?? undefined,
      explanation: copy.explanation,
      content: copy.content,
      evaluationMode: copy.evaluation_mode,
      rubric: copy.ai_rubric ?? undefined,
      compliance: {
        ownWords: false,
        noLongExcerpts: false,
        citationsIdentified: false,
        examplesAuthorized: false,
      },
    });
  }
}
