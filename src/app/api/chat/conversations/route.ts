import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonData, jsonError } from "@/lib/api/response";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(120).default("Nueva conversación"),
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

  const [conversationsResponse, bookMessagesResponse] = await Promise.all([
    session.supabase
      .from("chat_conversations")
      .select("id,title,context,book_id,last_message_at,created_at")
      .eq("user_id", session.user.id)
      .eq("context", "site")
      .order("last_message_at", { ascending: false }),
    session.supabase
      .from("chat_messages")
      .select("book_id,created_at")
      .eq("user_id", session.user.id)
      .eq("context", "book")
      .order("created_at", { ascending: false }),
  ]);

  if (conversationsResponse.error || bookMessagesResponse.error) {
    return jsonError({ code: "CHAT_HISTORY_FAILED", message: "No pudimos cargar tus conversaciones." }, 500);
  }

  const startedBooks = new Map<string, string>();
  for (const message of bookMessagesResponse.data ?? []) {
    if (!startedBooks.has(message.book_id)) {
      startedBooks.set(message.book_id, message.created_at);
    }
  }

  return jsonData({
    conversations: conversationsResponse.data ?? [],
    startedBooks: Array.from(startedBooks, ([bookId, lastMessageAt]) => ({ bookId, lastMessageAt })),
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
    .select("id,title,context,book_id,last_message_at,created_at")
    .single();

  if (error || !data) {
    return jsonError({ code: "CONVERSATION_CREATE_FAILED", message: "No pudimos crear la conversación." }, 500);
  }

  return jsonData({ conversation: data }, 201);
}
