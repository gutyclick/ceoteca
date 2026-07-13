import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonData, jsonError } from "@/lib/api/response";
import { exerciseAnswerSchema } from "@/lib/training/schemas";
import { getTrainingServerSession } from "@/lib/training/server-auth";
import { randomUUID } from "node:crypto";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { TrainingAnalyticsService } from "@/lib/training/analytics-service";

const schema = z.object({
  sessionExerciseId: z.string().uuid(),
  answer: exerciseAnswerSchema,
  clientAttemptId: z.string().uuid(),
  responseTimeMs: z.number().int().nonnegative().optional(),
  hintsUsed: z.number().int().nonnegative().default(0),
});
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const auth = await getTrainingServerSession(request);
  if (!auth)
    return jsonError(
      { code: "UNAUTHORIZED", message: "Inicia sesión para entrenar." },
      401,
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return jsonError(
      { code: "INVALID_INPUT", message: "La respuesta no es válida." },
      400,
    );
  const { sessionId } = await params;
  const input = parsed.data;
  const { data, error } = await auth.client.rpc("submit_training_answer", {
    p_session_id: sessionId,
    p_session_exercise_id: input.sessionExerciseId,
    p_answer: input.answer,
    p_client_attempt_id: input.clientAttemptId,
    p_response_time_ms: input.responseTimeMs ?? null,
    p_hints_used: input.hintsUsed,
  });
  if (error)
    return jsonError(
      {
        code: "SUBMIT_FAILED",
        message: "No pudimos guardar la respuesta. Inténtalo nuevamente.",
      },
      500,
    );
  const { error: progressError } = await auth.client.rpc(
    "advance_training_session",
    {
      p_session_id: sessionId,
      p_session_exercise_id: input.sessionExerciseId,
    },
  );
  if (progressError)
    return jsonError(
      {
        code: "PROGRESS_FAILED",
        message:
          "La respuesta se guardó, pero no pudimos actualizar el avance.",
      },
      500,
    );
  void (async () => {
    const service = createServiceSupabaseClient();
    const { data: context } = await service.from("training_session_exercises").select("exercise_id,training_exercises(version,type,difficulty,skill_id,concept_id,cognitive_level)").eq("id", input.sessionExerciseId).maybeSingle();
    type AnalyticsContext = { exercise_id: string; training_exercises: { version:number; type:string; difficulty:"beginner"|"intermediate"|"advanced"; skill_id:string; concept_id:string; cognitive_level:"recognition"|"recall"|"application"|"transfer"|"synthesis" } | Array<{ version:number; type:string; difficulty:"beginner"|"intermediate"|"advanced"; skill_id:string; concept_id:string; cognitive_level:"recognition"|"recall"|"application"|"transfer"|"synthesis" }> };
    const analyticsContext = context as unknown as AnalyticsContext | null;
    const exercise = Array.isArray(analyticsContext?.training_exercises) ? analyticsContext.training_exercises[0] : analyticsContext?.training_exercises;
    if (!analyticsContext?.exercise_id || !exercise) return;
    const result = data as { attemptNumber?: number; isCorrect?: boolean; normalizedScore?: number } | null;
    await new TrainingAnalyticsService(service).recordServerEvent(auth.user.id, { clientEventId: randomUUID(), eventName: "exercise_answer_evaluated", occurredAt: new Date().toISOString(), sessionId, sessionExerciseId: input.sessionExerciseId, exerciseId: analyticsContext.exercise_id, exerciseVersion: Number(exercise.version), skillId: exercise.skill_id, conceptId: exercise.concept_id, attemptNumber: result?.attemptNumber ?? 1, properties: { exercise_type: exercise.type, difficulty: exercise.difficulty, is_correct: result?.isCorrect, normalized_score: result?.normalizedScore, hints_used: input.hintsUsed, retry_used: (result?.attemptNumber ?? 1) > 1, response_time_ms: input.responseTimeMs, cognitive_level: exercise.cognitive_level } });
  })().catch(() => undefined);
  return jsonData(data);
}
