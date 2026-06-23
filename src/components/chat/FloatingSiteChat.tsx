"use client";

import Link from "next/link";
import {
  Bot,
  Lock,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { RichChatMessage } from "@/components/chat/RichChatMessage";
import { Card } from "@/components/ui/Card";
import { plans, type PlanKey } from "@/config/plans";
import { prepareChatConversation } from "@/lib/chat/conversation";
import { canAccessFeature } from "@/lib/permissions";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ChatConversationMessage } from "@/lib/validation/chat";
import { cn } from "@/lib/utils/cn";

type FloatingSiteChatProps = {
  plan: PlanKey;
};

type ChatResponse = {
  data?: {
    message: string;
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

const siteSuggestions = [
  "Recomiéndame análisis para mejorar mi enfoque.",
  "¿Cómo creo una rutina de lectura sostenible?",
  "Quiero mejorar mis finanzas personales.",
  "Dame una ruta de 7 días para mejores hábitos.",
  "¿Qué análisis me ayuda a vender mejor?",
  "Quiero mejorar mi comunicación.",
  "¿Qué leo si quiero invertir con más criterio?",
  "Ayúdame a salir del bloqueo mental.",
  "Dame una ruta para liderar mejor.",
] as const;

function getNextSuggestionSet(currentIndex: number) {
  return Array.from({ length: 3 }, (_, index) => {
    const suggestionIndex = (currentIndex + index) % siteSuggestions.length;

    return siteSuggestions[suggestionIndex];
  });
}

export function FloatingSiteChat({ plan }: FloatingSiteChatProps) {
  const introMessage = useMemo<ChatConversationMessage>(
    () => ({
      role: "assistant",
      content:
        "Hola. Soy CEO, tu IA de Ceoteca. Puedo recomendarte análisis del catálogo, ayudarte con productividad, mentalidad, desarrollo personal, hábitos de lectura y formas prácticas de aplicar ideas.",
    }),
    [],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatConversationMessage[]>([
    introMessage,
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingQuestions, setRemainingQuestions] = useState<number | null>(null);
  const [suggestionStartIndex, setSuggestionStartIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
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

  useEffect(() => {
    if (!isOpen || !hasChatAccess) {
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

        if (!accessToken) {
          throw new Error("Inicia sesión para ver tu historial.");
        }

        const response = await fetch("/api/chat/history?context=site", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const payload = (await response.json()) as ChatHistoryResponse;

        if (!response.ok || payload.error) {
          throw new Error(payload.error?.message ?? "No pudimos cargar tu historial.");
        }

        if (isMounted) {
          const historyMessages = payload.data?.messages ?? [];
          setMessages(historyMessages.length > 0 ? historyMessages : [introMessage]);
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
  }, [hasChatAccess, introMessage, isOpen]);

  useEffect(() => {
    if (!isOpen || !shouldFocusLatestAssistantRef.current) {
      return;
    }

    latestAssistantRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    shouldFocusLatestAssistantRef.current = false;
  }, [isOpen, messages]);

  async function sendMessage(message: string) {
    const trimmed = message.trim();

    if (!trimmed || isLoading || !hasChatAccess) {
      return;
    }

    setError(null);
    setInput("");
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
          context: "site",
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
      }
    } catch (caughtError) {
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
    <div className="fixed inset-x-3 bottom-4 z-40 flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6">
      {isOpen ? (
        <Card className="flex h-[min(760px,calc(100svh-112px))] w-full max-w-[520px] flex-col overflow-hidden rounded-[24px] border-brand-purple/30 bg-[#090a12]/95 p-0 shadow-[0_24px_90px_rgba(0,0,0,0.58)] backdrop-blur-xl sm:w-[520px]">
          <header className="relative shrink-0 border-b border-white/10 bg-white/[0.025] p-4 pr-14 sm:p-5 sm:pr-14">
            <div className="flex min-w-0 gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-brand-purple/40 bg-brand-purple/20 text-brand-purple shadow-[0_0_32px_rgba(168,85,247,0.35)]">
                <Bot aria-hidden="true" size={24} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-white">CEO</p>
                  <span className="rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                    En línea
                  </span>
                </div>
                <p className="mt-1 max-w-[340px] text-xs leading-5 text-text-secondary">
                  IA de Ceoteca para recomendaciones, lectura, productividad y aplicación.
                </p>
              </div>
            </div>
            <button
              aria-label="Cerrar chat"
              className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition hover:border-brand-purple/50 hover:bg-white/[0.14]"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X aria-hidden="true" size={19} />
            </button>
          </header>

          {hasChatAccess ? (
            <>
              <div
                className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5"
                ref={scrollAreaRef}
              >
                {shouldShowQuestionLimit ? (
                  <p className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-text-secondary">
                    <Sparkles aria-hidden="true" className="shrink-0 text-brand-purple" size={14} />
                    <span className="truncate">
                      {displayedRemainingQuestions} preguntas restantes este mes
                    </span>
                  </p>
                ) : null}

                <div className="space-y-4">
                  {isHistoryLoading ? (
                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-xs text-text-secondary">
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
                          "min-w-0 max-w-[88%] rounded-[20px] px-4 py-3.5 shadow-[0_14px_40px_rgba(0,0,0,0.22)]",
                          message.role === "user"
                            ? "rounded-br-md bg-brand-gradient text-white"
                            : "rounded-bl-md border border-white/10 bg-white/[0.065] text-text-primary",
                        )}
                      >
                        {message.role === "assistant" ? (
                          <RichChatMessage content={message.content} />
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
                      <div className="inline-flex items-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-text-secondary">
                        <Loader2 aria-hidden="true" className="animate-spin" size={16} />
                        CEO está pensando...
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <footer className="shrink-0 border-t border-white/10 bg-[#090a12]/98 p-3 sm:p-4">
                <div className="mb-3 grid grid-cols-[1fr_36px] items-stretch gap-2">
                  <div className="grid min-w-0 gap-2 sm:grid-cols-3">
                    {visibleSuggestions.map((suggestion) => (
                      <button
                        className="min-h-10 min-w-0 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-left text-xs leading-5 text-text-secondary transition hover:border-brand-purple/50 hover:text-white"
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
                    className="grid h-full min-h-10 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.055] text-text-secondary transition hover:border-brand-purple/50 hover:text-white"
                    onClick={() =>
                      setSuggestionStartIndex(
                        (current) => (current + 3) % siteSuggestions.length,
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
                <form
                  className="grid grid-cols-[1fr_48px] gap-2 rounded-[18px] border border-white/10 bg-white/[0.045] p-2 focus-within:border-brand-purple/70 focus-within:ring-2 focus-within:ring-brand-purple/25"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendMessage(input);
                  }}
                >
                  <textarea
                    className="max-h-28 min-h-11 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-white outline-none placeholder:text-text-muted"
                    maxLength={2000}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage(input);
                      }
                    }}
                    placeholder="Pregúntale a CEO..."
                    ref={inputRef}
                    rows={1}
                    value={input}
                  />
                  <button
                    aria-label="Enviar pregunta"
                    className="grid h-11 w-11 place-items-center rounded-[14px] bg-brand-gradient text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={isLoading || input.trim().length === 0}
                    type="submit"
                  >
                    <Send aria-hidden="true" className="translate-x-px" size={18} />
                  </button>
                </form>
              </footer>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 items-center p-5">
              <div className="rounded-[20px] border border-brand-purple/30 bg-brand-purple/10 p-5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-purple/20 text-brand-purple">
                  <Lock aria-hidden="true" size={22} />
                </span>
                <h2 className="mt-4 text-xl font-semibold text-white">
                  CEO está incluido desde Pro
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Activa recomendaciones personalizadas, rutas de lectura,
                  preguntas sobre análisis y apoyo para aplicar ideas a tu día.
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

      <button
        aria-label={isOpen ? "Cerrar CEO" : "Abrir CEO"}
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
    </div>
  );
}
