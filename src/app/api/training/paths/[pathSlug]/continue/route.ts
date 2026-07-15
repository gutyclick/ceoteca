import { NextRequest } from "next/server";

import { jsonData, jsonError } from "@/lib/api/response";
import { getTrainingPathRequestContext, trainingPathError } from "@/lib/training/path-route";
import { trainingPathSlugSchema } from "@/lib/training/path-schemas";
import { getTrainingPathService } from "@/lib/training/path-services";

export async function POST(request: NextRequest, { params }: { params: Promise<{ pathSlug: string }> }) {
  const context = await getTrainingPathRequestContext(request);
  if (!context) return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para continuar." }, 401);
  const slug = trainingPathSlugSchema.safeParse((await params).pathSlug);
  if (!slug.success) return jsonError({ code: "INVALID_PATH", message: "La ruta solicitada no es válida." }, 400);
  try {
    return jsonData(await getTrainingPathService().continuePath(context.userId, context.plan, slug.data));
  } catch (error) {
    const result = trainingPathError(error);
    return jsonError({ code: result.code, message: result.message }, result.status);
  }
}
