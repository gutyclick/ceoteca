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
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PlanKey } from "@/config/plans";
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

function renderInlineText(value: string) {
  const parts = value.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong className="font-semibold text-white" key={`${part}-${index}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

function RichMessage({ content }: { content: string }) {
  const lines = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 text-[15px] leading-7">
      {lines.map((line, index) => {
        const heading = line.match(/^#{1,3}\s+(.+)$/);
        const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
        const bullet = line.match(/^[-*]\s+(.+)$/);

        if (heading) {
          return (
            <h3
              className="pt-1 text-base font-semibold leading-6 text-white"
              key={`${line}-${index}`}
            >
              {renderInlineText(heading[1])}
            </h3>
          );
        }

        if (numbered) {
          return (
            <div className="grid grid-cols-[28px_1fr] gap-3" key={`${line}-${index}`}>
              <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-brand-purple/25 text-xs font-semibold text-brand-purple">
                {numbered[1]}
              </span>
              <p className="min-w-0 text-text-primary">{renderInlineText(numbered[2])}</p>
            </div>
          );
        }

        if (bullet) {
          return (
            <div className="grid grid-cols-[18px_1fr] gap-3" key={`${line}-${index}`}>
              <span className="mt-3 h-1.5 w-1.5 rounded-full bg-brand-purple" />
              <p className="min-w-0 text-text-primary">{renderInlineText(bullet[1])}</p>
            </div>
          );
        }

        return (
          <p className="text-text-primary" key={`${line}-${index}`}>
            {renderInlineText(line)}
          </p>
        );
      })}
    </div>
  );
}

export function FloatingSiteChat({ plan }: FloatingSiteChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatConversationMessage[]>([
    {
      role: "assistant",
      content:
        "Hola. Soy CEO, tu IA de Ceoteca. Puedo recomendarte análisis del catálogo, ayudarte con productividad, mentalidad, desarrollo personal, hábitos de lectura y formas prácticas de aplicar ideas.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingQuestions, setRemainingQuestions] = useState<number | null>(null);
  const [hasUsageLoaded, setHasUsageLoaded] = useState(false);
  const [suggestionStartIndex, setSuggestionStartIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const hasChatAccess = canAccessFeature(plan, "chat");
  const visibleSuggestions = getNextSuggestionSet(suggestionStartIndex);

  const conversation = useMemo(
    () =>
      messages.filter(
        (message) => message.role === "user" || message.role === "assistant",
      ),
    [messages],
  );

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [isOpen, messages, isLoading]);

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

      const responseData = payload.data;

      if (responseData) {
        setMessages((current) => [
          ...current,
          { role: "assistant", content: responseData.message },
        ]);
        setRemainingQuestions(responseData.remainingQuestions);
        setHasUsageLoaded(responseData.usage.limit !== null);
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
            <div className="flex items-start justify-between gap-4">
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
              <Button
                aria-label="Cerrar chat"
                className="absolute right-3 top-3 h-9 w-9 px-0"
                onClick={() => setIsOpen(false)}
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" size={18} />
              </Button>
            </div>
          </header>

          {hasChatAccess ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                {hasUsageLoaded && remainingQuestions !== null ? (
                  <p className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-text-secondary">
                    <Sparkles aria-hidden="true" className="shrink-0 text-brand-purple" size={14} />
                    <span className="truncate">
                      {remainingQuestions} preguntas restantes este mes
                    </span>
                  </p>
                ) : null}

                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start",
                      )}
                      key={`${message.role}-${index}`}
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
                          <RichMessage content={message.content} />
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
                  <div ref={bottomRef} />
                </div>
              </div>

              <footer className="shrink-0 border-t border-white/10 bg-[#090a12]/98 p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
                  {visibleSuggestions.map((suggestion) => (
                    <button
                      className="min-h-9 max-w-[220px] shrink-0 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-left text-xs leading-5 text-text-secondary transition hover:border-brand-purple/50 hover:text-white"
                      key={suggestion}
                      onClick={() => void sendMessage(suggestion)}
                      type="button"
                    >
                      <span className="block truncate">{suggestion}</span>
                    </button>
                  ))}
                  </div>
                  <button
                    aria-label="Ver otras preguntas sugeridas"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.055] text-text-secondary transition hover:border-brand-purple/50 hover:text-white"
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
