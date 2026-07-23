import { NextRequest } from "next/server";

import { plans } from "@/config/plans";
import { jsonData, jsonError } from "@/lib/api/response";
import { createBookRepository } from "@/lib/books/repository";
import { listConversationMessages, listUserConversations, recoverAbandonedTurns } from "@/lib/chat/conversation-service";
import { createChatRepository } from "@/lib/chat/repository";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";
import { getEffectiveSubscriptionForUser } from "@/lib/subscriptions/service";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
}

export async function GET(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para ver tu historial de chat." }, 401);
  }
  const supabase = createServerSupabaseClient(accessToken);
  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !authData.user) {
    return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para ver tu historial de chat." }, 401);
  }

  const searchParams = request.nextUrl.searchParams;
  const requestedId = searchParams.get("conversationId");
  const bookSlug = searchParams.get("bookId");
  const before = searchParams.get("before") ?? undefined;
  const legacyType = searchParams.get("context") === "book" ? "book" : "general";
  const conversations = await listUserConversations(authData.user.id);
  let conversationId = requestedId;

  if (!conversationId && legacyType === "book" && bookSlug) {
    const book = await createBookRepository().getBySlug(bookSlug);
    conversationId = conversations.find(
      (item) => item.type === "book" && item.bookId === book?.id && item.status === "active",
    )?.id ?? null;
  }
  if (!conversationId && legacyType === "general") {
    conversationId = conversations.find(
      (item) => item.type === "general" && item.status === "active",
    )?.id ?? null;
  }

  const subscription = await getEffectiveSubscriptionForUser(authData.user.id);
  const plan = plans[subscription.plan];
  const chatRepository = createChatRepository(accessToken);
  const questionCount = await chatRepository.getMonthlyUsage(authData.user.id);
  const usage = {
    questionCount,
    limit: plan.chatMonthlyLimit,
  };
  const remainingQuestions =
    plan.chatMonthlyLimit === null
      ? null
      : Math.max(plan.chatMonthlyLimit - questionCount, 0);

  if (!conversationId) {
    return jsonData({ conversation: null, messages: [], remainingQuestions, usage });
  }

  await recoverAbandonedTurns(authData.user.id, conversationId);

  const history = await listConversationMessages(authData.user.id, conversationId, { before, limit: 40 });
  if (!history) {
    return jsonError(
      { code: "CONVERSATION_NOT_FOUND", message: "No encontramos esta conversación o no tienes acceso." },
      404,
    );
  }

  const visibleMessages = history.messages;
  const assistantIds = visibleMessages.filter((message) => message.role === "assistant").map((message) => message.id);
  const feedback = assistantIds.length
    ? await createServiceSupabaseClient().from("chat_message_feedback").select("message_id,rating,reason").eq("user_id", authData.user.id).in("message_id", assistantIds)
    : { data: [] };

  return jsonData({
    conversation: history.conversation,
    messages: visibleMessages,
    hasMore: history.hasMore,
    feedback: feedback.data ?? [],
    remainingQuestions,
    usage,
  });
}
