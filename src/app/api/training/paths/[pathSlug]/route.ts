import { NextRequest } from "next/server";

import { jsonData, jsonError } from "@/lib/api/response";
import { getTrainingPathRequestContext } from "@/lib/training/path-route";
import { trainingPathSlugSchema } from "@/lib/training/path-schemas";
import { getTrainingPathService } from "@/lib/training/path-services";

export async function GET(request: NextRequest, { params }: { params: Promise<{ pathSlug: string }> }) {
  const context = await getTrainingPathRequestContext(request);
  if (!context) return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para consultar esta ruta." }, 401);
  const slug = trainingPathSlugSchema.safeParse((await params).pathSlug);
  if (!slug.success) return jsonError({ code: "INVALID_PATH", message: "La ruta solicitada no es válida." }, 400);
  const path = await getTrainingPathService().getPathBySlug(context.userId, context.plan, slug.data);
  return path ? jsonData(path) : jsonError({ code: "NOT_FOUND", message: "Esta ruta no está disponible." }, 404);
}
