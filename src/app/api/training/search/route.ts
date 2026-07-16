import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { serverEnv } from "@/lib/env";
import { getTrainingServerSession } from "@/lib/training/server-auth";
import { TrainingSearchService } from "@/lib/training/search-service";
import { trainingSearchQuerySchema } from "@/lib/training/search-schemas";
import { getEffectiveSubscriptionForUser } from "@/lib/subscriptions/service";

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
  const parsed = trainingSearchQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success)
    return jsonError(
      { code: "INVALID_SEARCH", message: "Revisa los filtros de búsqueda." },
      400,
    );
  const subscription = await getEffectiveSubscriptionForUser(auth.user.id);
  try {
    return jsonData(
      await new TrainingSearchService(auth.client).search(
        parsed.data,
        subscription.plan === "founder" ? "pro" : subscription.plan,
      ),
    );
  } catch {
    return jsonError(
      { code: "SEARCH_FAILED", message: "No pudimos completar la búsqueda." },
      500,
    );
  }
}
