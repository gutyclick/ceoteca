import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { auditEditorial } from "@/lib/training/editorial-audit";
import {
  generatedRubricSchema,
  generatedTemplateSuggestionSchema,
} from "@/lib/training/editorial-ai-schemas";
import { ExerciseEditorService } from "@/lib/training/editorial-service";
import type { ExerciseDraft } from "@/lib/training/editorial-validation";

type GeneratedRubric = z.infer<typeof generatedRubricSchema>;
type GeneratedTemplate = z.infer<typeof generatedTemplateSuggestionSchema>;

export class EditorialAIResultService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly actorId: string,
  ) {}

  private async ownedResult(resultId: string) {
    const { data } = await this.db
      .from("training_editorial_ai_results")
      .select(
        "id,job_id,result_type,status,output,saved_entity_type,saved_entity_id,training_editorial_ai_jobs!inner(created_by,prompt_version,source_type,source_id,job_type)",
      )
      .eq("id", resultId)
      .maybeSingle();
    const job = data?.training_editorial_ai_jobs as unknown as {
      created_by: string;
      prompt_version: string;
      source_type: string;
      source_id: string | null;
      job_type: string;
    } | null;
    if (!data || job?.created_by !== this.actorId)
      throw new Error("RESULT_NOT_FOUND");
    return { result: data, job };
  }

  async discard(resultId: string) {
    const { result } = await this.ownedResult(resultId);
    if (result.status === "saved") throw new Error("RESULT_ALREADY_SAVED");
    await this.db
      .from("training_editorial_ai_results")
      .update({ status: "discarded", updated_at: new Date().toISOString() })
      .eq("id", resultId);
    await auditEditorial(this.db, {
      actorId: this.actorId,
      action: "ai_editorial_result_discarded",
      entityType: "editorial_ai_result",
      entityId: resultId,
      metadata: { jobId: result.job_id },
    });
    return { ok: true };
  }

  async saveExercise(resultId: string, draft: ExerciseDraft) {
    const { result, job } = await this.ownedResult(resultId);
    if (result.status === "invalid" || result.status === "discarded")
      throw new Error("RESULT_NOT_SAVABLE");
    if (result.status === "saved")
      return {
        entityType: result.saved_entity_type,
        entityId: result.saved_entity_id,
        idempotent: true,
      };
    const exercise = await new ExerciseEditorService(
      this.db,
      this.actorId,
    ).create(draft, {
      origin: "ai_generated",
      jobId: result.job_id,
      resultId,
      sourceContextType: job.source_type,
      promptVersion: job.prompt_version,
    });
    if (job.job_type === "generate_variations" && job.source_id) {
      const { error: variantError } = await this.db
        .from("training_exercise_variants")
        .insert({
          parent_exercise_id: job.source_id,
          variant_exercise_id: exercise.id,
          ai_job_id: result.job_id,
          variation_type: "editorial_ai",
          created_by: this.actorId,
        });
      if (variantError) throw new Error("VARIANT_LINK_FAILED");
    }
    await this.markSaved(resultId, "exercise", exercise.id);
    return { entityType: "exercise", entityId: exercise.id, idempotent: false };
  }

  async saveRubric(resultId: string, slug: string, rubric: GeneratedRubric) {
    const { result } = await this.ownedResult(resultId);
    if (result.status === "invalid" || result.status === "discarded")
      throw new Error("RESULT_NOT_SAVABLE");
    if (result.status === "saved")
      return {
        entityType: result.saved_entity_type,
        entityId: result.saved_entity_id,
        idempotent: true,
      };
    const { data, error } = await this.db
      .from("training_rubrics")
      .insert({
        slug,
        name: rubric.name,
        description: rubric.description,
        status: "draft",
        created_by: this.actorId,
        origin: "ai_generated",
        ai_job_id: result.job_id,
        ai_result_id: resultId,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error("RUBRIC_SAVE_FAILED");
    await this.db
      .from("training_rubric_versions")
      .insert({
        rubric_id: data.id,
        version: 1,
        schema: rubric,
        status: "draft",
        change_reason: "Borrador generado con IA",
        created_by: this.actorId,
      });
    await this.markSaved(resultId, "rubric", data.id);
    return { entityType: "rubric", entityId: data.id, idempotent: false };
  }

  async saveTemplate(
    resultId: string,
    input: {
      slug: string;
      categoryId: string;
      difficulty: "beginner" | "intermediate" | "advanced";
      template: GeneratedTemplate;
    },
  ) {
    const { result } = await this.ownedResult(resultId);
    if (result.status === "invalid" || result.status === "discarded")
      throw new Error("RESULT_NOT_SAVABLE");
    if (result.status === "saved")
      return {
        entityType: result.saved_entity_type,
        entityId: result.saved_entity_id,
        idempotent: true,
      };
    const { data, error } = await this.db
      .from("training_templates")
      .insert({
        slug: input.slug,
        title: input.template.title,
        description: input.template.description,
        category_id: input.categoryId,
        difficulty: input.difficulty,
        estimated_minutes: input.template.estimatedMinutes,
        is_active: false,
        editorial_status: "draft",
        created_by: this.actorId,
        origin: "ai_generated",
        ai_job_id: result.job_id,
        ai_result_id: resultId,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error("TEMPLATE_SAVE_FAILED");
    await this.db
      .from("training_template_versions")
      .insert({
        template_id: data.id,
        version: 1,
        snapshot: input.template,
        status: "draft",
        change_reason: "Borrador generado con IA",
        created_by: this.actorId,
      });
    await this.markSaved(resultId, "template", data.id);
    return { entityType: "template", entityId: data.id, idempotent: false };
  }

  private async markSaved(
    resultId: string,
    entityType: string,
    entityId: string,
  ) {
    await this.db
      .from("training_editorial_ai_results")
      .update({
        status: "saved",
        saved_entity_type: entityType,
        saved_entity_id: entityId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resultId);
    await auditEditorial(this.db, {
      actorId: this.actorId,
      action: "ai_editorial_result_saved",
      entityType: "editorial_ai_result",
      entityId: resultId,
      metadata: { savedEntityType: entityType, savedEntityId: entityId },
    });
  }
}
