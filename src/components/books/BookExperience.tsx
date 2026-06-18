"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Headphones,
  Heart,
  Home,
  Loader2,
  MoreHorizontal,
  Play,
  Send,
  Share2,
  Sparkles,
  Star,
  User,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { ChatConversationMessage } from "@/lib/validation/chat";
import type { Book, BookActivity, KeyPoint } from "@/types";

type BookExperienceProps = {
  book: Book;
};

type TabKey = "summary" | "keyPoints" | "activities" | "audio" | "chat";

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

const disclaimer =
  "Contenido educativo y editorial propio. Ceoteca no esta afiliada al autor ni a la editorial. Este analisis no reemplaza la obra original.";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "summary", label: "Resumen" },
  { key: "keyPoints", label: "Ideas clave" },
  { key: "activities", label: "Ejercicios" },
  { key: "audio", label: "Audio" },
  { key: "chat", label: "Chat IA" },
];

const navItems = [
  { label: "Inicio", href: "/home", icon: Home, active: true },
  { label: "Biblioteca", href: "/biblioteca", icon: BookOpen, active: false },
  { label: "IA", href: "#chat-libro", icon: Bot, active: false },
  { label: "Favoritos", href: "/biblioteca", icon: Star, active: false },
  { label: "Perfil", href: "/planes", icon: User, active: false },
] as const;

const keyPointIcons = ["👁", "⭐", "⚡", "🙂", "🔒", "🎯", "🧠"] as const;

function getProgress(book: Book) {
  return book.progress ?? 73;
}

function getRemainingMinutes(book: Book) {
  return Math.max(Math.ceil(book.readingTime * (1 - getProgress(book) / 100)), 3);
}

function getSummary(book: Book) {
  const analysisText = book.analysis.map((section) => section.content).join(" ");

  if (analysisText.trim().length > 0) {
    return analysisText;
  }

  return book.description;
}

function MiniCover({ book }: { book: Book }) {
  return (
    <div className="relative h-[300px] w-full max-w-[190px] overflow-hidden rounded-md border border-white/20 bg-gradient-to-br from-yellow-300 via-amber-500 to-orange-700 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border border-white/25" />
      <div className="relative z-10 flex h-full flex-col justify-between text-black">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em]">
            Ceoteca
          </p>
          <h2 className="mt-7 text-balance text-3xl font-black uppercase leading-none">
            {book.title}
          </h2>
        </div>
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-black/40 bg-black/10">
          <Sparkles aria-hidden="true" size={38} />
        </div>
        <p className="text-center text-sm font-black uppercase tracking-[0.16em]">
          {book.author}
        </p>
      </div>
    </div>
  );
}

function BookStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="border-r border-white/10 px-4 text-center last:border-r-0">
      <Icon aria-hidden="true" className="mx-auto text-brand-purple" size={21} />
      <p className="mt-2 text-sm font-semibold">{value}</p>
      <p className="mt-1 text-xs text-text-secondary">{label}</p>
    </div>
  );
}

function AudioPanel({ book }: { book: Book }) {
  return (
    <Card className="rounded-[16px] bg-white/[0.035] p-6">
      <h2 className="text-xl font-semibold">Escucha el resumen</h2>
      <div className="mt-6 flex items-center gap-5">
        <button
          aria-label="Reproducir audio"
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-purple/70 text-white shadow-[0_0_38px_rgba(124,58,237,0.42)] transition hover:bg-brand-purple"
          type="button"
        >
          <Play aria-hidden="true" fill="currentColor" size={25} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {Array.from({ length: 30 }).map((_, index) => (
            <span
              className="w-1 rounded-full bg-brand-purple"
              key={index}
              style={{ height: 10 + ((index * 7) % 34) }}
            />
          ))}
        </div>
        <p className="text-sm text-text-secondary">{book.readingTime}:45</p>
      </div>
      <p className="mt-6 text-sm text-text-secondary">
        Resumen narrado por IA. Luego lo conectaremos al texto que subas para
        generar el audio real.
      </p>
      <button
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-button border border-white/10 bg-white/[0.04] px-4 text-sm text-text-secondary transition hover:text-white"
        type="button"
      >
        Cambiar voz
        <Headphones aria-hidden="true" size={17} />
      </button>
    </Card>
  );
}

function KeyPointRow({ point, index }: { point: KeyPoint; index: number }) {
  return (
    <details className="group border-b border-white/10 px-4 py-4 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.06] text-xl">
          {keyPointIcons[index % keyPointIcons.length]}
        </span>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-purple/20 text-sm font-semibold text-brand-purple">
          {point.number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{point.title}</span>
          <span className="mt-1 block text-sm text-text-secondary">
            {point.explanation}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="text-text-secondary transition group-open:rotate-180"
          size={18}
        />
      </summary>
      <div className="ml-[112px] mt-4 grid gap-3 text-sm leading-7 text-text-secondary">
        <p>
          <span className="text-text-primary">Ejemplo:</span> {point.example}
        </p>
        <p>
          <span className="text-text-primary">Accion:</span> {point.action}
        </p>
        <p>
          <span className="text-text-primary">Limitacion:</span> {point.limitation}
        </p>
      </div>
    </details>
  );
}

function ActivityCard({ activity }: { activity: BookActivity }) {
  return (
    <Card className="rounded-[16px] bg-white/[0.035] p-6">
      <div className="grid gap-5 md:grid-cols-[92px_1fr_210px] md:items-center">
        <span className="grid h-24 w-24 place-items-center rounded-full border border-brand-purple/50 bg-brand-purple/20 text-brand-purple shadow-[0_0_35px_rgba(124,58,237,0.28)]">
          <BookOpen aria-hidden="true" size={42} />
        </span>
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-brand-purple">
            Ejercicio practico
          </p>
          <h3 className="mt-3 text-xl font-semibold">{activity.title}</h3>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            {activity.prompt}
          </p>
          <button
            className="mt-5 min-h-11 rounded-button bg-brand-purple/70 px-5 text-sm font-medium text-white transition hover:bg-brand-purple"
            type="button"
          >
            Comenzar ejercicio
          </button>
        </div>
        <div className="rounded-card border border-white/10 bg-white/[0.035] p-4">
          <p className="text-sm font-medium">Opciones</p>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            {(activity.options ?? ["Responder en 2 minutos", "Guardar reflexion", "Aplicar hoy"]).map(
              (option) => (
                <li key={option}>• {option}</li>
              ),
            )}
          </ul>
        </div>
      </div>
    </Card>
  );
}

function ChatPanel({
  book,
  inputRef,
}: {
  book: Book;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatConversationMessage[]>([
    {
      role: "assistant",
      content: `IA entrenada en ${book.title}. Preguntame por aplicacion, ejercicios, recomendaciones o rutas de lectura.`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = useMemo(
    () =>
      messages.filter(
        (message) => message.role === "user" || message.role === "assistant",
      ),
    [messages],
  );

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
        throw new Error("Inicia sesion para usar el chat.");
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId: book.slug,
          message: trimmed,
          conversation,
        }),
      });
      const payload = (await response.json()) as ChatResponse;

      if (!response.ok || payload.error) {
        throw new Error(payload.error?.message ?? "No pudimos responder ahora.");
      }

      if (payload.data) {
        setMessages((current) => [
          ...current,
          { role: "assistant", content: payload.data?.message ?? "" },
        ]);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Ocurrio un error inesperado.",
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  const promptChips = [
    "Como crear mejores habitos?",
    "Que hago cuando fallo?",
    "Dame un plan de 7 dias",
  ];

  return (
    <Card
      className="rounded-[16px] bg-white/[0.035] p-5 lg:sticky lg:top-6"
      id="chat-libro"
    >
      <h2 className="text-xl font-semibold">Chat con el libro</h2>
      <p className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
        <span className="h-2 w-2 rounded-full bg-success" />
        IA entrenada en este libro
      </p>

      <div className="mt-5 max-h-[520px] space-y-4 overflow-y-auto pr-1">
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
                "max-w-[88%] rounded-[1.1rem] px-4 py-3 text-sm leading-6",
                message.role === "user"
                  ? "rounded-br-sm bg-brand-purple/70 text-white"
                  : "border border-white/10 bg-white/[0.055] text-text-secondary",
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-text-secondary">
            <Loader2 aria-hidden="true" className="animate-spin" size={16} />
            Pensando...
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mt-4 rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <form
        className="mt-4 flex gap-2 rounded-button border border-white/10 bg-white/[0.035] p-2"
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage(input);
        }}
      >
        <textarea
          className="min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-text-muted"
          maxLength={2000}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Escribe tu pregunta..."
          ref={inputRef}
          rows={1}
          value={input}
        />
        <button
          aria-label="Enviar pregunta"
          className="grid h-10 w-10 place-items-center rounded-button bg-brand-purple text-white transition hover:brightness-110 disabled:opacity-50"
          disabled={input.trim().length === 0 || isLoading}
          type="submit"
        >
          <Send aria-hidden="true" size={18} />
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {promptChips.map((prompt) => (
          <button
            className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-text-secondary transition hover:text-white"
            key={prompt}
            onClick={() => void sendMessage(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>
    </Card>
  );
}

export function BookExperience({ book }: BookExperienceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const progress = getProgress(book);

  function openBookChat() {
    setActiveTab("chat");
    document.getElementById("chat-libro")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    window.setTimeout(() => chatInputRef.current?.focus(), 250);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#03040b] pb-36 text-text-primary">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(124,58,237,0.18),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(79,99,255,0.12),transparent_30%),linear-gradient(180deg,#02030a_0%,#050612_52%,#04040a_100%)]" />

      <section className="mx-auto w-full max-w-[1220px] px-5 pt-7 md:px-8">
        <header className="flex items-center justify-between">
          <button
            aria-label="Volver"
            className="grid h-12 w-12 place-items-center rounded-button border border-white/10 bg-white/[0.035] text-text-primary transition hover:bg-white/[0.07]"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={22} />
          </button>
          <div className="flex gap-4">
            {[
              [Heart, "Favorito"],
              [Share2, "Compartir"],
              [MoreHorizontal, "Mas opciones"],
            ].map(([Icon, label]) => (
              <button
                aria-label={label as string}
                className="grid h-12 w-12 place-items-center rounded-button border border-white/10 bg-white/[0.035] text-text-primary transition hover:bg-white/[0.07] hover:text-brand-purple"
                key={label as string}
                type="button"
              >
                <Icon aria-hidden="true" size={21} />
              </button>
            ))}
          </div>
        </header>

        <section className="mt-5 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="grid gap-8 md:grid-cols-[210px_1fr] md:items-center">
            <MiniCover book={book} />
            <div>
              <h1 className="text-balance text-4xl font-semibold md:text-5xl">
                {book.title}
              </h1>
              <p className="mt-4 text-lg text-text-primary">{book.description}</p>
              <p className="mt-4 text-text-secondary">{book.author}</p>

              <div className="mt-8 grid max-w-xl grid-cols-5 overflow-hidden rounded-card border border-white/10 bg-white/[0.025] py-4">
                <BookStat
                  icon={Clock3}
                  label="Tiempo de lectura"
                  value={`${book.readingTime} min`}
                />
                <BookStat
                  icon={Star}
                  label="Ideas clave"
                  value={`${book.keyPoints.length}`}
                />
                <BookStat
                  icon={BookOpen}
                  label="Ejercicios"
                  value={`${book.activities.length}`}
                />
                <BookStat icon={Headphones} label="Audio incluido" value="Audio" />
                <BookStat icon={Bot} label="IA incluida" value="IA" />
              </div>

              <div className="mt-7 max-w-xl">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Progreso de lectura</span>
                  <span>{progress}%</span>
                  <span className="text-text-secondary">
                    {getRemainingMinutes(book)} min restantes
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-blue"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <AudioPanel book={book} />
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-5">
            <div className="grid grid-cols-5 overflow-hidden rounded-[16px] border border-white/10 bg-white/[0.035]">
              {tabs.map((tab) => (
                <button
                  className={cn(
                    "min-h-16 border-b-2 border-transparent text-sm text-text-secondary transition hover:text-white",
                    activeTab === tab.key &&
                      "border-brand-purple text-text-primary shadow-[inset_0_-20px_35px_rgba(124,58,237,0.08)]",
                  )}
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    if (tab.key === "chat") {
                      openBookChat();
                    }
                  }}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Card className="rounded-[16px] bg-white/[0.035] p-6">
              {activeTab === "summary" ? (
                <section>
                  <h2 className="flex items-center gap-3 text-xl font-semibold">
                    <BookOpen aria-hidden="true" className="text-brand-purple" size={22} />
                    Resumen del libro
                  </h2>
                  <div className="mt-5 space-y-4 text-sm leading-8 text-text-secondary">
                    {getSummary(book)
                      .split(".")
                      .filter(Boolean)
                      .slice(0, 4)
                      .map((sentence) => (
                        <p key={sentence}>{sentence.trim()}.</p>
                      ))}
                  </div>

                  <div className="mt-7 rounded-card border border-brand-purple/30 bg-brand-purple/5 p-5">
                    <p className="text-brand-purple">Principio fundamental</p>
                    <p className="mt-4 text-lg font-semibold">
                      Mejora del 1% cada dia → 37x mejor en un año
                    </p>
                    <p className="mt-3 text-sm text-text-secondary">
                      Pequeñas mejoras, repetidas en el tiempo, generan
                      resultados masivos.
                    </p>
                  </div>
                </section>
              ) : null}

              {activeTab === "keyPoints" ? (
                <section>
                  <h2 className="text-xl font-semibold">
                    Las {book.keyPoints.length} ideas clave
                  </h2>
                  <div className="mt-5 overflow-hidden rounded-card border border-white/10 bg-white/[0.025]">
                    {book.keyPoints.map((point, index) => (
                      <KeyPointRow
                        index={index}
                        key={point.number}
                        point={point}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {activeTab === "activities" ? (
                <section className="grid gap-5">
                  {book.activities.map((activity) => (
                    <ActivityCard activity={activity} key={activity.title} />
                  ))}
                </section>
              ) : null}

              {activeTab === "audio" ? <AudioPanel book={book} /> : null}

              {activeTab === "chat" ? (
                <section>
                  <h2 className="text-xl font-semibold">Chat IA</h2>
                  <p className="mt-3 text-sm leading-7 text-text-secondary">
                    El chat contextual esta disponible en el panel del libro.
                    Usa el boton IA del menu inferior o el panel lateral para
                    abrir la conversacion entrenada en este contenido.
                  </p>
                </section>
              ) : null}
            </Card>

            {activeTab === "summary" ? (
              <section className="space-y-5">
                <h2 className="text-xl font-semibold">
                  Las {book.keyPoints.length} ideas clave
                </h2>
                <div className="overflow-hidden rounded-card border border-white/10 bg-white/[0.025]">
                  {book.keyPoints.map((point, index) => (
                    <KeyPointRow index={index} key={point.number} point={point} />
                  ))}
                </div>
                {book.activities[0] ? (
                  <ActivityCard activity={book.activities[0]} />
                ) : null}
                {book.purchaseUrl ? (
                  <Card className="overflow-hidden rounded-[16px] bg-white/[0.035] p-6">
                    <div className="grid gap-5 md:grid-cols-[86px_1fr_160px] md:items-center">
                      <span className="grid h-20 w-20 place-items-center rounded-full border border-brand-purple/50 bg-brand-purple/20 text-brand-purple">
                        <BookOpen aria-hidden="true" size={38} />
                      </span>
                      <div>
                        <h2 className="text-xl font-semibold">
                          Compra el libro original
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-text-secondary">
                          Apoya al autor y profundiza en todo el contenido del
                          libro completo.
                        </p>
                        <Link
                          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-button border border-white/10 bg-white/[0.04] px-4 text-sm transition hover:text-brand-purple"
                          href={book.purchaseUrl}
                          target="_blank"
                        >
                          Ver compra
                          <ExternalLink aria-hidden="true" size={15} />
                        </Link>
                      </div>
                    </div>
                  </Card>
                ) : null}
              </section>
            ) : null}
          </div>

          <aside className="space-y-5">
            <ChatPanel book={book} inputRef={chatInputRef} />

            <Card className="rounded-[16px] bg-white/[0.035] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Puntos clave del libro</h2>
                <button
                  className="text-sm text-brand-purple"
                  onClick={() => setActiveTab("keyPoints")}
                  type="button"
                >
                  Ver todos
                </button>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-text-secondary">
                {book.keyPoints.slice(0, 5).map((point) => (
                  <p className="flex items-center gap-3" key={point.number}>
                    <CheckCircle2
                      aria-hidden="true"
                      className="text-success"
                      size={17}
                    />
                    {point.title}
                  </p>
                ))}
              </div>
            </Card>

            <Card className="rounded-[16px] bg-white/[0.035] p-6">
              <h2 className="text-xl font-semibold">Frases para recordar</h2>
              <blockquote className="mt-4 text-sm leading-7 text-text-secondary">
                “No te elevas al nivel de tus metas. Caes al nivel de tus
                sistemas.”
              </blockquote>
              <p className="mt-3 text-sm text-text-secondary">— {book.author}</p>
            </Card>

            <Card className="rounded-[16px] bg-white/[0.035] p-6">
              <h2 className="text-xl font-semibold">Disclaimer</h2>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                {disclaimer}
              </p>
            </Card>
          </aside>
        </section>
      </section>

      <nav className="fixed bottom-4 left-1/2 z-40 w-[min(94vw,1120px)] -translate-x-1/2 rounded-[24px] border border-white/10 bg-[#080915]/92 px-4 py-3 shadow-ambient backdrop-blur-xl">
        <div className="grid grid-cols-5 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isCenter = item.label === "IA";

            if (isCenter) {
              return (
                <button
                  className="-mt-10 mx-auto flex h-[74px] w-[74px] flex-col items-center justify-center gap-1 rounded-full border border-brand-purple/70 bg-brand-purple/20 text-xs text-brand-purple shadow-[0_0_45px_rgba(124,58,237,0.55)] transition hover:bg-brand-purple/30"
                  key={item.label}
                  onClick={openBookChat}
                  type="button"
                >
                  <Icon aria-hidden="true" size={27} />
                  {item.label}
                </button>
              );
            }

            return (
              <Link
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-button px-2 py-2 text-xs text-text-secondary transition hover:text-white md:flex-row md:text-base",
                  item.active && "text-brand-purple",
                )}
                href={item.href}
                key={item.label}
              >
                <Icon aria-hidden="true" size={24} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
