import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  all: z.boolean().optional(),
  notificationIds: z.array(z.string().uuid()).max(50).optional(),
});

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

async function getSession(request: NextRequest) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return null;
  }

  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return { accessToken, supabase, userId: data.user.id };
}

export async function GET(request: NextRequest) {
  const session = await getSession(request);

  if (!session) {
    return jsonError(
      { code: "UNAUTHORIZED", message: "Inicia sesión para ver notificaciones." },
      401,
    );
  }

  const { data, error } = await session.supabase
    .from("notifications")
    .select("id,type,title,body,href,metadata,read_at,created_at")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return jsonError(
      {
        code: "NOTIFICATIONS_ERROR",
        message: "No pudimos cargar tus notificaciones.",
      },
      500,
    );
  }

  return jsonData({
    notifications: data ?? [],
    unreadCount: (data ?? []).filter((notification) => !notification.read_at).length,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);

  if (!session) {
    return jsonError(
      { code: "UNAUTHORIZED", message: "Inicia sesión para actualizar notificaciones." },
      401,
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError(
      { code: "INVALID_INPUT", message: "El cuerpo de la solicitud no es válido." },
      400,
    );
  }

  const parsed = patchSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonError(
      { code: "INVALID_INPUT", message: "Revisa las notificaciones enviadas." },
      400,
    );
  }

  const now = new Date().toISOString();
  let query = session.supabase
    .from("notifications")
    .update({ read_at: now })
    .eq("user_id", session.userId)
    .is("read_at", null);

  if (!parsed.data.all) {
    const ids = parsed.data.notificationIds ?? [];

    if (ids.length === 0) {
      return jsonData({ updated: 0 });
    }

    query = query.in("id", ids);
  }

  const { error } = await query;

  if (error) {
    return jsonError(
      {
        code: "NOTIFICATIONS_UPDATE_ERROR",
        message: "No pudimos actualizar tus notificaciones.",
      },
      500,
    );
  }

  return jsonData({ updated: true });
}
