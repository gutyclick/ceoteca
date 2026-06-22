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
  Heart,
  Lock,
  Loader2,
  MoreHorizontal,
  Play,
  Share2,
  Sparkles,
  Target,
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

const disclaimer =
  "Contenido educativo y editorial propio. Ceoteca no está afiliada al autor ni a la editorial. Este análisis no reemplaza la obra original.";

const articleNav = [
  { href: "#intro", label: "Intro" },
  { href: "#tipos", label: "Tipos" },
  { href: "#sistema", label: "24 pasos" },
  { href: "#claves", label: "Claves" },
  { href: "#framework", label: "Framework" },
  { href: "#plantilla", label: "Plantilla" },
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

function getProgress(book: Book) {
  return book.progress ?? 0;
}

function getRemainingMinutes(book: Book) {
  return Math.max(Math.ceil(book.readingTime * (1 - getProgress(book) / 100)), 3);
}

function MiniCover({ book }: { book: Book }) {
  return (
    <div className="relative h-[320px] w-full max-w-[210px] overflow-hidden rounded-md border border-white/20 bg-gradient-to-br from-indigo-400 via-violet-600 to-fuchsia-600 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
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
    <Card className="relative overflow-hidden rounded-[16px] bg-white/[0.04] p-5">
      {locked ? (
        <LockedPremiumOverlay
          description="El audio narrado está incluido desde Pro."
          title="Audio bloqueado"
        />
      ) : null}
      <div className={cn("grid gap-4 md:grid-cols-[auto_1fr] md:items-center", locked && "select-none blur-sm")}>
        <button
          aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-purple/75 text-white shadow-[0_0_38px_rgba(124,58,237,0.42)] transition hover:bg-brand-purple"
          disabled={isLoadingAudio}
          onClick={() => void toggleAudio()}
          type="button"
        >
          {isLoadingAudio ? (
            <Loader2 aria-hidden="true" className="animate-spin" size={22} />
          ) : isPlaying ? (
            <span className="h-5 w-5 rounded-sm bg-current" />
          ) : (
            <Play aria-hidden="true" fill="currentColor" size={23} />
          )}
        </button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-white">Escucha el análisis</h2>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-xs text-text-secondary">
              {durationLabel}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1">
            {Array.from({ length: 34 }).map((_, index) => (
              <span
                className={cn(
                  "w-1 rounded-full bg-brand-purple transition-opacity",
                  !isPlaying && "opacity-45",
                )}
                key={index}
                style={{ height: 8 + ((index * 9) % 28) }}
              />
            ))}
          </div>
          {audioError ? (
            <div className="mt-3 rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              {audioError}
            </div>
          ) : (
            <p className="mt-2 text-xs leading-5 text-text-secondary">
              Audio editorial generado desde el análisis autorizado de Ceoteca.
            </p>
          )}
        </div>
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
    <section className="scroll-mt-28 py-10" id={id}>
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
                isSelected &&
                  (isCorrect
                    ? "border-success/50 bg-success/10 text-white"
                    : "border-danger/50 bg-danger/10 text-white"),
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
        <p className="mt-4 rounded-[14px] border border-white/10 bg-[#070812]/80 p-4 text-sm leading-7 text-text-secondary">
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
      <Card className="rounded-[16px] bg-white/[0.035] p-6">
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

export function BookExperience({ book }: BookExperienceProps) {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("free");
  const [readingProgress, setReadingProgress] = useState(0);
  const canUseAudio = canAccessFeature(currentPlan, "audio");
  const canUseChat = canAccessFeature(currentPlan, "chat");
  const isDisciplined = book.slug === "disciplined-entrepreneurship";

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

  useEffect(() => {
    function updateReadingProgress() {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress =
        maxScroll > 0 ? Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)) : 0;

      setReadingProgress(Math.round(nextProgress));
    }

    updateReadingProgress();
    window.addEventListener("scroll", updateReadingProgress, { passive: true });
    window.addEventListener("resize", updateReadingProgress);

    return () => {
      window.removeEventListener("scroll", updateReadingProgress);
      window.removeEventListener("resize", updateReadingProgress);
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#03040b] pb-16 pl-[var(--dashboard-sidebar-offset,84px)] text-text-primary transition-[padding] duration-300 ease-out">
      <DashboardSidebar active="home" />
      <div className="fixed left-[var(--dashboard-sidebar-offset,84px)] right-0 top-0 z-50 h-1 bg-white/5">
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-brand-purple via-brand-blue to-brand-pink transition-[width] duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(124,58,237,0.18),transparent_28%),radial-gradient(circle_at_76%_18%,rgba(79,99,255,0.12),transparent_30%),linear-gradient(180deg,#02030a_0%,#050612_52%,#04040a_100%)]" />

      <section className="mx-auto w-full max-w-[1240px] px-5 pt-7 md:px-8">
        <header className="flex items-center justify-between">
          <button
            aria-label="Volver"
            className="grid h-12 w-12 place-items-center rounded-button border border-white/10 bg-white/[0.035] text-text-primary transition hover:bg-white/[0.07]"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={22} />
          </button>
          <div className="flex gap-3">
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

        <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.025] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.36)] md:p-7">
          <div className="grid gap-8 lg:grid-cols-[230px_1fr] lg:items-center">
            <MiniCover book={book} />
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-brand-purple">
                Análisis Ceoteca · Libro #001
              </p>
              <h1 className="mt-4 text-balance text-5xl font-black leading-none text-white md:text-7xl">
                {book.title}
              </h1>
              <p className="mt-5 max-w-3xl text-xl leading-8 text-text-primary">
                {book.description}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <HeroMetric label="Autor" value={book.author} />
                <HeroMetric label="Categoría" value={book.category} />
                <HeroMetric label="Dificultad" value={book.difficulty} />
                <HeroMetric label="Lectura" value={`${book.readingTime} min`} />
              </div>
              <div className="mt-5 max-w-3xl">
                <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                  <span className="text-text-secondary">Lectura en pantalla</span>
                  <span>{readingProgress}%</span>
                  <span className="text-text-secondary">
                    {getRemainingMinutes(book)} min restantes
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-blue"
                    style={{ width: `${readingProgress}%` }}
                  />
                </div>
              </div>
              <div className="mt-5 max-w-3xl">
                <AudioPanel book={book} locked={!canUseAudio} />
              </div>
            </div>
          </div>
        </div>

        <nav className="sticky top-0 z-20 mt-6 overflow-x-auto rounded-[18px] border border-white/10 bg-[#070812]/90 px-3 py-3 backdrop-blur-xl">
          <div className="flex min-w-max items-center gap-2">
            {articleNav.map((item) => (
              <a
                className="rounded-full px-4 py-2 text-sm text-text-secondary transition hover:bg-white/[0.06] hover:text-white"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
            <span className="ml-auto hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-text-secondary lg:inline-flex">
              <Clock3 aria-hidden="true" size={15} />
              ~{book.readingTime} min
            </span>
            <span className="hidden rounded-full border border-brand-purple/30 bg-brand-purple/10 px-4 py-2 text-sm text-white lg:inline-flex">
              {readingProgress}% leído
            </span>
          </div>
        </nav>

        <section className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="min-w-0 rounded-[24px] border border-white/10 bg-white/[0.025] px-5 py-2 md:px-8">
            {isDisciplined ? <DisciplinedArticle book={book} /> : <GenericArticle book={book} />}

            <section className="border-t border-white/10 py-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-purple">
                Para llevar
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                Las ideas que no olvides
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {book.keyPoints.slice(0, 4).map((point) => (
                  <div
                    className="rounded-[18px] border border-white/10 bg-white/[0.035] p-5"
                    key={point.number}
                  >
                    <Target
                      aria-hidden="true"
                      className="text-brand-purple"
                      size={22}
                    />
                    <h3 className="mt-3 font-semibold text-white">
                      {point.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-text-secondary">
                      {point.action}
                    </p>
                  </div>
                ))}
              </div>
              <Callout title="Análisis final Ceoteca" tone="purple">
                {book.conclusion}
              </Callout>
            </section>
          </article>

          <Sidebar book={book} canUseChat={canUseChat} />
        </section>
      </section>

      <FloatingBookChat book={book} plan={currentPlan} />
    </main>
  );
}
