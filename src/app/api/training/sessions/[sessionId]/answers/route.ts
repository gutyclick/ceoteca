import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonData, jsonError } from "@/lib/api/response";
import { exerciseAnswerSchema } from "@/lib/training/schemas";
import { getTrainingServerSession } from "@/lib/training/server-auth";

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
  return jsonData(data);
}
