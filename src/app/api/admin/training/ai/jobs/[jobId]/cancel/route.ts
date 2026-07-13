import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
import { auditEditorial } from "@/lib/training/editorial-audit";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const access = await requireEditorialAccess(request, "ai_generate");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "Tu rol no permite cancelar trabajos." },
      403,
    );
  const { jobId } = await params;
  const { data } = await access.service
    .from("training_editorial_ai_jobs")
    .update({ status: "cancelled", completed_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("created_by", access.userId)
    .in("status", ["queued", "processing", "validating"])
    .select("id")
    .maybeSingle();
  if (!data)
    return jsonError(
      {
        code: "NOT_CANCELLABLE",
        message: "El trabajo ya terminó o no te pertenece.",
      },
      409,
    );
  await auditEditorial(access.service, {
    actorId: access.userId,
    action: "ai_editorial_job_cancelled",
    entityType: "editorial_ai_job",
    entityId: jobId,
  });
  return jsonData({ ok: true });
}
