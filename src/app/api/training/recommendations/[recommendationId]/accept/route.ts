import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { getTrainingServerSession } from "@/lib/training/server-auth";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ recommendationId: string }> },
) {
  const auth = await getTrainingServerSession(request);
  if (!auth)
    return jsonError(
      { code: "UNAUTHORIZED", message: "Inicia sesión para comenzar." },
      401,
    );
  const { recommendationId } = await params;
  const { data, error } = await auth.client.rpc(
    "accept_adaptive_training_recommendation",
    { p_recommendation_id: recommendationId },
  );
  if (error || !data)
    return jsonError(
      {
        code: "RECOMMENDATION_EXPIRED",
        message: "Esta recomendación ya no está disponible. Genera una nueva.",
      },
      409,
    );
  return jsonData({ sessionId: data });
}
