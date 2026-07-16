import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
import {
  editorialResourceSchema,
  type EditorialResourceType,
} from "@/lib/training/editorial-content-schemas";
import { TrainingEditorialPathService } from "@/lib/training/editorial-path-service";
import { TrainingEditorialTaxonomyService } from "@/lib/training/editorial-taxonomy-service";

const paramsSchema = z.object({
  resource: editorialResourceSchema,
  entityId: z.string().uuid(),
});
type TaxonomyResource = Exclude<EditorialResourceType, "paths">;

async function parameters(context: {
  params: Promise<{ resource: string; entityId: string }>;
}) {
  return paramsSchema.safeParse(await context.params);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ resource: string; entityId: string }> },
) {
  const access = await requireEditorialAccess(request, "read");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "No tienes acceso editorial." },
      403,
    );
  const parsed = await parameters(context);
  if (!parsed.success)
    return jsonError(
      { code: "NOT_FOUND", message: "Contenido no encontrado." },
      404,
    );
  try {
    const data =
      parsed.data.resource === "paths"
        ? await new TrainingEditorialPathService(
            access.service,
            access.userId,
          ).detail(parsed.data.entityId)
        : await new TrainingEditorialTaxonomyService(
            access.service,
            access.userId,
          ).detail(
            parsed.data.resource as TaxonomyResource,
            parsed.data.entityId,
          );
    return jsonData({ ...data, role: access.role });
  } catch {
    return jsonError(
      { code: "NOT_FOUND", message: "Contenido no encontrado." },
      404,
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ resource: string; entityId: string }> },
) {
  const access = await requireEditorialAccess(request, "edit");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "No tienes permiso para editar." },
      403,
    );
  const parsed = await parameters(context);
  if (!parsed.success)
    return jsonError(
      { code: "NOT_FOUND", message: "Contenido no encontrado." },
      404,
    );
  try {
    const body = await request.json();
    const data =
      parsed.data.resource === "paths"
        ? await new TrainingEditorialPathService(
            access.service,
            access.userId,
          ).save(parsed.data.entityId, body)
        : await new TrainingEditorialTaxonomyService(
            access.service,
            access.userId,
          ).save(
            parsed.data.resource as TaxonomyResource,
            parsed.data.entityId,
            body,
          );
    return jsonData(data);
  } catch (error) {
    const duplicate =
      error instanceof Error && error.message.includes("duplicate");
    return jsonError(
      {
        code: duplicate ? "SLUG_EXISTS" : "INVALID_CONTENT",
        message: duplicate
          ? "Ese slug ya está en uso."
          : "No pudimos guardar los cambios.",
      },
      400,
    );
  }
}
