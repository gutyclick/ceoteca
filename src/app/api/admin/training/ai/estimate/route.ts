import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
import { EditorialGenerationService } from "@/lib/training/editorial-ai-service";
import { editorialJobTypeSchema } from "@/lib/training/editorial-ai-schemas";
const schema = z
  .object({
    jobType: editorialJobTypeSchema,
    count: z.number().int().min(1).max(5),
    characterCount: z.number().int().min(1).max(20000),
  })
  .strict();
export async function POST(request: NextRequest) {
  const access = await requireEditorialAccess(request, "ai_generate");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "Tu rol no permite generar contenido." },
      403,
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return jsonError(
      { code: "INVALID_INPUT", message: "No pudimos estimar esta solicitud." },
      400,
    );
  return jsonData(
    new EditorialGenerationService(access.service).estimate(
      parsed.data.jobType,
      { characterCount: parsed.data.characterCount },
      parsed.data.count,
    ),
  );
}
