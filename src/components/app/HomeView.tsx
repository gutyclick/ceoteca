"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Flame,
  Lightbulb,
  MoreVertical,
  Send,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { DashboardAccountMenu } from "@/components/app/DashboardAccountMenu";
import { NotificationBell } from "@/components/app/NotificationBell";
import type { PlanKey } from "@/config/plans";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { resolvePlanFromSubscriptions } from "@/lib/subscriptions/resolve";
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

type CategoryShortcut = {
  label: string;
  category: BookCategory;
  icon: LucideIcon;
  iconClassName: string;
};

const categoryShortcuts: CategoryShortcut[] = [
  {
    label: "Liderazgo",
    category: "Liderazgo",
    icon: Trophy,
    iconClassName: "text-amber-500",
  },
  {
    label: "Productividad",
    category: "Productividad",
    icon: Zap,
    iconClassName: "text-orange-500",
  },
  {
    label: "Ventas",
    category: "Ventas",
    icon: Target,
    iconClassName: "text-emerald-500",
  },
  {
    label: "Dinero",
    category: "Finanzas personales",
    icon: CircleDollarSign,
    iconClassName: "text-green-600",
  },
  {
    label: "Negocios",
    category: "Emprendimiento",
    icon: BriefcaseBusiness,
    iconClassName: "text-blue-600",
  },
];

const actionChips = [
  "Comparar libros",
  "Crear plan",
  "Explicar concepto",
  "Aplicarlo a mi negocio",
  "Resumir capítulo",
] as const;

const faqs = [
  "¿Cómo funcionan los análisis en Ceoteca?",
  "¿Cómo se crean los análisis?",
  "¿Puedo cancelar cuando quiera?",
  "¿Qué pasa en el periodo de prueba?",
] as const;

function getFirstName(name: string) {
  return name.trim().split(" ").filter(Boolean)[0] ?? "Lector";
}

function getProgress(progressRows: ProgressRow[], bookId: string) {
  return progressRows.find((item) => item.book_id === bookId)?.progress ?? 0;
}

function getActiveDays(progressRows: ProgressRow[]) {
  return new Set(
    progressRows.map((item) => new Date(item.updated_at).toISOString().slice(0, 10)),
  ).size;
}

function getLearnedMinutes(progressRows: ProgressRow[], books: Book[]) {
  return progressRows.reduce((total, item) => {
    const book = books.find((currentBook) => currentBook.id === item.book_id);

    if (!book) {
      return total;
    }

    return total + Math.round(book.readingTime * (item.progress / 100));
  }, 0);
}

function getCategoryBooks(books: Book[], category: BookCategory) {
  return books.filter((book) => book.category === category);
}

function BookThumb({
  book,
  className,
  sizes = "120px",
}: {
  book: Book;
  className?: string;
  sizes?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[14px] border border-slate-950/[0.08] bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-[0_16px_42px_rgba(15,23,42,0.12)]",
        className,
      )}
    >
      {book.cover.imagePath ? (
        <Image
          alt={`Portada editorial de ${book.title}`}
          className="object-cover"
          fill
          sizes={sizes}
          src={book.cover.imagePath}
        />
      ) : (
        <div className="flex h-full flex-col justify-between p-3 text-white">
          <p className="line-clamp-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/75">
            {book.category}
          </p>
          <h3 className="line-clamp-4 text-base font-black leading-[0.95]">
            {book.title}
          </h3>
          <p className="line-clamp-1 text-[10px] text-white/75">{book.author}</p>
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  href = "/biblioteca",
  label = "Ver todos",
}: {
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-xl font-black tracking-[-0.02em] text-slate-950">
        {title}
      </h2>
      <Link
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-violet-700"
        href={href}
      >
        {label}
        <ArrowRight aria-hidden="true" size={16} />
      </Link>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-700 to-indigo-500"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
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
        const [profileResponse, subscriptionResponse, progressResponse, usageResponse] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("full_name,plan")
              .eq("id", userId)
              .maybeSingle(),
            supabase
              .from("subscriptions")
              .select("plan,status,updated_at")
              .eq("user_id", userId)
              .order("updated_at", { ascending: false }),
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

        if (subscriptionResponse.error) {
          throw subscriptionResponse.error;
        }

        const effectivePlan = resolvePlanFromSubscriptions({
          profilePlan: profileResponse.data?.plan ?? "free",
          subscriptions: subscriptionResponse.data ?? [],
        }).plan;

        if (isMounted) {
          setAccountData({
            fullName:
              profileResponse.data?.full_name ??
              userData.user.email?.split("@")[0] ??
              "Lector Ceoteca",
            plan: effectivePlan,
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

  const firstName = getFirstName(accountData.fullName);
  const firstBook = books[0];
  const continueBooks = accountData.progress
    .map((item) => books.find((book) => book.id === item.book_id))
    .filter((book): book is Book => Boolean(book))
    .slice(0, 5);
  const continueHero = continueBooks[0] ?? books.find((book) => book.progress) ?? firstBook;
  const continueHeroProgress = continueHero
    ? Math.max(getProgress(accountData.progress, continueHero.id), continueHero.progress ?? 0)
    : 0;
  const learningBooks = (continueBooks.length > 0 ? continueBooks : books.slice(1, 6)).slice(0, 5);
  const activeDays = getActiveDays(accountData.progress);
  const completedBooks = accountData.progress.filter((item) => item.completed).length;
  const learnedMinutes = getLearnedMinutes(accountData.progress, books);

  if (!firstBook) {
    return (
      <main className="min-h-screen bg-[#fbfaf8] text-slate-950">
        <section className="ceoteca-container ceoteca-section">
          <h1 className="text-3xl font-black">Biblioteca en preparación</h1>
          <p className="mt-3 text-slate-600">
            Aún no hay libros publicados en Supabase.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#fbfaf8] pb-8 pl-0 text-slate-950 transition-[padding] duration-300 ease-out sm:pl-[var(--dashboard-sidebar-offset,84px)]">
      <DashboardSidebar active="home" tone="light" />

      <section className="mx-auto w-full max-w-[1380px] px-5 pt-8 sm:px-7 lg:px-10">
        <header className="grid gap-4 border-b border-slate-950/[0.08] pb-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div>
            <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950">Inicio</h1>
            <p className="mt-2 text-base text-slate-600">Tu espacio personal de aprendizaje.</p>
          </div>

          <div className="flex items-center justify-end gap-4">
            <NotificationBell tone="light" />
            <DashboardAccountMenu />
          </div>
        </header>

        <section className="mt-10">
          <h1 className="text-balance text-[clamp(2rem,4vw,3rem)] font-black tracking-[-0.04em]">
            Buenos días, {firstName} 👋
          </h1>
          <p className="mt-2 text-lg font-medium text-slate-500">
            ¿Qué quieres mejorar hoy?
          </p>

          <div className="mt-7 flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {categoryShortcuts.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  className="inline-flex h-14 min-w-[150px] shrink-0 items-center justify-center gap-3 rounded-[16px] border border-slate-950/[0.08] bg-white px-5 text-sm font-black text-slate-800 shadow-[0_14px_36px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-violet-200"
                  href={`/biblioteca?categoria=${encodeURIComponent(item.category)}`}
                  key={item.label}
                >
                  <Icon aria-hidden="true" className={item.iconClassName} size={20} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              aria-label="Ver más categorías"
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-slate-950/[0.08] bg-white text-slate-700 shadow-[0_14px_36px_rgba(15,23,42,0.04)] transition hover:text-violet-700"
              href="/biblioteca"
            >
              <ChevronRight aria-hidden="true" size={22} />
            </Link>
          </div>
        </section>

        <section className="mt-9">
          <SectionHeader title="Continúa donde te quedaste" />
          <article className="grid gap-6 rounded-[22px] border border-slate-950/[0.08] bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.05)] md:grid-cols-[120px_minmax(0,1fr)_auto] md:items-center">
            <BookThumb
              book={continueHero}
              className="mx-auto h-[164px] w-[112px] md:mx-0"
              sizes="112px"
            />
            <div className="min-w-0">
              <h2 className="text-2xl font-black leading-tight">
                {continueHero.title}
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                {continueHero.author}
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_52px] sm:items-center">
                <ProgressBar value={continueHeroProgress} />
                <span className="text-sm font-black text-slate-500">
                  {continueHeroProgress}%
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-5 text-sm font-medium text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <BookMarked aria-hidden="true" size={16} />
                  {continueHero.keyPoints.length} ideas clave
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 aria-hidden="true" size={16} />
                  {continueHero.activities.length} ejercicios
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
              <div className="flex gap-2 text-slate-500">
                <button
                  aria-label="Guardar en favoritos"
                  className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-50"
                  type="button"
                >
                  <BookMarked aria-hidden="true" size={18} />
                </button>
                <button
                  aria-label="Más opciones"
                  className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-50"
                  type="button"
                >
                  <MoreVertical aria-hidden="true" size={18} />
                </button>
              </div>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-violet-700 to-indigo-600 px-6 text-sm font-black text-white shadow-[0_18px_45px_rgba(124,58,237,0.20)] transition hover:brightness-105"
                href={`/libro/${continueHero.slug}`}
              >
                Continuar leyendo
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </article>
        </section>

        <section className="mt-9">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-xl font-black tracking-[-0.02em]">
              Pregunta a tu biblioteca
            </h2>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
              Con IA
            </span>
          </div>
          <div className="rounded-[22px] border border-slate-950/[0.08] bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.05)]">
            <div className="grid gap-4 md:grid-cols-[1fr_54px] md:items-center">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  ¿Qué te gustaría saber o aplicar hoy?
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600" type="button">
                    ¿Cómo aplico las ideas de Hábitos Atómicos para dejar la procrastinación?
                  </button>
                  <button className="rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600" type="button">
                    Compara Padre Rico con El inversor inteligente
                  </button>
                </div>
              </div>
              <button
                aria-label="Enviar pregunta"
                className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-r from-violet-700 to-indigo-600 text-white shadow-[0_16px_35px_rgba(124,58,237,0.24)] md:justify-self-end"
                type="button"
              >
                <Send aria-hidden="true" size={19} />
              </button>
            </div>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {actionChips.map((item) => (
              <button
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[14px] border border-slate-950/[0.08] bg-white px-5 text-xs font-black text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
                key={item}
                type="button"
              >
                <Sparkles aria-hidden="true" size={15} />
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-9">
          <SectionHeader title="Continúa aprendiendo" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {learningBooks.map((book) => {
              const progress = Math.max(
                getProgress(accountData.progress, book.id),
                book.progress ?? 0,
              );

              return (
                <Link
                  className="group rounded-[18px] border border-slate-950/[0.08] bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-violet-200"
                  href={`/libro/${book.slug}`}
                  key={book.id}
                >
                  <BookThumb
                    book={book}
                    className="aspect-[4/3] w-full rounded-[12px]"
                    sizes="(min-width: 1024px) 180px, 45vw"
                  />
                  <h3 className="mt-4 line-clamp-2 text-base font-black leading-tight">
                    {book.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                    {book.author}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm font-bold text-slate-500">
                    <span>{progress}%</span>
                    <span>{book.readingTime} min</span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={progress} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-9">
          <SectionHeader title="Colecciones recomendadas para ti" label="Ver todas" />
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                title: "Para emprendedores",
                description: "Los mejores análisis para emprender con claridad.",
                icon: "🚀",
                category: "Emprendimiento" as BookCategory,
              },
              {
                title: "Finanzas personales",
                description: "Aprende a gestionar, invertir y multiplicar tu dinero.",
                icon: "💰",
                category: "Finanzas personales" as BookCategory,
              },
              {
                title: "Liderazgo",
                description: "Desarrolla tu liderazgo e inspira equipos.",
                icon: "📈",
                category: "Liderazgo" as BookCategory,
              },
            ].map((collection) => {
              const collectionBooks = getCategoryBooks(books, collection.category).slice(0, 4);

              return (
                <Link
                  className="rounded-[18px] border border-slate-950/[0.08] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-violet-200"
                  href={`/biblioteca?categoria=${encodeURIComponent(collection.category)}`}
                  key={collection.title}
                >
                  <h3 className="text-lg font-black">
                    <span className="mr-2">{collection.icon}</span>
                    {collection.title}
                  </h3>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
                    {collection.description}
                  </p>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div className="flex -space-x-2">
                      {collectionBooks.map((book) => (
                        <BookThumb
                          book={book}
                          className="h-12 w-9 rounded-md ring-2 ring-white"
                          key={book.id}
                          sizes="36px"
                        />
                      ))}
                    </div>
                    <span className="rounded-[12px] border border-slate-950/[0.08] bg-slate-50 px-3 py-2 text-center text-xs font-bold text-slate-500">
                      {getCategoryBooks(books, collection.category).length}
                      <span className="block font-medium">análisis</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-9 grid gap-5 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[20px] border border-slate-950/[0.08] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between border-b border-slate-950/[0.06] p-5">
              <h2 className="text-xl font-black">Tu progreso</h2>
              <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-violet-700" href="/perfil">
                Ver estadísticas
                <ArrowRight aria-hidden="true" size={15} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2">
              {[
                [`${accountData.progress.length}`, "análisis leídos", BookOpen, "text-violet-700"],
                [`${completedBooks}`, "ejercicios aplicados", CheckCircle2, "text-emerald-600"],
                [`${learnedMinutes}`, "minutos aprendidos", Target, "text-blue-600"],
                [`${activeDays}`, "días de racha", Flame, "text-orange-500"],
              ].map(([value, label, Icon, color]) => (
                <div className="flex gap-4 border-b border-slate-950/[0.06] p-5 even:sm:border-l" key={label as string}>
                  <span className={cn("grid h-11 w-11 place-items-center rounded-[14px] bg-slate-50", color as string)}>
                    <Icon aria-hidden="true" size={22} />
                  </span>
                  <div>
                    <p className="text-3xl font-black">{value as string}</p>
                    <p className="text-sm text-slate-500">{label as string}</p>
                    <p className="mt-1 text-xs font-bold text-emerald-600">
                      ↑ esta semana
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] border border-slate-950/[0.08] bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-black">Insights de la IA</h2>
            <p className="mt-1 text-sm text-slate-500">Basado en lo que has leído</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-[1fr_150px] sm:items-center">
              <div>
                <p className="font-black leading-6">
                  Lees mucho sobre productividad. Prueba una ruta corta sobre ventas.
                </p>
                <p className="mt-4 text-sm text-slate-500">
                  Te recomendamos explorar:
                </p>
                <div className="mt-3 grid divide-y divide-slate-100 text-sm font-medium text-slate-600">
                  {["Psicología de Ventas", "Vendes o Vendes", "El pequeño libro rojo de las ventas"].map((item) => (
                    <span className="py-2" key={item}>{item}</span>
                  ))}
                </div>
              </div>
              <div className="grid h-36 place-items-center rounded-[24px] bg-violet-50 text-violet-700">
                <Lightbulb aria-hidden="true" size={64} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[20px] border border-slate-950/[0.08] bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
            <h2 className="text-lg font-black">Idea para aplicar hoy</h2>
            <blockquote className="mt-4 border-l-4 border-violet-600 pl-4 text-sm font-black leading-6">
              La mayoría de personas crean hábitos demasiado grandes.
            </blockquote>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Hoy hazlo tan pequeño que no puedas fallar.
              </p>
              <button className="rounded-[12px] bg-violet-700 px-4 py-2 text-sm font-black text-white" type="button">
                Marcar como hecho
              </button>
            </div>
          </div>

          <div className="rounded-[20px] border border-slate-950/[0.08] bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
            <h2 className="text-lg font-black">Preguntas frecuentes</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {faqs.map((faq) => (
                <button
                  className="flex w-full items-center justify-between py-2.5 text-left text-sm font-medium text-slate-700"
                  key={faq}
                  type="button"
                >
                  {faq}
                  <ChevronRight aria-hidden="true" size={16} />
                </button>
              ))}
            </div>
            <Link className="mt-2 inline-flex items-center gap-2 text-sm font-black text-violet-700" href="/biblioteca">
              Ver todas las preguntas
              <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>
        </section>

        <section className="mt-8 rounded-[22px] bg-gradient-to-r from-violet-700 to-indigo-600 p-6 text-white shadow-[0_24px_70px_rgba(124,58,237,0.25)] md:grid md:grid-cols-[1fr_auto] md:items-center md:gap-8">
          <div className="flex gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-white/16">
              <Sparkles aria-hidden="true" size={26} />
            </span>
            <div>
              <h2 className="text-2xl font-black">
                Convierte ideas en acción todos los días
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Aprende, aplica y mejora con el poder de la IA y los mejores análisis.
              </p>
            </div>
          </div>
          <Link
            className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-white px-6 text-sm font-black text-violet-700 md:mt-0"
            href="/biblioteca"
          >
            Explorar toda la biblioteca
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </section>

        <footer className="mt-8 flex flex-col gap-3 border-t border-slate-950/[0.08] py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Ceoteca. Todos los derechos reservados.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal del dashboard">
            <Link className="hover:text-violet-700" href="/terminos">Términos</Link>
            <Link className="hover:text-violet-700" href="/privacidad">Privacidad</Link>
            <Link className="hover:text-violet-700" href="mailto:hola@ceoteca.com">Soporte</Link>
          </nav>
        </footer>
      </section>

    </main>
  );
}
