import { NextRequest } from "next/server";

import { jsonData, jsonError } from "@/lib/api/response";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
import { TrainingAuditService } from "@/lib/training/editorial-audit-service";
import { TrainingTaxonomyValidationService } from "@/lib/training/editorial-validation-service";

export async function GET(request: NextRequest) {
  const access = await requireEditorialAccess(request, "read");
  if (!access)
    return jsonError(
      { code: "FORBIDDEN", message: "No tienes acceso editorial." },
      403,
    );
  try {
    const issues = await new TrainingTaxonomyValidationService(
      access.service,
    ).validateAll();
    const summary = {
      errors: issues.filter((item) => item.severity === "error").length,
      warnings: issues.filter((item) => item.severity === "warning").length,
      info: issues.filter((item) => item.severity === "info").length,
    };
    if (summary.errors > 0) {
      await new TrainingAuditService(access.service, access.userId).record({
        action: "editorial_validation_failed",
        entityType: "catalog",
        metadata: summary,
      });
    }
    return jsonData({
      issues,
      summary,
    });
  } catch {
    return jsonError(
      { code: "VALIDATION_FAILED", message: "No pudimos validar el catálogo." },
      500,
    );
  }
}
