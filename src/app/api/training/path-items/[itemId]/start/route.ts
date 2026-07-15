import { NextRequest } from "next/server";

import { jsonData, jsonError } from "@/lib/api/response";
import { getTrainingPathRequestContext, trainingPathError } from "@/lib/training/path-route";
import { trainingPathItemIdSchema } from "@/lib/training/path-schemas";
import { getTrainingPathService } from "@/lib/training/path-services";

export async function POST(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const context = await getTrainingPathRequestContext(request);
  if (!context) return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para entrenar." }, 401);
  const itemId = trainingPathItemIdSchema.safeParse((await params).itemId);
  if (!itemId.success) return jsonError({ code: "INVALID_ITEM", message: "La actividad solicitada no es válida." }, 400);
  try {
    return jsonData(await getTrainingPathService().startModuleItem(context.userId, itemId.data, context.plan));
  } catch (error) {
    const result = trainingPathError(error);
    return jsonError({ code: result.code, message: result.message }, result.status);
  }
}
