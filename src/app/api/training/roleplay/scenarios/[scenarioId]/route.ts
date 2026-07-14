import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import {
  getRoleplayContext,
  roleplayRouteError,
} from "@/lib/training/roleplay-route";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> },
) {
  const context = await getRoleplayContext(request);
  if (!context)
    return jsonError(
      { code: "UNAUTHORIZED", message: "Inicia sesión para ver el escenario." },
      401,
    );
  try {
    return jsonData(
      await context.service.scenario(
        context.auth.user.id,
        (await params).scenarioId,
      ),
    );
  } catch (error) {
    return roleplayRouteError(error);
  }
}
