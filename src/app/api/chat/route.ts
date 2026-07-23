import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { z } from "zod";

import { jsonChatError, jsonData, jsonError } from "@/lib/api/response";
import { demoUser } from "@/lib/auth/demo";
import { canAccessBookChat } from "@/lib/books/access";
import { createBookRepository } from "@/lib/books/repository";
import {
  claimUserMessage,
  cancelMessageTurn,
  completeMessageTurn,
  ensureConversation,
  failMessageTurn,
  generateAndPersistConversationTitle,
  interruptMessageTurn,
  listConversationMessages,
  persistPartialAssistant,
} from "@/lib/chat/conversation-service";
import { ChatOperationError, createChatPublicError, logChatError, type ChatErrorCode } from "@/lib/chat/errors";
import { moderateChatMessage } from "@/lib/chat/moderation";
import { createChatRepository } from "@/lib/chat/repository";
import {
  attachChatUsage,
  confirmChatUsage,
  configureDemoChatUsage,
  getChatUsageSnapshot,
  releaseChatUsage,
  reserveChatUsage,
  type ChatUsageSnapshot,
} from "@/lib/chat/usage";
import type { ConversationType } from "@/lib/chat/model";
import { clientEnv } from "@/lib/env";
import { createAIProvider } from "@/lib/openai/provider";
import { chatTimeouts, withTimeout } from "@/lib/chat/retry";
import { canAccessFeature } from "@/lib/permissions";
import { checkRateLimit } from "@/lib/rate-limit/memory";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEffectiveSubscriptionForUser, type EffectiveSubscription } from "@/lib/subscriptions/service";
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

const cancelRequestSchema = z.object({
  clientMessageId: z.string().uuid(),
  partialContent: z.string().max(12_000).default(""),
});

async function getAuthenticatedUser(
  request: NextRequest,
): Promise<{ accessToken?: string; user: AppUser; subscription: EffectiveSubscription } | null> {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    return {
      user: demoUser,
      subscription: { plan: demoUser.plan, source: "profile", subscription: null },
    };
  }
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
    subscription: effectiveSubscription,
  };
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const requestStartedAt = Date.now();
  const demoFailure = clientEnv.NEXT_PUBLIC_DEMO_MODE
    ? request.headers.get("x-demo-chat-error")
    : null;
  if (demoFailure === "session_expired") {
    return jsonChatError(createChatPublicError("SESSION_EXPIRED", { requestId }), 401);
  }
  if (demoFailure === "limit") {
    return jsonChatError(createChatPublicError("USAGE_LIMIT_REACHED", { requestId }), 429);
  }
  if (demoFailure === "timeout") {
    return jsonChatError(createChatPublicError("TIMEOUT", { requestId }), 504);
  }
  if (demoFailure === "provider") {
    return jsonChatError(createChatPublicError("PROVIDER_UNAVAILABLE", { requestId }), 503);
  }
  const session = await getAuthenticatedUser(request);
  if (!session) {
    return jsonChatError(createChatPublicError("SESSION_EXPIRED", { requestId }), 401);
  }
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    const scenario = request.headers.get("x-demo-chat-usage");
    if (scenario === "reset" || scenario === "one_remaining" || scenario === "exhausted") {
      configureDemoChatUsage(session.subscription, scenario);
    }
  }

  const chatRepository = createChatRepository(session.accessToken);
  const rateLimit = checkRateLimit(`chat:${session.user.id}`, 20, 60_000);
  if (!rateLimit.allowed) {
    void chatRepository.logEvent({
      userId: session.user.id,
      bookId: null,
      context: "site",
      eventType: "usage_rate_limited",
      code: "RATE_LIMITED",
      metadata: { endpoint: "/api/chat" },
    }).catch(() => undefined);
    return jsonChatError(createChatPublicError("RATE_LIMITED", { requestId }), 429);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonChatError(createChatPublicError("INVALID_INPUT", { requestId }), 400);
  }

  const parsed = chatRequestSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors = getFieldErrors(parsed.error);
    return jsonError(
      {
        ...createChatPublicError("INVALID_INPUT", { requestId }),
        message: createChatPublicError("INVALID_INPUT").userMessage,
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
    return jsonChatError(createChatPublicError("FEATURE_LOCKED", { requestId }), 403);
  }

  if (type === "book") {
    try {
      const hasBookAccess = await canAccessBookChat({
        userId: session.user.id,
        plan: session.user.plan,
        bookId: book.id,
      });
      if (!hasBookAccess) {
        return jsonChatError(createChatPublicError("BOOK_ACCESS_DENIED", { requestId }), 403);
      }
    } catch (error) {
      logChatError({ error, code: "BOOK_ACCESS_DENIED", endpoint: "/api/chat", requestId, startedAt: requestStartedAt, status: 503, phase: "book_access", conversationType: type, plan: session.user.plan });
      return jsonChatError(createChatPublicError("UNKNOWN_ERROR", { requestId }), 503);
    }
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
  let usageSnapshot: ChatUsageSnapshot;
  try {
    usageSnapshot = await reserveChatUsage({
      userId: session.user.id,
      subscription: session.subscription,
      idempotencyKey: parsed.data.clientMessageId,
      usageType: parsed.data.interactionType === "contextual_action"
        ? "contextual_action"
        : type === "book" ? "book_chat" : "general_chat",
      bookId: book.id,
      metadata: { conversationType: type, limit: session.subscription.plan },
    });
  } catch (error) {
    logChatError({ error, code: "USAGE_RESERVATION_FAILED", endpoint: "/api/chat", requestId, startedAt: requestStartedAt, status: 503, phase: "usage_reservation", conversationType: type, plan: session.user.plan });
    return jsonChatError(createChatPublicError("USAGE_RESERVATION_FAILED", { requestId }), 503);
  }
  if (!usageSnapshot.allowed || !usageSnapshot.usageId) {
    void chatRepository.logEvent({ userId: session.user.id, bookId: book.id, context: legacyContext, eventType: "usage_limit_reached", code: "USAGE_LIMIT_REACHED", metadata: { type } }).catch(() => undefined);
    return jsonChatError(createChatPublicError("USAGE_LIMIT_REACHED", {
      requestId,
      metadata: {
        plan: usageSnapshot.plan,
        used: usageSnapshot.used,
        limit: usageSnapshot.limit,
        remaining: usageSnapshot.remaining,
        unlimited: usageSnapshot.unlimited,
        periodStart: usageSnapshot.periodStart,
        periodEnd: usageSnapshot.periodEnd,
      },
    }), 429);
  }
  const usageId = usageSnapshot.usageId;
  let usageConfirmed = usageSnapshot.usageStatus === "consumed";
  void chatRepository.logEvent({ userId: session.user.id, bookId: book.id, context: legacyContext, eventType: "usage_reserved", code: "USAGE_RESERVED", metadata: { usageId, usageType: parsed.data.interactionType === "contextual_action" ? "contextual_action" : type } }).catch(() => undefined);
  if (parsed.data.interactionType === "contextual_action") {
    void chatRepository.logEvent({ userId: session.user.id, bookId: book.id, context: legacyContext, eventType: "usage_contextual_action", code: "USAGE_CONTEXTUAL_ACTION", metadata: { usageId } }).catch(() => undefined);
  }
  const confirmReservedUsage = async () => {
    if (usageConfirmed) return usageSnapshot;
    usageSnapshot = await confirmChatUsage(usageId, session.user.id, session.subscription);
    usageConfirmed = true;
    void chatRepository.logEvent({ userId: session.user.id, bookId: book.id, context: legacyContext, eventType: "usage_consumed", code: "USAGE_CONSUMED", metadata: { usageId } }).catch(() => undefined);
    return usageSnapshot;
  };
  const releaseReservedUsage = async (reason = "generation_not_started") => {
    if (usageConfirmed) return usageSnapshot;
    usageSnapshot = await releaseChatUsage(usageId, session.user.id, session.subscription, reason);
    void chatRepository.logEvent({ userId: session.user.id, bookId: book.id, context: legacyContext, eventType: "usage_released", code: reason, metadata: { usageId } }).catch(() => undefined);
    return usageSnapshot;
  };
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
      await releaseReservedUsage();
      return jsonChatError(createChatPublicError("CONVERSATION_NOT_FOUND", { requestId }), 404);
    }
    if (conversation.status === "archived") {
      await releaseReservedUsage();
      return jsonChatError(createChatPublicError("CONVERSATION_ARCHIVED", { requestId }), 409);
    }

    const claim = await claimUserMessage({
      userId: session.user.id,
      conversation,
      clientMessageId: parsed.data.clientMessageId,
      content: parsed.data.message,
    });
    claimedMessageId = claim.userMessage.id;
    await attachChatUsage(usageId, session.user.id, conversation.id, claim.userMessage.id);

    if (!claim.created) {
      if (claim.assistantMessage?.status === "completed") {
        const currentUsage = await getChatUsageSnapshot(session.user.id, session.subscription);
        return jsonData({
          message: claim.assistantMessage.content,
          conversation,
          userMessage: claim.userMessage,
          assistantMessage: claim.assistantMessage,
          remainingQuestions: currentUsage.remaining,
          usage: currentUsage,
          replayed: true,
        });
      }
      return jsonError(
        { ...createChatPublicError("CONFLICT", { requestId }), message: createChatPublicError("CONFLICT").userMessage },
        409,
      );
    }

    const history = await listConversationMessages(session.user.id, conversation.id, {
      completedOnly: true,
    });
    if (!history) {
      if (!usageConfirmed) await releaseReservedUsage();
      return jsonError({ code: "CONVERSATION_NOT_FOUND", message: "No encontramos esta conversación." }, 404);
    }
    const trustedConversation = history.messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .slice(-12)
      .map((message) => ({ role: message.role as "user" | "assistant", content: message.content }));

    const provider = createAIProvider();
    const titlePromise = withTimeout(
      () => generateAndPersistConversationTitle({
        userId: session.user.id,
        conversation,
        message: parsed.data.message,
      }),
      chatTimeouts.titleGenerationMs,
    ).catch(() => conversation.title);

    if (parsed.data.stream) {
      const encoder = new TextEncoder();
      const providerAbort = new AbortController();
      request.signal.addEventListener("abort", () => providerAbort.abort(new DOMException("Client disconnected", "AbortError")), { once: true });
      let streamClosed = false;

      const responseStream = new ReadableStream<Uint8Array>({
        async start(controller) {
          const enqueue = (event: Record<string, unknown>) => {
            if (streamClosed) return;
            try {
              controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
            } catch {
              streamClosed = true;
            }
          };

          enqueue({
            type: "conversation",
            conversation,
            userMessage: claim.userMessage,
            assistantMessage: claim.assistantMessage,
            requestId,
            remainingQuestions: usageSnapshot.remaining,
            usage: usageSnapshot,
          });

          if (demoFailure === "interrupted") {
            const partial = "Estoy preparando una respuesta de prueba";
            usageSnapshot = await confirmReservedUsage();
            await persistPartialAssistant({ userId: session.user.id, userMessageId: claim.userMessage.id, content: partial });
            const assistantMessage = await interruptMessageTurn({ userId: session.user.id, userMessageId: claim.userMessage.id, partialContent: partial, reason: "network" });
            enqueue({ type: "delta", delta: partial });
            const visible = createChatPublicError("STREAM_INTERRUPTED", { requestId });
            enqueue({ type: "failed", ...visible, message: visible.userMessage, conversation, userMessage: { ...claim.userMessage, status: "completed" }, assistantMessage });
            streamClosed = true;
            controller.close();
            return;
          }

          let assistantContent = "";
          let providerFinished = false;
          let partialSyncedLength = 0;
          let lastPartialSyncAt = Date.now();
          let streamTimer = setTimeout(
            () => providerAbort.abort(new DOMException("Stream start timed out", "TimeoutError")),
            chatTimeouts.streamStartMs,
          );
          const resetStreamTimer = () => {
            clearTimeout(streamTimer);
            streamTimer = setTimeout(
              () => providerAbort.abort(new DOMException("Stream became idle", "TimeoutError")),
              chatTimeouts.streamIdleMs,
            );
          };
          try {
            const providerStream = type === "general"
              ? provider.streamSiteQuestion(
                  { books, message: parsed.data.message, conversation: trustedConversation },
                  providerAbort.signal,
                )
              : provider.streamBookQuestion(
                  { book, message: parsed.data.message, conversation: trustedConversation },
                  providerAbort.signal,
                );

            for await (const delta of providerStream) {
              if (providerAbort.signal.aborted) throw new DOMException("Aborted", "AbortError");
              if (!delta) continue;
              resetStreamTimer();
              if (!usageConfirmed) {
                usageSnapshot = await confirmReservedUsage();
              }
              assistantContent += delta;
              enqueue({ type: "delta", delta });
              if (
                assistantContent.length - partialSyncedLength >= 240
                || Date.now() - lastPartialSyncAt >= 1_000
              ) {
                await persistPartialAssistant({
                  userId: session.user.id,
                  userMessageId: claim.userMessage.id,
                  content: assistantContent,
                });
                partialSyncedLength = assistantContent.length;
                lastPartialSyncAt = Date.now();
              }
            }

            if (!assistantContent.trim()) throw new Error("The provider returned an empty response");
            providerFinished = true;
            const title = await titlePromise;
            const completed = await completeMessageTurn({
              userId: session.user.id,
              conversation: { ...conversation, title },
              userMessageId: claim.userMessage.id,
              userContent: parsed.data.message,
              assistantContent,
            });
            enqueue({ type: "title", title });
            enqueue({
              type: "completed",
              conversation: { ...conversation, title, lastMessageAt: completed.lastMessageAt },
              userMessage: { ...claim.userMessage, status: "completed" },
              assistantMessage: completed.assistantMessage,
              remainingQuestions: usageSnapshot.remaining,
              usage: usageSnapshot,
            });
          } catch (streamError) {
            if (!usageConfirmed) {
              usageSnapshot = await releaseReservedUsage().catch(() => usageSnapshot);
            }
            const timedOut = providerAbort.signal.reason instanceof DOMException
              && providerAbort.signal.reason.name === "TimeoutError";
            const code: ChatErrorCode = providerFinished
              ? "RESPONSE_SAVE_FAILED"
              : timedOut
              ? "TIMEOUT"
              : assistantContent.trim()
                ? "STREAM_INTERRUPTED"
                : "PROVIDER_UNAVAILABLE";
            const assistantMessage = await interruptMessageTurn({
              userId: session.user.id,
              userMessageId: claim.userMessage.id,
              partialContent: assistantContent,
              reason: providerFinished ? "persistence" : timedOut ? "timeout" : request.signal.aborted ? "network" : "provider",
            }).catch(() => null);
            const publicError = createChatPublicError(code, { requestId });
            logChatError({
              error: streamError,
              code,
              endpoint: "/api/chat",
              requestId,
              startedAt: requestStartedAt,
              status: code === "TIMEOUT" ? 504 : 503,
              phase: assistantContent ? "streaming" : "provider_start",
              conversationType: type,
              plan: session.user.plan,
            });
            enqueue({
              type: "failed",
              ...publicError,
              message: publicError.userMessage,
              conversation,
              userMessage: { ...claim.userMessage, status: "completed" },
              assistantMessage,
              remainingQuestions: usageSnapshot.remaining,
              usage: usageSnapshot,
            });
          } finally {
            clearTimeout(streamTimer);
            if (!streamClosed) {
              streamClosed = true;
              controller.close();
            }
          }
        },
        cancel() {
          streamClosed = true;
          providerAbort.abort();
        },
      });

      return new Response(responseStream, {
        headers: {
          "Cache-Control": "no-cache, no-transform",
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "X-Accel-Buffering": "no",
          "X-Request-Id": requestId,
        },
      });
    }

    const result = await withTimeout(
      () => type === "general"
        ? provider.answerSiteQuestion({ books, message: parsed.data.message, conversation: trustedConversation })
        : provider.answerBookQuestion({ book, message: parsed.data.message, conversation: trustedConversation }),
      chatTimeouts.streamIdleMs,
    );
    if (!result.message.trim()) throw new Error("The provider returned an empty response");
    if (!usageConfirmed) {
      usageSnapshot = await confirmReservedUsage();
    }

    const title = await titlePromise;
    const completed = await completeMessageTurn({
      userId: session.user.id,
      conversation: { ...conversation, title },
      userMessageId: claim.userMessage.id,
      userContent: parsed.data.message,
      assistantContent: result.message,
    });
    return jsonData({
      message: result.message,
      conversation: {
        ...conversation,
        title,
        lastMessageAt: completed.lastMessageAt,
      },
      userMessage: { ...claim.userMessage, status: "completed" },
      assistantMessage: completed.assistantMessage,
      remainingQuestions: usageSnapshot.remaining,
      usage: usageSnapshot,
      replayed: false,
    });
  } catch (caughtError) {
    if (!usageConfirmed) {
      usageSnapshot = await releaseReservedUsage().catch(() => usageSnapshot);
    }
    if (claimedMessageId) await failMessageTurn(session.user.id, claimedMessageId, "provider_or_persistence");
    const code: ChatErrorCode = caughtError instanceof ChatOperationError
      ? caughtError.code
      : caughtError instanceof DOMException && caughtError.name === "TimeoutError"
        ? "TIMEOUT"
        : claimedMessageId ? "PROVIDER_UNAVAILABLE" : "MESSAGE_SAVE_FAILED";
    logChatError({
      error: caughtError,
      code,
      endpoint: "/api/chat",
      requestId,
      startedAt: requestStartedAt,
      status: code === "TIMEOUT" ? 504 : code === "CONFLICT" ? 409 : 503,
      phase: claimedMessageId ? "generation" : "message_save",
      conversationType: type,
      plan: session.user.plan,
    });
    await chatRepository.logEvent({
      userId: session.user.id,
      bookId: book.id,
      context: legacyContext,
      eventType: "provider_error",
      code: "CHAT_RESPONSE_FAILED",
      message: code,
      metadata: { type },
    });
    return jsonChatError(
      createChatPublicError(code, { requestId }),
      code === "TIMEOUT" ? 504 : code === "CONFLICT" ? 409 : code === "MESSAGE_SAVE_FAILED" ? 500 : 503,
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAuthenticatedUser(request);
  if (!session) {
    return jsonError({ code: "UNAUTHORIZED", message: "Inicia sesión para detener la respuesta." }, 401);
  }

  const parsed = cancelRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError({ code: "INVALID_INPUT", message: "No pudimos identificar la respuesta activa." }, 400);
  }

  const cancelled = await cancelMessageTurn({ userId: session.user.id, ...parsed.data });
  return jsonData(cancelled);
}
