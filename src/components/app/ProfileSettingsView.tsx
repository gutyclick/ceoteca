"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  ChevronRight,
  Crown,
  Flame,
  Headphones,
  HelpCircle,
  LibraryBig,
  Lock,
  Pencil,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { plans } from "@/config/plans";
import { siteConfig } from "@/config/site";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils/cn";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProgressRow = Database["public"]["Tables"]["user_book_progress"]["Row"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type BookRow = Database["public"]["Tables"]["books"]["Row"];

type ProgressItem = ProgressRow & {
  bookTitle: string;
  bookCategory: string;
  bookSlug: string;
};

type ProfileData = {
  userId: string;
  email: string;
  profile: ProfileRow;
  subscription: SubscriptionRow | null;
  progress: ProgressItem[];
  chatQuestionsThisMonth: number;
  isDemo: boolean;
};

type ViewState =
  | { status: "loading" }
  | { status: "unauthorized" }
  | { status: "ready"; data: ProfileData; notice?: string };

const avatarOptions = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=320&q=80",
  "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=320&q=80",
] as const;

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Pendiente";
  }

  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(name: string, email: string) {
  const source = name.trim().length > 0 ? name : email;
  const parts = source.split(/[ @._-]+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part.at(0)?.toUpperCase() ?? "")
    .join("");
}

function getAverageProgress(progress: ProgressItem[]) {
  if (progress.length === 0) {
    return 0;
  }

  return Math.round(
    progress.reduce((total, item) => total + item.progress, 0) / progress.length,
  );
}

function getRelativeLevel(averageProgress: number, completedBooks: number) {
  return Math.min(96, Math.max(18, completedBooks * 11 + averageProgress));
}

function getActiveDays(progress: ProgressItem[]) {
  return new Set(
    progress.map((item) => new Date(item.updated_at).toISOString().slice(0, 10)),
  ).size;
}

function createDemoProfileData(): ProfileData {
  const now = new Date().toISOString();

  return {
    userId: "demo-user",
    email: "andres@ceoteca.com",
    isDemo: true,
    profile: {
      id: "demo-user",
      full_name: "Andres Ramirez",
      avatar_url: avatarOptions[0],
      birth_date: null,
      plan: "free",
      founder: false,
      created_at: now,
      updated_at: now,
    },
    subscription: null,
    chatQuestionsThisMonth: 0,
    progress: [
      {
        id: "progress-1",
        user_id: "demo-user",
        book_id: "book-1",
        progress: 73,
        completed: false,
        last_section_id: null,
        started_at: now,
        completed_at: null,
        updated_at: now,
        bookTitle: "Habitos Atomicos",
        bookCategory: "Productividad",
        bookSlug: "habitos-atomicos",
      },
      {
        id: "progress-2",
        user_id: "demo-user",
        book_id: "book-2",
        progress: 100,
        completed: true,
        last_section_id: null,
        started_at: now,
        completed_at: now,
        updated_at: now,
        bookTitle: "Deep Work",
        bookCategory: "Productividad",
        bookSlug: "deep-work",
      },
      {
        id: "progress-3",
        user_id: "demo-user",
        book_id: "book-3",
        progress: 35,
        completed: false,
        last_section_id: null,
        started_at: now,
        completed_at: null,
        updated_at: now,
        bookTitle: "Padre Rico Padre Pobre",
        bookCategory: "Finanzas",
        bookSlug: "padre-rico-padre-pobre",
      },
    ],
  };
}

function ProfileStatCard({
  icon: Icon,
  value,
  label,
  detail,
  tone,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  detail: string;
  tone: string;
}) {
  return (
    <Card className="group min-h-[210px] rounded-[16px] bg-white/[0.035] p-6">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start gap-5">
          <span
            className={cn(
              "grid h-14 w-14 shrink-0 place-items-center rounded-full border bg-white/[0.055]",
              tone,
            )}
          >
            <Icon aria-hidden="true" size={28} />
          </span>
          <div>
            <p className="text-3xl font-semibold">{value}</p>
            <p className="mt-4 text-base leading-6">{label}</p>
            <p className="mt-3 text-sm leading-6 text-text-secondary">{detail}</p>
          </div>
        </div>
        <span className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-white/[0.06] text-text-secondary transition group-hover:bg-brand-purple/30 group-hover:text-white">
          <ChevronRight aria-hidden="true" size={18} />
        </span>
      </div>
    </Card>
  );
}

function AvatarImage({
  avatarUrl,
  initials,
}: {
  avatarUrl: string | null;
  initials: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt="" className="h-full w-full object-cover" src={avatarUrl} />
    );
  }

  return <span>{initials}</span>;
}

function AvatarPicker({
  currentAvatar,
  initials,
  isSaving,
  error,
  onClose,
  onSelect,
}: {
  currentAvatar: string | null;
  initials: string;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSelect: (avatarUrl: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-sm">
      <Card className="w-full max-w-2xl rounded-[20px] bg-[#080915] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Elige tu imagen</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Usa una imagen prealojada. Se guardara en tu perfil de Supabase.
            </p>
          </div>
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-text-secondary transition hover:text-white"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {avatarOptions.map((avatarUrl) => (
            <button
              className={cn(
                "relative aspect-square overflow-hidden rounded-[24px] border bg-white/[0.04] transition hover:-translate-y-1 hover:border-brand-purple/70",
                currentAvatar === avatarUrl
                  ? "border-brand-purple shadow-[0_0_35px_rgba(124,58,237,0.35)]"
                  : "border-white/10",
              )}
              disabled={isSaving}
              key={avatarUrl}
              onClick={() => onSelect(avatarUrl)}
              type="button"
            >
              <AvatarImage avatarUrl={avatarUrl} initials={initials} />
            </button>
          ))}
        </div>
        {error ? (
          <div className="mt-5 rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </div>
        ) : null}
        <p className="mt-5 text-xs leading-5 text-text-muted">
          {isSaving ? "Guardando imagen..." : "Puedes cambiarla cuando quieras."}
        </p>
      </Card>
    </div>
  );
}

function StreakCard({ activeDays }: { activeDays: number }) {
  const days = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <Card className="rounded-[16px] bg-white/[0.035] p-6">
      <div className="flex items-center gap-5">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-orange-400/15 text-orange-300">
          <Flame aria-hidden="true" size={34} />
        </span>
        <div>
          <p className="text-5xl font-semibold">{activeDays}</p>
          <p className="mt-1 text-lg">dias con actividad</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-7 gap-3">
        {days.map((day, index) => {
          const isActive = index < Math.min(activeDays, 7);

          return (
            <span
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full text-sm font-medium",
                isActive
                  ? "bg-brand-purple text-white"
                  : "bg-white/[0.06] text-text-muted",
              )}
              key={`${day}-${index}`}
            >
              {day}
            </span>
          );
        })}
      </div>
      <p className="mt-6 text-base text-text-secondary">
        Excelente. Manten tu ritmo de aprendizaje.
      </p>
    </Card>
  );
}

function MonthlyProgressCard({
  progress,
  relativeLevel,
}: {
  progress: ProgressItem[];
  relativeLevel: number;
}) {
  const ordered = [...progress]
    .sort(
      (a, b) =>
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
    )
    .slice(-6);
  const values =
    ordered.length > 0 ? ordered.map((item) => item.progress) : [0, 0, 0, 0, 0, 0];
  const points = values.map((value, index) => {
    const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
    const y = 100 - value;

    return { x, y };
  });
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <Card className="rounded-[16px] bg-white/[0.035] p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Tu progreso</h2>
        <span className="inline-flex min-h-11 items-center rounded-button border border-white/10 bg-white/[0.035] px-4 text-sm text-text-secondary">
          Este mes
        </span>
      </div>
      <div className="mt-6 grid h-64 grid-cols-[44px_1fr] gap-3">
        <div className="grid text-xs text-text-secondary">
          {["100%", "75%", "50%", "25%", "0%"].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="relative overflow-hidden rounded-card border border-white/5 bg-[#050713]/70">
          <svg
            aria-label="Grafico mensual de progreso"
            className="h-full w-full overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id="profile-month-line" x1="0" x2="1" y1="0" y2="0">
                <stop stopColor="#a855f7" />
                <stop offset="1" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            {[0, 25, 50, 75, 100].map((line) => (
              <line
                key={line}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="2 3"
                strokeWidth="0.5"
                x1="0"
                x2="100"
                y1={line}
                y2={line}
              />
            ))}
            <path
              d={`${path} L 100 100 L 0 100 Z`}
              fill="rgba(124,58,237,0.18)"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={path}
              fill="none"
              stroke="url(#profile-month-line)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.6"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={points.at(-1)?.x ?? 0}
              cy={points.at(-1)?.y ?? 100}
              fill="#f7f7fa"
              r="2.6"
              stroke="#a855f7"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>
      <div className="mt-7 flex gap-4 rounded-card border border-white/10 bg-white/[0.035] p-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-purple/20 text-brand-purple">
          <TrendingUp aria-hidden="true" size={28} />
        </span>
        <div>
          <p className="font-semibold">Vas por buen camino</p>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Has avanzado mas que el {relativeLevel}% estimado de usuarios este mes.
          </p>
        </div>
      </div>
    </Card>
  );
}

function RecentActivityPanel({ progress }: { progress: ProgressItem[] }) {
  return (
    <Card className="rounded-[16px] bg-white/[0.035] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Actividad reciente</h2>
        <Link className="text-sm text-brand-purple" href="/biblioteca">
          Ver todo
        </Link>
      </div>
      <div className="mt-6 grid gap-1">
        {progress.length > 0 ? (
          progress.slice(0, 4).map((item, index) => (
            <Link
              className="grid grid-cols-[48px_1fr_auto_20px] items-center gap-4 border-b border-white/10 py-4 last:border-b-0"
              href={`/libro/${item.bookSlug}`}
              key={item.id}
            >
              <span className="grid h-12 w-12 place-items-center rounded-button bg-brand-purple/20 text-brand-purple">
                <BookOpen aria-hidden="true" size={23} />
              </span>
              <span>
                <span className="block font-medium">
                  {index === 0 ? "Exploraste" : "Continuaste"} {item.bookTitle}
                </span>
              </span>
              <span className="text-sm text-text-secondary">
                {index === 0 ? "Hoy" : index === 1 ? "Ayer" : `Hace ${index + 1} dias`}
              </span>
              <ChevronRight aria-hidden="true" className="text-text-secondary" size={17} />
            </Link>
          ))
        ) : (
          <div className="rounded-card border border-dashed border-white/15 bg-white/[0.025] p-5 text-sm leading-6 text-text-secondary">
            Aun no hay actividad. Empieza un libro desde la biblioteca.
          </div>
        )}
      </div>
    </Card>
  );
}

function UpgradeBanner() {
  return (
    <Card className="rounded-[16px] border-brand-purple/30 bg-gradient-to-r from-brand-purple/25 via-brand-purple/12 to-brand-blue/10 p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-purple/25 text-brand-purple">
            <Sparkles aria-hidden="true" size={32} />
          </span>
          <div>
            <h2 className="text-2xl font-semibold">Mejora tu experiencia</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Desbloquea resumenes ilimitados, audio, ejercicios y chat con IA.
            </p>
          </div>
        </div>
        <Link
          className="inline-flex min-h-14 min-w-40 items-center justify-center rounded-button bg-brand-gradient px-6 text-sm font-medium text-white transition hover:brightness-110"
          href="/planes"
        >
          Ver planes
        </Link>
      </div>
    </Card>
  );
}

function AchievementSummary({
  badges,
}: {
  badges: Array<{
    title: string;
    description: string;
    icon: LucideIcon;
    unlocked: boolean;
  }>;
}) {
  return (
    <Card className="rounded-[16px] bg-white/[0.035] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Logros</h2>
        <button className="text-sm text-brand-purple" type="button">
          Ver todos
        </button>
      </div>
      <div className="mt-6 grid gap-4">
        {badges.slice(0, 4).map((badge) => {
          const Icon = badge.icon;

          return (
            <div className="flex items-center gap-4" key={badge.title}>
              <span
                className={cn(
                  "grid h-12 w-12 place-items-center rounded-full",
                  badge.unlocked
                    ? "bg-brand-purple/20 text-brand-purple"
                    : "bg-white/[0.05] text-text-muted",
                )}
              >
                <Icon aria-hidden="true" size={23} />
              </span>
              <div>
                <p className="font-semibold">{badge.title}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {badge.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function HelpPanel() {
  return (
    <Card className="relative overflow-hidden rounded-[16px] bg-white/[0.035] p-6">
      <div className="absolute bottom-0 right-0 h-36 w-72 bg-brand-purple/20 blur-3xl" />
      <div className="relative z-10">
        <h2 className="text-2xl font-semibold">Necesitas ayuda?</h2>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Visita nuestro centro de ayuda o contactanos.
        </p>
        <Link
          className="mt-7 flex min-h-16 items-center justify-between rounded-card border border-white/10 bg-white/[0.045] px-4 transition hover:border-brand-purple/50"
          href={`mailto:${siteConfig.supportEmail}`}
        >
          <span className="flex items-center gap-4">
            <span className="grid h-11 w-11 place-items-center rounded-button bg-brand-purple/20 text-brand-purple">
              <Headphones aria-hidden="true" size={22} />
            </span>
            Centro de ayuda
          </span>
          <HelpCircle aria-hidden="true" size={22} />
        </Link>
      </div>
    </Card>
  );
}

export function ProfileSettingsView() {
  const [state, setState] = useState<ViewState>({ status: "loading" });
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          if (isMounted) {
            setState({ status: "unauthorized" });
          }
          return;
        }

        const userId = userData.user.id;
        const [
          profileResponse,
          progressResponse,
          subscriptionResponse,
          usageResponse,
        ] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
          supabase
            .from("user_book_progress")
            .select("*")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(8),
          supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("chat_usage")
            .select("question_count")
            .eq("user_id", userId)
            .eq("month", `${new Date().toISOString().slice(0, 7)}-01`),
        ]);

        if (profileResponse.error) {
          throw profileResponse.error;
        }

        const profile = profileResponse.data;

        if (!profile) {
          if (isMounted) {
            setState({ status: "unauthorized" });
          }
          return;
        }

        const progressRows = progressResponse.data ?? [];
        const bookIds = [...new Set(progressRows.map((item) => item.book_id))];
        let bookMap = new Map<string, Pick<BookRow, "title" | "category" | "slug">>();

        if (bookIds.length > 0) {
          const { data: booksData } = await supabase
            .from("books")
            .select("id,title,category,slug")
            .in("id", bookIds);

          bookMap = new Map(
            (booksData ?? []).map((book) => [
              book.id,
              {
                title: book.title,
                category: book.category,
                slug: book.slug,
              },
            ]),
          );
        }

        const progress = progressRows.map((item) => {
          const book = bookMap.get(item.book_id);

          return {
            ...item,
            bookTitle: book?.title ?? "Libro de Ceoteca",
            bookCategory: book?.category ?? "Biblioteca",
            bookSlug: book?.slug ?? "biblioteca",
          };
        });

        if (isMounted) {
          setState({
            status: "ready",
            data: {
              userId,
              email: userData.user.email ?? "sin-correo@ceoteca.com",
              profile,
              subscription: subscriptionResponse.data ?? null,
              progress,
              chatQuestionsThisMonth: (usageResponse.data ?? []).reduce(
                (total, row) => total + row.question_count,
                0,
              ),
              isDemo: false,
            },
          });
        }
      } catch {
        if (isMounted) {
          setState({
            status: "ready",
            data: createDemoProfileData(),
            notice:
              "No pudimos cargar Supabase en esta vista. Mostramos datos demo para mantener el flujo navegable.",
          });
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  async function saveAvatar(avatarUrl: string) {
    if (state.status !== "ready") {
      return;
    }

    setAvatarError(null);
    setIsSavingAvatar(true);

    try {
      if (!avatarOptions.includes(avatarUrl as (typeof avatarOptions)[number])) {
        throw new Error("Selecciona una imagen valida.");
      }

      if (!state.data.isDemo) {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase
          .from("profiles")
          .update({ avatar_url: avatarUrl })
          .eq("id", state.data.userId);

        if (error) {
          throw error;
        }
      }

      setState({
        status: "ready",
        data: {
          ...state.data,
          profile: {
            ...state.data.profile,
            avatar_url: avatarUrl,
          },
        },
      });
      setIsAvatarPickerOpen(false);
    } catch (caughtError) {
      setAvatarError(
        caughtError instanceof Error
          ? caughtError.message
          : "No pudimos guardar la imagen.",
      );
    } finally {
      setIsSavingAvatar(false);
    }
  }

  if (state.status === "loading") {
    return (
      <main className="min-h-screen bg-[#03040b] text-text-primary">
        <section className="mx-auto w-full max-w-[1180px] px-5 py-8 md:px-8">
          <Logo className="[&>span]:text-[15px] [&>span]:tracking-[0.34em]" />
          <Card className="mt-10 min-h-[420px] animate-pulse rounded-[18px] bg-white/[0.035] p-8">
            <div className="h-10 w-56 rounded-full bg-white/10" />
            <div className="mt-8 grid gap-5 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="h-32 rounded-[16px] bg-white/[0.06]" key={index} />
              ))}
            </div>
          </Card>
        </section>
      </main>
    );
  }

  if (state.status === "unauthorized") {
    return (
      <main className="min-h-screen bg-[#03040b] text-text-primary">
        <section className="mx-auto w-full max-w-2xl px-5 py-8 md:px-8">
          <Logo className="[&>span]:text-[15px] [&>span]:tracking-[0.34em]" />
          <Card className="mt-12 rounded-[18px] bg-white/[0.035] p-8 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-purple/20 text-brand-purple">
              <Lock aria-hidden="true" size={28} />
            </span>
            <h1 className="mt-6 text-3xl font-semibold">Inicia sesion</h1>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              Tu perfil y progreso pertenecen a tu cuenta privada.
            </p>
            <Link
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-button bg-brand-gradient px-5 text-sm font-medium text-white transition hover:brightness-110"
              href="/login"
            >
              Ir a login
            </Link>
          </Card>
        </section>
      </main>
    );
  }

  const { data, notice } = state;
  const displayName = data.profile.full_name ?? "Usuario Ceoteca";
  const currentPlan = data.profile.plan;
  const plan = plans[currentPlan];
  const completedBooks = data.progress.filter((item) => item.completed).length;
  const averageProgress = getAverageProgress(data.progress);
  const relativeLevel = getRelativeLevel(averageProgress, completedBooks);
  const activeDays = getActiveDays(data.progress);
  const initials = getInitials(displayName, data.email);
  const chatLimit = plan.chatMonthlyLimit;
  const badges = [
    {
      title: "Primer paso",
      description: "Comenzaste tu viaje de aprendizaje.",
      icon: Sparkles,
      unlocked: data.progress.length > 0,
    },
    {
      title: "Explorador",
      description: `Exploraste ${data.progress.length} libros.`,
      icon: LibraryBig,
      unlocked: data.progress.length >= 3,
    },
    {
      title: "Curioso",
      description: "Hiciste tu primera pregunta a la IA.",
      icon: Bot,
      unlocked: data.chatQuestionsThisMonth > 0,
    },
    {
      title: "Constante",
      description: "Mantienes actividad de aprendizaje.",
      icon: Flame,
      unlocked: activeDays > 0,
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#03040b] pb-16 pl-[92px] text-text-primary">
      <DashboardSidebar active="profile" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(124,58,237,0.18),transparent_28%),radial-gradient(circle_at_78%_12%,rgba(79,99,255,0.12),transparent_30%),linear-gradient(180deg,#02030a_0%,#050612_52%,#04040a_100%)]" />

      <section className="mx-auto w-full max-w-[1220px] px-5 pt-7 md:px-8">
        <header className="flex items-center justify-between">
          <Logo className="[&>span]:text-[15px] [&>span]:tracking-[0.34em]" />
          <button
            aria-label="Notificaciones"
            className="relative grid h-10 w-10 place-items-center rounded-full text-white transition hover:bg-white/[0.06]"
            type="button"
          >
            <Bell aria-hidden="true" size={21} />
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-brand-purple ring-2 ring-[#03040b]" />
          </button>
        </header>

        {notice ? (
          <Card className="mt-6 rounded-[14px] border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-warning">
            {notice}
          </Card>
        ) : null}

        <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_450px] lg:items-center">
          <div className="grid gap-8 md:grid-cols-[270px_1fr] md:items-center">
            <div className="relative mx-auto h-64 w-64 md:mx-0">
              <div className="absolute inset-0 rounded-full border-4 border-brand-purple shadow-[0_0_48px_rgba(124,58,237,0.55)]" />
              <div className="absolute inset-3 grid place-items-center overflow-hidden rounded-full bg-gradient-to-br from-slate-700 via-slate-500 to-slate-900 text-6xl font-semibold">
                <AvatarImage
                  avatarUrl={data.profile.avatar_url}
                  initials={initials}
                />
              </div>
              <button
                aria-label="Cambiar imagen de perfil"
                className="absolute bottom-1 right-5 grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-[#101321] text-white shadow-ambient transition hover:border-brand-purple/70"
                onClick={() => setIsAvatarPickerOpen(true)}
                type="button"
              >
                <Pencil aria-hidden="true" size={22} />
              </button>
            </div>
            <div>
              <p className="text-lg font-medium text-brand-purple">
                Bienvenido de nuevo
              </p>
              <h1 className="mt-4 text-balance text-5xl font-semibold md:text-6xl">
                {displayName}
              </h1>
              <p className="mt-4 text-lg text-text-secondary">
                Aprendiz desde {formatDate(data.profile.created_at)}
              </p>
              <p className="mt-3 text-lg text-text-secondary">{data.email}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-[14px] border border-brand-purple/35 bg-brand-purple/20 px-4 py-3 text-sm text-brand-purple">
                  <Crown aria-hidden="true" size={16} />
                  Plan {plan.name}
                </span>
                <span className="inline-flex items-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-text-secondary">
                  <CalendarDays aria-hidden="true" size={16} />
                  Miembro desde {formatDate(data.profile.created_at)}
                </span>
              </div>
            </div>
          </div>

          <StreakCard activeDays={activeDays} />
        </section>

        <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <ProfileStatCard
            detail="Explorando nuevos conocimientos"
            icon={BookOpen}
            label="Libros iniciados"
            tone="border-brand-purple/25 text-brand-purple"
            value={`${data.progress.length}`}
          />
          <ProfileStatCard
            detail="Sigue asi, tu puedes"
            icon={LibraryBig}
            label="Libros completados"
            tone="border-emerald-300/20 text-emerald-300"
            value={`${completedBooks}`}
          />
          <ProfileStatCard
            detail={`Por encima del ${relativeLevel}% estimado de usuarios`}
            icon={TrendingUp}
            label="Progreso promedio"
            tone="border-amber-300/20 text-amber-300"
            value={`${averageProgress}%`}
          />
          <ProfileStatCard
            detail={
              chatLimit === null
                ? "Uso razonable incluido"
                : `${chatLimit} disponibles segun tu plan`
            }
            icon={Bot}
            label="Preguntas a la IA este mes"
            tone="border-sky-300/20 text-sky-300"
            value={`${data.chatQuestionsThisMonth}`}
          />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <MonthlyProgressCard
            progress={data.progress}
            relativeLevel={relativeLevel}
          />
          <RecentActivityPanel progress={data.progress} />
        </section>

        <section className="mt-5">
          <UpgradeBanner />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <AchievementSummary badges={badges} />
          <HelpPanel />
        </section>

        <footer className="mt-10 border-t border-white/10 py-8 text-sm text-text-muted">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p>© 2026 Ceoteca. Todos los derechos reservados.</p>
            <nav
              aria-label="Legal del perfil"
              className="flex flex-wrap gap-x-5 gap-y-2"
            >
              <Link className="transition hover:text-text-primary" href="/terminos">
                Terminos
              </Link>
              <Link
                className="transition hover:text-text-primary"
                href="/privacidad"
              >
                Privacidad
              </Link>
              <Link
                className="transition hover:text-text-primary"
                href={`mailto:${siteConfig.supportEmail}`}
              >
                Soporte
              </Link>
            </nav>
          </div>
        </footer>
      </section>

      {isAvatarPickerOpen ? (
        <AvatarPicker
          currentAvatar={data.profile.avatar_url}
          error={avatarError}
          initials={initials}
          isSaving={isSavingAvatar}
          onClose={() => setIsAvatarPickerOpen(false)}
          onSelect={(avatarUrl) => void saveAvatar(avatarUrl)}
        />
      ) : null}
    </main>
  );
}
