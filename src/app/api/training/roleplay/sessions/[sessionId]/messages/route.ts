import { NextRequest } from "next/server";
import { jsonData, jsonError } from "@/lib/api/response";
import { roleplayMessageSchema } from "@/lib/training/roleplay-schemas";
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
  const body = await request.json().catch(() => null);
  const parsed = roleplayMessageSchema.safeParse(
    body && typeof body === "object" && "clientTurnId" in body
      ? { ...body, clientMessageId: body.clientTurnId }
      : body,
  );
  if (!parsed.success)
    return jsonError(
      {
        code: "INVALID_INPUT",
        message: "Escribe una respuesta válida de hasta 1.500 caracteres.",
      },
      400,
    );
  try {
    return jsonData(
      await context.service.turn(
        context.auth.user.id,
        (await params).sessionId,
        parsed.data,
      ),
    );
  } catch (error) {
    return roleplayRouteError(
      error,
      "No pudimos responder. Tu mensaje quedó guardado y puedes reintentar.",
    );
  }
}
