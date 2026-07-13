import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonData, jsonError } from "@/lib/api/response";
import { LearningMetricsService } from "@/lib/training/analytics-service";
import { requireEditorialAccess } from "@/lib/training/editorial-auth";
export async function POST(request: NextRequest) {
  const access = await requireEditorialAccess(request, "analytics_settings");
  if (!access) return jsonError({ code: "FORBIDDEN", message: "Acceso denegado." }, 403);
  const parsed = z.object({ date: z.string().date() }).safeParse(await request.json());
  if (!parsed.success) return jsonError({ code: "INVALID_DATE", message: "La fecha no es válida." }, 400);
  return jsonData(await new LearningMetricsService(access.service).aggregateDay(parsed.data.date));
}
