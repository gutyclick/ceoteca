import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { serverEnv } from "@/lib/env";
import { getTrainingServerSession } from "@/lib/training/server-auth";
import { searchTrainingCatalog } from "@/lib/training/taxonomy";

const querySchema = z.string().trim().min(2).max(80);

export async function GET(request: NextRequest) {
  if (
    !serverEnv.TRAINING_TAXONOMY_ENABLED ||
    !serverEnv.TRAINING_TRAINING_SEARCH_ENABLED
  )
    return jsonError(
      {
        code: "FEATURE_DISABLED",
        message: "La búsqueda de Training no está disponible.",
      },
      404,
    );
  const auth = await getTrainingServerSession(request);
  if (!auth)
    return jsonError(
      {
        code: "UNAUTHORIZED",
        message: "Inicia sesión para buscar en Training.",
      },
      401,
    );
  const parsed = querySchema.safeParse(request.nextUrl.searchParams.get("q"));
  if (!parsed.success) return jsonData({ results: [] });
  return jsonData({ results: searchTrainingCatalog(parsed.data) });
}
