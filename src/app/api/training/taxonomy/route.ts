import { NextRequest } from "next/server";

import { jsonData, jsonError } from "@/lib/api/response";
import { serverEnv } from "@/lib/env";
import { getTrainingServerSession } from "@/lib/training/server-auth";

export async function GET(request: NextRequest) {
  if (
    !serverEnv.TRAINING_TAXONOMY_ENABLED ||
    !serverEnv.TRAINING_CATEGORIES_ENABLED
  )
    return jsonError(
      {
        code: "FEATURE_DISABLED",
        message: "Las categorías de Training no están disponibles.",
      },
      404,
    );
  const auth = await getTrainingServerSession(request);
  if (!auth)
    return jsonError(
      {
        code: "UNAUTHORIZED",
        message: "Inicia sesión para consultar Training.",
      },
      401,
    );
  const { data, error } = await auth.client
    .from("training_category_catalog")
    .select("*")
    .order("sort_order");
  if (error)
    return jsonError(
      {
        code: "TAXONOMY_UNAVAILABLE",
        message: "No pudimos cargar las categorías.",
      },
      500,
    );
  return jsonData({ categories: data ?? [] });
}
