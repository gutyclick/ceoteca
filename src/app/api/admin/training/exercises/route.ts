import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
import { ExerciseEditorService } from "@/lib/training/editorial-service";
import { exerciseDraftSchema } from "@/lib/training/editorial-validation";
export async function GET(request: NextRequest) {
  const access = await requireEditorialAccess(request, "read");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "No tienes acceso editorial." },
      403,
    );
  return jsonData(
    await new ExerciseEditorService(access.service, access.userId).list(),
  );
}
export async function POST(request: NextRequest) {
  const access = await requireEditorialAccess(request, "create");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "Tu rol no permite crear ejercicios." },
      403,
    );
  const parsed = exerciseDraftSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return jsonError(
      {
        code: "INVALID_CONTENT",
        message: parsed.error.issues[0]?.message ?? "Revisa el contenido.",
      },
      400,
    );
  try {
    return jsonData(
      await new ExerciseEditorService(access.service, access.userId).create(
        parsed.data,
      ),
      201,
    );
  } catch {
    return jsonError(
      { code: "CREATE_FAILED", message: "No pudimos guardar el borrador." },
      500,
    );
  }
}
