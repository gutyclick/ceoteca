import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { finishRoleplaySchema } from "@/lib/training/roleplay-schemas";
import {
  getRoleplayContext,
  roleplayRouteError,
} from "@/lib/training/roleplay-route";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const context = await getRoleplayContext(request);
  if (!context)
    return jsonError(
      { code: "UNAUTHORIZED", message: "Inicia sesión para continuar." },
      401,
    );
  const parsed = finishRoleplaySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return jsonError(
      { code: "INVALID_INPUT", message: "No pudimos finalizar la simulación." },
      400,
    );
  try {
    return jsonData(
      await context.service.finish(
        context.auth.user.id,
        (await params).sessionId,
        parsed.data.reason,
      ),
    );
  } catch (error) {
    return roleplayRouteError(error);
  }
}
