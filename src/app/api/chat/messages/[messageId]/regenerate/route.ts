import { NextRequest } from "next/server";

import { plans } from "@/config/plans";
import { jsonError } from "@/lib/api/response";
import { createBookRepository } from "@/lib/books/repository";
import { getUserConversation, listConversationMessages } from "@/lib/chat/conversation-service";
import { mapStoredMessage, type ChatMessageRow } from "@/lib/chat/model";
import { createChatRepository } from "@/lib/chat/repository";
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
  if (!canAccessFeature(subscription.plan, "chat")) return jsonError({ code: "CHAT_NOT_INCLUDED", message: "Tu plan no incluye Chat con CEO." }, 403);
  const plan = plans[subscription.plan];
  const repository = createChatRepository(token);
  const currentUsage = await repository.getMonthlyUsage(authData.user.id);
  if (plan.chatMonthlyLimit !== null && currentUsage >= plan.chatMonthlyLimit) return jsonError({ code: "MONTHLY_LIMIT_REACHED", message: "Alcanzaste el límite mensual de preguntas." }, 403);
  const rateLimit = checkRateLimit(`chat-regenerate:${authData.user.id}`, 8, 60_000);
  if (!rateLimit.allowed) return jsonError({ code: "RATE_LIMITED", message: "Espera un momento antes de regenerar otra respuesta." }, 429);

  const { messageId } = await context.params;
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
  const history = await listConversationMessages(authData.user.id, conversation.id, { completedOnly: true });
  const trustedConversation = (history?.messages ?? []).filter((item) => (item.role === "user" || item.role === "assistant") && new Date(item.createdAt) < new Date(source.created_at)).slice(-12).map((item) => ({ role: item.role as "user" | "assistant", content: item.content }));
  const provider = createAIProvider();
  const encoder = new TextEncoder();
  const providerAbort = new AbortController();
  const regenerationKey = `${authData.user.id}:${source.id}`;
  if (activeRegenerations.has(regenerationKey)) return jsonError({ code: "REGENERATION_IN_PROGRESS", message: "Esta respuesta ya se está regenerando." }, 409);
  activeRegenerations.add(regenerationKey);
  request.signal.addEventListener("abort", () => providerAbort.abort(), { once: true });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      let content = "";
      try {
        const response = conversation.type === "book"
          ? provider.streamBookQuestion({ book, message: parent.content, conversation: trustedConversation }, providerAbort.signal)
          : provider.streamSiteQuestion({ books, message: parent.content, conversation: trustedConversation }, providerAbort.signal);
        for await (const delta of response) { content += delta; send({ type: "delta", delta }); }
        if (!content.trim()) throw new Error("Empty regeneration");

        const { count } = await client.from("chat_message_versions").select("id", { count: "exact", head: true }).eq("message_id", source.id);
        if (source.content.trim()) await client.from("chat_message_versions").insert({ message_id: source.id, user_id: authData.user.id, version_number: (count ?? 0) + 1, content: source.content, parts: source.parts, metadata: source.metadata });
        const { data: updated, error: updateError } = await client.from("chat_messages").update({ content: content.trim(), status: "completed", updated_at: new Date().toISOString(), metadata: { versionCount: (count ?? 0) + 2 } }).eq("id", source.id).eq("user_id", authData.user.id).select("id,user_id,conversation_id,role,content,parts,status,created_at,updated_at,parent_message_id,metadata,client_message_id").single();
        if (updateError) throw updateError;
        await repository.incrementUsage(authData.user.id, book.id, conversation.type === "book" ? "book" : "site");
        send({ type: "completed", assistantMessage: mapStoredMessage(updated as ChatMessageRow), remainingQuestions: plan.chatMonthlyLimit === null ? null : Math.max(plan.chatMonthlyLimit - currentUsage - 1, 0) });
      } catch {
        send({ type: "failed", message: providerAbort.signal.aborted ? "La regeneración se detuvo." : "CEO no pudo regenerar esta respuesta." });
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

  return new Response(stream, { headers: { "Cache-Control": "no-cache, no-transform", "Content-Type": "application/x-ndjson; charset=utf-8", "X-Accel-Buffering": "no" } });
}
