import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
import { EditorialAIResultService } from "@/lib/training/editorial-ai-results";
import {
  generatedRubricSchema,
  generatedTemplateSuggestionSchema,
  trainingDifficultySchema,
} from "@/lib/training/editorial-ai-schemas";
import { exerciseDraftSchema } from "@/lib/training/editorial-validation";
const schema = z.discriminatedUnion("entityType", [
  z
    .object({ entityType: z.literal("exercise"), draft: exerciseDraftSchema })
    .strict(),
  z
    .object({
      entityType: z.literal("rubric"),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      rubric: generatedRubricSchema,
    })
    .strict(),
  z
    .object({
      entityType: z.literal("template"),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      categoryId: z.string().uuid(),
      difficulty: trainingDifficultySchema,
      template: generatedTemplateSuggestionSchema,
    })
    .strict(),
]);
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> },
) {
  const access = await requireEditorialAccess(request, "create");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "Tu rol no permite guardar borradores." },
      403,
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return jsonError(
      {
        code: "INVALID_DRAFT",
        message: parsed.error.issues[0]?.message ?? "Revisa el borrador.",
      },
      400,
    );
  const { resultId } = await params;
  const service = new EditorialAIResultService(access.service, access.userId);
  try {
    if (parsed.data.entityType === "exercise")
      return jsonData(
        await service.saveExercise(resultId, parsed.data.draft),
        201,
      );
    if (parsed.data.entityType === "rubric")
      return jsonData(
        await service.saveRubric(
          resultId,
          parsed.data.slug,
          parsed.data.rubric,
        ),
        201,
      );
    return jsonData(await service.saveTemplate(resultId, parsed.data), 201);
  } catch {
    return jsonError(
      {
        code: "DRAFT_SAVE_FAILED",
        message: "No pudimos guardar el resultado como borrador.",
      },
      409,
    );
  }
}
