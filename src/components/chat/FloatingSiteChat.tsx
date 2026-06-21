"use client";

import Link from "next/link";
import { Bot, Lock, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

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
  "Recomiéndame qué análisis explorar para mejorar mi enfoque.",
  "¿Cómo puedo crear una rutina de lectura sostenible?",
  "Quiero mejorar mis finanzas personales, ¿por dónde empiezo?",
  "Dame una ruta de 7 días para construir mejores hábitos.",
] as const;

export function FloatingSiteChat({ plan }: FloatingSiteChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatConversationMessage[]>([
    {
      role: "assistant",
      content:
        "Hola. Soy la IA de Ceoteca. Puedo recomendarte análisis del catálogo, ayudarte con productividad, mentalidad, desarrollo personal, hábitos de lectura y formas prácticas de aplicar ideas.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<string>("Lista para orientarte.");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const hasChatAccess = canAccessFeature(plan, "chat");

  const conversation = useMemo(
    () =>
      messages.filter(
        (message) => message.role === "user" || message.role === "assistant",
      ),
    [messages],
  );

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
        throw new Error("Inicia sesión para usar la IA de Ceoteca.");
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
        setUsage(
          responseData.usage.limit === null
            ? `${responseData.usage.questionCount} preguntas este mes`
            : `${responseData.remainingQuestions} preguntas restantes este mes`,
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
      inputRef.current?.focus();
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <Card className="w-[calc(100vw-40px)] overflow-hidden rounded-[22px] border-brand-purple/35 bg-[#090a12]/95 p-0 shadow-[0_24px_90px_rgba(0,0,0,0.56)] backdrop-blur-xl sm:w-[430px]">
          <header className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
            <div className="flex gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-brand-purple/40 bg-brand-purple/20 text-brand-purple shadow-[0_0_32px_rgba(168,85,247,0.35)]">
                <Bot aria-hidden="true" size={24} />
              </span>
              <div>
                <p className="text-base font-semibold">IA de Ceoteca</p>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  Recomendaciones del sitio, lectura, productividad y aplicación.
                </p>
              </div>
            </div>
            <Button
              aria-label="Cerrar chat"
              className="h-9 w-9 shrink-0 px-0"
              onClick={() => setIsOpen(false)}
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" size={18} />
            </Button>
          </header>

          {hasChatAccess ? (
            <>
              <div className="max-h-[min(58vh,500px)] space-y-4 overflow-y-auto p-5">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-text-secondary">
                  <Sparkles aria-hidden="true" className="text-brand-purple" size={14} />
                  {usage}
                </p>
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
                        "max-w-[86%] rounded-[18px] px-4 py-3 text-sm leading-6",
                        message.role === "user"
                          ? "bg-brand-gradient text-white"
                          : "border border-white/10 bg-white/[0.055] text-text-secondary",
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading ? (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-text-secondary">
                      <Loader2 aria-hidden="true" className="animate-spin" size={16} />
                      Pensando...
                    </div>
                  </div>
                ) : null}
              </div>

              <footer className="border-t border-white/10 p-4">
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {siteSuggestions.map((suggestion) => (
                    <button
                      className="shrink-0 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-xs text-text-secondary transition hover:border-brand-purple/50 hover:text-white"
                      key={suggestion}
                      onClick={() => void sendMessage(suggestion)}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                {error ? (
                  <div className="mb-3 rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                    {error}
                  </div>
                ) : null}
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendMessage(input);
                  }}
                >
                  <textarea
                    className="min-h-12 flex-1 resize-none rounded-button border border-white/10 bg-white/[0.045] px-4 py-3 text-sm outline-none transition placeholder:text-text-muted focus:border-brand-purple"
                    maxLength={2000}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Pregunta sobre Ceoteca, lectura o hábitos..."
                    ref={inputRef}
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
            </>
          ) : (
            <div className="p-5">
              <div className="rounded-[18px] border border-brand-purple/30 bg-brand-purple/10 p-5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-purple/20 text-brand-purple">
                  <Lock aria-hidden="true" size={22} />
                </span>
                <h2 className="mt-4 text-xl font-semibold">
                  La IA está incluida desde Pro
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
        aria-label={isOpen ? "Cerrar IA de Ceoteca" : "Abrir IA de Ceoteca"}
        className="group relative grid h-16 w-16 place-items-center rounded-full border border-brand-purple/50 bg-brand-gradient text-white shadow-[0_18px_55px_rgba(124,58,237,0.45)] transition duration-300 hover:-translate-y-1 hover:brightness-110"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="absolute inset-[-7px] rounded-full border border-brand-purple/25 opacity-0 transition group-hover:opacity-100" />
        {isOpen ? <X aria-hidden="true" size={24} /> : <MessageCircle aria-hidden="true" size={25} />}
      </button>
    </div>
  );
}
