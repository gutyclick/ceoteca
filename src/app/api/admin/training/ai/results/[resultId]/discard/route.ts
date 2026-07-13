import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
import { EditorialAIResultService } from "@/lib/training/editorial-ai-results";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> },
) {
  const access = await requireEditorialAccess(request, "ai_generate");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "Tu rol no permite descartar resultados." },
      403,
    );
  try {
    const { resultId } = await params;
    return jsonData(
      await new EditorialAIResultService(access.service, access.userId).discard(
        resultId,
      ),
    );
  } catch {
    return jsonError(
      {
        code: "RESULT_NOT_SAVABLE",
        message: "No pudimos descartar este resultado.",
      },
      409,
    );
  }
}
