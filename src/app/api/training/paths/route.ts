import { NextRequest } from "next/server";

import { jsonData, jsonError } from "@/lib/api/response";
import { serverEnv } from "@/lib/env";
import { getTrainingPathRequestContext } from "@/lib/training/path-route";
import { trainingPathFiltersSchema } from "@/lib/training/path-schemas";
import { getTrainingPathService } from "@/lib/training/path-services";

export async function GET(request: NextRequest) {
  if (!serverEnv.TRAINING_TAXONOMY_ENABLED || !serverEnv.TRAINING_LEARNING_PATHS_ENABLED)
    return jsonError({ code: "FEATURE_DISABLED", message: "Las rutas no están disponibles." }, 404);
  const context = await getTrainingPathRequestContext(request);
  if (!context) return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para consultar tus rutas." }, 401);
  const parsed = trainingPathFiltersSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return jsonError({ code: "INVALID_FILTERS", message: "Revisa los filtros seleccionados." }, 400);
  return jsonData(await getTrainingPathService().getPaths(context.userId, context.plan, {
    query: parsed.data.q, category: parsed.data.category, difficulty: parsed.data.difficulty,
    duration: parsed.data.duration, progress: parsed.data.progress, plan: parsed.data.plan,
  }));
}
