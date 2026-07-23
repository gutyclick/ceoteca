import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { deleteConversationAttachments } from "@/lib/chat/attachments/service";
import { getUserConversation, listUserConversations } from "@/lib/chat/conversation-service";
import { mapConversation, type ChatConversationRow } from "@/lib/chat/model";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";

const updateConversationSchema = z.discriminatedUnion("action", [
  z.object({ id: z.string().uuid(), action: z.literal("rename"), title: z.string().trim().min(1).max(120) }),
  z.object({ id: z.string().uuid(), action: z.enum(["archive", "restore"]) }),
]);

const deleteConversationSchema = z.object({ id: z.string().uuid() });
const fields =
  "id,user_id,type,book_id,title,status,created_at,updated_at,last_message_at,metadata,title_is_manual";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
}

async function getSession(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) return null;
  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);
  return error || !data.user ? null : { user: data.user };
}

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para ver tus conversaciones." }, 401);
  }

  try {
    return jsonData({ conversations: await listUserConversations(session.user.id) });
  } catch {
    return jsonError({ code: "CHAT_HISTORY_FAILED", message: "No pudimos cargar tus conversaciones." }, 500);
  }
}

export async function POST() {
  return jsonError(
    {
      code: "CONVERSATION_REQUIRES_MESSAGE",
      message: "La conversación se crea cuando envías el primer mensaje.",
    },
    405,
  );
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para administrar tus conversaciones." }, 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }
  const parsed = updateConversationSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError({ code: "INVALID_INPUT", message: "La acción solicitada no es válida." }, 400);
  }

  const existing = await getUserConversation(session.user.id, parsed.data.id);
  if (!existing) {
    return jsonError(
      { code: "CONVERSATION_NOT_FOUND", message: "No encontramos esta conversación o no tienes acceso." },
      404,
    );
  }

  const client = createServiceSupabaseClient();
  const changes =
    parsed.data.action === "rename"
      ? { title: parsed.data.title, title_is_manual: true }
      : parsed.data.action === "archive"
        ? { status: "archived" as const, archived_at: new Date().toISOString() }
        : { status: "active" as const, archived_at: null };
  const { data, error } = await client
    .from("chat_conversations")
    .update(changes)
    .eq("id", parsed.data.id)
    .eq("user_id", session.user.id)
    .select(fields)
    .single();

  if (error || !data) {
    return jsonError({ code: "CONVERSATION_UPDATE_FAILED", message: "No pudimos actualizar la conversación." }, 500);
  }
  return jsonData({ conversation: mapConversation(data as ChatConversationRow) });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para eliminar conversaciones." }, 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }
  const parsed = deleteConversationSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError({ code: "INVALID_INPUT", message: "La conversación no es válida." }, 400);
  }

  const existing = await getUserConversation(session.user.id, parsed.data.id);
  if (!existing) {
    return jsonError(
      { code: "CONVERSATION_NOT_FOUND", message: "No encontramos esta conversación o no tienes acceso." },
      404,
    );
  }

  try {
    await deleteConversationAttachments(session.user.id, parsed.data.id);
  } catch {
    return jsonError(
      { code: "CONVERSATION_DELETE_FAILED", message: "No pudimos eliminar los archivos de la conversación." },
      503,
    );
  }
  const client = createServiceSupabaseClient();
  const { error } = await client
    .from("chat_conversations")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", session.user.id);
  if (error) {
    return jsonError({ code: "CONVERSATION_DELETE_FAILED", message: "No pudimos eliminar la conversación." }, 500);
  }
  return jsonData({ deleted: true, id: parsed.data.id });
}
