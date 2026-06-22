"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  Lock,
  Loader2,
  MoreHorizontal,
  Play,
  Share2,
  Sparkles,
  Star,
} from "lucide-react";

import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { FloatingBookChat } from "@/components/chat/FloatingBookChat";
import { Card } from "@/components/ui/Card";
import type { PlanKey } from "@/config/plans";
import { canAccessFeature } from "@/lib/permissions";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { Book, BookActivity, KeyPoint } from "@/types";

type BookExperienceProps = {
  book: Book;
};

type TabKey = "summary" | "keyPoints" | "activities" | "audio" | "chat";

const disclaimer =
  "Contenido educativo y editorial propio. Ceoteca no está afiliada al autor ni a la editorial. Este análisis no reemplaza la obra original.";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "summary", label: "Resumen" },
  { key: "keyPoints", label: "Ideas clave" },
  { key: "activities", label: "Ejercicios" },
  { key: "audio", label: "Audio" },
  { key: "chat", label: "CEO" },
];

const keyPointIcons = ["◎", "★", "ϟ", "✓", "◇", "↗", "◌"] as const;

function getProgress(book: Book) {
  return book.progress ?? 0;
}

function getRemainingMinutes(book: Book) {
  return Math.max(Math.ceil(book.readingTime * (1 - getProgress(book) / 100)), 3);
}

function getSummary(book: Book) {
  const analysisText = book.analysis.map((section) => section.content).join(" ");

  return analysisText.trim().length > 0 ? analysisText : book.description;
}

function MiniCover({ book }: { book: Book }) {
  return (
    <div className="relative h-[300px] w-full max-w-[190px] overflow-hidden rounded-md border border-white/20 bg-gradient-to-br from-indigo-400 via-violet-600 to-fuchsia-600 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.26),transparent_26%),linear-gradient(160deg,rgba(0,0,0,0.05),rgba(0,0,0,0.42))]" />
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border border-white/25" />
      <div className="relative z-10 flex h-full flex-col justify-between text-white">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em]">
            Ceoteca
          </p>
          <h2 className="mt-7 text-balance text-3xl font-black uppercase leading-none">
            {book.title}
          </h2>
        </div>
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-white/35 bg-white/10">
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
    <div className="border-r border-white/10 px-3 text-center last:border-r-0">
      <Icon aria-hidden="true" className="mx-auto text-brand-purple" size={21} />
      <p className="mt-2 text-sm font-semibold">{value}</p>
      <p className="mt-1 text-xs text-text-secondary">{label}</p>
    </div>
  );
}

function LockedPremiumOverlay({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center rounded-[16px] bg-[#050612]/55 p-6 backdrop-blur-[3px]">
      <div className="max-w-xs rounded-[1.25rem] border border-brand-purple/40 bg-[#0b0c18]/90 p-5 text-center shadow-[0_0_42px_rgba(124,58,237,0.28)]">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-purple/20 text-brand-purple">
          <Lock aria-hidden="true" size={22} />
        </span>
        <h3 className="mt-4 font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
        <Link
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-button bg-brand-gradient px-4 text-sm font-medium text-white transition hover:brightness-110"
          href="/planes"
        >
          Mejorar plan
        </Link>
      </div>
    </div>
  );
}

function AudioPanel({ book, locked = false }: { book: Book; locked?: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  async function loadAudioUrl() {
    if (audioUrl) {
      return audioUrl;
    }

    const supabase = createBrowserSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      throw new Error("Inicia sesión para escuchar audio.");
    }

    const response = await fetch("/api/audio", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookSlug: book.slug }),
    });
    const payload = (await response.json()) as {
      data?: {
        audioUrl: string;
        durationSeconds: number | null;
      };
      error?: {
        message: string;
      };
    };

    if (!response.ok || payload.error || !payload.data?.audioUrl) {
      throw new Error(payload.error?.message ?? "No pudimos cargar el audio.");
    }

    setAudioUrl(payload.data.audioUrl);
    setDurationSeconds(payload.data.durationSeconds);

    return payload.data.audioUrl;
  }

  async function toggleAudio() {
    if (locked || isLoadingAudio) {
      return;
    }

    setAudioError(null);

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoadingAudio(true);

    try {
      await loadAudioUrl();
      window.setTimeout(() => {
        void audioRef.current?.play();
      }, 0);
      setIsPlaying(true);
    } catch (caughtError) {
      setAudioError(
        caughtError instanceof Error
          ? caughtError.message
          : "No pudimos reproducir el audio.",
      );
    } finally {
      setIsLoadingAudio(false);
    }
  }

  const durationLabel = durationSeconds
    ? `${Math.max(1, Math.ceil(durationSeconds / 60))} min`
    : `${book.readingTime} min`;

  return (
    <Card className="relative overflow-hidden rounded-[16px] bg-white/[0.035] p-6">
      {locked ? (
        <LockedPremiumOverlay
          description="El audio narrado está incluido desde Pro."
          title="Audio bloqueado"
        />
      ) : null}
      <div className={cn(locked && "select-none blur-sm")}>
        <h2 className="text-xl font-semibold">Escucha el análisis</h2>
        <div className="mt-6 flex items-center gap-5">
          <button
            aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-purple/70 text-white shadow-[0_0_38px_rgba(124,58,237,0.42)] transition hover:bg-brand-purple"
            disabled={isLoadingAudio}
            onClick={() => void toggleAudio()}
            type="button"
          >
            {isLoadingAudio ? (
              <Loader2 aria-hidden="true" className="animate-spin" size={25} />
            ) : isPlaying ? (
              <span className="h-6 w-6 rounded-sm bg-current" />
            ) : (
              <Play aria-hidden="true" fill="currentColor" size={25} />
            )}
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-1">
            {Array.from({ length: 30 }).map((_, index) => (
              <span
                className={cn(
                  "w-1 rounded-full bg-brand-purple transition-opacity",
                  !isPlaying && "opacity-45",
                )}
                key={index}
                style={{ height: 10 + ((index * 7) % 34) }}
              />
            ))}
          </div>
          <p className="text-sm text-text-secondary">{durationLabel}</p>
        </div>
        <p className="mt-6 text-sm text-text-secondary">
          Audio editorial narrado por IA. Se genera desde el análisis autorizado
          de Ceoteca y queda disponible para próximas reproducciones.
        </p>
        {audioError ? (
          <div className="mt-4 rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            {audioError}
          </div>
        ) : null}
        <button
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-button border border-white/10 bg-white/[0.04] px-4 text-sm text-text-secondary transition hover:text-white"
          type="button"
        >
          Cambiar voz
          <Headphones aria-hidden="true" size={17} />
        </button>
        {audioUrl ? (
          <audio
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            ref={audioRef}
            src={audioUrl}
          >
            <track kind="captions" />
          </audio>
        ) : null}
      </div>
    </Card>
  );
}

function KeyPointRow({ point, index }: { point: KeyPoint; index: number }) {
  return (
    <details className="group border-b border-white/10 px-4 py-4 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white/[0.06] text-xl text-brand-purple">
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
      <div className="mt-4 grid gap-3 text-sm leading-7 text-text-secondary md:ml-[112px]">
        <p>
          <span className="text-text-primary">Ejemplo:</span> {point.example}
        </p>
        <p>
          <span className="text-text-primary">Acción:</span> {point.action}
        </p>
        <p>
          <span className="text-text-primary">Limitación:</span> {point.limitation}
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
            Ejercicio práctico
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
          <p className="text-sm font-medium">Guía rápida</p>
          <ul className="mt-3 space-y-2 text-sm text-text-secondary">
            {(activity.options ?? ["Responder en 2 minutos", "Guardar reflexión", "Aplicar hoy"]).map(
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

function BookAiContextCard({ locked = false }: { locked?: boolean }) {
  return (
    <Card className="relative overflow-hidden rounded-[16px] bg-white/[0.035] p-6">
      {locked ? (
        <LockedPremiumOverlay
          description="CEO con contexto del libro está incluido desde Pro."
          title="CEO bloqueado"
        />
      ) : null}
      <div className={cn(locked && "select-none blur-sm")}>
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-brand-purple/40 bg-brand-purple/20 text-brand-purple">
            <Bot aria-hidden="true" size={24} />
          </span>
          <div>
            <h2 className="text-xl font-semibold">CEO contextual</h2>
            <p className="mt-2 text-sm leading-7 text-text-secondary">
              Usa el botón flotante para preguntar por aplicación práctica,
              ejercicios, límites de la idea y próximos pasos de este análisis.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function BookExperience({ book }: BookExperienceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("free");
  const progress = getProgress(book);
  const canUseAudio = canAccessFeature(currentPlan, "audio");
  const canUseChat = canAccessFeature(currentPlan, "chat");

  useEffect(() => {
    let isMounted = true;

    async function loadPlan() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (isMounted && data?.plan) {
          setCurrentPlan(data.plan);
        }
      } catch {
        if (isMounted) {
          setCurrentPlan("free");
        }
      }
    }

    void loadPlan();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#03040b] pb-16 pl-[var(--dashboard-sidebar-offset,84px)] text-text-primary transition-[padding] duration-300 ease-out">
      <DashboardSidebar active="home" />
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
              [MoreHorizontal, "Más opciones"],
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
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-brand-purple">
                Análisis Ceoteca
              </p>
              <h1 className="mt-3 text-balance text-4xl font-semibold md:text-5xl">
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
                <BookStat
                  icon={Headphones}
                  label={canUseAudio ? "Audio incluido" : "Audio bloqueado"}
                  value="Audio"
                />
                <BookStat
                  icon={Bot}
                  label={canUseChat ? "CEO incluido" : "CEO bloqueado"}
                  value="CEO"
                />
              </div>

              <div className="mt-7 max-w-xl">
                <div className="mb-2 flex items-center justify-between gap-4 text-sm">
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

          <AudioPanel book={book} locked={!canUseAudio} />
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-5">
            <div className="grid grid-cols-5 overflow-hidden rounded-[16px] border border-white/10 bg-white/[0.035]">
              {tabs.map((tab) => (
                <button
                  className={cn(
                    "min-h-16 border-b-2 border-transparent px-2 text-sm text-text-secondary transition hover:text-white",
                    activeTab === tab.key &&
                      "border-brand-purple text-text-primary shadow-[inset_0_-20px_35px_rgba(124,58,237,0.08)]",
                  )}
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
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
                    Resumen editorial
                  </h2>
                  <div className="mt-5 space-y-4 text-sm leading-8 text-text-secondary">
                    {getSummary(book)
                      .split(".")
                      .filter(Boolean)
                      .slice(0, 5)
                      .map((sentence) => (
                        <p key={sentence}>{sentence.trim()}.</p>
                      ))}
                  </div>

                  {book.analysis[0] ? (
                    <div className="mt-7 rounded-card border border-brand-purple/30 bg-brand-purple/5 p-5">
                      <p className="text-brand-purple">Principio fundamental</p>
                      <p className="mt-4 text-lg font-semibold">
                        {book.analysis[0].title}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-text-secondary">
                        {book.analysis[0].content}
                      </p>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {activeTab === "keyPoints" ? (
                <section>
                  <h2 className="text-xl font-semibold">
                    Las {book.keyPoints.length} ideas clave
                  </h2>
                  <div className="mt-5 overflow-hidden rounded-card border border-white/10 bg-white/[0.025]">
                    {book.keyPoints.map((point, index) => (
                      <KeyPointRow index={index} key={point.number} point={point} />
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

              {activeTab === "audio" ? (
                <AudioPanel book={book} locked={!canUseAudio} />
              ) : null}

              {activeTab === "chat" ? (
                <section>
                  <h2 className="text-xl font-semibold">CEO para este análisis</h2>
                  <p className="mt-3 text-sm leading-7 text-text-secondary">
                    Usa el botón flotante de CEO en la esquina inferior derecha.
                    En esta página, CEO recibe el contexto autorizado de este
                    análisis para responder dudas, sugerir ejercicios y ayudarte
                    a aplicar las ideas sin sustituir el libro original.
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
                          Apoya al autor y profundiza en la obra completa.
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
            <BookAiContextCard locked={!canUseChat} />

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
              <h2 className="text-xl font-semibold">Conclusión editorial</h2>
              <p className="mt-4 text-sm leading-7 text-text-secondary">
                {book.conclusion}
              </p>
            </Card>

            <Card className="rounded-[16px] bg-white/[0.035] p-6">
              <h2 className="text-xl font-semibold">Aviso editorial</h2>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                {disclaimer}
              </p>
            </Card>
          </aside>
        </section>
      </section>

      <FloatingBookChat book={book} plan={currentPlan} />
    </main>
  );
}
