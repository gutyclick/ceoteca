import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { serverEnv } from "@/lib/env";
import { auditEditorial } from "@/lib/training/editorial-audit";
import {
  createEditorialGenerationProvider,
  type EditorialGenerationProvider,
} from "@/lib/training/editorial-ai-provider";
import {
  estimateEditorialCost,
  routeEditorialModel,
} from "@/lib/training/editorial-ai-model-router";
import { editorialPromptVersions } from "@/lib/training/editorial-ai-prompts";
import type { EditorialJobType } from "@/lib/training/editorial-ai-schemas";

const outputTokenEstimates: Record<EditorialJobType, number> = {
  generate_exercises: 850,
  generate_distractors: 450,
  improve_feedback: 550,
  generate_variations: 850,
  suggest_rubric: 1100,
  review_exercise: 600,
  suggest_classification: 500,
  suggest_template: 850,
};

const flagByTask: Record<EditorialJobType, keyof typeof serverEnv> = {
  generate_exercises: "TRAINING_EDITORIAL_AI_EXERCISE_GENERATION_ENABLED",
  generate_distractors: "TRAINING_EDITORIAL_AI_DISTRACTORS_ENABLED",
  improve_feedback: "TRAINING_EDITORIAL_AI_FEEDBACK_ENABLED",
  generate_variations: "TRAINING_EDITORIAL_AI_VARIATIONS_ENABLED",
  suggest_rubric: "TRAINING_EDITORIAL_AI_RUBRICS_ENABLED",
  review_exercise: "TRAINING_EDITORIAL_AI_REVIEW_ENABLED",
  suggest_classification: "TRAINING_EDITORIAL_AI_REVIEW_ENABLED",
  suggest_template: "TRAINING_EDITORIAL_AI_TEMPLATE_SUGGESTION_ENABLED",
};

export class EditorialAICostService {
  estimate(jobType: EditorialJobType, input: unknown, count: number) {
    const inputTokens = Math.ceil(JSON.stringify(input).length / 4);
    const outputTokens = outputTokenEstimates[jobType] * count;
    const route = routeEditorialModel(jobType);
    return {
      modelTier: route.tier,
      model: route.model,
      inputTokens,
      outputTokens,
      estimatedCost: estimateEditorialCost(route, inputTokens, outputTokens),
    };
  }
  actual(jobType: EditorialJobType, inputTokens: number, outputTokens: number) {
    return estimateEditorialCost(
      routeEditorialModel(jobType),
      inputTokens,
      outputTokens,
    );
  }
}

export class EditorialAIQuotaService {
  constructor(private readonly db: SupabaseClient) {}
  async check(userId: string, estimatedCost: number) {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setUTCHours(0, 0, 0, 0);
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const [{ count }, { data: usage }] = await Promise.all([
      this.db
        .from("training_editorial_ai_jobs")
        .select("id", { count: "exact", head: true })
        .eq("created_by", userId)
        .gte("created_at", dayStart.toISOString()),
      this.db
        .from("training_editorial_ai_usage")
        .select("estimated_cost")
        .gte("created_at", monthStart.toISOString()),
    ]);
    const spent = (usage ?? []).reduce(
      (sum, item) => sum + Number(item.estimated_cost ?? 0),
      0,
    );
    const budget = serverEnv.TRAINING_EDITORIAL_AI_MONTHLY_BUDGET_USD;
    if ((count ?? 0) >= serverEnv.TRAINING_EDITORIAL_AI_DAILY_JOB_LIMIT)
      throw new Error("EDITORIAL_DAILY_LIMIT");
    if (spent + estimatedCost > budget)
      throw new Error("EDITORIAL_BUDGET_EXCEEDED");
    return {
      spent,
      budget,
      remaining: Math.max(0, budget - spent),
      percentage: budget > 0 ? Math.round((spent / budget) * 100) : 100,
      dailyJobs: count ?? 0,
      dailyLimit: serverEnv.TRAINING_EDITORIAL_AI_DAILY_JOB_LIMIT,
    };
  }
}

type ExecuteInput = {
  userId: string;
  jobType: EditorialJobType;
  clientJobId: string;
  sourceType?: "concept" | "exercise" | "analysis" | "manual";
  sourceId?: string;
  requestedCount?: number;
  payload: Record<string, unknown>;
};

export class EditorialGenerationService {
  private readonly cost = new EditorialAICostService();
  private readonly quota: EditorialAIQuotaService;
  constructor(
    private readonly db: SupabaseClient,
    private readonly provider: EditorialGenerationProvider = createEditorialGenerationProvider(),
  ) {
    this.quota = new EditorialAIQuotaService(db);
  }

  estimate(jobType: EditorialJobType, payload: unknown, requestedCount = 1) {
    return this.cost.estimate(jobType, payload, requestedCount);
  }

  async execute(input: ExecuteInput) {
    if (
      !serverEnv.TRAINING_EDITORIAL_AI_ENABLED ||
      serverEnv[flagByTask[input.jobType]] !== true
    )
      throw new Error("EDITORIAL_AI_DISABLED");
    const payload =
      input.jobType === "suggest_template"
        ? await this.withEligibleTemplateExercises(input.payload)
        : input.jobType === "generate_variations"
          ? await this.withSourceExercise(input.payload)
          : input.payload;
    const serialized = JSON.stringify(payload);
    if (serialized.length > serverEnv.TRAINING_EDITORIAL_AI_MAX_CONTEXT_CHARS)
      throw new Error("EDITORIAL_CONTEXT_TOO_LONG");
    const requestedCount = Math.min(
      input.requestedCount ?? 1,
      serverEnv.TRAINING_EDITORIAL_AI_MAX_EXERCISES_PER_JOB,
    );
    const estimate = this.cost.estimate(input.jobType, payload, requestedCount);
    const quota = await this.quota.check(input.userId, estimate.estimatedCost);
    const inputHash = createHash("sha256")
      .update(
        JSON.stringify({
          userId: input.userId,
          jobType: input.jobType,
          promptVersion: editorialPromptVersions[input.jobType],
          payload,
          model: estimate.model,
          requestedCount,
          language: "es",
        }),
      )
      .digest("hex");

    const { data: existing } = await this.db
      .from("training_editorial_ai_jobs")
      .select("id,status,estimated_cost")
      .eq("created_by", input.userId)
      .eq("client_job_id", input.clientJobId)
      .maybeSingle();
    if (existing) return this.getJob(input.userId, existing.id);

    const { data: cached } = await this.db
      .from("training_editorial_ai_jobs")
      .select("id,created_at")
      .eq("created_by", input.userId)
      .eq("input_hash", inputHash)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: job, error: jobError } = await this.db
      .from("training_editorial_ai_jobs")
      .insert({
        client_job_id: input.clientJobId,
        created_by: input.userId,
        job_type: input.jobType,
        status: "processing",
        source_type: input.sourceType ?? "manual",
        source_id: input.sourceId ?? null,
        input_hash: inputHash,
        input_summary: this.safeSummary(payload),
        provider: serverEnv.OPENAI_API_KEY ? "openai" : "mock",
        model: estimate.model,
        prompt_version: editorialPromptVersions[input.jobType],
        requested_count: requestedCount,
        estimated_cost: estimate.estimatedCost,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (jobError || !job) throw new Error("EDITORIAL_JOB_CREATE_FAILED");

    await auditEditorial(this.db, {
      actorId: input.userId,
      action: "ai_editorial_job_started",
      entityType: "editorial_ai_job",
      entityId: job.id,
      metadata: {
        jobType: input.jobType,
        promptVersion: editorialPromptVersions[input.jobType],
        modelTier: estimate.modelTier,
        estimatedCost: estimate.estimatedCost,
        cacheAvailableJobId: cached?.id ?? null,
      },
    });

    const startedAt = Date.now();
    try {
      const output = await Promise.race([
        this.callProvider(input.jobType, payload),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("EDITORIAL_TIMEOUT")),
            serverEnv.TRAINING_EDITORIAL_AI_TIMEOUT_MS,
          ),
        ),
      ]);
      await this.db
        .from("training_editorial_ai_jobs")
        .update({ status: "validating" })
        .eq("id", job.id);
      const results = this.toResults(input.jobType, output.data, payload);
      const validCount = results.filter(
        (result) => result.validationIssues.length === 0,
      ).length;
      const invalidCount = results.length - validCount;
      const resultRows = results.map((result, index) => ({
        job_id: job.id,
        result_index: index,
        result_type: result.type,
        status: result.validationIssues.length ? "invalid" : "valid",
        output: result.output,
        confidence: result.confidence,
        validation_issues: result.validationIssues,
      }));
      const { error: resultError } = await this.db
        .from("training_editorial_ai_results")
        .insert(resultRows);
      if (resultError) throw new Error("EDITORIAL_RESULTS_SAVE_FAILED");
      const actualCost = this.cost.actual(
        input.jobType,
        output.inputTokens,
        output.outputTokens,
      );
      const latency = Date.now() - startedAt;
      await Promise.all([
        this.db
          .from("training_editorial_ai_jobs")
          .update({
            status:
              invalidCount === 0
                ? "completed"
                : validCount > 0
                  ? "partial"
                  : "failed",
            provider: output.provider,
            model: output.model,
            generated_count: results.length,
            valid_count: validCount,
            invalid_count: invalidCount,
            input_tokens: output.inputTokens,
            output_tokens: output.outputTokens,
            estimated_cost: actualCost,
            latency_ms: latency,
            completed_at: new Date().toISOString(),
          })
          .eq("id", job.id),
        this.db.from("training_editorial_ai_usage").insert({
          user_id: input.userId,
          job_id: job.id,
          usage_type: input.jobType,
          provider: output.provider,
          model: output.model,
          input_tokens: output.inputTokens,
          output_tokens: output.outputTokens,
          estimated_cost: actualCost,
        }),
      ]);
      await auditEditorial(this.db, {
        actorId: input.userId,
        action: "ai_editorial_job_completed",
        entityType: "editorial_ai_job",
        entityId: job.id,
        metadata: {
          resultCount: results.length,
          model: output.model,
          promptVersion: output.promptVersion,
          cost: actualCost,
          latency,
          repaired: output.repaired,
        },
      });
      return { ...(await this.getJob(input.userId, job.id)), quota };
    } catch (error) {
      const timedOut =
        error instanceof Error && error.message === "EDITORIAL_TIMEOUT";
      const safeCode =
        error instanceof Error
          ? error.message.slice(0, 80)
          : "EDITORIAL_PROVIDER_FAILED";
      await this.db
        .from("training_editorial_ai_jobs")
        .update({
          status: timedOut ? "timed_out" : "failed",
          error_code: safeCode,
          error_message_safe: timedOut
            ? "La generación superó el tiempo disponible."
            : "No pudimos validar la salida del proveedor.",
          latency_ms: Date.now() - startedAt,
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      await auditEditorial(this.db, {
        actorId: input.userId,
        action: timedOut
          ? "ai_editorial_job_timed_out"
          : "ai_editorial_job_failed",
        entityType: "editorial_ai_job",
        entityId: job.id,
        metadata: { errorCode: safeCode },
      });
      throw error;
    }
  }

  async getJob(userId: string, jobId: string) {
    const { data: job } = await this.db
      .from("training_editorial_ai_jobs")
      .select(
        "id,job_type,status,source_type,source_id,provider,model,prompt_version,requested_count,generated_count,valid_count,invalid_count,input_tokens,output_tokens,estimated_cost,latency_ms,error_code,error_message_safe,created_at,completed_at,created_by",
      )
      .eq("id", jobId)
      .eq("created_by", userId)
      .maybeSingle();
    if (!job) throw new Error("EDITORIAL_JOB_NOT_FOUND");
    const { data: results } = await this.db
      .from("training_editorial_ai_results")
      .select(
        "id,result_index,result_type,status,output,validation_issues,confidence,regeneration_count,saved_entity_type,saved_entity_id,created_at",
      )
      .eq("job_id", jobId)
      .order("result_index");
    return { ...job, results: results ?? [] };
  }

  async usage(userId: string, includeGlobal: boolean) {
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    let query = this.db
      .from("training_editorial_ai_usage")
      .select("estimated_cost,input_tokens,output_tokens,usage_type,user_id")
      .gte("created_at", monthStart.toISOString());
    if (!includeGlobal) query = query.eq("user_id", userId);
    const { data } = await query;
    const rows = data ?? [];
    const spent = rows.reduce(
      (sum, row) => sum + Number(row.estimated_cost ?? 0),
      0,
    );
    const budget = serverEnv.TRAINING_EDITORIAL_AI_MONTHLY_BUDGET_USD;
    return {
      spent,
      budget,
      remaining: Math.max(0, budget - spent),
      percentage:
        budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 100,
      inputTokens: rows.reduce(
        (sum, row) => sum + Number(row.input_tokens ?? 0),
        0,
      ),
      outputTokens: rows.reduce(
        (sum, row) => sum + Number(row.output_tokens ?? 0),
        0,
      ),
      jobs: rows.length,
    };
  }

  private safeSummary(payload: Record<string, unknown>) {
    return {
      keys: Object.keys(payload).slice(0, 30),
      characterCount: JSON.stringify(payload).length,
      sourceType: payload.sourceType ?? null,
      count: payload.count ?? 1,
    };
  }

  private async withEligibleTemplateExercises(
    payload: Record<string, unknown>,
  ) {
    const query = this.db
      .from("training_exercises")
      .select("id,type,difficulty,estimated_seconds,concept_id")
      .eq("skill_id", String(payload.skillId))
      .eq("status", "published")
      .eq("difficulty", String(payload.difficulty))
      .limit(30);
    const { data } = await query;
    return { ...payload, eligibleExercises: data ?? [] };
  }

  private async withSourceExercise(payload: Record<string, unknown>) {
    const exerciseId = String(payload.exerciseId ?? "");
    const [{ data: exercise }, { data: rules }] = await Promise.all([
      this.db
        .from("training_exercises")
        .select(
          "id,type,title,prompt,instruction,difficulty,estimated_seconds,hint,explanation,content,skill_id,concept_id",
        )
        .eq("id", exerciseId)
        .maybeSingle(),
      this.db
        .from("training_exercise_evaluation_rules")
        .select("evaluation_config")
        .eq("exercise_id", exerciseId)
        .maybeSingle(),
    ]);
    if (!exercise) throw new Error("SOURCE_EXERCISE_NOT_FOUND");
    return {
      ...payload,
      sourceExercise: exercise,
      evaluationConfig: rules?.evaluation_config ?? null,
    };
  }

  private callProvider(
    jobType: EditorialJobType,
    payload: Record<string, unknown>,
  ) {
    switch (jobType) {
      case "generate_exercises":
        return this.provider.generateExercises(payload);
      case "generate_distractors":
        return this.provider.generateDistractors(payload);
      case "improve_feedback":
        return this.provider.improveFeedback(payload);
      case "generate_variations":
        return this.provider.generateVariations(payload);
      case "suggest_rubric":
        return this.provider.suggestRubric(payload);
      case "review_exercise":
        return this.provider.reviewExercise(payload);
      case "suggest_classification":
        return this.provider.suggestClassification(payload);
      case "suggest_template":
        return this.provider.suggestTemplate(payload);
    }
  }

  private toResults(
    jobType: EditorialJobType,
    data: unknown,
    payload: Record<string, unknown>,
  ) {
    if (jobType === "generate_exercises" || jobType === "generate_variations") {
      const exercises = (data as { exercises: Array<{ confidence?: number }> })
        .exercises;
      const sourceText = JSON.stringify(payload).toLocaleLowerCase("es");
      return exercises.map((output) => {
        const generatedText = JSON.stringify(output).toLocaleLowerCase("es");
        const suspiciousExcerpt = sourceText
          .split(/[.!?]\s+/)
          .map((sentence) => sentence.trim())
          .find(
            (sentence) =>
              sentence.length >= 140 && generatedText.includes(sentence),
          );
        return {
          type: "exercise",
          output,
          confidence: output.confidence ?? null,
          validationIssues: suspiciousExcerpt
            ? [
                "Se detectó una coincidencia textual extensa con el contexto de origen. Reescribe el borrador antes de guardarlo.",
              ]
            : [],
        };
      });
    }
    if (jobType === "suggest_template") {
      const allowed = new Set(
        (
          (payload.eligibleExercises as Array<{ id: string }> | undefined) ?? []
        ).map((item) => item.id),
      );
      const ids = (
        data as { sections: Array<{ exerciseIds: string[] }> }
      ).sections.flatMap((section) => section.exerciseIds);
      const invalidIds = ids.filter((id) => !allowed.has(id));
      return [
        {
          type: jobType,
          output: data,
          confidence: null,
          validationIssues: invalidIds.length
            ? [
                `La sugerencia incluyó ${invalidIds.length} ejercicios no elegibles.`,
              ]
            : [],
        },
      ];
    }
    return [
      {
        type: jobType,
        output: data,
        confidence: null,
        validationIssues: [] as string[],
      },
    ];
  }
}

export class ExerciseGenerationService extends EditorialGenerationService {}
export class DistractorGenerationService extends EditorialGenerationService {}
export class FeedbackGenerationService extends EditorialGenerationService {}
export class RubricSuggestionService extends EditorialGenerationService {}
export class EditorialAIReviewService extends EditorialGenerationService {}
export class ExerciseVariationService extends EditorialGenerationService {}
export class TemplateSuggestionService extends EditorialGenerationService {}
