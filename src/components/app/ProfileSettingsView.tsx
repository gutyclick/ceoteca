"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  CreditCard,
  Crown,
  Download,
  Home,
  KeyRound,
  LibraryBig,
  LineChart,
  Lock,
  Mail,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  User,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { plans, type PlanKey } from "@/config/plans";
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

const navItems = [
  { label: "Inicio", href: "/home", icon: Home, active: false },
  { label: "Biblioteca", href: "/biblioteca", icon: BookOpen, active: false },
  { label: "IA", href: "/home#ia", icon: Bot, active: false },
  { label: "Favoritos", href: "/biblioteca", icon: Star, active: false },
  { label: "Perfil", href: "/perfil", icon: User, active: true },
] as const;

const planOrder: PlanKey[] = ["free", "pro", "unlimited", "founder"];

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

function createDemoProfileData(): ProfileData {
  const now = new Date().toISOString();

  return {
    userId: "demo-user",
    email: "andres@ceoteca.com",
    isDemo: true,
    profile: {
      id: "demo-user",
      full_name: "Andres Ramirez",
      avatar_url: null,
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

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <Card className="rounded-[16px] bg-white/[0.035] p-5">
      <div className="flex items-start justify-between gap-4">
        <span
          className={cn(
            "grid h-12 w-12 place-items-center rounded-[14px] border bg-white/[0.045]",
            tone,
          )}
        >
          <Icon aria-hidden="true" size={22} />
        </span>
        <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs text-text-muted">
          Cuenta
        </span>
      </div>
      <p className="mt-5 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
      <p className="mt-2 text-xs leading-5 text-text-secondary">{detail}</p>
    </Card>
  );
}

function BadgeCard({
  icon: Icon,
  title,
  description,
  unlocked,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  unlocked: boolean;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-[16px] bg-white/[0.035] p-5 transition",
        unlocked
          ? "border-brand-purple/45 shadow-[0_0_36px_rgba(124,58,237,0.16)]"
          : "opacity-70",
      )}
    >
      <div className={cn(!unlocked && "blur-[1px]")}>
        <span
          className={cn(
            "grid h-12 w-12 place-items-center rounded-full",
            unlocked
              ? "bg-brand-purple/20 text-brand-purple"
              : "bg-white/[0.055] text-text-muted",
          )}
        >
          <Icon aria-hidden="true" size={23} />
        </span>
        <h3 className="mt-4 font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          {description}
        </p>
      </div>
      {!unlocked ? (
        <span className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#080915]/85 text-text-muted">
          <Lock aria-hidden="true" size={16} />
        </span>
      ) : null}
    </Card>
  );
}

function SettingsPanel({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-[16px] bg-white/[0.035] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-brand-purple/15 text-brand-purple">
            <Icon aria-hidden="true" size={22} />
          </span>
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {description}
            </p>
          </div>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function DisabledAction({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="inline-flex min-h-10 items-center justify-center rounded-button border border-white/10 bg-white/[0.035] px-4 text-sm text-text-muted"
      disabled
      type="button"
    >
      {children}
    </button>
  );
}

function BottomNavigation() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="fixed bottom-5 left-1/2 z-40 w-[min(94vw,1120px)] -translate-x-1/2">
      {isCollapsed ? (
        <button
          aria-label="Mostrar menu"
          className="mx-auto flex min-h-14 items-center gap-3 rounded-full border border-brand-purple/45 bg-[#080915]/92 px-5 text-sm text-text-primary shadow-[0_0_38px_rgba(124,58,237,0.28)] backdrop-blur-xl transition hover:border-brand-purple/80"
          onClick={() => setIsCollapsed(false)}
          type="button"
        >
          <User aria-hidden="true" className="text-brand-purple" size={22} />
          Menu
          <ChevronsUp aria-hidden="true" size={18} />
        </button>
      ) : (
        <nav className="relative rounded-[24px] border border-white/10 bg-[#080915]/92 px-4 pb-3 pt-4 shadow-ambient backdrop-blur-xl">
          <button
            aria-label="Ocultar menu"
            className="absolute -top-4 right-5 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#101121] text-text-secondary shadow-ambient transition hover:border-brand-purple/60 hover:text-white"
            onClick={() => setIsCollapsed(true)}
            type="button"
          >
            <ChevronsDown aria-hidden="true" size={16} />
          </button>

          <div className="grid grid-cols-5 items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isCenter = item.label === "IA";

              return (
                <Link
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-button px-2 py-2 text-xs text-text-secondary transition hover:text-white md:flex-row md:text-base",
                    item.active && "text-brand-purple",
                    isCenter &&
                      "-mt-11 mx-auto h-[78px] w-[78px] rounded-full border border-brand-purple/70 bg-brand-purple/20 text-brand-purple shadow-[0_0_45px_rgba(124,58,237,0.55)] md:flex-col md:text-sm",
                  )}
                  href={item.href}
                  key={item.label}
                >
                  <Icon aria-hidden="true" size={isCenter ? 28 : 24} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export function ProfileSettingsView() {
  const [state, setState] = useState<ViewState>({ status: "loading" });

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
              "No pudimos cargar Supabase en esta vista. Mostramos una estructura demo para mantener el flujo navegable.",
          });
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <main className="min-h-screen bg-[#03040b] text-text-primary">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_8%,rgba(124,58,237,0.18),transparent_28%),linear-gradient(180deg,#02030a_0%,#050612_52%,#04040a_100%)]" />
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
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_8%,rgba(124,58,237,0.18),transparent_28%),linear-gradient(180deg,#02030a_0%,#050612_52%,#04040a_100%)]" />
        <section className="mx-auto w-full max-w-2xl px-5 py-8 md:px-8">
          <Logo className="[&>span]:text-[15px] [&>span]:tracking-[0.34em]" />
          <Card className="mt-12 rounded-[18px] bg-white/[0.035] p-8 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-purple/20 text-brand-purple">
              <Lock aria-hidden="true" size={28} />
            </span>
            <h1 className="mt-6 text-3xl font-semibold">Inicia sesion</h1>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              Tu perfil, progreso y ajustes pertenecen a tu cuenta privada.
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
  const initials = getInitials(displayName, data.email);
  const chatLimit = plan.chatMonthlyLimit;

  const badges = [
    {
      title: "Primer paso",
      description: "Comenzaste tu primera experiencia de aprendizaje.",
      icon: Sparkles,
      unlocked: data.progress.length > 0,
    },
    {
      title: "Finalizador",
      description: "Completaste al menos un libro interactivo.",
      icon: Trophy,
      unlocked: completedBooks > 0,
    },
    {
      title: "Constancia",
      description: "Mantienes actividad reciente en tu cuenta.",
      icon: LineChart,
      unlocked: data.progress.some((item) => item.updated_at),
    },
    {
      title: "Explorador",
      description: "Probaste tres o mas experiencias de la biblioteca.",
      icon: LibraryBig,
      unlocked: data.progress.length >= 3,
    },
    {
      title: "Conversador IA",
      description: "Usaste el chat contextual para aprender mejor.",
      icon: Bot,
      unlocked: data.chatQuestionsThisMonth > 0,
    },
    {
      title: "Cuenta Pro",
      description: "Activaste un plan con audio y chat incluidos.",
      icon: Crown,
      unlocked: currentPlan !== "free",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#03040b] pb-40 text-text-primary">
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

        <section className="mt-9 grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="relative overflow-hidden rounded-[18px] border-brand-purple/25 bg-white/[0.035] p-6">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-purple/20 blur-3xl" />
            <div className="relative grid gap-6 md:grid-cols-[116px_1fr] md:items-center">
              <div className="grid h-28 w-28 place-items-center rounded-[28px] border border-brand-purple/40 bg-brand-purple/20 text-3xl font-semibold text-white shadow-[0_0_46px_rgba(124,58,237,0.32)]">
                {data.profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="h-full w-full rounded-[28px] object-cover"
                    src={data.profile.avatar_url}
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-brand-purple">
                  Perfil y ajustes
                </p>
                <h1 className="mt-3 text-balance text-4xl font-semibold md:text-5xl">
                  {displayName}
                </h1>
                <p className="mt-3 text-sm text-text-secondary">{data.email}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-brand-purple/45 bg-brand-purple/15 px-4 py-2 text-sm text-brand-purple">
                    <Crown aria-hidden="true" size={16} />
                    Plan {plan.name}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm text-text-secondary">
                    <ShieldCheck aria-hidden="true" size={16} />
                    Miembro desde {formatDate(data.profile.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-[18px] bg-white/[0.035] p-6">
            <p className="text-sm font-medium text-text-secondary">
              Comparado con usuarios activos
            </p>
            <p className="mt-4 text-5xl font-semibold">{relativeLevel}%</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Estimacion basada en tu avance y libros completados. La analitica
              global real se activara cuando haya suficientes datos agregados.
            </p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-blue"
                style={{ width: `${relativeLevel}%` }}
              />
            </div>
          </Card>
        </section>

        <section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            detail="Experiencias con progreso guardado."
            icon={LibraryBig}
            label="Libros iniciados"
            tone="border-emerald-300/20 text-emerald-300"
            value={`${data.progress.length}`}
          />
          <MetricCard
            detail="Analisis completados en tu cuenta."
            icon={CheckCircle2}
            label="Libros completados"
            tone="border-brand-purple/25 text-brand-purple"
            value={`${completedBooks}`}
          />
          <MetricCard
            detail="Promedio de avance entre tus libros."
            icon={LineChart}
            label="Progreso promedio"
            tone="border-blue-300/20 text-blue-300"
            value={`${averageProgress}%`}
          />
          <MetricCard
            detail={
              chatLimit === null
                ? "Uso razonable incluido en tu plan."
                : `${chatLimit} preguntas disponibles segun tu plan.`
            }
            icon={Bot}
            label="Preguntas IA este mes"
            tone="border-pink-300/20 text-pink-300"
            value={`${data.chatQuestionsThisMonth}`}
          />
        </section>

        <section className="mt-7 grid gap-7 lg:grid-cols-[1fr_390px]">
          <div className="space-y-7">
            <Card className="rounded-[18px] bg-white/[0.035] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Logros</h2>
                  <p className="mt-2 text-sm text-text-secondary">
                    Badges pensados para motivar progreso sin convertir el
                    aprendizaje en ruido.
                  </p>
                </div>
                <span className="rounded-full bg-white/[0.05] px-3 py-1 text-sm text-text-secondary">
                  {badges.filter((badge) => badge.unlocked).length}/{badges.length}
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {badges.map((badge) => (
                  <BadgeCard
                    description={badge.description}
                    icon={badge.icon}
                    key={badge.title}
                    title={badge.title}
                    unlocked={badge.unlocked}
                  />
                ))}
              </div>
            </Card>

            <SettingsPanel
              description="Datos basicos de tu cuenta y futuras opciones para editar perfil."
              icon={UserRound}
              title="Cuenta"
              action={<DisabledAction>Guardar cambios</DisabledAction>}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className="text-text-secondary">Nombre</span>
                  <input
                    className="min-h-12 rounded-button border border-white/10 bg-white/[0.035] px-4 text-text-primary outline-none"
                    disabled
                    value={displayName}
                    readOnly
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="text-text-secondary">Correo</span>
                  <input
                    className="min-h-12 rounded-button border border-white/10 bg-white/[0.035] px-4 text-text-primary outline-none"
                    disabled
                    value={data.email}
                    readOnly
                  />
                </label>
              </div>
              <p className="mt-4 text-xs leading-5 text-text-muted">
                La edicion real de perfil se conectara a endpoints validados en
                servidor antes de habilitar escritura.
              </p>
            </SettingsPanel>

            <SettingsPanel
              description="Correo, contrasena y protecciones de acceso."
              icon={ShieldCheck}
              title="Seguridad"
            >
              <div className="grid gap-3">
                {[
                  {
                    icon: Mail,
                    title: "Cambiar correo",
                    description: "Requiere confirmacion por email antes de aplicar.",
                  },
                  {
                    icon: KeyRound,
                    title: "Cambiar contrasena",
                    description: "Se enviara un flujo seguro de recuperacion.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Verificacion adicional",
                    description: "Preparado para activar MFA en una fase posterior.",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      className="flex items-center justify-between gap-4 rounded-card border border-white/10 bg-white/[0.025] p-4"
                      key={item.title}
                    >
                      <div className="flex gap-3">
                        <Icon
                          aria-hidden="true"
                          className="mt-1 text-brand-purple"
                          size={20}
                        />
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-sm text-text-secondary">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <DisabledAction>Configurar</DisabledAction>
                    </div>
                  );
                })}
              </div>
            </SettingsPanel>
          </div>

          <aside className="space-y-7">
            <SettingsPanel
              description="Estado de tu plan, acceso y proximos cambios."
              icon={CreditCard}
              title="Suscripcion"
              action={
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-button bg-brand-gradient px-4 text-sm font-medium text-white transition hover:brightness-110"
                  href="/planes"
                >
                  Cambiar plan
                </Link>
              }
            >
              <div className="rounded-card border border-brand-purple/35 bg-brand-purple/10 p-4">
                <p className="text-sm text-text-secondary">Plan actual</p>
                <p className="mt-2 text-2xl font-semibold">{plan.name}</p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {plan.description}
                </p>
                <div className="mt-4 grid gap-2 text-sm text-text-secondary">
                  <p>Estado: {data.subscription?.status ?? "Activo visual"}</p>
                  <p>
                    Renovacion:{" "}
                    {formatDate(data.subscription?.current_period_end ?? null)}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {planOrder
                  .filter((planKey) => planKey !== currentPlan)
                  .slice(0, 3)
                  .map((planKey) => (
                    <Link
                      className="flex items-center justify-between rounded-card border border-white/10 bg-white/[0.025] p-4 text-sm transition hover:border-brand-purple/50 hover:bg-white/[0.045]"
                      href={`/planes?plan=${planKey}`}
                      key={planKey}
                    >
                      <span>
                        <span className="block font-medium">
                          {plans[planKey].name}
                        </span>
                        <span className="mt-1 block text-text-secondary">
                          USD {plans[planKey].monthlyPriceUsd.toFixed(2)}/mes
                        </span>
                      </span>
                      <ChevronRight aria-hidden="true" size={18} />
                    </Link>
                  ))}
              </div>
            </SettingsPanel>

            <SettingsPanel
              description="Historial de pagos y documentos fiscales."
              icon={ReceiptText}
              title="Pagos y facturas"
            >
              <div className="rounded-card border border-dashed border-white/15 bg-white/[0.025] p-5 text-center">
                <ReceiptText
                  aria-hidden="true"
                  className="mx-auto text-text-muted"
                  size={28}
                />
                <h3 className="mt-4 font-semibold">Sin facturas todavia</h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  El proveedor de pagos esta deshabilitado hasta definir la
                  pasarela. No hay cobros reales registrados.
                </p>
                <DisabledAction>
                  <Download aria-hidden="true" className="mr-2" size={16} />
                  Descargar factura
                </DisabledAction>
              </div>
            </SettingsPanel>

            <Card className="rounded-[18px] bg-white/[0.035] p-6">
              <h2 className="text-xl font-semibold">Actividad reciente</h2>
              <div className="mt-5 grid gap-3">
                {data.progress.length > 0 ? (
                  data.progress.slice(0, 5).map((item) => (
                    <Link
                      className="grid gap-3 rounded-card border border-white/10 bg-white/[0.025] p-4 transition hover:border-brand-purple/50 hover:bg-white/[0.045]"
                      href={`/libro/${item.bookSlug}`}
                      key={item.id}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{item.bookTitle}</p>
                          <p className="mt-1 text-xs text-text-secondary">
                            {item.bookCategory} - actualizado{" "}
                            {formatDate(item.updated_at)}
                          </p>
                        </div>
                        <span className="text-sm text-brand-purple">
                          {item.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-blue"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-card border border-dashed border-white/15 bg-white/[0.025] p-5 text-sm leading-6 text-text-secondary">
                    Aun no hay progreso guardado. Empieza un libro desde la
                    biblioteca.
                  </div>
                )}
              </div>
            </Card>
          </aside>
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

      <BottomNavigation />
    </main>
  );
}
