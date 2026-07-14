import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import {
  getRoleplayContext,
  roleplayRouteError,
} from "@/lib/training/roleplay-route";
export async function GET(request: NextRequest) {
  const context = await getRoleplayContext(request);
  if (!context)
    return jsonError(
      {
        code: "UNAUTHORIZED",
        message: "Inicia sesión para explorar categorías.",
      },
      401,
    );
  try {
    const catalog = await context.service.catalog(context.auth.user.id);
    return jsonData({ categories: catalog.categories });
  } catch (error) {
    return roleplayRouteError(error);
  }
}
