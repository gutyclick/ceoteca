"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Crown,
  Flame,
  LibraryBig,
  Loader2,
  Lock,
  Pencil,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { NotificationBell } from "@/components/app/NotificationBell";
import { plans } from "@/config/plans";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { resolvePlanFromSubscriptions } from "@/lib/subscriptions/resolve";
import { cn } from "@/lib/utils/cn";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProgressRow = Database["public"]["Tables"]["user_book_progress"]["Row"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type BookRow = Database["public"]["Tables"]["books"]["Row"];
type ChatMessageRow = Database["public"]["Tables"]["chat_messages"]["Row"];
type FavoriteRow = Database["public"]["Tables"]["user_book_favorites"]["Row"];

type ProgressItem = ProgressRow & {
  bookTitle: string;
  bookCategory: string;
  bookSlug: string;
};

type ActivityItem = {
  id: string;
  href: string;
  title: string;
  detail: string;
  createdAt: string;
  icon: LucideIcon;
};

type ProfileData = {
  userId: string;
  email: string;
  profile: ProfileRow;
  subscription: SubscriptionRow | null;
  effectivePlan: ProfileRow["plan"];
  progress: ProgressItem[];
  chatQuestionsThisMonth: number;
  activity: ActivityItem[];
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

function formatRelativeDate(value: string) {
  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const diffDays = Math.max(0, Math.floor(diffMs / 86_400_000));

  if (diffDays === 0) {
    return "Hoy";
  }

  if (diffDays === 1) {
    return "Ayer";
  }

  if (diffDays < 30) {
    return `Hace ${diffDays} días`;
  }

  return formatDate(value);
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

function getActiveDays(progress: ProgressItem[], activity: ActivityItem[] = []) {
  return new Set(
    [
      ...progress.map((item) => item.updated_at),
      ...activity.map((item) => item.createdAt),
    ].map((value) => new Date(value).toISOString().slice(0, 10)),
  ).size;
}

function buildActivityItems({
  progress,
  chatMessages,
  favorites,
  bookMap,
}: {
  progress: ProgressItem[];
  chatMessages: ChatMessageRow[];
  favorites: FavoriteRow[];
  bookMap: Map<string, Pick<BookRow, "title" | "category" | "slug">>;
}) {
  const progressItems: ActivityItem[] = progress.map((item) => ({
    id: `progress-${item.id}`,
    href: `/libro/${item.bookSlug}`,
    title: item.completed
      ? `Completaste ${item.bookTitle}`
      : `Continuaste ${item.bookTitle}`,
    detail: `${item.progress}% leído · ${item.bookCategory}`,
    createdAt: item.updated_at,
    icon: BookOpen,
  }));

  const chatItems: ActivityItem[] = chatMessages.map((item) => {
    const book = bookMap.get(item.book_id);

    return {
      id: `chat-${item.id}`,
      href: book ? `/libro/${book.slug}` : "/home",
      title: book ? `Preguntaste a CEO sobre ${book.title}` : "Preguntaste a CEO",
      detail: item.content.length > 92 ? `${item.content.slice(0, 92)}...` : item.content,
      createdAt: item.created_at,
      icon: Bot,
    };
  });

  const favoriteItems: ActivityItem[] = favorites.map((item) => {
    const book = bookMap.get(item.book_id);

    return {
      id: `favorite-${item.id}`,
      href: book ? `/libro/${book.slug}` : "/biblioteca",
      title: book ? `Guardaste ${book.title}` : "Guardaste un análisis",
      detail: book?.category ?? "Favorito de tu biblioteca",
      createdAt: item.created_at,
      icon: Star,
    };
  });

  return [...progressItems, ...chatItems, ...favoriteItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);
}

function createDemoProfileData(): ProfileData {
  const now = new Date().toISOString();

  return {
    userId: "demo-user",
    email: "andres@ceoteca.com",
    isDemo: true,
    profile: {
      id: "demo-user",
      full_name: "Andrés Gómez",
      avatar_url: avatarOptions[0],
      birth_date: null,
      plan: "pro",
      founder: false,
      onboarding_completed: true,
      plan_selected_at: now,
      terms_accepted_at: now,
      terms_version: "2026-07-03",
      privacy_accepted_at: now,
      privacy_version: "2026-07-03",
      legal_acceptance_ip: null,
      legal_acceptance_user_agent: null,
      created_at: now,
      updated_at: now,
    },
    subscription: null,
    effectivePlan: "pro",
    chatQuestionsThisMonth: 4,
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
        bookTitle: "Hábitos Atómicos",
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
        bookTitle: "Trabajo profundo",
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
        bookTitle: "Padre Rico, Padre Pobre",
        bookCategory: "Finanzas personales",
        bookSlug: "padre-rico-padre-pobre",
      },
    ],
    activity: [
      {
        id: "demo-activity-1",
        href: "/libro/habitos-atomicos",
        title: "Continuaste Hábitos Atómicos",
        detail: "73% leído · Productividad",
        createdAt: now,
        icon: BookOpen,
      },
      {
        id: "demo-activity-2",
        href: "/libro/deep-work",
        title: "Completaste Trabajo profundo",
        detail: "100% leído · Productividad",
        createdAt: now,
        icon: CheckCircle2,
      },
    ],
  };
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-5 backdrop-blur-sm">
      <section className="w-full max-w-xl rounded-[24px] border border-slate-950/[0.08] bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
              Elige tu imagen
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Selecciona una imagen prealojada para tu perfil.
            </p>
          </div>
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-950/[0.10] bg-white text-slate-500 transition hover:text-violet-700"
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
                "relative aspect-square overflow-hidden rounded-[22px] border bg-slate-50 transition hover:border-violet-500",
                currentAvatar === avatarUrl
                  ? "border-violet-600 ring-4 ring-violet-100"
                  : "border-slate-200",
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
          <div className="mt-5 rounded-[14px] border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <p className="mt-5 text-xs leading-5 text-slate-500">
          {isSaving ? "Guardando imagen..." : "Puedes cambiarla cuando quieras."}
        </p>
      </section>
    </div>
  );
}

function StatCard({
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
    <section className="rounded-[18px] border border-slate-950/[0.08] bg-white p-5">
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "grid h-14 w-14 shrink-0 place-items-center rounded-[16px]",
            tone,
          )}
        >
          <Icon aria-hidden="true" size={27} />
        </span>
        <div className="min-w-0">
          <p className="text-3xl font-black tracking-[-0.04em] text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-sm font-black text-slate-950">{label}</p>
          <p className="mt-2 text-xs font-bold text-violet-700">{detail}</p>
        </div>
      </div>
    </section>
  );
}

function StreakPanel({ activeDays }: { activeDays: number }) {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <section className="rounded-[18px] border border-slate-950/[0.08] bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Flame aria-hidden="true" className="text-slate-600" size={21} />
          <h2 className="text-lg font-black text-slate-950">Racha de lectura</h2>
        </div>
        <span className="rounded-full bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700">
          {activeDays} días
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600">
        Estás en racha. Mantén un ritmo que puedas sostener.
      </p>
      <div className="mt-6 grid grid-cols-7 gap-3">
        {days.map((day, index) => {
          const isActive = index < Math.min(activeDays, 7);

          return (
            <div className="grid gap-2 text-center" key={`${day}-${index}`}>
              <span className="text-xs font-bold text-slate-500">{day}</span>
              <span
                className={cn(
                  "grid aspect-square place-items-center rounded-full border text-sm font-black",
                  isActive
                    ? "border-violet-100 bg-violet-100 text-violet-700"
                    : "border-slate-200 bg-white text-slate-300",
                )}
              >
                {isActive ? "✓" : ""}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-slate-950/[0.08] pt-5 text-sm">
        <span className="flex items-center gap-2 font-bold text-slate-700">
          <Trophy aria-hidden="true" size={18} />
          Mejor racha: {Math.max(activeDays, 5)} días
        </span>
        <ChevronRight aria-hidden="true" className="text-slate-400" size={18} />
      </div>
    </section>
  );
}

function ActivityPanel({ activity }: { activity: ActivityItem[] }) {
  return (
    <section className="rounded-[18px] border border-slate-950/[0.08] bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-950">Actividad reciente</h2>
        <Link className="text-sm font-bold text-violet-700" href="/biblioteca">
          Ver todo
        </Link>
      </div>
      <div className="mt-5 grid gap-1">
        {activity.length > 0 ? (
          activity.slice(0, 4).map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className="grid grid-cols-[44px_1fr_auto_18px] items-center gap-3 border-b border-slate-950/[0.06] py-4 last:border-b-0"
                href={item.href}
                key={item.id}
              >
                <span className="grid h-11 w-11 place-items-center rounded-[13px] bg-violet-50 text-violet-700">
                  <Icon aria-hidden="true" size={21} />
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-1 block text-sm font-black text-slate-950">
                    {item.title}
                  </span>
                  <span className="mt-1 line-clamp-1 block text-xs text-slate-500">
                    {item.detail}
                  </span>
                </span>
                <span className="whitespace-nowrap text-xs text-slate-500">
                  {formatRelativeDate(item.createdAt)}
                </span>
                <ChevronRight aria-hidden="true" className="text-slate-400" size={16} />
              </Link>
            );
          })
        ) : (
          <div className="rounded-[16px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            Aún no hay actividad. Empieza un análisis desde la biblioteca.
          </div>
        )}
      </div>
    </section>
  );
}

function AchievementCard({
  title,
  description,
  icon: Icon,
  unlocked,
  progress,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  unlocked: boolean;
  progress?: string;
}) {
  return (
    <article className="rounded-[16px] border border-slate-950/[0.08] bg-white p-4">
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "grid h-14 w-14 shrink-0 place-items-center rounded-[16px] border",
            unlocked
              ? "border-violet-200 bg-violet-100 text-violet-700"
              : "border-slate-200 bg-slate-100 text-slate-400",
          )}
        >
          <Icon aria-hidden="true" size={26} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-950">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
          <p className="mt-3 text-xs font-black text-violet-700">
            {unlocked ? "Completado" : progress ?? "En progreso"}
          </p>
        </div>
      </div>
    </article>
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
          chatMessagesResponse,
          favoritesResponse,
        ] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
          supabase
            .from("user_book_progress")
            .select("*")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false }),
          supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false }),
          supabase
            .from("chat_usage")
            .select("question_count")
            .eq("user_id", userId)
            .eq("month", `${new Date().toISOString().slice(0, 7)}-01`),
          supabase
            .from("chat_messages")
            .select("*")
            .eq("user_id", userId)
            .eq("role", "user")
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("user_book_favorites")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(8),
        ]);

        if (profileResponse.error) {
          throw profileResponse.error;
        }

        if (progressResponse.error) {
          throw progressResponse.error;
        }

        if (subscriptionResponse.error) {
          throw subscriptionResponse.error;
        }

        if (usageResponse.error) {
          throw usageResponse.error;
        }

        if (chatMessagesResponse.error) {
          throw chatMessagesResponse.error;
        }

        if (favoritesResponse.error) {
          throw favoritesResponse.error;
        }

        const profile = profileResponse.data;

        if (!profile) {
          if (isMounted) {
            setState({ status: "unauthorized" });
          }
          return;
        }

        const progressRows = progressResponse.data ?? [];
        const subscriptionRows = subscriptionResponse.data ?? [];
        const effectivePlan = resolvePlanFromSubscriptions({
          profilePlan: profile.plan,
          subscriptions: subscriptionRows,
        }).plan;
        const chatRows = chatMessagesResponse.data ?? [];
        const favoriteRows = favoritesResponse.data ?? [];
        const bookIds = [
          ...new Set([
            ...progressRows.map((item) => item.book_id),
            ...chatRows.map((item) => item.book_id),
            ...favoriteRows.map((item) => item.book_id),
          ]),
        ];
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
            bookTitle: book?.title ?? "Análisis de Ceoteca",
            bookCategory: book?.category ?? "Biblioteca",
            bookSlug: book?.slug ?? "biblioteca",
          };
        });
        const activity = buildActivityItems({
          progress,
          chatMessages: chatRows,
          favorites: favoriteRows,
          bookMap,
        });

        if (isMounted) {
          setState({
            status: "ready",
            data: {
              userId,
              email: userData.user.email ?? "sin-correo@ceoteca.com",
              profile,
              subscription: subscriptionRows[0] ?? null,
              effectivePlan,
              progress,
              activity,
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
              "No pudimos cargar tus datos en este momento. Mostramos una vista temporal.",
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
        throw new Error("Selecciona una imagen válida.");
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
      <main className="min-h-screen bg-[#fbfaf8] text-slate-950">
        <section className="mx-auto grid min-h-screen w-full max-w-xl place-items-center px-5">
          <div className="rounded-[22px] border border-slate-950/[0.08] bg-white p-8 text-center">
            <Loader2
              aria-hidden="true"
              className="mx-auto animate-spin text-violet-700"
              size={32}
            />
            <p className="mt-4 text-sm font-bold text-slate-600">
              Cargando tu perfil...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (state.status === "unauthorized") {
    return (
      <main className="min-h-screen bg-[#fbfaf8] text-slate-950">
        <section className="mx-auto grid min-h-screen w-full max-w-xl place-items-center px-5">
          <div className="rounded-[22px] border border-slate-950/[0.08] bg-white p-8 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-violet-50 text-violet-700">
              <Lock aria-hidden="true" size={28} />
            </span>
            <h1 className="mt-6 text-3xl font-black tracking-[-0.03em]">
              Inicia sesión
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Tu perfil y progreso pertenecen a tu cuenta privada.
            </p>
            <Link
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-[14px] bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-sm font-black text-white"
              href="/login"
            >
              Ir a login
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const { data, notice } = state;
  const displayName = data.profile.full_name ?? "Usuario Ceoteca";
  const plan = plans[data.effectivePlan];
  const completedBooks = data.progress.filter((item) => item.completed).length;
  const averageProgress = getAverageProgress(data.progress);
  const relativeLevel = getRelativeLevel(averageProgress, completedBooks);
  const activeDays = getActiveDays(data.progress, data.activity);
  const initials = getInitials(displayName, data.email);
  const chatLimit = plan.chatMonthlyLimit;
  const remainingChatQuestions =
    chatLimit === null ? null : Math.max(0, chatLimit - data.chatQuestionsThisMonth);
  const badges = [
    {
      title: "Primer análisis",
      description: "Completa tu primer análisis.",
      icon: BookOpen,
      unlocked: data.progress.length > 0,
      progress: "0/1",
    },
    {
      title: "Racha de 3 días",
      description: "Lee durante 3 días seguidos.",
      icon: Flame,
      unlocked: activeDays >= 3,
      progress: `${Math.min(activeDays, 3)}/3`,
    },
    {
      title: "10 horas de lectura",
      description: "Acumula 10 horas de lectura.",
      icon: Clock3,
      unlocked: data.progress.length >= 10,
      progress: `${Math.min(data.progress.length, 10)}/10`,
    },
    {
      title: "Lector constante",
      description: "Mantén una racha de 7 días.",
      icon: Trophy,
      unlocked: activeDays >= 7,
      progress: `${Math.min(activeDays, 7)}/7`,
    },
    {
      title: "Explorador",
      description: "Inicia análisis en varias categorías.",
      icon: Target,
      unlocked: data.progress.length >= 5,
      progress: `${Math.min(data.progress.length, 5)}/5`,
    },
    {
      title: "Maestro del conocimiento",
      description: "Completa 50 análisis.",
      icon: Crown,
      unlocked: completedBooks >= 50,
      progress: `${Math.min(completedBooks, 50)}/50`,
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fbfaf8] pb-12 pl-0 text-slate-950 transition-[padding] duration-300 ease-out sm:pl-[var(--dashboard-sidebar-offset,240px)]">
      <DashboardSidebar active="profile" tone="light" />

      <section className="mx-auto w-full max-w-[1380px] px-5 pt-8 sm:px-7 lg:px-10">
        <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(420px,auto)] lg:items-start">
          <div>
            <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950">
              Mi perfil
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Tu progreso, estadísticas y logros en Ceoteca.
            </p>
          </div>

          <div className="flex items-center gap-3 lg:justify-end">
            <label className="relative hidden w-[340px] sm:block">
              <span className="sr-only">Buscar en Ceoteca</span>
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={19}
              />
              <input
                className="min-h-12 w-full rounded-[14px] border border-slate-950/[0.10] bg-white pl-12 pr-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                placeholder="Buscar libros, autores o temas..."
                type="search"
              />
            </label>
            <NotificationBell />
          </div>
        </header>

        {notice ? (
          <div className="mt-6 rounded-[16px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            {notice}
          </div>
        ) : null}

        <section className="mt-8 rounded-[20px] border border-slate-950/[0.08] bg-white p-6">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
            <div className="grid gap-6 md:grid-cols-[150px_1fr] md:items-center">
              <div className="relative h-36 w-36">
                <div className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-violet-100 text-3xl font-black text-violet-700">
                  <AvatarImage
                    avatarUrl={data.profile.avatar_url}
                    initials={initials}
                  />
                </div>
                <button
                  aria-label="Cambiar imagen de perfil"
                  className="absolute bottom-0 right-1 grid h-10 w-10 place-items-center rounded-full bg-violet-600 text-white"
                  onClick={() => setIsAvatarPickerOpen(true)}
                  type="button"
                >
                  <Pencil aria-hidden="true" size={17} />
                </button>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
                    {displayName}
                  </h2>
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                    Miembro {plan.name}
                  </span>
                </div>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                  Aprendiendo cada día para convertir ideas en acción.
                </p>
                <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays aria-hidden="true" size={18} />
                    Miembro desde {formatDate(data.profile.created_at)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Crown aria-hidden="true" size={18} />
                    Plan {plan.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[18px] bg-violet-50 p-6">
              <Sparkles aria-hidden="true" className="text-violet-500" size={28} />
              <p className="mt-4 text-lg leading-7 text-slate-800">
                La lectura funciona mejor cuando termina en una decisión,
                una conversación o una acción concreta.
              </p>
              <p className="mt-4 text-sm font-black text-violet-700">
                Ceoteca
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            detail="+3 esta semana"
            icon={BookOpen}
            label="Análisis iniciados"
            tone="bg-violet-50 text-violet-700"
            value={`${data.progress.length}`}
          />
          <StatCard
            detail="+64 esta semana"
            icon={LibraryBig}
            label="Completados"
            tone="bg-emerald-50 text-emerald-700"
            value={`${completedBooks}`}
          />
          <StatCard
            detail="Sigue así"
            icon={Flame}
            label="Días de racha"
            tone="bg-orange-50 text-orange-600"
            value={`${activeDays}`}
          />
          <StatCard
            detail="Ver todos"
            icon={Trophy}
            label="Logros obtenidos"
            tone="bg-amber-50 text-amber-600"
            value={`${badges.filter((badge) => badge.unlocked).length}`}
          />
          <StatCard
            detail="Vas muy bien"
            icon={TrendingUp}
            label="Nivel de progreso"
            tone="bg-sky-50 text-sky-700"
            value={`${averageProgress}%`}
          />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
          <StreakPanel activeDays={activeDays} />
          <ActivityPanel activity={data.activity} />
        </section>

        <section className="mt-5 rounded-[20px] border border-slate-950/[0.08] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-slate-950">Logros</h2>
              <span className="text-sm font-bold text-slate-500">
                {badges.filter((badge) => badge.unlocked).length} de {badges.length} desbloqueados
              </span>
            </div>
            <button className="text-sm font-black text-violet-700" type="button">
              Ver todos los logros
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {badges.map((badge) => (
              <AchievementCard
                description={badge.description}
                icon={badge.icon}
                key={badge.title}
                progress={badge.progress}
                title={badge.title}
                unlocked={badge.unlocked}
              />
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="rounded-[20px] border border-slate-950/[0.08] bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-950">Resumen de CEO</h2>
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                IA
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Tu avance muestra constancia. El siguiente paso recomendado es
              terminar un análisis pendiente y convertir una idea en una acción
              medible esta semana. Estás por encima del {relativeLevel}% estimado
              de usuarios con actividad reciente.
            </p>
          </div>

          <div className="rounded-[20px] border border-slate-950/[0.08] bg-white p-6">
            <h2 className="text-lg font-black text-slate-950">Uso de CEO</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {remainingChatQuestions === null
                ? "Tu plan incluye consultas ampliadas con uso razonable."
                : `Te quedan ${remainingChatQuestions} preguntas este mes.`}
            </p>
            <Link
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[13px] bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-sm font-black text-white"
              href="/planes"
            >
              Mejorar plan
            </Link>
          </div>
        </section>
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
