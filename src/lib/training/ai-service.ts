import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { serverEnv } from "@/lib/env";
import {
  createTrainingEvaluationProvider,
  fallbackEvaluation,
} from "@/lib/training/ai-provider";
import { openEvaluationSchema } from "@/lib/training/ai-schemas";
import {
  parseTrainingRubric,
  validateEvaluationCriteria,
} from "@/lib/training/ai-rubrics";

type EvaluateInput = {
  userId: string;
  sessionId: string;
  sessionExerciseId: string;
  answer: unknown;
  clientEvaluationId: string;
  plan: "free" | "pro" | "unlimited" | "founder";
};

export class TrainingEvaluationService {
  constructor(private readonly db: SupabaseClient) {}

  async evaluate(input: EvaluateInput) {
    const { data: row } = await this.db
      .from("training_session_exercises")
      .select(
        "id,exercise_id,exercise_snapshot,training_sessions!inner(user_id,status)",
      )
      .eq("id", input.sessionExerciseId)
      .eq("session_id", input.sessionId)
      .maybeSingle();
    const owner = row?.training_sessions as unknown as {
      user_id: string;
      status: string;
    } | null;
    if (!row || owner?.user_id !== input.userId) throw new Error("NOT_FOUND");
    const snapshot = row.exercise_snapshot as Record<string, unknown>;
    const type = String(snapshot.type ?? "");
    if (
      !new Set([
        "open_response",
        "guided_builder",
        "decision_justification",
        "reflection",
        "visual_annotation",
        "message_response",
        "message_comparison",
        "tone_adjustment",
        "objection_response",
        "email_rewrite",
        "conversation_diagnosis",
      ]).has(type)
    )
      throw new Error("NOT_OPEN_EXERCISE");
    const serialized = JSON.stringify(input.answer);
    if (serialized.length > serverEnv.TRAINING_AI_MAX_INPUT_CHARS)
      throw new Error("ANSWER_TOO_LONG");

    const { data: exercise } = await this.db
      .from("training_exercises")
      .select(
        "ai_rubric,ai_prompt_version,minimum_response_length,maximum_response_length,explanation,content,skill_id,concept_id",
      )
      .eq("id", row.exercise_id)
      .single();
    if (!exercise) throw new Error("EXERCISE_NOT_FOUND");
    if (serialized.length < exercise.minimum_response_length)
      throw new Error("ANSWER_TOO_SHORT");
    const rubric = parseTrainingRubric(exercise.ai_rubric);
    const model = serverEnv.TRAINING_AI_DEFAULT_MODEL;
    const inputHash = createHash("sha256")
      .update(
        JSON.stringify({
          exerciseId: row.exercise_id,
          version: rubric.version,
          prompt: exercise.ai_prompt_version,
          answer: input.answer,
          model,
        }),
      )
      .digest("hex");
    const { data: cached } = await this.db
      .from("training_ai_evaluations")
      .select("id,evaluation,status")
      .eq("user_id", input.userId)
      .eq("input_hash", inputHash)
      .in("status", ["completed", "fallback_completed"])
      .maybeSingle();
    if (cached?.evaluation)
      return {
        evaluationId: cached.id,
        status: cached.status,
        feedback: openEvaluationSchema.parse(cached.evaluation),
        cacheHit: true,
      };

    const start = new Date();
    const { data: answerRow, error: answerError } = await this.db
      .from("training_answers")
      .insert({
        client_attempt_id: input.clientEvaluationId,
        user_id: input.userId,
        session_id: input.sessionId,
        session_exercise_id: input.sessionExerciseId,
        answer: input.answer,
        attempt_number: 1,
        hints_used: 0,
        evaluation_status: "pending",
      })
      .select("id")
      .single();
    if (answerError || !answerRow) {
      const { data: existing } = await this.db
        .from("training_answers")
        .select("id")
        .eq("user_id", input.userId)
        .eq("client_attempt_id", input.clientEvaluationId)
        .maybeSingle();
      if (!existing) throw new Error("ANSWER_SAVE_FAILED");
      const { data: existingEvaluation } = await this.db
        .from("training_ai_evaluations")
        .select("id,status,evaluation")
        .eq("answer_id", existing.id)
        .maybeSingle();
      if (existingEvaluation?.evaluation)
        return {
          evaluationId: existingEvaluation.id,
          status: existingEvaluation.status,
          feedback: openEvaluationSchema.parse(existingEvaluation.evaluation),
          cacheHit: true,
        };
      throw new Error("EVALUATION_IN_PROGRESS");
    }
    const { data: evaluationRow } = await this.db
      .from("training_ai_evaluations")
      .insert({
        answer_id: answerRow.id,
        user_id: input.userId,
        session_id: input.sessionId,
        session_exercise_id: input.sessionExerciseId,
        status: "processing",
        provider: "openai",
        model,
        rubric_version: rubric.version,
        prompt_version: exercise.ai_prompt_version,
        input_hash: inputHash,
        started_at: start.toISOString(),
      })
      .select("id")
      .single();
    if (!evaluationRow) throw new Error("EVALUATION_SAVE_FAILED");

    let status = "completed";
    let output;
    try {
      output = await Promise.race([
        createTrainingEvaluationProvider().evaluate({
          exerciseType: type,
          skill: String(exercise.skill_id),
          concept: String(exercise.concept_id),
          principleSummary: exercise.explanation,
          context: (exercise.content as Record<string, unknown>) ?? {},
          answer: input.answer,
          rubric,
          promptVersion: exercise.ai_prompt_version,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("TIMEOUT")),
            serverEnv.TRAINING_AI_TIMEOUT_MS,
          ),
        ),
      ]);
      if (
        !validateEvaluationCriteria(
          rubric,
          output.evaluation.criteria.map((item) => item.criterionId),
        )
      )
        throw new Error("INVALID_CRITERIA");
    } catch (error) {
      if (!serverEnv.TRAINING_AI_FALLBACK_ENABLED) throw error;
      status = "fallback_completed";
      output = { model: "self-assessment", evaluation: fallbackEvaluation() };
    }
    const latency = Date.now() - start.getTime();
    await this.db
      .from("training_ai_evaluations")
      .update({
        status,
        provider: output.model === "mock" ? "mock" : "openai",
        model: output.model,
        evaluation: output.evaluation,
        normalized_score: output.evaluation.overallScore / 100,
        latency_ms: latency,
        input_tokens: output.inputTokens ?? null,
        output_tokens: output.outputTokens ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", evaluationRow.id);
    await this.db
      .from("training_answers")
      .update({
        score: output.evaluation.overallScore,
        normalized_score: output.evaluation.overallScore / 100,
        evaluation_status: status,
        evaluation_details: output.evaluation,
      })
      .eq("id", answerRow.id);
    await this.db.rpc("advance_training_session", {
      p_session_id: input.sessionId,
      p_session_exercise_id: input.sessionExerciseId,
    });
    return {
      evaluationId: evaluationRow.id,
      answerId: answerRow.id,
      status,
      feedback: output.evaluation,
      cacheHit: false,
    };
  }
}
