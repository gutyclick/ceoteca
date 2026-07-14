import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { startRoleplaySchema } from "@/lib/training/roleplay-schemas";
import {
  getRoleplayContext,
  roleplayRouteError,
} from "@/lib/training/roleplay-route";

export async function POST(request: NextRequest) {
  const context = await getRoleplayContext(request);
  if (!context)
    return jsonError(
      { code: "UNAUTHORIZED", message: "Inicia sesión para comenzar." },
      401,
    );
  const parsed = startRoleplaySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return jsonError(
      {
        code: "INVALID_INPUT",
        message: "Revisa el escenario y la dificultad.",
      },
      400,
    );
  try {
    return jsonData(
      await context.service.start(context.auth.user.id, parsed.data),
      201,
    );
  } catch (error) {
    return roleplayRouteError(error, "No pudimos iniciar la simulación.");
  }
}
