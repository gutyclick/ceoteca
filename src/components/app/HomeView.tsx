"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Brain,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DollarSign,
  Flame,
  LibraryBig,
  MessageCircle,
  Percent,
  Play,
  Rocket,
  Star,
  Target,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { NotificationBell } from "@/components/app/NotificationBell";
import { FloatingSiteChat } from "@/components/chat/FloatingSiteChat";
import { Card } from "@/components/ui/Card";
import type { PlanKey } from "@/config/plans";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils/cn";
import type { Book, BookCategory } from "@/types";

type HomeViewProps = {
  books: Book[];
};

type ProgressRow = Database["public"]["Tables"]["user_book_progress"]["Row"];

type HomeAccountData = {
  fullName: string;
  plan: PlanKey;
  progress: ProgressRow[];
  chatQuestionsThisMonth: number;
};

type CollectionCard = {
  title: string;
  icon: LucideIcon;
  category: BookCategory;
};

const categoryCards = [
  {
    title: "Finanzas personales",
    className: "from-emerald-400/18 via-emerald-900/20 to-black",
    border: "border-emerald-300/20",
  },
  {
    title: "Productividad",
    className: "from-blue-500/20 via-blue-950/35 to-black",
    border: "border-blue-400/20",
  },
  {
    title: "Emprendimiento",
    className: "from-orange-500/22 via-red-950/30 to-black",
    border: "border-orange-400/20",
  },
  {
    title: "Desarrollo personal",
    className: "from-cyan-400/20 via-teal-950/30 to-black",
    border: "border-cyan-300/20",
  },
  {
    title: "Liderazgo",
    className: "from-purple-500/22 via-violet-950/32 to-black",
    border: "border-purple-300/20",
  },
] as const;

function getRemainingMinutes(book: Book, progress: number) {
  return Math.max(Math.ceil(book.readingTime * (1 - progress / 100)), 3);
}

const categoryIcons: LucideIcon[] = [DollarSign, Zap, Rocket, Brain, Target];

const collectionCards: CollectionCard[] = [
  { title: "Construye riqueza", icon: DollarSign, category: "Ingresos y riqueza" },
  { title: "Emprende desde cero", icon: Rocket, category: "Emprendimiento" },
  { title: "Mejora tu enfoque", icon: Brain, category: "Psicología y comportamiento" },
  { title: "Lidera con claridad", icon: Target, category: "Liderazgo" },
  { title: "Productividad extrema", icon: Zap, category: "Productividad" },
];

function getFirstName(name: string) {
  return name.trim().split(" ").filter(Boolean)[0] ?? "Lector";
}

function getSavedBookProgress(progressRows: ProgressRow[], bookId: string) {
  return progressRows.find((item) => item.book_id === bookId)?.progress ?? 0;
}

function getActiveDays(progressRows: ProgressRow[]) {
  return new Set(
    progressRows.map((item) => new Date(item.updated_at).toISOString().slice(0, 10)),
  ).size;
}

function getLearnedHours(progressRows: ProgressRow[], books: Book[]) {
  const minutes = progressRows.reduce((total, item) => {
    const book = books.find((currentBook) => currentBook.id === item.book_id);

    if (!book) {
      return total;
    }

    return total + book.readingTime * (item.progress / 100);
  }, 0);

  return Math.round((minutes / 60) * 10) / 10;
}

function getCategoryCount(books: Book[], title: string) {
  return books.filter((book) => book.category === title).length;
}

function getRecentLabel(index: number) {
  if (index === 0) {
    return "Hoy";
  }

  if (index === 1) {
    return "Ayer";
  }

  return `Hace ${index + 1} días`;
}

function getGradient(index: number) {
  return [
    "from-yellow-300/90 via-amber-500/80 to-orange-700/80",
    "from-purple-400/85 via-violet-700/80 to-black",
    "from-cyan-300/80 via-blue-700/70 to-black",
    "from-emerald-300/80 via-teal-800/75 to-black",
    "from-orange-300/85 via-red-800/75 to-black",
  ][index % 5];
}

function getCoverTitleLines(title: string) {
  const words = title.toUpperCase().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > 12 && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 4);
}

function getCoverTitleSize(title: string) {
  if (title.length > 28) {
    return "text-[clamp(0.9rem,4vw,1.15rem)]";
  }

  if (title.length > 18) {
    return "text-[clamp(1rem,4.5vw,1.3rem)]";
  }

  return "text-[clamp(1.1rem,5vw,1.45rem)]";
}

function MiniCover({
  book,
  index,
  className,
}: {
  book: Book;
  index: number;
  className?: string;
}) {
  const titleLines = getCoverTitleLines(book.title);

  return (
    <div
      className={cn(
        "relative aspect-[2/3] min-h-0 overflow-hidden rounded-md border border-white/15 bg-gradient-to-br p-3 shadow-[0_14px_35px_rgba(0,0,0,0.35)]",
        getGradient(index),
        className,
      )}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full border border-white/25" />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <p className="line-clamp-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/70">
          {book.category}
        </p>
        <div className="min-w-0">
          <h3
            className={cn(
              "max-w-full break-words font-black uppercase leading-[0.9] text-white",
              getCoverTitleSize(book.title),
            )}
          >
            {titleLines.map((line) => (
              <span className="block" key={line}>
                {line}
              </span>
            ))}
          </h3>
          <p className="mt-2 line-clamp-1 text-[10px] text-white/72">
            {book.author}
          </p>
        </div>
      </div>
    </div>
  );
}

function HeaderControls({ title }: { title: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-balance text-[22px] font-semibold tracking-normal">{title}</h2>
      <div className="flex shrink-0 items-center gap-2">
        <Link className="mr-2 text-sm text-brand-purple" href="/biblioteca">
          Ver todo
        </Link>
        <button
          aria-label="Anterior"
          className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06] text-text-secondary transition hover:text-white"
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={17} />
        </button>
        <button
          aria-label="Siguiente"
          className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06] text-text-secondary transition hover:text-white"
          type="button"
        >
          <ChevronRight aria-hidden="true" size={17} />
        </button>
      </div>
    </div>
  );
}

export function HomeView({ books }: HomeViewProps) {
  const [accountData, setAccountData] = useState<HomeAccountData>({
    fullName: "Lector Ceoteca",
    plan: "free",
    progress: [],
    chatQuestionsThisMonth: 0,
  });
  const primaryBook = books[0];
  const progressBookIds = new Set(accountData.progress.map((item) => item.book_id));
  const continueBooks = accountData.progress
    .map((item) => books.find((book) => book.id === item.book_id))
    .filter((book): book is Book => Boolean(book))
    .slice(0, 3);
  const trendingBooks = books.slice(0, 5);
  const recommendedBook =
    books.find((book) => !progressBookIds.has(book.id)) ??
    books.find((book) => book.slug.includes("deep")) ??
    books[2] ??
    primaryBook;
  const showNewUserOffer = accountData.plan === "free";
  const activeDays = getActiveDays(accountData.progress);
  const learnedHours = getLearnedHours(accountData.progress, books);
  const completedBooks = accountData.progress.filter((item) => item.completed).length;
  const firstName = getFirstName(accountData.fullName);

  useEffect(() => {
    let isMounted = true;

    async function loadAccountData() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          return;
        }

        const userId = userData.user.id;
        const [profileResponse, progressResponse, usageResponse] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("full_name,plan")
              .eq("id", userId)
              .maybeSingle(),
            supabase
              .from("user_book_progress")
              .select("*")
              .eq("user_id", userId)
              .order("updated_at", { ascending: false }),
            supabase
              .from("chat_usage")
              .select("question_count")
              .eq("user_id", userId)
              .eq("month", `${new Date().toISOString().slice(0, 7)}-01`),
          ]);

        if (profileResponse.error) {
          throw profileResponse.error;
        }

        if (isMounted) {
          setAccountData({
            fullName:
              profileResponse.data?.full_name ??
              userData.user.email?.split("@")[0] ??
              "Lector Ceoteca",
            plan: profileResponse.data?.plan ?? "free",
            progress: progressResponse.data ?? [],
            chatQuestionsThisMonth: (usageResponse.data ?? []).reduce(
              (total, item) => total + item.question_count,
              0,
            ),
          });
        }
      } catch {
        if (isMounted) {
          setAccountData((current) => current);
        }
      }
    }

    void loadAccountData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!primaryBook) {
    return (
      <main className="min-h-screen bg-background text-text-primary">
        <section className="ceoteca-container ceoteca-section">
          <h1 className="text-3xl font-semibold">Biblioteca en preparacion</h1>
          <p className="mt-3 text-text-secondary">
            Aún no hay libros publicados en Supabase.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen overflow-x-clip bg-[#03040b] pb-16 pl-[var(--dashboard-sidebar-offset,84px)] text-text-primary transition-[padding] duration-300 ease-out"
    >
      <DashboardSidebar active="home" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_22%_12%,rgba(124,58,237,0.18),transparent_30%),radial-gradient(circle_at_70%_0%,rgba(79,99,255,0.1),transparent_24%),linear-gradient(180deg,#02030a_0%,#050612_42%,#04040a_100%)]" />

      <section className="mx-auto w-full max-w-[1500px] px-4 pt-4 sm:px-5 md:px-8 xl:px-10">
        <header className="flex items-center justify-end">
          <NotificationBell />
        </header>

        <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-end">
          <div className="reveal-up min-w-0">
            <p className="text-lg font-medium text-brand-purple">
              Hola, {firstName}
            </p>
            <h1 className="mt-5 max-w-[720px] text-balance text-[clamp(2.25rem,7vw,4.75rem)] font-black leading-[0.98] tracking-normal text-white">
              ¿Qué quieres mejorar{" "}
              <span className="bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">
                hoy?
              </span>
            </h1>
          </div>

          <Card className="reveal-up min-h-[164px] rounded-[18px] border-white/10 bg-white/[0.035] p-5 [animation-delay:120ms] sm:p-6">
            <div className="flex h-full items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Actividad actual</p>
                <p className="mt-6 text-5xl font-bold">{activeDays}</p>
                <p className="mt-2 text-sm text-text-secondary">días con aprendizaje</p>
              </div>
              <div className="grid h-full content-end">
                <div className="flex h-[88px] items-end gap-3">
                  {[18, 30, 42, 56, 72, 88].map((height, index) => (
                    <span
                      className="w-2.5 rounded-full bg-gradient-to-t from-brand-blue to-brand-purple shadow-[0_0_18px_rgba(124,58,237,0.45)]"
                      key={height}
                      style={{ height, opacity: 0.55 + index * 0.08 }}
                    />
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-7 text-center text-xs text-text-muted">
                  {["L", "M", "M", "J", "V", "S", "D"].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))] gap-5">
          {categoryCards.map((card, index) => {
            const Icon = categoryIcons[index] ?? LibraryBig;
            const count = getCategoryCount(books, card.title);

            return (
            <Link className="group reveal-up" href="/biblioteca" key={card.title}>
              <Card
                className={cn(
                  "relative h-[190px] overflow-hidden rounded-[14px] bg-gradient-to-br p-5 transition duration-300 group-hover:-translate-y-1",
                  card.className,
                  card.border,
                )}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.13),transparent_33%)]" />
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div className="grid place-items-center pt-2">
                    <span className="grid h-[72px] w-[72px] place-items-center rounded-[1.25rem] border border-white/10 bg-white/[0.06] text-brand-purple shadow-[0_0_30px_rgba(124,58,237,0.35)]">
                      <Icon aria-hidden="true" size={36} />
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">{card.title}</h2>
                      <p className="mt-1 text-sm text-text-secondary">
                        {count} {count === 1 ? "libro" : "libros"}
                      </p>
                    </div>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.07] text-text-secondary transition group-hover:bg-white/[0.14] group-hover:text-white">
                      <ArrowRight aria-hidden="true" size={18} />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
            );
          })}
        </section>

        {showNewUserOffer ? (
          <Card className="mt-6 overflow-hidden rounded-[16px] border-brand-purple/35 bg-gradient-to-r from-brand-purple/20 via-white/[0.035] to-brand-blue/10 p-5">
            <div className="grid gap-5 md:grid-cols-[72px_1fr_auto] md:items-center">
              <span className="grid h-16 w-16 place-items-center rounded-[1.25rem] border border-brand-purple/40 bg-brand-purple/20 text-brand-purple shadow-[0_0_35px_rgba(124,58,237,0.35)]">
                <Percent aria-hidden="true" size={30} />
              </span>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-purple">
                  Oferta única para usuarios nuevos
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  15% de descuento en tu primer mes
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Activa audio, chat con IA y todas las experiencias premium
                  desde Pro. Esta oferta solo aparece para usuarios nuevos en
                  plan Gratis.
                </p>
              </div>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-button bg-brand-gradient px-5 text-sm font-medium text-white transition hover:brightness-110"
                href="/planes?plan=pro&offer=new-user-15"
              >
                Mejorar plan
              </Link>
            </div>
          </Card>
        ) : null}

        <section className="mt-8">
          <HeaderControls title="Continuar aprendiendo" />
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-5">
            {continueBooks.length > 0 ? (
              continueBooks.map((book, index) => {
              const progress = getSavedBookProgress(accountData.progress, book.id);

              return (
                <Card
                  className="h-[156px] rounded-[14px] border-white/10 bg-white/[0.035] p-4"
                  key={book.id}
                >
                  <div className="grid h-full grid-cols-[80px_minmax(0,1fr)_46px] items-center gap-4 sm:grid-cols-[88px_minmax(0,1fr)_46px] sm:gap-5">
                    <MiniCover book={book} className="h-[120px] w-[80px]" index={index} />
                    <div className="min-w-0">
                      <p className="text-lg font-bold">
                        {progress}%{" "}
                        <span className="text-sm font-normal text-white">
                          completado
                        </span>
                      </p>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-blue"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-4 text-sm text-text-secondary">
                        {getRemainingMinutes(book, progress)} min restantes
                      </p>
                    </div>
                    <Link
                      aria-label={`Continuar ${book.title}`}
                      className="grid h-12 w-12 place-items-center rounded-full bg-white/[0.08] text-white transition hover:bg-brand-purple"
                      href={`/libro/${book.slug}`}
                    >
                      <Play aria-hidden="true" fill="currentColor" size={18} />
                    </Link>
                  </div>
                </Card>
              );
              })
            ) : (
              <Card className="rounded-[14px] border-dashed border-white/15 bg-white/[0.025] p-6 md:col-span-full">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      Empieza tu primera experiencia
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                      Explora la biblioteca y guarda tu progreso mientras avanzas
                      por ideas, ejercicios y recomendaciones editoriales.
                    </p>
                  </div>
                  <Link
                    className="inline-flex min-h-12 items-center justify-center rounded-button bg-brand-gradient px-5 text-sm font-medium text-white transition hover:brightness-110"
                    href="/biblioteca"
                  >
                    Ir a biblioteca
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-[22px] font-semibold">Recomendado para ti</h2>
          <Card className="mt-4 overflow-hidden rounded-[14px] border-white/10 bg-white/[0.032] p-5">
            <div className="grid gap-6 md:grid-cols-[130px_minmax(0,1fr)] xl:grid-cols-[140px_minmax(0,1.2fr)_minmax(220px,0.9fr)_240px] xl:items-center">
              <MiniCover
                book={recommendedBook}
                className="h-[190px] w-[128px] max-md:mx-auto"
                index={2}
              />
              <div>
                <span className="inline-flex rounded-full bg-brand-purple/20 px-4 py-1 text-sm text-brand-purple">
                  Recomendación CEOTECA
                </span>
                <h3 className="mt-5 text-2xl font-semibold">
                  {accountData.progress.length > 0
                    ? "Basado en tus lecturas"
                    : "Para comenzar tu ruta"}
                </h3>
                <p className="mt-4 max-w-sm text-sm leading-7 text-text-secondary">
                  {accountData.progress.length > 0
                    ? "Seleccionamos esta experiencia por tu historial de lectura y progreso reciente."
                    : "Esta experiencia es una buena entrada para descubrir cómo funciona Ceoteca."}
                </p>
              </div>
              <div className="space-y-4 text-sm">
                <p className="text-text-secondary">
                  {accountData.progress.length > 0
                    ? "Relacionado con:"
                    : "Ideal para:"}
                </p>
                {(continueBooks.length > 0 ? continueBooks : books.slice(0, 2)).slice(0, 2).map((book) => (
                  <p className="flex items-center gap-2 text-text-secondary" key={book.id}>
                    <CheckCircle2
                      aria-hidden="true"
                      className="text-white"
                      size={16}
                    />
                    {book.title}
                  </p>
                ))}
              </div>
              <div className="relative min-h-[190px] md:col-span-2 xl:col-span-1">
                <div className="ceoteca-orbit absolute inset-0 opacity-75 max-md:hidden" />
                <Link
                  className="absolute bottom-0 right-0 inline-flex min-h-14 min-w-52 items-center justify-center gap-3 rounded-button border border-brand-purple/80 bg-brand-purple/20 px-5 text-white shadow-[0_0_32px_rgba(168,85,247,0.42)] transition hover:bg-brand-purple/35 max-sm:static max-sm:w-full"
                  href={`/libro/${recommendedBook.slug}`}
                >
                  Explorar libro
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-6">
          <HeaderControls title="Trending en CEOTECA" />
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-5">
            {trendingBooks.map((book, index) => (
              <Link href={`/libro/${book.slug}`} key={book.id}>
                <Card
                  className={cn(
                    "min-h-[205px] rounded-[13px] bg-gradient-to-br p-5",
                    [
                      "from-purple-600/20 via-violet-950/35 to-black",
                      "from-emerald-500/18 via-teal-950/35 to-black",
                      "from-orange-500/20 via-red-950/35 to-black",
                      "from-blue-500/20 via-blue-950/35 to-black",
                      "from-fuchsia-500/18 via-purple-950/35 to-black",
                    ][index],
                  )}
                  interactive
                >
                  <h3 className="text-balance text-xl font-bold uppercase leading-tight">
                    {book.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary">{book.author}</p>
                  <div className="mt-8 grid gap-2 text-sm text-text-secondary">
                    <p className="flex items-center gap-2">
                      <Clock3 aria-hidden="true" size={15} />
                      {book.readingTime} min
                    </p>
                    <p className="flex items-center gap-2">
                      <Star aria-hidden="true" className="text-brand-purple" size={15} />
                      {(5 - index * 0.04).toFixed(1)}
                    </p>
                    <p className="flex items-center gap-2">
                      <Bot aria-hidden="true" size={15} />
                      IA incluida
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <HeaderControls title="Colecciones populares" />
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-5">
            {collectionCards.map(({ title, icon: Icon, category }) => {
              const count = getCategoryCount(books, category);

              return (
              <Link href="/biblioteca" key={title}>
                <Card className="flex min-h-[116px] items-center justify-between rounded-[13px] bg-white/[0.035] p-5" interactive>
                  <div>
                    <h3 className="max-w-36 text-lg font-semibold leading-tight">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm text-text-secondary">
                      {count} {count === 1 ? "libro" : "libros"}
                    </p>
                  </div>
                  <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-white/[0.06] text-brand-purple drop-shadow-[0_0_24px_rgba(124,58,237,0.45)]">
                    <Icon aria-hidden="true" size={26} />
                  </span>
                </Card>
              </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-[13px] bg-white/[0.035] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Tu progreso</h2>
              <Link className="text-sm text-brand-purple" href="/biblioteca">
                Ver estadisticas
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,140px),1fr))] gap-4">
              {[
                [`${accountData.progress.length}`, "Libros iniciados", LibraryBig, "text-emerald-300"],
                [`${completedBooks}`, "Libros completados", CheckCircle2, "text-yellow-300"],
                [`${learnedHours}`, "Horas aprendidas", Flame, "text-red-300"],
                [`${accountData.chatQuestionsThisMonth}`, "Preguntas a la IA", MessageCircle, "text-blue-300"],
              ].map(([value, label, Icon, color]) => (
                <div className="flex gap-3" key={label as string}>
                  <span
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-button bg-white/[0.06]",
                      color as string,
                    )}
                  >
                    <Icon aria-hidden="true" size={18} />
                  </span>
                  <div>
                    <p className="text-xl font-semibold">{value as string}</p>
                    <p className="text-xs leading-4 text-text-secondary">
                      {label as string}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[13px] bg-white/[0.035] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Actividad reciente</h2>
              <Link className="text-sm text-brand-purple" href="/biblioteca">
                Ver todo
              </Link>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              {continueBooks.length > 0 ? (
                continueBooks.map((book, index) => (
                <div className="grid gap-2 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-3" key={book.id}>
                  <p className="flex items-center gap-2 text-text-secondary">
                    <CheckCircle2 aria-hidden="true" className="text-success" size={16} />
                    {getRecentLabel(index)}
                  </p>
                  <p>
                    {getSavedBookProgress(accountData.progress, book.id) >= 100
                      ? "Completaste"
                      : "Continuaste"}{" "}
                    {book.title}
                  </p>
                </div>
                ))
              ) : (
                <div className="rounded-card border border-dashed border-white/15 bg-white/[0.025] p-4 text-text-secondary">
                  Tu actividad aparecerá aquí cuando empieces un libro.
                </div>
              )}
            </div>
          </Card>
        </section>

        <footer className="mt-10 border-t border-white/10 py-8 text-sm text-text-muted">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p>&copy; 2026 Ceoteca. Todos los derechos reservados.</p>
            <nav
              aria-label="Legal del dashboard"
              className="flex flex-wrap gap-x-5 gap-y-2"
            >
              <Link className="transition hover:text-text-primary" href="/terminos">
                Términos
              </Link>
              <Link className="transition hover:text-text-primary" href="/privacidad">
                Privacidad
              </Link>
              <Link
                className="transition hover:text-text-primary"
                href="mailto:hola@ceoteca.com"
              >
                Soporte
              </Link>
            </nav>
          </div>
        </footer>
      </section>
      <FloatingSiteChat plan={accountData.plan} />
    </main>
  );
}

