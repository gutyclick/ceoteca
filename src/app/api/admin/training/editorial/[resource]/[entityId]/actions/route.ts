import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
import {
  editorialActionSchema,
  editorialResourceSchema,
  type EditorialResourceType,
} from "@/lib/training/editorial-content-schemas";
import { TrainingEditorialPathService } from "@/lib/training/editorial-path-service";
import { TrainingEditorialTaxonomyService } from "@/lib/training/editorial-taxonomy-service";
import { TrainingTaxonomyValidationService } from "@/lib/training/editorial-validation-service";
import { TrainingVersioningService } from "@/lib/training/editorial-versioning-service";

const paramsSchema = z.object({
  resource: editorialResourceSchema,
  entityId: z.string().uuid(),
});
const entityType = {
  categories: "category",
  subcategories: "subcategory",
  skills: "skill",
  concepts: "concept",
  formats: "format",
  paths: "path",
} as const;
type TaxonomyResource = Exclude<EditorialResourceType, "paths">;
const permission = {
  submit_review: "submit_review",
  approve: "review",
  request_changes: "review",
  publish: "publish",
  archive: "archive",
  duplicate: "create",
  restore: "edit",
} as const;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ resource: string; entityId: string }> },
) {
  const params = paramsSchema.safeParse(await context.params);
  const body = editorialActionSchema.safeParse(
    await request.json().catch(() => ({})),
  );
  if (!params.success || !body.success)
    return jsonError(
      { code: "INVALID_ACTION", message: "Revisa la acción solicitada." },
      400,
    );
  const access = await requireEditorialAccess(
    request,
    permission[body.data.action],
  );
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "No tienes permiso para esta acción." },
      403,
    );
  const versions = new TrainingVersioningService(access.service, access.userId);
  const validator = new TrainingTaxonomyValidationService(access.service);
  const type = entityType[params.data.resource];
  try {
    if (body.data.action === "submit_review")
      return jsonData(
        await versions.transition(
          body.data.versionId!,
          "in_review",
          body.data.reason,
        ),
      );
    if (body.data.action === "approve")
      return jsonData(
        await versions.transition(
          body.data.versionId!,
          "approved",
          body.data.reason,
        ),
      );
    if (body.data.action === "request_changes")
      return jsonData(
        await versions.transition(
          body.data.versionId!,
          "changes_requested",
          body.data.reason,
        ),
      );
    if (body.data.action === "restore")
      return jsonData(
        await versions.restore(
          body.data.versionId!,
          body.data.reason ?? "Restauración editorial",
        ),
      );
    if (body.data.action === "publish") {
      if (params.data.resource === "paths") {
        const detail = await new TrainingEditorialPathService(
          access.service,
          access.userId,
        ).detail(params.data.entityId);
        const pathErrors = validator
          .validatePathDraft(detail.draft)
          .filter((entry: { severity: string }) => entry.severity === "error");
        if (pathErrors.length)
          return jsonError(
            {
              code: "VALIDATION_FAILED",
              message: pathErrors
                .map((entry: { message: string }) => entry.message)
                .join(" "),
            },
            409,
          );
        await new TrainingEditorialPathService(
          access.service,
          access.userId,
        ).applyPublished(params.data.entityId, body.data.versionId!);
      } else {
        await validator.assertPublishable(type, params.data.entityId);
        await new TrainingEditorialTaxonomyService(
          access.service,
          access.userId,
        ).applyPublished(
          params.data.resource as TaxonomyResource,
          params.data.entityId,
          body.data.versionId!,
        );
      }
      return jsonData({ published: true });
    }
    if (body.data.action === "archive") {
      if (params.data.resource === "paths")
        await new TrainingEditorialPathService(
          access.service,
          access.userId,
        ).archive(params.data.entityId);
      else
        await new TrainingEditorialTaxonomyService(
          access.service,
          access.userId,
        ).archive(
          params.data.resource as TaxonomyResource,
          params.data.entityId,
        );
      return jsonData({ archived: true });
    }
    const duplicated =
      params.data.resource === "paths"
        ? await new TrainingEditorialPathService(
            access.service,
            access.userId,
          ).duplicate(params.data.entityId)
        : await new TrainingEditorialTaxonomyService(
            access.service,
            access.userId,
          ).duplicate(
            params.data.resource as TaxonomyResource,
            params.data.entityId,
          );
    return jsonData(duplicated);
  } catch (error) {
    const validation =
      error instanceof Error &&
      error.message.startsWith("EDITORIAL_VALIDATION_FAILED");
    return jsonError(
      {
        code: validation ? "VALIDATION_FAILED" : "ACTION_FAILED",
        message: validation
          ? "Corrige los errores editoriales antes de publicar."
          : "No pudimos completar la acción.",
      },
      validation ? 409 : 400,
    );
  }
}
