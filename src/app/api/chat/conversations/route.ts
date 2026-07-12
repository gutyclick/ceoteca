import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";

const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(120).default("Nueva conversación"),
});

const conversationActionSchema = z.object({
  target: z.enum(["site", "book"]),
  id: z.string().uuid(),
  action: z.enum(["archive", "restore", "delete"]),
});

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
  return error || !data.user ? null : { supabase, user: data.user };
}

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para ver tus conversaciones." }, 401);
  }

  const [conversationsResponse, bookMessagesResponse, preferencesResponse] = await Promise.all([
    session.supabase
      .from("chat_conversations")
      .select("id,title,context,book_id,archived_at,last_message_at,created_at")
      .eq("user_id", session.user.id)
      .eq("context", "site")
      .order("last_message_at", { ascending: false }),
    session.supabase
      .from("chat_messages")
      .select("book_id,created_at")
      .eq("user_id", session.user.id)
      .eq("context", "book")
      .order("created_at", { ascending: false }),
    session.supabase
      .from("chat_book_preferences")
      .select("book_id,archived_at")
      .eq("user_id", session.user.id),
  ]);

  if (conversationsResponse.error || bookMessagesResponse.error || preferencesResponse.error) {
    return jsonError({ code: "CHAT_HISTORY_FAILED", message: "No pudimos cargar tus conversaciones." }, 500);
  }

  const startedBooks = new Map<string, string>();
  const archivedBooks = new Map(
    (preferencesResponse.data ?? []).map((item) => [item.book_id, item.archived_at]),
  );
  for (const message of bookMessagesResponse.data ?? []) {
    if (!startedBooks.has(message.book_id)) {
      startedBooks.set(message.book_id, message.created_at);
    }
  }

  return jsonData({
    conversations: conversationsResponse.data ?? [],
    startedBooks: Array.from(startedBooks, ([bookId, lastMessageAt]) => ({
      bookId,
      lastMessageAt,
      archivedAt: archivedBooks.get(bookId) ?? null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para crear una conversación." }, 401);
  }

  let payload: unknown = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }
  const parsed = createConversationSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError({ code: "INVALID_INPUT", message: "El título de la conversación no es válido." }, 400);
  }

  const { data, error } = await session.supabase
    .from("chat_conversations")
    .insert({
      user_id: session.user.id,
      context: "site",
      title: parsed.data.title,
    })
    .select("id,title,context,book_id,archived_at,last_message_at,created_at")
    .single();

  if (error || !data) {
    return jsonError({ code: "CONVERSATION_CREATE_FAILED", message: "No pudimos crear la conversación." }, 500);
  }

  return jsonData({ conversation: data }, 201);
}

async function parseAction(request: NextRequest) {
  try {
    return conversationActionSchema.safeParse(await request.json());
  } catch {
    return conversationActionSchema.safeParse(null);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para administrar tus conversaciones." }, 401);
  }
  const parsed = await parseAction(request);
  if (!parsed.success || parsed.data.action === "delete") {
    return jsonError({ code: "INVALID_INPUT", message: "La acción solicitada no es válida." }, 400);
  }

  const archivedAt = parsed.data.action === "archive" ? new Date().toISOString() : null;
  if (parsed.data.target === "site") {
    const { error } = await session.supabase
      .from("chat_conversations")
      .update({ archived_at: archivedAt })
      .eq("id", parsed.data.id)
      .eq("user_id", session.user.id);
    if (error) return jsonError({ code: "CONVERSATION_UPDATE_FAILED", message: "No pudimos actualizar la conversación." }, 500);
  } else {
    const { error } = await session.supabase.from("chat_book_preferences").upsert({
      user_id: session.user.id,
      book_id: parsed.data.id,
      archived_at: archivedAt,
    }, { onConflict: "user_id,book_id" });
    if (error) return jsonError({ code: "CONVERSATION_UPDATE_FAILED", message: "No pudimos actualizar el chat del libro." }, 500);
  }

  return jsonData({ archivedAt });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para eliminar conversaciones." }, 401);
  }
  const parsed = await parseAction(request);
  if (!parsed.success || parsed.data.action !== "delete") {
    return jsonError({ code: "INVALID_INPUT", message: "La acción solicitada no es válida." }, 400);
  }

  if (parsed.data.target === "site") {
    const { error } = await session.supabase
      .from("chat_conversations")
      .delete()
      .eq("id", parsed.data.id)
      .eq("user_id", session.user.id);
    if (error) return jsonError({ code: "CONVERSATION_DELETE_FAILED", message: "No pudimos eliminar la conversación." }, 500);
  } else {
    const serviceClient = createServiceSupabaseClient();
    const { error } = await serviceClient
      .from("chat_messages")
      .delete()
      .eq("user_id", session.user.id)
      .eq("book_id", parsed.data.id)
      .eq("context", "book");
    if (error) return jsonError({ code: "CONVERSATION_DELETE_FAILED", message: "No pudimos eliminar el chat del libro." }, 500);
    await serviceClient.from("chat_book_preferences").delete().eq("user_id", session.user.id).eq("book_id", parsed.data.id);
  }

  return jsonData({ deleted: true });
}
