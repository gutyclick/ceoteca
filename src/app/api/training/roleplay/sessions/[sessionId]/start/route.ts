import { NextRequest } from "next/server";

import { jsonData, jsonError } from "@/lib/api/response";
import {
  getRoleplayContext,
  roleplayRouteError,
} from "@/lib/training/roleplay-route";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const context = await getRoleplayContext(request);
  if (!context) {
    return jsonError(
      { code: "UNAUTHORIZED", message: "Inicia sesión para continuar." },
      401,
    );
  }
  try {
    return jsonData(
      await context.service.getSession(
        context.auth.user.id,
        (await params).sessionId,
      ),
    );
  } catch (error) {
    return roleplayRouteError(error);
  }
}
