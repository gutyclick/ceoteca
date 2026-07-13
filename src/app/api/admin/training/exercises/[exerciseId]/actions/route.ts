import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
import { ExerciseEditorService } from "@/lib/training/editorial-service";
const schema = z.object({
  action: z.enum(["duplicate", "submit_review", "publish", "archive"]),
});
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ exerciseId: string }> },
) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return jsonError(
      { code: "INVALID_ACTION", message: "Selecciona una acción válida." },
      400,
    );
  const required =
    parsed.data.action === "publish"
      ? "publish"
      : parsed.data.action === "archive"
        ? "archive"
        : parsed.data.action === "duplicate"
          ? "create"
          : "submit_review";
  const access = await requireEditorialAccess(request, required);
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "Tu rol no permite esta acción." },
      403,
    );
  const { exerciseId } = await params;
  const service = new ExerciseEditorService(access.service, access.userId);
  try {
    if (parsed.data.action === "duplicate")
      return jsonData(await service.duplicate(exerciseId));
    const status =
      parsed.data.action === "submit_review"
        ? "in_review"
        : parsed.data.action === "publish"
          ? "published"
          : "archived";
    await service.changeStatus(exerciseId, status);
    return jsonData({ ok: true });
  } catch {
    return jsonError(
      {
        code: "ACTION_FAILED",
        message: "No pudimos completar la acción. Revisa las validaciones.",
      },
      409,
    );
  }
}
