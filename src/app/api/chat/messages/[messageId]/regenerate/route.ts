import { NextRequest } from "next/server";

import { jsonChatError, jsonError } from "@/lib/api/response";
import { canAccessBookChat } from "@/lib/books/access";
import { createBookRepository } from "@/lib/books/repository";
import { getUserConversation, listConversationMessages } from "@/lib/chat/conversation-service";
import { mapStoredMessage, type ChatMessageRow } from "@/lib/chat/model";
import { createChatPublicError } from "@/lib/chat/errors";
import { createChatRepository } from "@/lib/chat/repository";
import { confirmChatUsage, releaseChatUsage, reserveChatUsage, type ChatUsageSnapshot } from "@/lib/chat/usage";
import { createAIProvider } from "@/lib/openai/provider";
import { canAccessFeature } from "@/lib/permissions";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";
import { getEffectiveSubscriptionForUser } from "@/lib/subscriptions/service";

const activeRegenerations = new Set<string>();

function bearer(request: NextRequest) {
  const value = request.headers.get("authorization");
  return value?.startsWith("Bearer ") ? value.slice(7).trim() : null;
}

export async function POST(request: NextRequest, context: { params: Promise<{ messageId: string }> }) {
  const token = bearer(request);
  if (!token) return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para regenerar la respuesta." }, 401);
  const auth = createServerSupabaseClient(token);
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  if (authError || !authData.user) return jsonError({ code: "UNAUTHORIZED", message: "Tu sesión ya no es válida." }, 401);

  const subscription = await getEffectiveSubscriptionForUser(authData.user.id);
  if (!canAccessFeature(subscription.plan, "chat")) return jsonChatError(createChatPublicError("FEATURE_LOCKED"), 403);
  const chatRepository = createChatRepository(token);
  const rateLimit = checkRateLimit(`chat-regenerate:${authData.user.id}`, 8, 60_000);
  if (!rateLimit.allowed) {
    void chatRepository.logEvent({ userId: authData.user.id, bookId: null, context: "site", eventType: "usage_rate_limited", code: "RATE_LIMITED", metadata: { endpoint: "/api/chat/messages/regenerate" } }).catch(() => undefined);
    return jsonChatError(createChatPublicError("RATE_LIMITED"), 429);
  }

  const { messageId } = await context.params;
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const idempotencyKey = request.headers.get("x-idempotency-key");
  if (!idempotencyKey || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return jsonChatError(createChatPublicError("INVALID_INPUT", { requestId }), 400);
  }
  const client = createServiceSupabaseClient();
  const { data: source, error: sourceError } = await client.from("chat_messages").select("id,user_id,conversation_id,role,content,parts,status,created_at,updated_at,parent_message_id,metadata,client_message_id").eq("id", messageId).eq("user_id", authData.user.id).maybeSingle();
  if (sourceError || !source?.conversation_id || source.role !== "assistant" || !source.parent_message_id) return jsonError({ code: "MESSAGE_NOT_FOUND", message: "No encontramos esta respuesta." }, 404);
  const { data: parent } = await client.from("chat_messages").select("id,content,created_at").eq("id", source.parent_message_id).eq("user_id", authData.user.id).eq("role", "user").maybeSingle();
  if (!parent) return jsonError({ code: "PARENT_NOT_FOUND", message: "No encontramos el mensaje original." }, 404);
  const conversation = await getUserConversation(authData.user.id, source.conversation_id);
  if (!conversation || conversation.status !== "active") return jsonError({ code: "CONVERSATION_NOT_FOUND", message: "No encontramos esta conversación activa." }, 404);

  const books = (await createBookRepository().list()).filter((book) => book.isPublished);
  const book = conversation.type === "book" ? books.find((item) => item.id === conversation.bookId) : books[0];
  if (!book) return jsonError({ code: "BOOK_NOT_FOUND", message: "No hay contenido disponible para responder." }, 404);
  if (conversation.type === "book") {
    try {
      const hasBookAccess = await canAccessBookChat({ userId: authData.user.id, plan: subscription.plan, bookId: book.id });
      if (!hasBookAccess) return jsonChatError(createChatPublicError("BOOK_ACCESS_DENIED", { requestId }), 403);
    } catch {
      return jsonChatError(createChatPublicError("UNKNOWN_ERROR", { requestId }), 503);
    }
  }
  let usage: ChatUsageSnapshot;
  try {
    usage = await reserveChatUsage({
      userId: authData.user.id,
      subscription,
      idempotencyKey,
      usageType: "regeneration",
      bookId: book.id,
      metadata: { conversationType: conversation.type, sourceMessageId: source.id },
    });
  } catch {
    return jsonChatError(createChatPublicError("USAGE_RESERVATION_FAILED", { requestId }), 503);
  }
  if (!usage.allowed || !usage.usageId) {
    return jsonChatError(createChatPublicError("USAGE_LIMIT_REACHED", { requestId, metadata: {
      plan: usage.plan, used: usage.used, limit: usage.limit, remaining: usage.remaining,
      unlimited: usage.unlimited, periodStart: usage.periodStart, periodEnd: usage.periodEnd,
    } }), 429);
  }
  const usageId = usage.usageId;
  let usageConfirmed = usage.usageStatus === "consumed";
  void chatRepository.logEvent({ userId: authData.user.id, bookId: book.id, context: conversation.type === "book" ? "book" : "site", eventType: "usage_regeneration", code: "USAGE_REGENERATION", metadata: { usageId, sourceMessageId: source.id } }).catch(() => undefined);
  if (usage.replayed && usageConfirmed) {
    if (source.status !== "completed") {
      return jsonChatError(createChatPublicError("CONFLICT", { requestId }), 409);
    }
    return new Response(`${JSON.stringify({
      type: "completed",
      assistantMessage: mapStoredMessage(source as ChatMessageRow),
      remainingQuestions: usage.remaining,
      usage,
      replayed: true,
    })}\n`, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "X-Request-Id": requestId,
      },
    });
  }
  const history = await listConversationMessages(authData.user.id, conversation.id, { completedOnly: true });
  const trustedConversation = (history?.messages ?? []).filter((item) => (item.role === "user" || item.role === "assistant") && new Date(item.createdAt) < new Date(source.created_at)).slice(-12).map((item) => ({ role: item.role as "user" | "assistant", content: item.content }));
  const provider = createAIProvider();
  const encoder = new TextEncoder();
  const providerAbort = new AbortController();
  const regenerationKey = `${authData.user.id}:${source.id}`;
  if (activeRegenerations.has(regenerationKey)) {
    if (!usageConfirmed) await releaseChatUsage(usageId, authData.user.id, subscription);
    return jsonChatError(createChatPublicError("CONFLICT", { requestId }), 409);
  }
  const { data: claimed } = await client
    .from("chat_messages")
    .update({ status: "streaming", metadata: { regenerationStartedAt: new Date().toISOString() } })
    .eq("id", source.id)
    .eq("user_id", authData.user.id)
    .neq("status", "streaming")
    .select("id")
    .maybeSingle();
  if (!claimed) {
    if (!usageConfirmed) await releaseChatUsage(usageId, authData.user.id, subscription);
    return jsonChatError(createChatPublicError("CONFLICT", { requestId }), 409);
  }
  activeRegenerations.add(regenerationKey);
  request.signal.addEventListener("abort", () => providerAbort.abort(), { once: true });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      let content = "";
      let lastSync = 0;
      try {
        const response = conversation.type === "book"
          ? provider.streamBookQuestion({ book, message: parent.content, conversation: trustedConversation }, providerAbort.signal)
          : provider.streamSiteQuestion({ books, message: parent.content, conversation: trustedConversation }, providerAbort.signal);
        send({ type: "usage", usage, remainingQuestions: usage.remaining });
        for await (const delta of response) {
          if (!delta) continue;
          if (!usageConfirmed) {
            usage = await confirmChatUsage(usageId, authData.user.id, subscription);
            usageConfirmed = true;
          }
          content += delta;
          send({ type: "delta", delta });
          if (content.length - lastSync >= 240) {
            await client.from("chat_messages").update({ content, status: "streaming", metadata: { regenerationStartedAt: new Date().toISOString() } }).eq("id", source.id).eq("user_id", authData.user.id);
            lastSync = content.length;
          }
        }
        if (!content.trim()) throw new Error("Empty regeneration");

        const { count } = await client.from("chat_message_versions").select("id", { count: "exact", head: true }).eq("message_id", source.id);
        if (source.content.trim()) await client.from("chat_message_versions").insert({ message_id: source.id, user_id: authData.user.id, version_number: (count ?? 0) + 1, content: source.content, parts: source.parts, metadata: source.metadata });
        const { data: updated, error: updateError } = await client.from("chat_messages").update({ content: content.trim(), status: "completed", updated_at: new Date().toISOString(), metadata: { versionCount: (count ?? 0) + 2 } }).eq("id", source.id).eq("user_id", authData.user.id).select("id,user_id,conversation_id,role,content,parts,status,created_at,updated_at,parent_message_id,metadata,client_message_id").single();
        if (updateError) throw updateError;
        send({ type: "completed", assistantMessage: mapStoredMessage(updated as ChatMessageRow), remainingQuestions: usage.remaining, usage });
      } catch {
        if (!usageConfirmed) usage = await releaseChatUsage(usageId, authData.user.id, subscription).catch(() => usage);
        await client.from("chat_messages").update({ content: content.trim() || source.content, status: content.trim() ? "interrupted" : source.status, metadata: { regenerationInterruptedAt: new Date().toISOString() } }).eq("id", source.id).eq("user_id", authData.user.id);
        const visible = createChatPublicError(content.trim() ? "STREAM_INTERRUPTED" : "PROVIDER_UNAVAILABLE", { requestId });
        send({ type: "failed", ...visible, message: visible.userMessage, usage, remainingQuestions: usage.remaining });
      } finally {
        activeRegenerations.delete(regenerationKey);
        controller.close();
      }
    },
    cancel() {
      activeRegenerations.delete(regenerationKey);
      providerAbort.abort();
    },
  });

  return new Response(stream, { headers: { "Cache-Control": "no-cache, no-transform", "Content-Type": "application/x-ndjson; charset=utf-8", "X-Accel-Buffering": "no", "X-Request-Id": requestId } });
}
