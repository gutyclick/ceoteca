import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { serverEnv } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { TrainingEvaluationService } from "@/lib/training/ai-service";
import { getTrainingServerSession } from "@/lib/training/server-auth";

const schema = z.object({
  sessionExerciseId: z.string().uuid(),
  answer: z.unknown(),
  clientEvaluationId: z.string().uuid(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const auth = await getTrainingServerSession(request);
  if (!auth)
    return jsonError(
      {
        code: "UNAUTHORIZED",
        message: "Inicia sesión para evaluar tu respuesta.",
      },
      401,
    );
  if (!serverEnv.TRAINING_AI_OPEN_RESPONSE_ENABLED)
    return jsonError(
      {
        code: "AI_DISABLED",
        message:
          "La evaluación con IA no está disponible. Puedes continuar con autoevaluación.",
      },
      503,
    );
  const rate = checkRateLimit(`training-ai:${auth.user.id}`, 6, 60_000);
  if (!rate.allowed)
    return jsonError(
      {
        code: "RATE_LIMITED",
        message: "Has enviado varias evaluaciones seguidas. Espera un momento.",
      },
      429,
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return jsonError(
      {
        code: "INVALID_INPUT",
        message: "Revisa tu respuesta antes de enviarla.",
      },
      400,
    );
  const { data: profile } = await auth.client
    .from("profiles")
    .select("plan")
    .eq("id", auth.user.id)
    .single();
  const plan = profile?.plan ?? "free";
  const now = new Date();
  const { data: monthlyUsage } = await auth.client.rpc(
    "get_training_ai_monthly_usage",
    { p_user_id: auth.user.id, p_month: now.toISOString().slice(0, 10) },
  );
  const limit =
    plan === "free"
      ? serverEnv.TRAINING_AI_FREE_DEEP_EVALUATIONS_PER_MONTH
      : serverEnv.TRAINING_AI_DAILY_LIMIT_PRO;
  if ((monthlyUsage ?? 0) >= limit)
    return jsonError(
      {
        code: "AI_QUOTA_REACHED",
        message:
          plan === "free"
            ? "Ya utilizaste tu evaluación profunda de este mes. Puedes continuar con autoevaluación."
            : "Has utilizado las evaluaciones con IA incluidas en tu plan.",
      },
      403,
    );
  try {
    const { sessionId } = await params;
    const service = new TrainingEvaluationService(auth.client);
    return jsonData(
      await service.evaluate({
        sessionExerciseId: parsed.data.sessionExerciseId,
        clientEvaluationId: parsed.data.clientEvaluationId,
        answer: parsed.data.answer,
        sessionId,
        userId: auth.user.id,
        plan: plan as "free" | "pro" | "unlimited" | "founder",
      }),
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "EVALUATION_FAILED";
    const statuses: Record<string, number> = {
      NOT_FOUND: 404,
      ANSWER_TOO_SHORT: 400,
      ANSWER_TOO_LONG: 413,
      EVALUATION_IN_PROGRESS: 409,
    };
    return jsonError(
      {
        code,
        message:
          code === "ANSWER_TOO_SHORT"
            ? "Añade un poco más de información antes de evaluar."
            : code === "ANSWER_TOO_LONG"
              ? "Reduce la respuesta para poder evaluarla."
              : "No pudimos evaluar ahora. Puedes continuar mediante autoevaluación.",
      },
      statuses[code] ?? 500,
    );
  }
}
