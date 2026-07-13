import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { TrainingAnalyticsService } from "@/lib/training/analytics-service";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
export async function GET(request: NextRequest) {
  const access = await requireEditorialAccess(request, "analytics_read");
  if (!access) return jsonError({ code: "FORBIDDEN", message: "Acceso denegado." }, 403);
  return jsonData(await new TrainingAnalyticsService(access.service).exercises());
}
