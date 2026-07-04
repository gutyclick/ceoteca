import { NextRequest } from "next/server";

import { jsonData, jsonError } from "@/lib/api/response";
import {
  getAuthFieldErrors,
  getRequestIp,
  getRequestUserAgent,
  logAuthEvent,
} from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { passwordUpdateSchema } from "@/lib/validation/auth";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);
  const userAgent = getRequestUserAgent(request);
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return jsonError(
      {
        code: "INVALID_RECOVERY_SESSION",
        message: "Tu enlace expiró. Solicita uno nuevo para continuar.",
      },
      401,
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError(
      { code: "INVALID_INPUT", message: "El cuerpo de la solicitud no es JSON válido." },
      400,
    );
  }

  const parsed = passwordUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(
      {
        code: "INVALID_INPUT",
        message: "Revisa los campos marcados.",
        fieldErrors: getAuthFieldErrors(parsed.error),
      },
      400,
    );
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { data: userData } = await supabase.auth.getUser(accessToken);
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  await logAuthEvent({
    userId: userData.user?.id ?? null,
    email: userData.user?.email ?? null,
    eventType: error ? "password_reset_error" : "password_reset_updated",
    code: error ? "PASSWORD_RESET_UPDATE_FAILED" : "PASSWORD_RESET_UPDATED",
    message: error?.message ?? null,
    ip,
    userAgent,
  });

  if (error) {
    return jsonError(
      {
        code: "PASSWORD_RESET_UPDATE_FAILED",
        message: "No pudimos actualizar tu contraseña. Solicita un nuevo enlace e inténtalo otra vez.",
      },
      400,
    );
  }

  return jsonData({
    message: "Contraseña actualizada. Ya puedes iniciar sesión.",
  });
}
