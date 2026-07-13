import { NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
import { auditEditorial } from "@/lib/training/editorial-audit";
import { EditorialGenerationService } from "@/lib/training/editorial-ai-service";
import {
  classificationInputSchema,
  generateDistractorsInputSchema,
  generateExercisesInputSchema,
  improveFeedbackInputSchema,
  reviewExerciseInputSchema,
  rubricInputSchema,
  templateInputSchema,
  variationInputSchema,
  type EditorialJobType,
} from "@/lib/training/editorial-ai-schemas";

const schemas = {
  generate_exercises: generateExercisesInputSchema,
  generate_distractors: generateDistractorsInputSchema,
  improve_feedback: improveFeedbackInputSchema,
  generate_variations: variationInputSchema,
  suggest_rubric: rubricInputSchema,
  review_exercise: reviewExerciseInputSchema,
  suggest_classification: classificationInputSchema,
  suggest_template: templateInputSchema,
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> },
) {
  const access = await requireEditorialAccess(request, "ai_generate");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "Tu rol no permite regenerar resultados." },
      403,
    );
  const { resultId } = await params;
  const { data: result } = await access.service
    .from("training_editorial_ai_results")
    .select(
      "id,regeneration_count,job_id,training_editorial_ai_jobs!inner(created_by,job_type,source_type,source_id)",
    )
    .eq("id", resultId)
    .maybeSingle();
  const job = result?.training_editorial_ai_jobs as unknown as {
    created_by: string;
    job_type: EditorialJobType;
    source_type: "concept" | "exercise" | "analysis" | "manual";
    source_id?: string;
  } | null;
  if (!result || job?.created_by !== access.userId)
    return jsonError(
      { code: "NOT_FOUND", message: "No encontramos este resultado." },
      404,
    );
  if (
    result.regeneration_count >=
    serverEnv.TRAINING_EDITORIAL_AI_MAX_REGENERATIONS_PER_RESULT
  )
    return jsonError(
      {
        code: "REGENERATION_LIMIT",
        message: "Este resultado alcanzó el máximo de regeneraciones.",
      },
      429,
    );
  const raw = await request.json().catch(() => null);
  const parsed = schemas[job.job_type].safeParse(raw);
  if (!parsed.success)
    return jsonError(
      {
        code: "INVALID_INPUT",
        message: parsed.error.issues[0]?.message ?? "Revisa los datos.",
      },
      400,
    );
  const payload = parsed.data as Record<string, unknown>;
  const count = Number(payload.count ?? 1);
  try {
    const generated = await new EditorialGenerationService(
      access.service,
    ).execute({
      userId: access.userId,
      jobType: job.job_type,
      clientJobId: String(payload.clientJobId),
      sourceType: job.source_type,
      sourceId: job.source_id,
      requestedCount: count,
      payload,
    });
    await access.service
      .from("training_editorial_ai_results")
      .update({
        regeneration_count: result.regeneration_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resultId);
    await auditEditorial(access.service, {
      actorId: access.userId,
      action: "ai_editorial_regeneration_started",
      entityType: "editorial_ai_result",
      entityId: resultId,
      metadata: { originalJobId: result.job_id, newJobId: generated.id },
    });
    return jsonData(generated, 201);
  } catch {
    return jsonError(
      {
        code: "REGENERATION_FAILED",
        message: "No pudimos regenerar este resultado.",
      },
      500,
    );
  }
}
