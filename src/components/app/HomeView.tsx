"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  Target,
} from "lucide-react";

import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { DashboardAccountMenu } from "@/components/app/DashboardAccountMenu";
import { NotificationBell } from "@/components/app/NotificationBell";
import type { PlanKey } from "@/config/plans";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { resolvePlanFromSubscriptions } from "@/lib/subscriptions/resolve";
import { cn } from "@/lib/utils/cn";
import type { Book } from "@/types";

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
  const nextBook =
    learningBooks.find((book) => book.id !== continueHero.id) ??
    learningBooks[0] ??
    continueHero;
  const rhythmGoal = 5;
  const rhythmPercent = Math.min(100, Math.round((activeDays / rhythmGoal) * 100));

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
          <p className="mt-2 text-base font-medium text-slate-500">
            Retoma tu lectura y mantén un ritmo que puedas sostener.
          </p>
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
            <div className="flex items-center justify-end">
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
          <SectionHeader title="Tu progreso" href="/perfil" label="Ver perfil" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                value: accountData.progress.length,
                label: "Análisis iniciados",
                Icon: BookOpen,
                tone: "bg-violet-50 text-violet-700",
              },
              {
                value: completedBooks,
                label: "Análisis completados",
                Icon: CheckCircle2,
                tone: "bg-emerald-50 text-emerald-600",
              },
              {
                value: learnedMinutes,
                label: "Minutos aprendidos",
                Icon: Clock3,
                tone: "bg-sky-50 text-sky-600",
              },
              {
                value: activeDays,
                label: "Días con actividad",
                Icon: Flame,
                tone: "bg-orange-50 text-orange-600",
              },
            ].map(({ value, label, Icon, tone }) => (
              <article
                className="flex min-h-32 items-center gap-4 rounded-[18px] border border-slate-950/[0.08] bg-white p-5"
                key={label}
              >
                <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-[14px]", tone)}>
                  <Icon aria-hidden="true" size={23} />
                </span>
                <div>
                  <p className="text-3xl font-black tracking-[-0.03em]">{value}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
          <article className="rounded-[18px] border border-slate-950/[0.08] bg-white p-5 md:p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-violet-50 text-violet-700">
                <Target aria-hidden="true" size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black">Tu ritmo de aprendizaje</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {activeDays > 0
                    ? `Has registrado actividad en ${activeDays} ${activeDays === 1 ? "día" : "días"}.`
                    : "Comienza hoy con una lectura breve y construye un ritmo constante."}
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between gap-4 text-sm font-bold">
              <span>Meta de 5 días activos</span>
              <span className="text-violet-700">{Math.min(activeDays, rhythmGoal)}/{rhythmGoal}</span>
            </div>
            <div className="mt-3">
              <ProgressBar value={rhythmPercent} />
            </div>
          </article>

          <Link
            className="group flex items-center gap-4 rounded-[18px] border border-slate-950/[0.08] bg-white p-5 transition hover:border-violet-200"
            href={`/libro/${nextBook.slug}`}
          >
            <BookThumb book={nextBook} className="h-24 w-16 shrink-0 rounded-[10px]" sizes="64px" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-700">Siguiente lectura</p>
              <h2 className="mt-2 line-clamp-2 text-lg font-black leading-tight">{nextBook.title}</h2>
              <p className="mt-1 line-clamp-1 text-sm text-slate-500">{nextBook.author}</p>
            </div>
            <ArrowRight className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-violet-700" aria-hidden="true" size={20} />
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
