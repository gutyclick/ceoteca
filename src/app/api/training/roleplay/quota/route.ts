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
        message: "Inicia sesión para consultar tu acceso.",
      },
      401,
    );
  try {
    return jsonData(await context.service.quota(context.auth.user.id));
  } catch (error) {
    return roleplayRouteError(error);
  }
}
