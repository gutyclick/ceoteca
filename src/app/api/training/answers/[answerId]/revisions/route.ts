import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonData, jsonError } from "@/lib/api/response";
import { TrainingEvaluationService } from "@/lib/training/ai-service";
import { getTrainingServerSession } from "@/lib/training/server-auth";

const schema = z.object({
  answer: z.unknown(),
  clientEvaluationId: z.string().uuid(),
});
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ answerId: string }> },
) {
  const auth = await getTrainingServerSession(request);
  if (!auth)
    return jsonError(
      {
        code: "UNAUTHORIZED",
        message: "Inicia sesión para mejorar tu respuesta.",
      },
      401,
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return jsonError(
      { code: "INVALID_INPUT", message: "Revisa la respuesta revisada." },
      400,
    );
  const { answerId } = await params;
  const { data: original } = await auth.client
    .from("training_answers")
    .select("id,session_id,session_exercise_id")
    .eq("id", answerId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!original)
    return jsonError(
      { code: "NOT_FOUND", message: "No encontramos la respuesta original." },
      404,
    );
  const { count } = await auth.client
    .from("training_answer_revisions")
    .select("id", { count: "exact", head: true })
    .eq("original_answer_id", answerId)
    .eq("user_id", auth.user.id);
  const { data: profile } = await auth.client
    .from("profiles")
    .select("plan")
    .eq("id", auth.user.id)
    .single();
  if ((profile?.plan ?? "free") === "free")
    return jsonError(
      {
        code: "REVISION_REEVALUATION_NOT_INCLUDED",
        message:
          "La reevaluación de respuestas está disponible en el plan Pro. Puedes guardar tu revisión y usar la checklist de autoevaluación.",
      },
      403,
    );
  if ((count ?? 0) >= 1)
    return jsonError(
      {
        code: "REVISION_LIMIT_REACHED",
        message: "Ya utilizaste la revisión disponible para este ejercicio.",
      },
      403,
    );
  try {
    const evaluated = await new TrainingEvaluationService(auth.client).evaluate(
      {
        userId: auth.user.id,
        sessionId: original.session_id,
        sessionExerciseId: original.session_exercise_id,
        answer: parsed.data.answer,
        clientEvaluationId: parsed.data.clientEvaluationId,
        plan: (profile?.plan ?? "free") as
          | "free"
          | "pro"
          | "unlimited"
          | "founder",
      },
    );
    await auth.client.from("training_answer_revisions").insert({
      original_answer_id: answerId,
      user_id: auth.user.id,
      revision_number: 1,
      content: parsed.data.answer,
      evaluation_id: evaluated.evaluationId,
    });
    return jsonData({ ...evaluated, revisionNumber: 1 });
  } catch {
    return jsonError(
      {
        code: "REVISION_FAILED",
        message:
          "No pudimos evaluar la revisión ahora. Conserva el texto e inténtalo nuevamente.",
      },
      500,
    );
  }
}
