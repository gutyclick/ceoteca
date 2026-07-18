import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { plans } from "@/config/plans";
import { jsonData, jsonError } from "@/lib/api/response";
import { demoUser } from "@/lib/auth/demo";
import { createBookRepository } from "@/lib/books/repository";
import {
  claimUserMessage,
  completeMessageTurn,
  ensureConversation,
  failMessageTurn,
  listConversationMessages,
} from "@/lib/chat/conversation-service";
import { moderateChatMessage } from "@/lib/chat/moderation";
import { createChatRepository } from "@/lib/chat/repository";
import type { ConversationType } from "@/lib/chat/model";
import { clientEnv } from "@/lib/env";
import { createAIProvider } from "@/lib/openai/provider";
import { canAccessFeature } from "@/lib/permissions";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEffectiveSubscriptionForUser } from "@/lib/subscriptions/service";
import { chatRequestSchema } from "@/lib/validation/chat";
import type { AppUser } from "@/types";

function getFieldErrors(error: ZodError) {
  const flattened = error.flatten().fieldErrors;
  return Object.fromEntries(
    Object.entries(flattened).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1]),
    ),
  );
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
}

async function getAuthenticatedUser(
  request: NextRequest,
): Promise<{ accessToken?: string; user: AppUser } | null> {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) return { user: demoUser };
  const accessToken = getBearerToken(request);
  if (!accessToken) return null;
  const supabase = createServerSupabaseClient(accessToken);
  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !authData.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,plan")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (!profile) return null;
  const effectiveSubscription = await getEffectiveSubscriptionForUser(authData.user.id);
  return {
    accessToken,
    user: {
      id: authData.user.id,
      email: authData.user.email ?? "",
      fullName: profile.full_name ?? "Usuario",
      plan: effectiveSubscription.plan,
      isDemo: false,
    },
  };
}

export async function POST(request: NextRequest) {
  const session = await getAuthenticatedUser(request);
  if (!session) {
    return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para usar el chat." }, 401);
  }

  const rateLimit = checkRateLimit(`chat:${session.user.id}`, 20, 60_000);
  if (!rateLimit.allowed) {
    return jsonError(
      { code: "RATE_LIMITED", message: "Demasiadas preguntas seguidas. Inténtalo de nuevo en un momento." },
      429,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError({ code: "INVALID_INPUT", message: "El cuerpo de la solicitud no es JSON válido." }, 400);
  }

  const parsed = chatRequestSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors = getFieldErrors(parsed.error);
    return jsonError(
      {
        code: "INVALID_INPUT",
        message: Object.values(fieldErrors).flat()[0] ?? "Revisa los campos enviados.",
        fieldErrors,
      },
      400,
    );
  }

  const type: ConversationType =
    parsed.data.type ?? (parsed.data.context === "site" ? "general" : "book");
  const legacyContext = type === "general" ? "site" : "book";
  const bookRepository = createBookRepository();
  const books = (await bookRepository.list()).filter((item) => item.isPublished);
  const book =
    type === "book"
      ? await bookRepository.getBySlug(parsed.data.bookId ?? "")
      : books[0] ?? null;

  if (!book || !book.isPublished) {
    return jsonError(
      {
        code: "BOOK_NOT_FOUND",
        message:
          type === "book"
            ? "No encontramos este libro."
            : "No hay análisis publicados para responder en este momento.",
      },
      404,
    );
  }

  if (!canAccessFeature(session.user.plan, "chat")) {
    return jsonError({ code: "CHAT_NOT_INCLUDED", message: "Tu plan actual no incluye Chat con CEO." }, 403);
  }

  const plan = plans[session.user.plan];
  const chatRepository = createChatRepository(session.accessToken);
  const monthlyQuestionCount = await chatRepository.getMonthlyUsage(session.user.id);
  if (plan.chatMonthlyLimit !== null && monthlyQuestionCount >= plan.chatMonthlyLimit) {
    return jsonError({ code: "MONTHLY_LIMIT_REACHED", message: "Alcanzaste el límite mensual de preguntas." }, 403);
  }

  const moderation = moderateChatMessage(parsed.data.message, legacyContext);
  if (!moderation.allowed) {
    await chatRepository.logEvent({
      userId: session.user.id,
      bookId: book.id,
      context: legacyContext,
      eventType: "moderation_block",
      code: moderation.code,
      message: moderation.reason,
      metadata: { messageLength: parsed.data.message.length },
    });
    return jsonError({ code: "MESSAGE_BLOCKED", message: moderation.reason }, 400);
  }

  let claimedMessageId: string | null = null;
  try {
    const conversation = await ensureConversation({
      userId: session.user.id,
      conversationId: parsed.data.conversationId,
      clientCreationKey: parsed.data.clientCreationKey,
      type,
      bookId: type === "book" ? book.id : null,
      bookTitle: type === "book" ? book.title : undefined,
    });
    if (!conversation) {
      return jsonError(
        { code: "CONVERSATION_NOT_FOUND", message: "No encontramos esta conversación o no tienes acceso." },
        404,
      );
    }
    if (conversation.status === "archived") {
      return jsonError({ code: "CONVERSATION_ARCHIVED", message: "Restaura esta conversación para continuar." }, 409);
    }

    const claim = await claimUserMessage({
      userId: session.user.id,
      conversation,
      clientMessageId: parsed.data.clientMessageId,
      content: parsed.data.message,
    });
    claimedMessageId = claim.userMessage.id;

    if (!claim.created) {
      if (claim.assistantMessage?.status === "completed") {
        const currentCount = await chatRepository.getMonthlyUsage(session.user.id);
        return jsonData({
          message: claim.assistantMessage.content,
          conversation,
          userMessage: claim.userMessage,
          assistantMessage: claim.assistantMessage,
          remainingQuestions:
            plan.chatMonthlyLimit === null ? null : Math.max(plan.chatMonthlyLimit - currentCount, 0),
          usage: { questionCount: currentCount, limit: plan.chatMonthlyLimit },
          replayed: true,
        });
      }
      return jsonError(
        { code: "MESSAGE_IN_PROGRESS", message: "Este mensaje ya se está procesando." },
        409,
      );
    }

    const history = await listConversationMessages(session.user.id, conversation.id, {
      completedOnly: true,
    });
    if (!history) {
      return jsonError({ code: "CONVERSATION_NOT_FOUND", message: "No encontramos esta conversación." }, 404);
    }
    const trustedConversation = history.messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .slice(-12)
      .map((message) => ({ role: message.role as "user" | "assistant", content: message.content }));

    const provider = createAIProvider();
    const result =
      type === "general"
        ? await provider.answerSiteQuestion({ books, message: parsed.data.message, conversation: trustedConversation })
        : await provider.answerBookQuestion({ book, message: parsed.data.message, conversation: trustedConversation });

    await chatRepository.incrementUsage(session.user.id, book.id, legacyContext);
    const completed = await completeMessageTurn({
      userId: session.user.id,
      conversation,
      userMessageId: claim.userMessage.id,
      userContent: parsed.data.message,
      assistantContent: result.message,
    });
    const nextCount = monthlyQuestionCount + 1;
    return jsonData({
      message: result.message,
      conversation: {
        ...conversation,
        title: completed.title,
        lastMessageAt: completed.lastMessageAt,
      },
      userMessage: { ...claim.userMessage, status: "completed" },
      assistantMessage: completed.assistantMessage,
      remainingQuestions:
        plan.chatMonthlyLimit === null ? null : Math.max(plan.chatMonthlyLimit - nextCount, 0),
      usage: { questionCount: nextCount, limit: plan.chatMonthlyLimit },
      replayed: false,
    });
  } catch (caughtError) {
    const reason = caughtError instanceof Error ? caughtError.message : "Unknown provider error";
    if (claimedMessageId) await failMessageTurn(session.user.id, claimedMessageId, reason);
    console.error("Chat request failed", caughtError);
    await chatRepository.logEvent({
      userId: session.user.id,
      bookId: book.id,
      context: legacyContext,
      eventType: "provider_error",
      code: "CHAT_RESPONSE_FAILED",
      message: reason.slice(0, 500),
      metadata: { type },
    });
    return jsonError(
      { code: "CHAT_RESPONSE_FAILED", message: "No pudimos generar una respuesta en este momento." },
      502,
    );
  }
}
