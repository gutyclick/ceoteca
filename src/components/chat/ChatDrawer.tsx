"use client";

import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { prepareChatConversation } from "@/lib/chat/conversation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ChatConversationMessage } from "@/lib/validation/chat";
import { cn } from "@/lib/utils/cn";

type ChatDrawerProps = {
  bookSlug: string;
  bookTitle: string;
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

const suggestions = [
  "¿Cuál es la idea más aplicable esta semana?",
  "Dame un plan de 7 días basado en este análisis.",
  "¿Qué limitación debería tener en cuenta?",
] as const;

export function ChatDrawer({ bookSlug, bookTitle }: ChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatConversationMessage[]>([
    {
      role: "assistant",
      content: `Estoy listo para responder sobre el análisis de ${bookTitle}.`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<string>("Sin preguntas todavía.");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const conversation = useMemo(() => prepareChatConversation(messages), [messages]);

  async function sendMessage(message: string) {
    const trimmed = message.trim();

    if (!trimmed || isLoading) {
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
        throw new Error("Inicia sesión para usar el chat.");
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId: bookSlug,
          message: trimmed,
          conversation,
        }),
      });
      const payload = (await response.json()) as ChatResponse;

      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "No pudimos enviar tu pregunta.");
      }

      const data = payload.data;

      if (data) {
        setMessages((current) => [
          ...current,
          { role: "assistant", content: data.message },
        ]);
        setUsage(
          data.usage.limit === null
            ? `${data.usage.questionCount} preguntas este mes`
            : `${data.remainingQuestions} preguntas restantes este mes`,
        );
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Ocurrió un error inesperado.",
      );
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }

  return (
    <>
      <Button className="w-full" onClick={() => setIsOpen(true)} type="button">
        <MessageCircle aria-hidden="true" size={18} />
        Hablar con este libro
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Cerrar chat"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            type="button"
          />
          <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-xl flex-col border-l border-white/10 bg-background shadow-ambient sm:rounded-l-[1.5rem]">
            <header className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-purple/15 text-brand-purple">
                  <Bot aria-hidden="true" size={22} />
                </span>
                <div>
                  <h2 className="font-semibold">Habla con este libro</h2>
                  <p className="text-sm text-text-secondary">{usage}</p>
                </div>
              </div>
              <Button
                aria-label="Cerrar chat"
                className="h-10 w-10 px-0"
                onClick={() => setIsOpen(false)}
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" size={20} />
              </Button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
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
                      "max-w-[85%] rounded-[1.25rem] px-4 py-3 text-sm leading-6",
                      message.role === "user"
                        ? "bg-brand-purple text-white"
                        : "border border-white/10 bg-white/[0.05] text-text-secondary",
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading ? (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-[1.25rem] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-text-secondary">
                    <Loader2 aria-hidden="true" className="animate-spin" size={16} />
                    Pensando...
                  </div>
                </div>
              ) : null}
            </div>

            <footer className="border-t border-white/10 p-5">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {suggestions.map((suggestion) => (
                  <button
                    className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-text-secondary transition hover:text-text-primary"
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              {error ? (
                <Card className="mb-3 border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                  {error}
                </Card>
              ) : null}
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage(input);
                }}
              >
                <textarea
                  className="min-h-12 flex-1 resize-none rounded-button border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none transition placeholder:text-text-muted focus:border-brand-purple"
                  maxLength={2000}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Pregunta algo sobre este análisis..."
                  ref={textareaRef}
                  rows={1}
                  value={input}
                />
                <Button
                  aria-label="Enviar pregunta"
                  className="h-12 w-12 px-0"
                  disabled={isLoading || input.trim().length === 0}
                  type="submit"
                >
                  <Send aria-hidden="true" size={18} />
                </Button>
              </form>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}
