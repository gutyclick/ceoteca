"use client";

import Link from "next/link";
import {
  Bot,
  Lock,
  Loader2,
  MessageCircle,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { RichChatMessage } from "@/components/chat/RichChatMessage";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { Card } from "@/components/ui/Card";
import { plans, type PlanKey } from "@/config/plans";
import { prepareChatConversation } from "@/lib/chat/conversation";
import { clearChatDraft, readChatDraft, writeChatDraft, type ChatDraftScope } from "@/lib/chat/drafts";
import { canAccessFeature } from "@/lib/permissions";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ChatConversationMessage } from "@/lib/validation/chat";
import { cn } from "@/lib/utils/cn";
import type { Book } from "@/types";

type FloatingBookChatProps = {
  book: Book;
  plan: PlanKey;
  variant?: "floating" | "panel";
};

type ChatResponse = {
  data?: {
    message: string;
    conversation: { id: string };
    remainingQuestions: number | null;
    usage: {
      questionCount: number;
      limit: number | null;
    };
  };
  error?: {
    code: string;
    message: string;
  };
};

type ChatHistoryResponse = {
  data?: {
    conversation: { id: string } | null;
    messages: ChatConversationMessage[];
    remainingQuestions: number | null;
    usage: {
      questionCount: number;
      limit: number | null;
    };
  };
  error?: {
    code: string;
    message: string;
  };
};

const bookSuggestions = [
  "¿Cómo aplico esto esta semana?",
  "Dame un plan de 7 días.",
  "¿Cuál es el primer paso práctico?",
  "¿Qué error debo evitar?",
  "¿Cómo adapto esto a mi caso?",
  "¿Qué debo validar primero?",
  "¿Qué ejercicio me conviene hacer?",
  "Explícamelo con un ejemplo simple.",
  "¿Qué debería recordar mañana?",
] as const;

function getNextSuggestionSet(currentIndex: number) {
  return Array.from({ length: 3 }, (_, index) => {
    const suggestionIndex = (currentIndex + index) % bookSuggestions.length;

    return bookSuggestions[suggestionIndex];
  });
}

export function FloatingBookChat({
  book,
  plan,
  variant = "floating",
}: FloatingBookChatProps) {
  const isPanel = variant === "panel";
  const introMessage = useMemo<ChatConversationMessage>(
    () => ({
      role: "assistant",
      content: `Hola. Soy CEO y estoy usando el contexto de **${book.title}** para ayudarte a convertir este análisis en decisiones, ejercicios y próximos pasos concretos.`,
    }),
    [book.title],
  );
  const [isOpen, setIsOpen] = useState(isPanel);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatConversationMessage[]>([
    introMessage,
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingQuestions, setRemainingQuestions] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [suggestionStartIndex, setSuggestionStartIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const creationKeyRef = useRef(crypto.randomUUID());
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const latestAssistantRef = useRef<HTMLDivElement | null>(null);
  const shouldFocusLatestAssistantRef = useRef(false);
  const hasChatAccess = canAccessFeature(plan, "chat");
  const visibleSuggestions = getNextSuggestionSet(suggestionStartIndex);
  const planQuestionLimit = plans[plan].chatMonthlyLimit;
  const displayedRemainingQuestions = remainingQuestions ?? planQuestionLimit;
  const shouldShowQuestionLimit =
    hasChatAccess && displayedRemainingQuestions !== null;

  const conversation = useMemo(() => prepareChatConversation(messages), [messages]);
  const draftScope = useMemo<ChatDraftScope | null>(() => userId ? ({
    userId,
    type: "book",
    conversationId,
    bookId: book.id,
  }) : null, [book.id, conversationId, userId]);
  const isVisible = isPanel || isOpen;

  useEffect(() => {
    setMessages([introMessage]);
    setRemainingQuestions(null);
    setConversationId(null);
    creationKeyRef.current = crypto.randomUUID();
    setError(null);
  }, [book.slug, introMessage]);

  useEffect(() => {
    if (!draftScope) return;
    setInput(readChatDraft(draftScope));
  }, [draftScope]);

  useEffect(() => {
    if (!draftScope) return;
    const timeout = window.setTimeout(() => writeChatDraft(draftScope, input), 350);
    return () => window.clearTimeout(timeout);
  }, [draftScope, input]);

  useEffect(() => {
    if (!isVisible || !hasChatAccess) {
      return;
    }

    let isMounted = true;

    async function loadHistory() {
      setIsHistoryLoading(true);
      setError(null);

      try {
        const supabase = createBrowserSupabaseClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        setUserId(sessionData.session?.user.id ?? null);

        if (!accessToken) {
          throw new Error("Inicia sesión para ver tu historial.");
        }

        const response = await fetch(
          `/api/chat/history?context=book&bookId=${encodeURIComponent(book.slug)}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        const payload = (await response.json()) as ChatHistoryResponse;

        if (!response.ok || payload.error) {
          throw new Error(payload.error?.message ?? "No pudimos cargar tu historial.");
        }

        if (isMounted) {
          const historyMessages = payload.data?.messages ?? [];
          setMessages(historyMessages.length > 0 ? historyMessages : [introMessage]);
          setConversationId(payload.data?.conversation?.id ?? null);
          setRemainingQuestions(payload.data?.remainingQuestions ?? null);
          window.setTimeout(() => {
            const scrollArea = scrollAreaRef.current;

            if (scrollArea) {
              scrollArea.scrollTop = scrollArea.scrollHeight;
            }
            inputRef.current?.focus();
          }, 80);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Ocurrió un error inesperado.",
          );
        }
      } finally {
        if (isMounted) {
          setIsHistoryLoading(false);
        }
      }
    }

    void loadHistory();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadHistory();
      }
    }

    window.addEventListener("focus", loadHistory);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", loadHistory);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [book.slug, hasChatAccess, introMessage, isVisible]);

  useEffect(() => {
    if (!isVisible || !shouldFocusLatestAssistantRef.current) {
      return;
    }

    latestAssistantRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    shouldFocusLatestAssistantRef.current = false;
  }, [isVisible, messages]);

  async function sendMessage(message: string) {
    const trimmed = message.trim();

    if (!trimmed || isLoading || !hasChatAccess) {
      return;
    }

    setError(null);
    setInput("");
    if (draftScope) clearChatDraft(draftScope);
    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setIsLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("Inicia sesión para usar CEO.");
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "book",
          bookId: book.slug,
          conversationId: conversationId ?? undefined,
          clientCreationKey: conversationId ? undefined : creationKeyRef.current,
          clientMessageId: crypto.randomUUID(),
          message: trimmed,
          conversation,
        }),
      });
      const payload = (await response.json()) as ChatResponse;

      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "No pudimos enviar tu pregunta.");
      }

      if (payload.data) {
        shouldFocusLatestAssistantRef.current = true;
        setMessages((current) => [
          ...current,
          { role: "assistant", content: payload.data?.message ?? "" },
        ]);
        setRemainingQuestions(payload.data.remainingQuestions);
        setConversationId(payload.data.conversation?.id ?? conversationId);
      }
    } catch (caughtError) {
      setInput(trimmed);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Ocurrió un error inesperado.",
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div
      className={cn(
        isPanel
          ? "h-full min-h-[620px] w-full"
          : "fixed inset-x-3 bottom-4 z-40 flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6",
      )}
    >
      {isVisible ? (
        <Card
          className={cn(
            "flex flex-col overflow-hidden p-0",
            isPanel
              ? "h-full rounded-[28px] border-slate-950/[0.08] bg-white text-slate-950 shadow-none"
              : "h-[min(760px,calc(100svh-112px))] w-full max-w-[520px] rounded-[24px] border-brand-purple/30 bg-[#090a12]/95 shadow-[0_24px_90px_rgba(0,0,0,0.58)] backdrop-blur-xl sm:w-[520px]",
          )}
        >
          <header
            className={cn(
              "relative shrink-0 border-b p-4 pr-14 sm:p-5 sm:pr-14",
              isPanel ? "border-slate-950/[0.08] bg-white" : "border-white/10 bg-white/[0.025]",
            )}
          >
            <div className="flex min-w-0 gap-3">
              <span
                className={cn(
                  "grid h-12 w-12 shrink-0 place-items-center rounded-2xl border text-brand-purple",
                  isPanel
                    ? "border-violet-100 bg-violet-50 shadow-none"
                    : "border-brand-purple/40 bg-brand-purple/20 shadow-[0_0_32px_rgba(168,85,247,0.25)]",
                )}
              >
                <Bot aria-hidden="true" size={24} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={cn(
                      "text-base font-semibold",
                      isPanel ? "text-slate-950" : "text-white",
                    )}
                  >
                    Pregunta a CEO
                  </p>
                  <span className="rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                    Contexto del libro
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-1 line-clamp-2 text-xs leading-5",
                    isPanel ? "text-slate-500" : "text-text-secondary",
                  )}
                >
                  Tu asistente para aplicar ideas, ejercicios y próximos pasos de {book.title}.
                </p>
              </div>
            </div>
            {!isPanel ? (
              <button
                aria-label="Cerrar chat"
                className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition hover:border-brand-purple/50 hover:bg-white/[0.14]"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X aria-hidden="true" size={19} />
              </button>
            ) : null}
          </header>

          {hasChatAccess ? (
            <>
              <div
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5",
                  isPanel && "px-6 py-5",
                )}
                ref={scrollAreaRef}
              >
                {shouldShowQuestionLimit ? (
                  <p
                    className={cn(
                      "mb-4 inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                      isPanel
                        ? "border-slate-950/[0.08] bg-slate-50 text-slate-500"
                        : "border-white/10 bg-white/[0.045] text-text-secondary",
                    )}
                  >
                    <Sparkles aria-hidden="true" className="shrink-0 text-brand-purple" size={14} />
                    <span className="truncate">
                      {displayedRemainingQuestions} preguntas restantes este mes
                    </span>
                  </p>
                ) : null}

                <div className="space-y-4">
                  {isHistoryLoading ? (
                    <div className="flex justify-center">
                      <div
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs",
                          isPanel
                            ? "border-slate-950/[0.08] bg-slate-50 text-slate-500"
                            : "border-white/10 bg-white/[0.055] text-text-secondary",
                        )}
                      >
                        <Loader2 aria-hidden="true" className="animate-spin" size={14} />
                        Cargando historial...
                      </div>
                    </div>
                  ) : null}
                  {messages.map((message, index) => (
                    <div
                      className={cn(
                        "flex scroll-mt-4",
                        message.role === "user" ? "justify-end" : "justify-start",
                      )}
                      key={`${message.role}-${index}`}
                      ref={
                        message.role === "assistant" && index === messages.length - 1
                          ? latestAssistantRef
                          : undefined
                      }
                    >
                      <div
                        className={cn(
                          "min-w-0 rounded-[20px] px-4 py-3.5",
                          isPanel ? "max-w-[94%]" : "max-w-[88%]",
                          message.role === "user"
                            ? cn(
                                "rounded-br-md text-white",
                                isPanel
                                  ? "bg-violet-700 shadow-none"
                                  : "bg-brand-gradient shadow-[0_14px_40px_rgba(15,23,42,0.10)]",
                              )
                            : isPanel
                              ? "rounded-bl-md border border-slate-950/[0.08] bg-slate-50 text-slate-800 shadow-none"
                              : "rounded-bl-md border border-white/10 bg-white/[0.065] text-text-primary shadow-[0_14px_40px_rgba(15,23,42,0.10)]",
                        )}
                      >
                        {message.role === "assistant" ? (
                          <RichChatMessage
                            content={message.content}
                            tone={isPanel ? "light" : "dark"}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap text-[15px] font-medium leading-7">
                            {message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading ? (
                    <div className="flex justify-start">
                      <div
                        className={cn(
                          "inline-flex items-center gap-2 rounded-[18px] border px-4 py-3 text-sm",
                          isPanel
                            ? "border-slate-950/[0.08] bg-slate-50 text-slate-500"
                            : "border-white/10 bg-white/[0.055] text-text-secondary",
                        )}
                      >
                        <Loader2 aria-hidden="true" className="animate-spin" size={16} />
                        CEO está pensando...
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <footer
                className={cn(
                  "shrink-0 border-t p-3 sm:p-4",
                  isPanel ? "border-slate-950/[0.08] bg-white" : "border-white/10 bg-[#090a12]/98",
                )}
              >
                <div className="mb-3 grid grid-cols-[1fr_42px] items-stretch gap-2">
                  <div
                    className={cn(
                      "grid min-w-0 gap-2",
                      isPanel ? "grid-cols-1 xl:grid-cols-3" : "sm:grid-cols-3",
                    )}
                  >
                    {visibleSuggestions.map((suggestion) => (
                      <button
                        className={cn(
                          "min-h-11 min-w-0 border px-3 py-2 text-left text-xs leading-5 transition hover:border-brand-purple/50",
                          isPanel
                            ? "rounded-[16px] border-slate-950/[0.08] bg-slate-50 text-slate-600 hover:text-violet-700"
                            : "rounded-full border-white/10 bg-white/[0.045] text-text-secondary hover:text-white",
                        )}
                        key={suggestion}
                        onClick={() => {
                          setInput(suggestion);
                          inputRef.current?.focus();
                        }}
                        type="button"
                      >
                        <span className="block whitespace-normal text-balance">
                          {suggestion}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    aria-label="Ver otras preguntas sugeridas"
                    className={cn(
                      "grid h-full min-h-11 w-11 shrink-0 place-items-center rounded-[16px] border transition hover:border-brand-purple/50",
                      isPanel
                        ? "border-slate-950/[0.08] bg-slate-50 text-slate-500 hover:text-violet-700"
                        : "border-white/10 bg-white/[0.055] text-text-secondary hover:text-white",
                    )}
                    onClick={() =>
                      setSuggestionStartIndex(
                        (current) => (current + 3) % bookSuggestions.length,
                      )
                    }
                    type="button"
                  >
                    <RefreshCw aria-hidden="true" size={15} />
                  </button>
                </div>
                {error ? (
                  <div className="mb-3 rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                    {error}
                  </div>
                ) : null}
                <ChatComposer
                  disabled={isHistoryLoading}
                  disabledReason={isHistoryLoading ? "Estamos preparando el contexto de este análisis." : undefined}
                  isSubmitting={isLoading}
                  locked={!hasChatAccess || displayedRemainingQuestions === 0}
                  lockedReason={!hasChatAccess ? "Chat con CEO no está incluido en tu plan actual." : displayedRemainingQuestions === 0 ? "Has alcanzado el límite de consultas de tu plan." : undefined}
                  maxHeight={112}
                  onChange={setInput}
                  onSubmit={() => void sendMessage(input)}
                  placeholder="Pregunta sobre este análisis…"
                  textareaRef={inputRef}
                  tone={isPanel ? "light" : "dark"}
                  value={input}
                />
              </footer>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 items-center p-5">
              <div className="rounded-[20px] border border-brand-purple/30 bg-brand-purple/10 p-5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-purple/20 text-brand-purple">
                  <Lock aria-hidden="true" size={22} />
                </span>
                <h2
                  className={cn(
                    "mt-4 text-xl font-semibold",
                    isPanel ? "text-slate-950" : "text-white",
                  )}
                >
                  CEO para libros está incluido desde Pro
                </h2>
                <p
                  className={cn(
                    "mt-2 text-sm leading-6",
                    isPanel ? "text-slate-600" : "text-text-secondary",
                  )}
                >
                  Activa preguntas contextuales sobre cada análisis, ejercicios
                  guiados y ayuda para aplicar ideas a tu situación.
                </p>
                <Link
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-button bg-brand-gradient px-5 text-sm font-medium text-white transition hover:brightness-110"
                  href="/planes?plan=pro&offer=new-user-15"
                >
                  Mejorar plan
                </Link>
              </div>
            </div>
          )}
        </Card>
      ) : null}

      {!isPanel ? (
        <button
          aria-label={isOpen ? "Cerrar CEO" : "Abrir CEO del libro"}
          className="group relative grid h-16 w-16 place-items-center self-end rounded-full border border-brand-purple/50 bg-brand-gradient text-white shadow-[0_18px_55px_rgba(124,58,237,0.45)] transition duration-300 hover:-translate-y-1 hover:brightness-110"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span className="absolute inset-[-7px] rounded-full border border-brand-purple/25 opacity-0 transition group-hover:opacity-100" />
          {isOpen ? (
            <X aria-hidden="true" size={24} />
          ) : (
            <MessageCircle aria-hidden="true" size={25} />
          )}
        </button>
      ) : null}
    </div>
  );
}
