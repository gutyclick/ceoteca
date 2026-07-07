"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Heart,
  Headphones,
  Lock,
  Loader2,
  Maximize2,
  MoreHorizontal,
  Moon,
  Pause,
  Play,
  Sparkles,
  X,
} from "lucide-react";

import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { FloatingBookChat } from "@/components/chat/FloatingBookChat";
import { Card } from "@/components/ui/Card";
import { planKeys, type PlanKey } from "@/config/plans";
import { canAccessFeature } from "@/lib/permissions";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { resolvePlanFromSubscriptions } from "@/lib/subscriptions/resolve";
import { cn } from "@/lib/utils/cn";
import type { Book, BookActivity, KeyPoint } from "@/types";

type BookExperienceProps = {
  book: Book;
};

type ReadingTheme = "light" | "sepia" | "dark";

const planStorageKey = "ceoteca-current-plan";

const disclaimer =
  "Contenido educativo y editorial propio. Ceoteca no está afiliada al autor ni a la editorial. Este análisis no reemplaza la obra original.";

const articleNav = [
  { href: "#ideas", label: "Ideas clave" },
  { href: "#ejercicios", label: "Ejercicios" },
  { href: "#resena", label: "Reseña" },
  { href: "#notas", label: "Notas" },
  { href: "#recursos", label: "Recursos" },
] as const;

const disciplinedPhases = [
  {
    label: "¿Quién es tu cliente?",
    range: "Pasos 1-5",
    color: "border-brand-purple/35 bg-brand-purple/10",
    steps: [
      "Segmentación de mercado",
      "Seleccionar un mercado de entrada",
      "Construir el perfil del usuario final",
      "Calcular el TAM del mercado de entrada",
      "Definir un Persona real",
    ],
  },
  {
    label: "¿Qué puedes hacer por él?",
    range: "Pasos 6-9",
    color: "border-brand-blue/35 bg-brand-blue/10",
    steps: [
      "Caso de uso de ciclo completo",
      "Especificación de alto nivel del producto",
      "Cuantificar la propuesta de valor",
      "Identificar los próximos 10 clientes",
    ],
  },
  {
    label: "¿Cómo adquieres clientes?",
    range: "Pasos 10-12",
    color: "border-cyan-300/30 bg-cyan-300/10",
    steps: [
      "Unidad de decisión",
      "Proceso para adquirir un cliente pagador",
      "Mapa del proceso de ventas",
    ],
  },
  {
    label: "¿Es rentable?",
    range: "Pasos 13-17",
    color: "border-amber-300/30 bg-amber-300/10",
    steps: [
      "Calcular el Lifetime Value",
      "Calcular el costo de adquisición",
      "Diseñar el modelo de negocio",
      "Establecer precios",
      "Calcular mercados de seguimiento",
    ],
  },
  {
    label: "¿Qué construyes?",
    range: "Pasos 18-20",
    color: "border-fuchsia-300/30 bg-fuchsia-300/10",
    steps: [
      "Definir tu ventaja central",
      "Graficar posición competitiva",
      "Definir el producto mínimo de negocio viable",
    ],
  },
  {
    label: "¿Funciona en el mundo real?",
    range: "Pasos 21-24",
    color: "border-emerald-300/30 bg-emerald-300/10",
    steps: [
      "Identificar suposiciones clave",
      "Probar suposiciones clave",
      "Demostrar aceptación del mercado",
      "Desarrollar el plan de producto",
    ],
  },
];

const implementationSteps = [
  {
    title: "Semana 1-2: claridad de mercado",
    text: "Dedica dos semanas a entender el segmento y hablar con clientes potenciales reales. No vendas todavía: escucha, compara patrones y define un Persona que puedas reconocer.",
  },
  {
    title: "Semana 3-4: valor cuantificado",
    text: "Convierte el problema en números: tiempo ahorrado, dinero recuperado, riesgo reducido o ingresos nuevos. Si no puedes cuantificarlo, la propuesta aún está borrosa.",
  },
  {
    title: "Mes 2: finanzas y producto",
    text: "Diseña la unidad económica, el proceso comercial y el producto mínimo por el que alguien estaría dispuesto a pagar. No solo un prototipo: una prueba de negocio.",
  },
  {
    title: "Mes 3+: validación en campo",
    text: "Prueba supuestos con comportamiento real: clientes pagando, usando, volviendo o recomendando. Cada ciclo debe mejorar tus respuestas anteriores.",
  },
];

function getBookDisplayTitle(book: Book) {
  if (book.slug === "disciplined-entrepreneurship") {
    return "Análisis de La disciplina de emprender";
  }

  return book.title;
}

function getCoverTitle(book: Book) {
  if (book.slug === "disciplined-entrepreneurship") {
    return "La disciplina de emprender";
  }

  return book.title;
}

function MiniCover({ book }: { book: Book }) {
  const coverTitle = getCoverTitle(book);
  const titleSize =
    coverTitle.length > 28
      ? "text-[clamp(1.45rem,8vw,2rem)]"
      : "text-[clamp(1.75rem,9vw,2.4rem)]";

  if (book.cover.imagePath) {
    return (
      <div className="relative aspect-[2/3] w-full max-w-[220px] overflow-hidden rounded-md border border-white/20 bg-[#11111e] shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <Image
          alt={`Portada editorial de ${coverTitle}`}
          className="object-cover"
          fill
          priority
          sizes="220px"
          src={book.cover.imagePath}
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-[2/3] w-full max-w-[220px] overflow-hidden rounded-md border border-white/20 bg-gradient-to-br from-indigo-400 via-violet-600 to-fuchsia-600 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.26),transparent_26%),linear-gradient(160deg,rgba(0,0,0,0.05),rgba(0,0,0,0.42))]" />
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border border-white/25" />
      <div className="absolute bottom-16 right-5 h-24 w-24 rounded-full border border-white/20 bg-white/5 blur-[1px]" />
      <div className="relative z-10 flex h-full flex-col justify-between text-white">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em]">
            Análisis Ceoteca
          </p>
          <h2 className={cn("mt-7 line-clamp-5 break-words font-black uppercase leading-none tracking-tight", titleSize)}>
            {coverTitle}
          </h2>
        </div>
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-white/35 bg-white/10 shadow-[0_0_45px_rgba(168,85,247,0.45)]">
          <Sparkles aria-hidden="true" size={38} />
        </div>
        <p className="text-center text-sm font-black uppercase tracking-[0.16em]">
          {book.author}
        </p>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Se conserva mientras se migran variantes editoriales anteriores.
function HeroMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-card border border-white/10 bg-white/[0.035] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
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

function formatAudioTime(seconds: number | null | undefined) {
  if (!seconds || !Number.isFinite(seconds)) {
    return "0:00";
  }

  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function AudioPanel({
  book,
  isPlanLoading = false,
  locked = false,
}: {
  book: Book;
  isPlanLoading?: boolean;
  locked?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [audioDurationSeconds, setAudioDurationSeconds] = useState<number | null>(null);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const loadAudioUrl = useCallback(async (metadataOnly = false) => {
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
      body: JSON.stringify({ bookSlug: book.slug, metadataOnly }),
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
    setAudioDurationSeconds(payload.data.durationSeconds);

    return payload.data.audioUrl;
  }, [audioUrl, book.slug]);

  async function toggleAudio() {
    if (locked || isPlanLoading || isLoadingAudio) {
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
        if (audioRef.current?.ended) {
          audioRef.current.currentTime = 0;
        }
        void audioRef.current?.play();
      }, 30);
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

  useEffect(() => {
    if (locked || isPlanLoading || audioUrl) {
      return;
    }

    let isMounted = true;

    async function preloadAudioMetadata() {
      try {
        await loadAudioUrl(true);
      } catch {
        if (isMounted) {
          setAudioError(null);
        }
      }
    }

    void preloadAudioMetadata();

    return () => {
      isMounted = false;
    };
  }, [audioUrl, isPlanLoading, loadAudioUrl, locked]);

  function handleSeek(nextTime: number) {
    setCurrentTimeSeconds(nextTime);

    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
  }

  const displayDurationSeconds = audioDurationSeconds ?? durationSeconds;
  const durationLabel = displayDurationSeconds
    ? `${Math.max(1, Math.ceil(displayDurationSeconds / 60))} min`
    : `${book.readingTime} min`;
  const totalTimeLabel = displayDurationSeconds
    ? formatAudioTime(displayDurationSeconds)
    : `~${book.readingTime}:00`;
  const progressPercent =
    displayDurationSeconds && displayDurationSeconds > 0
      ? Math.min(100, Math.max(0, (currentTimeSeconds / displayDurationSeconds) * 100))
      : 0;
  const playbackStatus = isPlaying ? "En reproducción" : currentTimeSeconds > 0 ? "Pausado" : "Listo";

  return (
    <Card className="relative overflow-hidden rounded-[20px] border-slate-950/[0.08] bg-white p-4 shadow-none">
      {locked ? (
        <LockedPremiumOverlay
          description="El audio narrado está incluido desde Pro."
          title="Audio bloqueado"
        />
      ) : null}
      <div
        className={cn(
          "grid gap-3 md:grid-cols-[auto_1fr] md:items-center",
          locked && "select-none blur-sm",
        )}
      >
        <button
          aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-violet-700 text-white shadow-[0_14px_30px_rgba(124,58,237,0.22)] transition hover:bg-violet-800"
          disabled={isLoadingAudio || isPlanLoading}
          onClick={() => void toggleAudio()}
          type="button"
        >
          {isLoadingAudio ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={22} />
          ) : isPlaying ? (
            <Pause aria-hidden="true" fill="currentColor" size={23} />
          ) : (
            <Play aria-hidden="true" fill="currentColor" size={23} />
          )}
        </button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-black text-slate-950">Escucha el análisis</h2>
            <span className="rounded-full border border-slate-950/[0.08] bg-slate-50 px-2 py-1 text-xs text-slate-500">
              {durationLabel}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs",
                isPlaying
                  ? "border-success/25 bg-success/10 text-success"
                  : "border-slate-950/[0.08] bg-slate-50 text-slate-500",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isPlaying ? "animate-pulse bg-success" : "bg-text-muted",
                )}
              />
              {playbackStatus}
            </span>
          </div>
          <div
            aria-hidden="true"
            className="mt-3 grid h-10 grid-cols-[repeat(48,minmax(2px,1fr))] items-center gap-1 overflow-hidden rounded-[14px] border border-slate-950/[0.08] bg-slate-50 px-3"
          >
            {Array.from({ length: 48 }).map((_, index) => {
              const barStart = (index / 48) * 100;
              const barEnd = ((index + 1) / 48) * 100;
              const fillPercent =
                progressPercent <= barStart
                  ? 0
                  : progressPercent >= barEnd
                    ? 100
                    : ((progressPercent - barStart) / (barEnd - barStart)) * 100;
              const height = 10 + ((index * 11) % 24);

              return (
                <span
                  className={cn(
                    "relative mx-auto w-full max-w-[5px] overflow-hidden rounded-full bg-slate-200 transition-transform duration-300",
                    isPlaying && fillPercent > 0 && "scale-y-110",
                  )}
                  key={index}
                  style={{ height }}
                >
                  <span
                    className="absolute inset-x-0 bottom-0 rounded-full bg-gradient-to-t from-brand-purple via-brand-blue to-brand-pink shadow-[0_0_14px_rgba(168,85,247,0.45)] transition-[height] duration-300"
                    style={{ height: `${fillPercent}%` }}
                  />
                </span>
              );
            })}
          </div>
          <div className="mt-3">
            <input
              aria-label="Progreso del audio"
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-100 accent-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!displayDurationSeconds || isLoadingAudio}
              max={displayDurationSeconds ?? 0}
              min={0}
              onChange={(event) => handleSeek(Number(event.currentTarget.value))}
              step={1}
              type="range"
              value={Math.min(currentTimeSeconds, displayDurationSeconds ?? currentTimeSeconds)}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{formatAudioTime(currentTimeSeconds)}</span>
              <span>{totalTimeLabel}</span>
            </div>
          </div>
          {audioError ? (
            <div className="mt-3 rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              {audioError}
            </div>
          ) : (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Audio editorial generado desde el análisis autorizado de Ceoteca.
            </p>
          )}
        </div>
        {audioUrl ? (
          <audio
            onEnded={(event) => {
              setIsPlaying(false);

              if (Number.isFinite(event.currentTarget.duration)) {
                setCurrentTimeSeconds(event.currentTarget.duration);
              }
            }}
            onLoadedMetadata={(event) => {
              if (Number.isFinite(event.currentTarget.duration)) {
                setAudioDurationSeconds(event.currentTarget.duration);
              }
            }}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onTimeUpdate={(event) => setCurrentTimeSeconds(event.currentTarget.currentTime)}
            preload="metadata"
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

function ArticleSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-36 py-10" id={id}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-purple">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-3xl font-semibold text-white md:text-4xl">
        {title}
      </h2>
      <div className="mt-6 space-y-5 text-base leading-8 text-text-secondary">
        {children}
      </div>
    </section>
  );
}

function Callout({
  title,
  children,
  tone = "purple",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "purple" | "blue" | "green" | "warning";
}) {
  const styles = {
    purple: "border-brand-purple/35 bg-brand-purple/10",
    blue: "border-brand-blue/35 bg-brand-blue/10",
    green: "border-emerald-300/30 bg-emerald-300/10",
    warning: "border-amber-300/30 bg-amber-300/10",
  };

  return (
    <div className={cn("rounded-[18px] border p-5", styles[tone])}>
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-2 text-sm leading-7 text-text-secondary">{children}</div>
    </div>
  );
}

function ReflectionBox({
  id,
  label,
  placeholder,
}: {
  id: string;
  label: string;
  placeholder: string;
}) {
  const storageKey = `ceoteca:reflection:${id}`;
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(window.localStorage.getItem(storageKey) ?? "");
  }, [storageKey]);

  function updateValue(nextValue: string) {
    setValue(nextValue);
    window.localStorage.setItem(storageKey, nextValue);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <span aria-hidden="true">✍️</span>
          {label}
        </p>
        <span className={cn("text-xs text-success opacity-0 transition", saved && "opacity-100")}>
          Guardado
        </span>
      </div>
      <textarea
        className="mt-4 min-h-28 w-full resize-y rounded-[16px] border border-white/10 bg-[#070812]/80 p-4 text-sm leading-7 text-white outline-none transition placeholder:text-text-muted focus:border-brand-purple/70 focus:ring-2 focus:ring-brand-purple/25"
        onChange={(event) => updateValue(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

function QuizBox() {
  const [selected, setSelected] = useState<string | null>(null);
  const correct = "C";
  const options = [
    ["A", "Tener una tecnología patentada"],
    ["B", "Conseguir inversores desde el día uno"],
    ["C", "Buscar mercados amplios con una ventaja basada en innovación"],
    ["D", "Contratar un equipo grande rápidamente"],
  ];

  return (
    <div className="rounded-[22px] border border-brand-purple/35 bg-brand-purple/10 p-5">
      <p className="text-sm font-semibold text-white">🎯 Test rápido</p>
      <h3 className="mt-2 text-xl font-semibold text-white">
        ¿Qué define mejor a un emprendimiento impulsado por innovación?
      </h3>
      <div className="mt-5 grid gap-3">
        {options.map(([key, label]) => {
          const isSelected = selected === key;
          const isCorrect = key === correct;

          return (
            <button
              className={cn(
                "rounded-[16px] border border-white/10 bg-white/[0.045] p-4 text-left text-sm text-text-secondary transition hover:border-brand-purple/50 hover:text-white",
                selected &&
                  isCorrect &&
                  "border-success/60 bg-success/10 text-white shadow-[0_0_28px_rgba(34,197,94,0.12)]",
                selected &&
                  isSelected &&
                  !isCorrect &&
                  "border-danger/60 bg-danger/10 text-white shadow-[0_0_28px_rgba(239,68,68,0.12)]",
              )}
              key={key}
              onClick={() => setSelected(key)}
              type="button"
            >
              <span className="font-semibold text-white">{key}.</span> {label}
            </button>
          );
        })}
      </div>
      {selected ? (
        <p
          className={cn(
            "mt-4 rounded-[14px] border p-4 text-sm leading-7",
            selected === correct
              ? "border-success/40 bg-success/10 text-white"
              : "border-danger/40 bg-danger/10 text-white",
          )}
        >
          {selected === correct
            ? "Correcto. El foco no es solo inventar, sino construir una ventaja que pueda escalar en un mercado amplio."
            : "Casi. La respuesta más completa es la C: mercado amplio, ventaja innovadora y potencial de escala."}
        </p>
      ) : null}
    </div>
  );
}

function AccordionPanel({
  title,
  eyebrow,
  children,
  defaultOpen = false,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="group rounded-[18px] border border-white/10 bg-white/[0.035] p-5 transition hover:border-brand-purple/35"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span>
          {eyebrow ? (
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-brand-purple">
              {eyebrow}
            </span>
          ) : null}
          <span className="mt-1 block text-lg font-semibold text-white">{title}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="shrink-0 text-text-secondary transition group-open:rotate-180 group-hover:text-white"
          size={20}
        />
      </summary>
      <div className="mt-4 border-t border-white/10 pt-4 text-sm leading-7 text-text-secondary">
        {children}
      </div>
    </details>
  );
}

function CanvasField({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-white">{label}</span>
      <textarea
        className="min-h-20 resize-y rounded-[16px] border border-white/10 bg-[#070812]/80 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-text-muted focus:border-brand-purple/70 focus:ring-2 focus:ring-brand-purple/25"
        placeholder={placeholder}
      />
    </label>
  );
}

function KeyPointArticleCard({ point }: { point: KeyPoint }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.035] p-5">
      <div className="flex items-start gap-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-purple/20 text-sm font-semibold text-brand-purple">
          {point.number}
        </span>
        <div>
          <h3 className="text-lg font-semibold text-white">{point.title}</h3>
          <p className="mt-2 text-sm leading-7 text-text-secondary">
            {point.explanation}
          </p>
          <div className="mt-4 grid gap-3 text-sm leading-7 text-text-secondary">
            <p>
              <span className="text-white">Ejemplo:</span> {point.example}
            </p>
            <p>
              <span className="text-white">Acción:</span> {point.action}
            </p>
            <p>
              <span className="text-white">Limitación:</span> {point.limitation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityArticleCard({ activity }: { activity: BookActivity }) {
  const reflectionId = activity.title.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.035] p-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-brand-purple/40 bg-brand-purple/20 text-brand-purple">
          <BookOpen aria-hidden="true" size={30} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold text-white">{activity.title}</h3>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            {activity.prompt}
          </p>
          {activity.options ? (
            <ul className="mt-4 grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
              {activity.options.map((option) => (
                <li className="flex gap-2" key={option}>
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-success"
                    size={16}
                  />
                  {option}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-5">
            <ReflectionBox
              id={`activity:${reflectionId}`}
              label="Tus respuestas"
              placeholder="Escribe aquí tu reflexión, decisiones o próximos pasos..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Se conserva mientras se migran variantes editoriales anteriores.
function DisciplinedArticle({ book }: { book: Book }) {
  return (
    <>
      <ArticleSection
        eyebrow="Punto de partida"
        id="intro"
        title="¿Por qué este libro importa?"
      >
        <p>{book.analysis[0]?.content}</p>
        <Callout title="Tesis del análisis" tone="purple">
          El emprendimiento no se trata solo de tener una idea brillante. El
          valor aparece cuando esa idea se convierte en un proceso disciplinado:
          cliente correcto, problema claro, valor medible y validación real.
        </Callout>
        <Callout title="Fórmula central" tone="blue">
          <p className="text-center text-2xl font-semibold text-white">
            Innovación = Invención × Comercialización
          </p>
          <p className="mt-2 text-center">
            Si cualquiera de los dos factores es cero, el resultado práctico
            también se acerca a cero.
          </p>
        </Callout>
        <p>{book.analysis[1]?.content}</p>
        <ReflectionBox
          id={`${book.slug}:formula`}
          label="Tu reflexión"
          placeholder="¿Qué te parece la fórmula Innovación = Invención × Comercialización? ¿Tu idea necesita más invención, mejor comercialización o ambas?"
        />
      </ArticleSection>

      <ArticleSection
        eyebrow="Mapa conceptual"
        id="tipos"
        title="No todo emprendimiento es igual"
      >
        <p>{book.analysis[2]?.content}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[18px] border border-emerald-300/25 bg-emerald-300/10 p-5">
            <h3 className="text-lg font-semibold text-white">
              SME: pequeña empresa
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Mercado local o regional.</li>
              <li>Crecimiento más lineal.</li>
              <li>Menos dependencia de capital externo.</li>
              <li>Independencia y control como meta frecuente.</li>
            </ul>
          </div>
          <div className="rounded-[18px] border border-brand-purple/35 bg-brand-purple/10 p-5">
            <h3 className="text-lg font-semibold text-white">
              IDE: empresa impulsada por innovación
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Mercado amplio desde etapas tempranas.</li>
              <li>Crecimiento con potencial exponencial.</li>
              <li>Equipo diverso y búsqueda de escala.</li>
              <li>Ventaja competitiva difícil de copiar.</li>
            </ul>
          </div>
        </div>
        <div className="overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.035]">
          <div className="grid grid-cols-3 border-b border-white/10 bg-white/[0.04] text-sm font-semibold text-white">
            <div className="p-4">Dimensión</div>
            <div className="p-4">SME</div>
            <div className="p-4">IDE</div>
          </div>
          {[
            ["Curva de ingresos", "Responde más rápido a la inversión", "Puede perder dinero antes de escalar"],
            ["Financiamiento", "Propio, deuda o flujo del negocio", "Capital externo o inversión de riesgo"],
            ["Control", "Alta prioridad para el fundador", "Se comparte control para crecer"],
            ["Empleos", "Más locales y operativos", "Más exportables y escalables"],
            ["Ejemplos", "Restaurante, consultora local", "Google, Airbnb, Slack"],
          ].map(([dimension, sme, ide]) => (
            <div
              className="grid grid-cols-3 border-b border-white/10 text-sm last:border-b-0"
              key={dimension}
            >
              <div className="p-4 font-medium text-white">{dimension}</div>
              <div className="p-4 text-text-secondary">{sme}</div>
              <div className="p-4 text-text-secondary">{ide}</div>
            </div>
          ))}
        </div>
        <Callout title="Pregunta útil" tone="warning">
          ¿Estás construyendo para independencia, para escala o para una mezcla
          que todavía no has definido? La respuesta cambia producto, equipo,
          ventas y financiamiento.
        </Callout>
        <QuizBox />
      </ArticleSection>

      <ArticleSection
        eyebrow="El sistema"
        id="sistema"
        title="Los 24 pasos agrupados por fase"
      >
        <p>{book.analysis[3]?.content}</p>
        <div className="grid gap-4">
          {disciplinedPhases.map((phase, phaseIndex) => (
            <AccordionPanel
              defaultOpen={phaseIndex === 0}
              eyebrow={phase.range}
              key={phase.label}
              title={phase.label}
            >
              <ol className={cn("space-y-2 rounded-[14px] border p-4", phase.color)}>
                {phase.steps.map((step, stepIndex) => (
                  <li className="flex gap-3" key={step}>
                    <span className="text-brand-purple">
                      {String(phaseIndex * 4 + stepIndex + 1).padStart(2, "0")}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </AccordionPanel>
          ))}
        </div>
        <ReflectionBox
          id={`${book.slug}:steps`}
          label="Tu reflexión sobre los 24 pasos"
          placeholder="¿En qué paso está tu idea ahora mismo? ¿Qué paso se siente más difícil de responder con evidencia real?"
        />
      </ArticleSection>

      <ArticleSection
        eyebrow="Análisis Ceoteca"
        id="claves"
        title="Los conceptos que más importan"
      >
        <p>
          Estos son los puntos que convierten el libro en una herramienta de
          trabajo. No son ideas para memorizar: son decisiones que debes probar
          con clientes, datos y aprendizaje real.
        </p>
        <div className="grid gap-4">
          {book.keyPoints.map((point) => (
            <KeyPointArticleCard key={point.number} point={point} />
          ))}
        </div>
        <ActivityArticleCard activity={book.activities[0]} />
      </ArticleSection>

      <ArticleSection
        eyebrow="Framework de aplicación"
        id="framework"
        title="Cómo aplicar este libro"
      >
        <p>{book.analysis[4]?.content}</p>
        <div className="grid gap-4">
          {implementationSteps.map((step) => (
            <AccordionPanel key={step.title} title={step.title}>
              <p>{step.text}</p>
            </AccordionPanel>
          ))}
        </div>
        <ReflectionBox
          id={`${book.slug}:framework`}
          label="¿Qué parte del framework te genera más dudas?"
          placeholder="Escribe preguntas, barreras o decisiones que todavía no tienes claras para aplicar este sistema."
        />
      </ArticleSection>

      <ArticleSection
        eyebrow="Herramienta práctica"
        id="plantilla"
        title="Canvas de Startup Disciplinado"
      >
        <p>
          Completa esta plantilla para convertir el análisis en un documento de
          claridad. La meta no es llenar casillas por cumplir: es descubrir qué
          parte de tu negocio todavía depende de suposiciones.
        </p>
        <div className="grid gap-4 rounded-[22px] border border-white/10 bg-white/[0.035] p-5">
          <CanvasField
            label="Nombre del proyecto"
            placeholder="¿Cómo se llama tu startup o idea?"
          />
          <CanvasField
            label="Beachhead market"
            placeholder="Ejemplo: gerentes de logística de pymes manufactureras en Panamá con 50-200 empleados."
          />
          <CanvasField
            label="Mi Persona"
            placeholder="Nombre real, cargo, empresa, mayor preocupación laboral y forma actual de resolver el problema."
          />
          <CanvasField
            label="Propuesta de valor cuantificada"
            placeholder="Ejemplo: ahorra 8 horas por semana, reduce errores 30% o recupera $400 mensuales por usuario."
          />
          <CanvasField
            label="Supuesto más riesgoso"
            placeholder="¿Qué tendría que ser falso para que la idea pierda sentido?"
          />
        </div>
        <div className="grid gap-4">
          {book.activities.map((activity) => (
            <ActivityArticleCard activity={activity} key={activity.title} />
          ))}
        </div>
        <Callout title="Compromiso de acción" tone="green">
          Elige una acción concreta para las próximas 48 horas: una entrevista,
          una estimación de valor, una prueba de precio o la validación del
          supuesto más riesgoso.
        </Callout>
        <ReflectionBox
          id={`${book.slug}:commitment`}
          label="Compromiso de acción"
          placeholder="El próximo paso concreto que tomaré en las próximas 48 horas es..."
        />
      </ArticleSection>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Se conserva mientras se migran variantes editoriales anteriores.
function GenericArticle({ book }: { book: Book }) {
  return (
    <>
      <ArticleSection eyebrow="① Punto de partida" id="intro" title="Idea central">
        {book.analysis.map((section) => (
          <div key={section.title}>
            <h3 className="text-lg font-semibold text-white">{section.title}</h3>
            <p className="mt-2">{section.content}</p>
          </div>
        ))}
      </ArticleSection>
      <ArticleSection eyebrow="② Ideas clave" id="claves" title="Qué debes recordar">
        <div className="grid gap-4">
          {book.keyPoints.map((point) => (
            <KeyPointArticleCard key={point.number} point={point} />
          ))}
        </div>
      </ArticleSection>
      <ArticleSection eyebrow="③ Ejercicios" id="plantilla" title="Convierte ideas en acción">
        <div className="grid gap-4">
          {book.activities.map((activity) => (
            <ActivityArticleCard activity={activity} key={activity.title} />
          ))}
        </div>
      </ArticleSection>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Se conserva mientras se migra el panel lateral antiguo.
function Sidebar({
  book,
  canUseChat,
}: {
  book: Book;
  canUseChat: boolean;
}) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
      <Card className="rounded-[16px] bg-white/[0.035] p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-brand-purple/40 bg-brand-purple/20 text-brand-purple">
            <Bot aria-hidden="true" size={24} />
          </span>
          <div>
            <h2 className="text-xl font-semibold">CEO contextual</h2>
            <p className="mt-2 text-sm leading-7 text-text-secondary">
              Usa el botón flotante para preguntar por aplicación práctica,
              ejercicios y próximos pasos de este análisis.
            </p>
            {!canUseChat ? (
              <Link
                className="mt-4 inline-flex rounded-button bg-brand-gradient px-4 py-2 text-sm font-medium text-white"
                href="/planes"
              >
                Mejorar plan
              </Link>
            ) : null}
          </div>
        </div>
      </Card>
      <Card className="rounded-[16px] bg-white/[0.035] p-6">
        <h2 className="text-xl font-semibold">Puntos clave</h2>
        <div className="mt-5 grid gap-3 text-sm text-text-secondary">
          {book.keyPoints.slice(0, 6).map((point) => (
            <a className="flex items-center gap-3 transition hover:text-white" href="#claves" key={point.number}>
              <CheckCircle2 aria-hidden="true" className="text-success" size={17} />
              {point.title}
            </a>
          ))}
        </div>
      </Card>
      <Card className="scroll-mt-36 rounded-[16px] bg-white/[0.035] p-6" id="aviso-editorial">
        <h2 className="text-xl font-semibold">Aviso editorial</h2>
        <p className="mt-3 text-sm leading-7 text-text-secondary">{disclaimer}</p>
      </Card>
      {book.purchaseUrl ? (
        <Card className="rounded-[16px] bg-white/[0.035] p-6">
          <h2 className="text-xl font-semibold">Libro original</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Profundiza en la obra completa y apoya al autor mediante canales
            legales.
          </p>
          <Link
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-button border border-white/10 bg-white/[0.04] px-4 text-sm transition hover:text-brand-purple"
            href={book.purchaseUrl}
            target="_blank"
          >
            Comprar original
            <ExternalLink aria-hidden="true" size={15} />
          </Link>
        </Card>
      ) : null}
    </aside>
  );
}

function getCachedPlan(): PlanKey | null {
  if (typeof window === "undefined") {
    return null;
  }

  const cachedPlan = window.localStorage.getItem(planStorageKey);

  return planKeys.includes(cachedPlan as PlanKey) ? (cachedPlan as PlanKey) : null;
}

function LightKeyPointCard({
  point,
  defaultOpen = false,
  readingTheme = "light",
}: {
  point: KeyPoint;
  defaultOpen?: boolean;
  readingTheme?: ReadingTheme;
}) {
  const isDark = readingTheme === "dark";
  const isSepia = readingTheme === "sepia";

  return (
    <details
      className={cn(
        "group rounded-[18px] border p-4",
        isDark
          ? "border-white/10 bg-[#171717] text-stone-100"
          : isSepia
            ? "border-amber-950/10 bg-[#fff8e8] text-stone-900"
            : "border-slate-950/[0.08] bg-white text-slate-950",
      )}
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-violet-100 text-base font-black text-violet-700">
            {point.number}
          </span>
          <div className="min-w-0">
            <h3 className={cn("font-black leading-6", isDark ? "text-white" : "text-slate-950")}>
              {point.title}
            </h3>
            <p className={cn("mt-1 text-sm leading-6", isDark ? "text-stone-300" : isSepia ? "text-stone-700" : "text-slate-500")}>
              {point.explanation}
            </p>
          </div>
        </div>
        <ChevronDown
          aria-hidden="true"
          className="mt-2 shrink-0 text-slate-400 transition group-open:rotate-180"
          size={18}
        />
      </summary>
      <div
        className={cn(
          "mt-4 grid gap-3 border-t pt-4 text-sm leading-7",
          isDark
            ? "border-white/10 text-stone-300"
            : isSepia
              ? "border-amber-950/10 text-stone-700"
              : "border-slate-950/[0.06] text-slate-600",
        )}
      >
        <p className={cn("rounded-[14px] p-3", isDark ? "bg-white/[0.04]" : isSepia ? "bg-[#fffaf0]" : "bg-slate-50")}>
          <span className={cn("block font-black", isDark ? "text-white" : "text-slate-950")}>Ejemplo</span>
          {point.example}
        </p>
        <p className={cn("rounded-[14px] p-3", isDark ? "bg-violet-500/10" : isSepia ? "bg-violet-500/10" : "bg-violet-50")}>
          <span className="block font-black text-violet-700">Acción</span>
          {point.action}
        </p>
        <p className={cn("rounded-[14px] p-3", isDark ? "bg-white/[0.04]" : isSepia ? "bg-[#fffaf0]" : "bg-slate-50")}>
          <span className={cn("block font-black", isDark ? "text-white" : "text-slate-950")}>Cuidado</span>
          {point.limitation}
        </p>
      </div>
    </details>
  );
}
function LightActivityCard({
  activity,
  bookSlug,
  readingTheme = "light",
}: {
  activity: BookActivity;
  bookSlug: string;
  readingTheme?: ReadingTheme;
}) {
  const reflectionId = `${bookSlug}:${activity.title.toLowerCase().replace(/\s+/g, "-")}`;
  const [value, setValue] = useState("");
  const isDark = readingTheme === "dark";
  const isSepia = readingTheme === "sepia";

  useEffect(() => {
    setValue(window.localStorage.getItem(`ceoteca:activity:${reflectionId}`) ?? "");
  }, [reflectionId]);

  function updateValue(nextValue: string) {
    setValue(nextValue);
    window.localStorage.setItem(`ceoteca:activity:${reflectionId}`, nextValue);
  }

  return (
    <article
      className={cn(
        "rounded-[20px] border p-5",
        isDark
          ? "border-white/10 bg-[#171717]"
          : isSepia
            ? "border-amber-950/10 bg-[#fff8e8]"
            : "border-slate-950/[0.08] bg-white",
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-violet-100 text-violet-700">
          <BookOpen aria-hidden="true" size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className={cn("text-lg font-black", isDark ? "text-white" : "text-slate-950")}>{activity.title}</h3>
          <p className={cn("mt-2 text-sm leading-7", isDark ? "text-stone-300" : "text-slate-600")}>{activity.prompt}</p>
          {activity.options ? (
            <ul className={cn("mt-4 grid gap-2 text-sm sm:grid-cols-2", isDark ? "text-stone-300" : "text-slate-600")}>
              {activity.options.map((option) => (
                <li className="flex gap-2" key={option}>
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-emerald-500"
                    size={16}
                  />
                  {option}
                </li>
              ))}
            </ul>
          ) : null}
          <textarea
            className={cn(
              "mt-5 min-h-28 w-full resize-y rounded-[16px] border p-4 text-sm leading-7 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100",
              isDark
                ? "border-white/10 bg-white/[0.04] text-stone-100"
                : isSepia
                  ? "border-amber-950/10 bg-[#fffaf0] text-stone-900"
                  : "border-slate-950/[0.08] bg-slate-50 text-slate-900",
            )}
            onChange={(event) => updateValue(event.target.value)}
            placeholder="Escribe tu reflexión, decisión o próximo paso..."
            value={value}
          />
        </div>
      </div>
    </article>
  );
}

function LightNoteBox({
  bookSlug,
  readingTheme = "light",
}: {
  bookSlug: string;
  readingTheme?: ReadingTheme;
}) {
  const storageKey = `ceoteca:notes:${bookSlug}`;
  const [value, setValue] = useState("");
  const isDark = readingTheme === "dark";
  const isSepia = readingTheme === "sepia";

  useEffect(() => {
    setValue(window.localStorage.getItem(storageKey) ?? "");
  }, [storageKey]);

  function updateValue(nextValue: string) {
    setValue(nextValue);
    window.localStorage.setItem(storageKey, nextValue);
  }

  return (
    <textarea
      className={cn(
        "min-h-52 w-full resize-y rounded-[20px] border p-5 text-sm leading-7 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100",
        isDark
          ? "border-white/10 bg-white/[0.04] text-stone-100"
          : isSepia
            ? "border-amber-950/10 bg-[#fff8e8] text-stone-900"
            : "border-slate-950/[0.08] bg-white text-slate-900",
      )}
      onChange={(event) => updateValue(event.target.value)}
      placeholder="Guarda aquí tus notas personales sobre este análisis..."
      value={value}
    />
  );
}
export function BookExperience({ book }: BookExperienceProps) {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<PlanKey | null>(() => getCachedPlan());
  const [isPlanLoading, setIsPlanLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<string>(articleNav[0].href);
  const [isAudioDockOpen, setIsAudioDockOpen] = useState(false);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>("light");
  const persistedProgressRef = useRef(0);
  const canUseAudio = currentPlan ? canAccessFeature(currentPlan, "audio") : false;

  useEffect(() => {
    let isMounted = true;

    async function loadPlan() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          if (isMounted) {
            setCurrentPlan("free");
            setUserId(null);
          }
          return;
        }

        if (isMounted) {
          setUserId(userData.user.id);
        }

        const [profileResponse, subscriptionResponse] = await Promise.all([
          supabase
            .from("profiles")
            .select("plan")
            .eq("id", userData.user.id)
            .maybeSingle(),
          supabase
            .from("subscriptions")
            .select("plan,status,updated_at")
            .eq("user_id", userData.user.id)
            .order("updated_at", { ascending: false }),
        ]);

        if (isMounted && profileResponse.data?.plan) {
          const effectivePlan = resolvePlanFromSubscriptions({
            profilePlan: profileResponse.data.plan,
            subscriptions: subscriptionResponse.data ?? [],
          }).plan;
          setCurrentPlan(effectivePlan);
          window.localStorage.setItem(planStorageKey, effectivePlan);
        }
      } catch {
        if (isMounted) {
          setCurrentPlan((current) => current ?? "free");
        }
      } finally {
        if (isMounted) {
          setIsPlanLoading(false);
        }
      }
    }

    void loadPlan();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isMounted = true;
    const currentUserId = userId;

    async function loadSavedProgress() {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("user_book_progress")
        .select("progress")
        .eq("user_id", currentUserId)
        .eq("book_id", book.id)
        .maybeSingle();

      if (error || !isMounted) {
        return;
      }

      const savedProgress = data?.progress ?? 0;
      persistedProgressRef.current = savedProgress;
      setReadingProgress((current) => Math.max(current, savedProgress));
    }

    void loadSavedProgress();

    return () => {
      isMounted = false;
    };
  }, [book.id, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const nextProgress = Math.max(readingProgress, persistedProgressRef.current);
    const shouldPersist =
      nextProgress >= 98 ||
      persistedProgressRef.current === 0 ||
      nextProgress - persistedProgressRef.current >= 5;

    if (!shouldPersist) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      const isCompleted = nextProgress >= 98;
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.from("user_book_progress").upsert(
        {
          user_id: userId,
          book_id: book.id,
          progress: isCompleted ? 100 : nextProgress,
          completed: isCompleted,
          last_section_id: activeSection.replace("#", ""),
          completed_at: isCompleted ? new Date().toISOString() : null,
        },
        { onConflict: "user_id,book_id" },
      );

      if (!error) {
        persistedProgressRef.current = isCompleted ? 100 : nextProgress;
      }
    }, 750);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeSection, book.id, readingProgress, userId]);

  useEffect(() => {
    let isMounted = true;

    async function loadFavorite() {
      setIsFavoriteLoading(true);

      try {
        const supabase = createBrowserSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          if (isMounted) {
            setIsFavorite(false);
          }

          return;
        }

        const { data, error } = await supabase
          .from("user_book_favorites")
          .select("id")
          .eq("user_id", userData.user.id)
          .eq("book_id", book.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (isMounted) {
          setIsFavorite(Boolean(data));
        }
      } catch {
        if (isMounted) {
          setIsFavorite(false);
        }
      } finally {
        if (isMounted) {
          setIsFavoriteLoading(false);
        }
      }
    }

    void loadFavorite();

    return () => {
      isMounted = false;
    };
  }, [book.id]);

  useEffect(() => {
    function updateReadingProgress() {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress =
        maxScroll > 0 ? Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)) : 0;
      const currentSection =
        [...articleNav]
          .reverse()
          .find((item) => {
            const section = document.getElementById(item.href.slice(1));

            return section ? section.offsetTop - 170 <= scrollTop : false;
          })?.href ?? articleNav[0].href;

      setReadingProgress(Math.round(nextProgress));
      setActiveSection(currentSection);
    }

    updateReadingProgress();
    window.addEventListener("scroll", updateReadingProgress, { passive: true });
    window.addEventListener("resize", updateReadingProgress);

    return () => {
      window.removeEventListener("scroll", updateReadingProgress);
      window.removeEventListener("resize", updateReadingProgress);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsReadingMode(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function enterReadingMode() {
    setIsAudioDockOpen(false);
    setIsReadingMode(true);
  }

  async function toggleFavorite() {
    if (isFavoriteLoading) {
      return;
    }

    setIsFavoriteLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.push("/login");
        return;
      }

      if (isFavorite) {
        const { error } = await supabase
          .from("user_book_favorites")
          .delete()
          .eq("user_id", userData.user.id)
          .eq("book_id", book.id);

        if (error) {
          throw error;
        }

        setIsFavorite(false);
      } else {
        const { error } = await supabase.from("user_book_favorites").upsert(
          {
            user_id: userData.user.id,
            book_id: book.id,
          },
          { onConflict: "user_id,book_id" },
        );

        if (error) {
          throw error;
        }

        setIsFavorite(true);
      }
    } finally {
      setIsFavoriteLoading(false);
    }
  }

  const isReaderDark = isReadingMode && readingTheme === "dark";
  const isReaderSepia = isReadingMode && readingTheme === "sepia";
  const readerSurfaceClass = isReaderDark
    ? "border-white/10 bg-[#171717] text-stone-100 shadow-none"
    : isReaderSepia
      ? "border-amber-950/10 bg-[#fff8e8] text-stone-900 shadow-none"
      : "border-slate-950/[0.08] bg-white text-slate-950 shadow-none";
  const readerMutedTextClass = isReaderDark ? "text-stone-300" : "text-slate-600";
  const readerHeadingClass = isReaderDark ? "text-white" : "text-slate-950";
  const readerSectionClass = cn(
    "scroll-mt-32 rounded-[24px] border p-5 md:p-7",
    isReadingMode
      ? readerSurfaceClass
      : "border-slate-950/[0.08] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.04)]",
  );
  const readingThemeOptions: Array<{
    key: ReadingTheme;
    label: string;
  }> = [
    { key: "light", label: "Claro" },
    { key: "sepia", label: "Sepia" },
    { key: "dark", label: "Oscuro" },
  ];

  return (
    <main
      className={cn(
        "min-h-screen overflow-x-clip bg-[#fbfaf8] pb-24 text-slate-950 transition-[padding] duration-300 ease-out sm:pl-[var(--dashboard-sidebar-offset,84px)]",
        isReadingMode && "sm:pl-0",
        isReaderDark && "bg-[#111111] text-stone-100",
        isReaderSepia && "bg-[#f7ecd8] text-stone-900",
        isReadingMode && readingTheme === "light" && "bg-[#fbfaf6]",
        isAudioDockOpen && "pb-52",
      )}
    >
      {!isReadingMode ? (
        <DashboardSidebar active="library" showProfile={false} tone="light" />
      ) : null}
      <div
        className={cn(
          "fixed left-0 right-0 top-0 z-50 h-1 bg-slate-950/[0.06] sm:left-[var(--dashboard-sidebar-offset,84px)]",
          isReadingMode && "sm:left-0",
        )}
      >
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-violet-700 via-indigo-500 to-fuchsia-500 transition-[width] duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {isReadingMode ? (
        <div
          className={cn(
            "fixed left-1/2 top-4 z-50 flex w-[calc(100vw-2rem)] max-w-[760px] -translate-x-1/2 flex-wrap items-center justify-between gap-3 rounded-[20px] border p-2",
            isReaderDark
              ? "border-white/10 bg-[#171717]/95 text-stone-100"
              : isReaderSepia
                ? "border-amber-950/10 bg-[#fff8e8]/95 text-stone-900"
                : "border-slate-950/[0.08] bg-white/95 text-slate-950",
          )}
        >
          <div
            className={cn(
              "flex h-10 items-center gap-2 rounded-[14px] border px-3",
              isReaderDark
                ? "border-white/10 bg-white/[0.04]"
                : "border-slate-950/[0.08] bg-slate-50",
            )}
          >
            <Moon
              aria-hidden="true"
              className={isReaderDark ? "text-violet-300" : "text-violet-700"}
              size={16}
            />
            <label className="sr-only" htmlFor="reading-theme">
              Tema de lectura
            </label>
            <select
              className={cn(
                "h-8 bg-transparent pr-7 text-sm font-black outline-none",
                isReaderDark ? "text-stone-100" : "text-slate-800",
              )}
              id="reading-theme"
              onChange={(event) => setReadingTheme(event.target.value as ReadingTheme)}
              value={readingTheme}
            >
              {readingThemeOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-[14px] px-3 text-sm font-black transition",
              isReaderDark
                ? "text-stone-300 hover:bg-white/10 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            )}
            onClick={() => setIsReadingMode(false)}
            type="button"
          >
            <X aria-hidden="true" size={17} />
            Salir
          </button>
        </div>
      ) : null}

      <section
        className={cn(
          "mx-auto grid w-full gap-6 px-4 py-6 md:px-8 xl:px-10",
          isReadingMode
            ? "max-w-[1440px] grid-cols-1 pb-16 pt-24 md:px-10 xl:px-12"
            : "max-w-[1560px] lg:grid-cols-[minmax(0,1fr)_460px]",
        )}
      >
        <div className="min-w-0">
          <div
            className={cn(
              "mb-5 flex flex-wrap items-center justify-between gap-3",
              isReadingMode && "hidden",
            )}
          >
            <button
              className="inline-flex h-11 items-center gap-2 rounded-[14px] px-2 text-sm font-bold text-slate-600 transition hover:text-violet-700"
              onClick={() => router.push("/biblioteca")}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={18} />
              Volver a biblioteca
            </button>
            <div className="flex flex-wrap items-center gap-2 rounded-[18px] border border-slate-950/[0.08] bg-white p-1">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-[13px] px-3 text-sm font-black text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                onClick={enterReadingMode}
                type="button"
              >
                <Maximize2 aria-hidden="true" size={17} />
                <span className="hidden sm:inline">Lectura</span>
              </button>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-[13px] px-3 text-sm font-black text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
                onClick={() => setIsAudioDockOpen(true)}
                type="button"
              >
                <Headphones aria-hidden="true" size={18} />
                <span className="hidden sm:inline">Escuchar</span>
              </button>
              <button
                aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-[13px] px-3 text-sm font-black transition hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60",
                  isFavorite ? "bg-violet-50 text-violet-700" : "text-slate-700",
                )}
                disabled={isFavoriteLoading}
                onClick={() => void toggleFavorite()}
                type="button"
              >
                <Heart aria-hidden="true" fill={isFavorite ? "currentColor" : "none"} size={18} />
                <span className="hidden sm:inline">Favorito</span>
              </button>
              <button
                aria-label="Más opciones"
                className="grid h-10 w-10 place-items-center rounded-[13px] text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
                type="button"
              >
                <MoreHorizontal aria-hidden="true" size={19} />
              </button>
            </div>
          </div>

          <section
            className={cn(
              "grid gap-8 rounded-[28px] border p-5 md:p-7 lg:p-8",
              isReadingMode
                ? cn(
                    readerSurfaceClass,
                    "items-center md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)]",
                  )
                : "border-slate-950/[0.08] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)] md:grid-cols-[240px_1fr]",
            )}
          >
            <MiniCover book={book} />
            <div className="flex min-w-0 flex-col justify-center">
              <h1
                className={cn(
                  "text-balance text-4xl font-black tracking-[-0.05em]",
                  isReadingMode ? readerHeadingClass : "text-slate-950",
                  isReadingMode ? "max-w-[980px] leading-[0.98] md:text-5xl xl:text-6xl" : "md:text-5xl xl:text-6xl",
                )}
              >
                {getBookDisplayTitle(book)}
              </h1>
              <p className="mt-3 text-lg font-black text-violet-700">{book.author}</p>
              <p
                className={cn(
                  "mt-5 max-w-3xl text-base leading-8 md:text-lg",
                  isReadingMode ? readerMutedTextClass : "text-slate-600",
                )}
              >
                {book.description}
              </p>
              <div
                className={cn(
                  "mt-7 flex flex-wrap gap-3 text-sm font-bold",
                  isReaderDark ? "text-stone-300" : "text-slate-600",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full px-4",
                    isReaderDark ? "bg-white/[0.06]" : isReaderSepia ? "bg-amber-950/[0.04]" : "bg-slate-50",
                  )}
                >
                  <Sparkles aria-hidden="true" className="text-violet-600" size={17} />
                  {book.keyPoints.length} ideas clave
                </span>
                <span
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full px-4",
                    isReaderDark ? "bg-white/[0.06]" : isReaderSepia ? "bg-amber-950/[0.04]" : "bg-slate-50",
                  )}
                >
                  <CheckCircle2 aria-hidden="true" className="text-violet-600" size={17} />
                  {book.activities.length} ejercicios
                </span>
                <span
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full px-4",
                    isReaderDark ? "bg-white/[0.06]" : isReaderSepia ? "bg-amber-950/[0.04]" : "bg-slate-50",
                  )}
                >
                  <Clock3 aria-hidden="true" className="text-violet-600" size={17} />
                  {book.readingTime} min de lectura
                </span>
              </div>
              <div className="mt-7 max-w-2xl">
                <div
                  className={cn(
                    "mb-2 flex items-center justify-between text-sm font-bold",
                    isReadingMode ? readerMutedTextClass : "text-slate-500",
                  )}
                >
                  <span>Tu progreso</span>
                  <span className={isReadingMode ? readerHeadingClass : "text-slate-950"}>{readingProgress}%</span>
                </div>
                <div
                  className={cn(
                    "h-2 rounded-full",
                    isReaderDark ? "bg-white/10" : isReaderSepia ? "bg-amber-950/10" : "bg-slate-100",
                  )}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-700 to-indigo-500 transition-[width] duration-300"
                    style={{ width: `${readingProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          <div
            className={cn(
              "sticky z-30 mt-5 rounded-[22px] border p-2",
              isReadingMode ? "top-[86px]" : "top-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl",
              isReaderDark
                ? "border-white/10 bg-[#171717]/95"
                : isReaderSepia
                  ? "border-amber-950/10 bg-[#fff8e8]/95"
                  : "border-slate-950/[0.08] bg-white/95",
            )}
          >
            <nav className="flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {articleNav.map((item) => (
                <a
                  className={cn(
                    "shrink-0 rounded-[16px] px-4 py-3 text-sm font-black text-slate-500 transition hover:text-violet-700",
                    activeSection === item.href && "bg-violet-50 text-violet-700",
                    isReaderDark && "text-stone-400 hover:bg-white/10 hover:text-white",
                    isReaderDark && activeSection === item.href && "bg-violet-500/15 text-violet-300",
                    isReaderSepia && "text-stone-600 hover:bg-amber-950/[0.04] hover:text-violet-700",
                    isReaderSepia && activeSection === item.href && "bg-violet-500/10 text-violet-700",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <article className="mt-6 space-y-6">
            <section className={readerSectionClass} id="ideas">
              <h2 className={cn("text-2xl font-black tracking-[-0.03em]", isReadingMode ? readerHeadingClass : "text-slate-950")}>Ideas clave</h2>
              <div className="mt-5 grid gap-3">
                {book.keyPoints.map((point, index) => (
                  <LightKeyPointCard
                    defaultOpen={index === 0}
                    key={point.number}
                    point={point}
                    readingTheme={isReadingMode ? readingTheme : "light"}
                  />
                ))}
              </div>
            </section>
            <section className={readerSectionClass} id="ejercicios">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-600">Aplicación práctica</p>
              <h2 className={cn("mt-2 text-2xl font-black tracking-[-0.03em]", isReadingMode ? readerHeadingClass : "text-slate-950")}>Ejercicios para convertir ideas en acción</h2>
              <div className="mt-5 grid gap-4">
                {book.activities.map((activity) => (
                  <LightActivityCard
                    activity={activity}
                    bookSlug={book.slug}
                    key={activity.title}
                    readingTheme={isReadingMode ? readingTheme : "light"}
                  />
                ))}
              </div>
            </section>
            <section className={readerSectionClass} id="resena">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-600">Reseña editorial</p>
              <h2 className={cn("mt-2 text-2xl font-black tracking-[-0.03em]", isReadingMode ? readerHeadingClass : "text-slate-950")}>Qué propone este análisis</h2>
              <div className="mt-4 grid gap-4">
                {book.analysis.map((section) => (
                  <div
                    className={cn(
                      "rounded-[18px] p-4",
                      isReaderDark ? "bg-white/[0.04]" : isReaderSepia ? "bg-[#fffaf0]" : "bg-slate-50",
                    )}
                    key={section.title}
                  >
                    <h3 className={cn("font-black", isReadingMode ? readerHeadingClass : "text-slate-950")}>{section.title}</h3>
                    <p className={cn("mt-2 text-base leading-8", isReadingMode ? readerMutedTextClass : "text-slate-600")}>{section.content}</p>
                  </div>
                ))}
              </div>
              <div
                className={cn(
                  "mt-6 rounded-[20px] border p-5 text-sm leading-7",
                  isReaderDark
                    ? "border-violet-400/20 bg-violet-500/10 text-stone-200"
                    : isReaderSepia
                      ? "border-violet-500/15 bg-violet-500/10 text-stone-800"
                      : "border-violet-100 bg-violet-50 text-violet-950",
                )}
              >
                <strong className="block text-base text-violet-700">Idea para llevar</strong>
                {book.conclusion}
              </div>
            </section>
            <section className={readerSectionClass} id="notas">
              <h2 className={cn("text-2xl font-black tracking-[-0.03em]", isReadingMode ? readerHeadingClass : "text-slate-950")}>Tus notas</h2>
              <p className={cn("mt-2 text-sm leading-7", isReadingMode ? readerMutedTextClass : "text-slate-500")}>Guarda reflexiones, decisiones o preguntas que quieras revisar después.</p>
              <div className="mt-5">
                <LightNoteBox
                  bookSlug={book.slug}
                  readingTheme={isReadingMode ? readingTheme : "light"}
                />
              </div>
            </section>
            <section className={readerSectionClass} id="recursos">
              <h2 className={cn("text-2xl font-black tracking-[-0.03em]", isReadingMode ? readerHeadingClass : "text-slate-950")}>Recursos y contexto</h2>
              <p className={cn("mt-4 text-sm leading-7", isReadingMode ? readerMutedTextClass : "text-slate-500")}>{disclaimer}</p>
              {book.purchaseUrl ? (
                <Link
                  className={cn(
                    "mt-5 inline-flex h-11 items-center gap-2 rounded-[14px] border px-4 text-sm font-black transition hover:border-violet-200 hover:text-violet-700",
                    isReaderDark
                      ? "border-white/10 bg-white/[0.04] text-stone-200"
                      : isReaderSepia
                        ? "border-amber-950/10 bg-[#fffaf0] text-stone-800"
                        : "border-slate-950/[0.08] bg-white text-slate-700",
                  )}
                  href={book.purchaseUrl}
                  target="_blank"
                >
                  Comprar el libro original
                  <ExternalLink aria-hidden="true" size={15} />
                </Link>
              ) : null}
            </section>
          </article>
        </div>

        {currentPlan && !isReadingMode ? (
          <aside className="hidden lg:sticky lg:top-6 lg:block lg:h-[calc(100svh-3rem)]">
            <FloatingBookChat book={book} plan={currentPlan} variant="panel" />
          </aside>
        ) : null}
      </section>

      {currentPlan && !isReadingMode ? (
        <div className="lg:hidden">
          <FloatingBookChat book={book} plan={currentPlan} />
        </div>
      ) : null}

      {isAudioDockOpen && !isReadingMode ? (
        <div className="fixed inset-x-3 bottom-3 z-50 sm:left-[calc(var(--dashboard-sidebar-offset,84px)+1rem)]">
          <div className="mx-auto max-w-[1560px] rounded-[22px] border border-slate-950/[0.08] bg-white/96 p-2 shadow-[0_18px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl md:p-3">
            <button aria-label="Cerrar reproductor" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-950" onClick={() => setIsAudioDockOpen(false)} type="button">
              <X aria-hidden="true" size={18} />
            </button>
            <AudioPanel book={book} isPlanLoading={isPlanLoading && !currentPlan} locked={!isPlanLoading && !canUseAudio} />
          </div>
        </div>
      ) : null}
    </main>
  );
}
