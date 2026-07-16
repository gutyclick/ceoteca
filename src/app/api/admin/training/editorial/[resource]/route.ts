import { NextRequest } from "next/server";

import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
import {
  editorialResourceSchema,
  type EditorialResourceType,
} from "@/lib/training/editorial-content-schemas";
import { TrainingEditorialPathService } from "@/lib/training/editorial-path-service";
import { TrainingEditorialTaxonomyService } from "@/lib/training/editorial-taxonomy-service";

type TaxonomyResource = Exclude<EditorialResourceType, "paths">;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ resource: string }> },
) {
  const access = await requireEditorialAccess(request, "read");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "No tienes acceso editorial." },
      403,
    );
  const parsed = editorialResourceSchema.safeParse(
    (await context.params).resource,
  );
  if (!parsed.success)
    return jsonError(
      { code: "NOT_FOUND", message: "Sección editorial no encontrada." },
      404,
    );
  try {
    const data =
      parsed.data === "paths"
        ? await new TrainingEditorialPathService(
            access.service,
            access.userId,
          ).list()
        : await new TrainingEditorialTaxonomyService(
            access.service,
            access.userId,
          ).list(parsed.data as TaxonomyResource);
    return jsonData({ items: data, role: access.role });
  } catch {
    return jsonError(
      {
        code: "EDITORIAL_LIST_FAILED",
        message: "No pudimos cargar el contenido editorial.",
      },
      500,
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ resource: string }> },
) {
  const access = await requireEditorialAccess(request, "create");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "No tienes permiso para crear contenido." },
      403,
    );
  const parsed = editorialResourceSchema.safeParse(
    (await context.params).resource,
  );
  if (!parsed.success)
    return jsonError(
      { code: "NOT_FOUND", message: "Sección editorial no encontrada." },
      404,
    );
  try {
    const body = await request.json();
    const data =
      parsed.data === "paths"
        ? await new TrainingEditorialPathService(
            access.service,
            access.userId,
          ).create(body)
        : await new TrainingEditorialTaxonomyService(
            access.service,
            access.userId,
          ).create(parsed.data as TaxonomyResource, body);
    return jsonData(data, 201);
  } catch (error) {
    const duplicate =
      error instanceof Error && error.message.includes("duplicate");
    return jsonError(
      {
        code: duplicate ? "SLUG_EXISTS" : "INVALID_CONTENT",
        message: duplicate
          ? "Ese slug ya está en uso."
          : "Revisa los campos editoriales.",
      },
      400,
    );
  }
}
