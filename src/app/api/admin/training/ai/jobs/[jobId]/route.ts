import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
import { EditorialGenerationService } from "@/lib/training/editorial-ai-service";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const access = await requireEditorialAccess(request, "read");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "No tienes acceso editorial." },
      403,
    );
  try {
    const { jobId } = await params;
    return jsonData(
      await new EditorialGenerationService(access.service).getJob(
        access.userId,
        jobId,
      ),
    );
  } catch {
    return jsonError(
      { code: "NOT_FOUND", message: "No encontramos este trabajo editorial." },
      404,
    );
  }
}
