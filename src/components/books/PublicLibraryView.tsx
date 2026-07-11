"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  BarChart3,
  Bolt,
  Bookmark,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  Crown,
  Filter,
  Grid3X3,
  LibraryBig,
  List,
  MoreHorizontal,
  PlayCircle,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { DashboardAccountMenu } from "@/components/app/DashboardAccountMenu";
import { NotificationBell } from "@/components/app/NotificationBell";
import { Footer } from "@/components/marketing/Footer";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { ButtonLink } from "@/components/ui/Button";
import { plans, type PlanKey } from "@/config/plans";
import { bookCategories, filterBooks } from "@/data/books";
import { clientEnv } from "@/lib/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { resolvePlanFromSubscriptions } from "@/lib/subscriptions/resolve";
import { cn } from "@/lib/utils/cn";
import type { Book, BookCategory, BookDifficulty } from "@/types";

type PublicLibraryViewProps = {
  books: Book[];
};

type AuthState = "loading" | "public" | "private";
type ProgressRow = Database["public"]["Tables"]["user_book_progress"]["Row"];
type TimeFilter = "Todos" | "short" | "medium" | "long";
type PlanAccessFilter = "Todos" | "included" | "upgrade";
type ProgressFilter = "Todos" | "not-started" | "in-progress" | "completed";
type SortOption = "featured" | "recent" | "popular" | "continue";

const coverIcons = {
  orb: CircleDot,
  steps: BarChart3,
  bolt: Bolt,
  growth: TrendingUp,
  people: Users,
  grid: Grid3X3,
} as const;

function getBookCategories() {
  return bookCategories.filter(
    (category): category is BookCategory => category !== "Todos",
  );
}

function getProgressRow(progressRows: ProgressRow[], bookId: string) {
  return progressRows.find((item) => item.book_id === bookId);
}

function getBookProgress(progressRows: ProgressRow[], book: Book) {
  return getProgressRow(progressRows, book.id)?.progress ?? book.progress ?? 0;
}

function getProgressState(progress: number): Exclude<ProgressFilter, "Todos"> {
  if (progress >= 100) {
    return "completed";
  }

  if (progress > 0) {
    return "in-progress";
  }

  return "not-started";
}

function getTimeBucket(readingTime: number): Exclude<TimeFilter, "Todos"> {
  if (readingTime <= 10) {
    return "short";
  }

  if (readingTime <= 15) {
    return "medium";
  }

  return "long";
}

function isBookIncludedInPlan(bookIndex: number, plan: PlanKey) {
  const bookLimit = plans[plan].bookLimit;

  return bookLimit === null || bookIndex < bookLimit;
}

function getPopularityScore(book: Book) {
  return (
    (book.isFeatured ? 100 : 0) +
    book.keyPoints.length * 8 +
    book.activities.length * 5 +
    book.tags.length * 3 +
    Math.max(0, 20 - book.readingTime)
  );
}

function PrivateBookCard({
  book,
  href,
  planLocked = false,
  progress = 0,
}: {
  book: Book;
  href: string;
  planLocked?: boolean;
  progress?: number;
}) {
  const hasProgress = progress > 0;

  return (
    <Link
      className="group relative flex min-h-[310px] flex-col rounded-[18px] border border-slate-950/[0.08] bg-white p-5 transition hover:border-violet-200"
      href={href}
    >
      <button
        aria-label={`Opciones de ${book.title}`}
        className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-50 hover:text-violet-700"
        onClick={(event) => event.preventDefault()}
        type="button"
      >
        <MoreHorizontal aria-hidden="true" size={18} />
      </button>

      <div className="mx-auto w-[112px]">
        <PrivateBookCover book={book} />
      </div>

      <div className="mt-5 min-w-0">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-base font-black leading-tight text-slate-950">
          {book.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-slate-500">
          {book.author}
        </p>
      </div>

      <div className="mt-auto pt-4">
        {hasProgress ? (
          <div className="mb-4 grid grid-cols-[1fr_auto] items-center gap-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-500">{progress}%</span>
          </div>
        ) : (
          <span className="mb-4 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
            No iniciado
          </span>
        )}

        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 aria-hidden="true" size={14} />
            {book.readingTime} min de lectura
          </span>
          {planLocked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-1 font-bold text-violet-700">
              <Crown aria-hidden="true" size={12} />
              Pro
            </span>
          ) : (
            <Bookmark aria-hidden="true" size={17} />
          )}
        </div>
      </div>
    </Link>
  );
}

function PrivateBookCover({ book }: { book: Book }) {
  const Icon = coverIcons[book.cover.variant] ?? Brain;

  if (book.cover.imagePath) {
    return (
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[10px] border border-slate-950/[0.08] bg-slate-50">
        <Image
          alt={`Portada editorial de ${book.title}`}
          className="object-cover"
          fill
          sizes="112px"
          src={book.cover.imagePath}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-[10px] border border-slate-950/[0.08] bg-gradient-to-br p-3",
        book.cover.gradient,
      )}
    >
      <div className="absolute inset-0 bg-black/24" />
      <div className="relative z-10 flex h-full flex-col justify-between text-white">
        <p className="line-clamp-1 text-[8px] font-black uppercase tracking-[0.18em] text-white/75">
          {book.category}
        </p>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-[14px] bg-white/16">
          <Icon aria-hidden="true" size={25} />
        </span>
        <div>
          <h3 className="line-clamp-4 text-[1rem] font-black leading-[0.95]">
            {book.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-[10px] text-white/75">
            {book.author}
          </p>
        </div>
      </div>
    </div>
  );
}

function PublicMiniCover({
  book,
  className,
}: {
  book: Book;
  className?: string;
}) {
  const Icon = coverIcons[book.cover.variant] ?? Brain;

  if (book.cover.imagePath) {
    return (
      <div
        className={cn(
          "relative aspect-[3/4] min-h-0 w-full overflow-hidden rounded-[18px] border border-slate-950/[0.08] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)]",
          className,
        )}
      >
        <Image
          alt={`Portada editorial de ${book.title}`}
          className="object-cover"
          fill
          sizes="(min-width: 1280px) 180px, (min-width: 768px) 24vw, 40vw"
          src={book.cover.imagePath}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex aspect-[3/4] min-h-0 w-full flex-col overflow-hidden rounded-[18px] border border-slate-950/[0.08] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)]",
        className,
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-95", book.cover.gradient)} />
      <div className="absolute inset-0 bg-white/18" />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          <h3 className="line-clamp-3 text-[clamp(1.05rem,2.4vw,1.55rem)] font-black leading-[0.98] text-slate-950">
            {book.title}
          </h3>
          <p className="mt-2 line-clamp-1 text-xs font-semibold text-slate-700">
            {book.author}
          </p>
        </div>
        <div className="grid place-items-center py-4 text-white/78">
          <Icon aria-hidden="true" size={46} strokeWidth={1.7} />
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-950/12 px-2.5 py-1 text-[10px] font-bold text-slate-950">
            {book.keyPoints.length} ideas clave
          </span>
          <span className="rounded-full bg-white/35 px-2.5 py-1 text-[10px] font-bold text-slate-950">
            {book.activities.length} ejercicios
          </span>
        </div>
      </div>
    </div>
  );
}

function PublicHeroStack({ books }: { books: Book[] }) {
  const heroBooks = books.slice(0, 6);

  return (
    <div className="relative mx-auto h-[360px] w-full max-w-[560px] lg:h-[430px]">
      <div className="absolute left-[10%] top-8 w-[28%] rotate-6 opacity-95 sm:left-[9%]">
        {heroBooks[0] ? <PublicMiniCover book={heroBooks[0]} /> : null}
      </div>
      <div className="absolute left-[38%] top-2 z-10 w-[29%] -rotate-3 opacity-100">
        {heroBooks[1] ? <PublicMiniCover book={heroBooks[1]} /> : null}
      </div>
      <div className="absolute right-[4%] top-10 w-[28%] rotate-7 opacity-95">
        {heroBooks[2] ? <PublicMiniCover book={heroBooks[2]} /> : null}
      </div>
      <div className="absolute bottom-10 left-[6%] w-[27%] -rotate-6 opacity-80 blur-[0.2px]">
        {heroBooks[3] ? <PublicMiniCover book={heroBooks[3]} /> : null}
      </div>
      <div className="absolute bottom-2 left-[36%] w-[29%] rotate-2 opacity-82 blur-[0.2px]">
        {heroBooks[4] ? <PublicMiniCover book={heroBooks[4]} /> : null}
      </div>
      <div className="absolute bottom-8 right-[7%] w-[28%] -rotate-4 opacity-80 blur-[0.2px]">
        {heroBooks[5] ? <PublicMiniCover book={heroBooks[5]} /> : null}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#fbfaf8] via-[#fbfaf8]/80 to-transparent" />
    </div>
  );
}

function PublicCatalogCard({ book }: { book: Book }) {
  return (
    <Link
      className="group grid min-h-[244px] grid-cols-[96px_1fr] gap-5 rounded-[18px] border border-slate-950/[0.08] bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_24px_70px_rgba(109,40,217,0.12)]"
      href="/registro"
    >
      <PublicMiniCover book={book} className="h-[154px] rounded-[14px] p-3 shadow-[0_14px_30px_rgba(15,23,42,0.12)]" />
      <div className="flex min-w-0 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-black leading-tight text-slate-950">
              {book.title}
            </h3>
            <p className="mt-2 line-clamp-1 text-sm text-slate-500">
              {book.author}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-amber-500">
            <Star aria-hidden="true" size={15} fill="currentColor" />
            {(4.7 + (book.keyPoints.length % 3) / 10).toFixed(1)}
          </span>
        </div>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
          {book.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <span className="rounded-full border border-slate-950/[0.08] bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {book.keyPoints.length} ideas clave
          </span>
          <span className="rounded-full border border-slate-950/[0.08] bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {book.activities.length} ejercicios
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-violet-700">
            <Clock3 aria-hidden="true" size={13} />
            {book.readingTime} min
          </span>
        </div>
      </div>
    </Link>
  );
}

function PublicStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof BookOpen;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-violet-100 text-violet-700">
        <Icon aria-hidden="true" size={24} />
      </span>
      <div>
        <p className="text-2xl font-black text-violet-700">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function PublicLibrary({ books }: { books: Book[] }) {
  const availableCategories = getBookCategories().filter((category) =>
    books.some((book) => book.category === category),
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Todos" | BookCategory>("Todos");
  const [sortBy, setSortBy] = useState<"popular" | "short" | "recent">("popular");
  const [showAll, setShowAll] = useState(false);

  const filteredBooks = useMemo(() => {
    const baseBooks = filterBooks(books, query, category);

    return [...baseBooks].sort((firstBook, secondBook) => {
      if (sortBy === "short") {
        return firstBook.readingTime - secondBook.readingTime;
      }

      if (sortBy === "recent") {
        return books.indexOf(firstBook) - books.indexOf(secondBook);
      }

      return getPopularityScore(secondBook) - getPopularityScore(firstBook);
    });
  }, [books, category, query, sortBy]);

  const visibleBooks = showAll ? filteredBooks : filteredBooks.slice(0, 8);
  const chipCategories = availableCategories.slice(0, 7);

  return (
    <main className="min-h-screen overflow-x-clip bg-[#fbfaf8] text-slate-950">
      <section className="ceoteca-container grid items-center gap-12 pb-12 pt-16 lg:grid-cols-[0.95fr_1.05fr] lg:pb-16 lg:pt-20">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">
            Biblioteca Ceoteca
          </p>
          <h1 className="mt-5 max-w-2xl text-balance text-[clamp(2.6rem,5.8vw,5.2rem)] font-black leading-[0.96] tracking-normal text-slate-950">
            Ideas de libros, llevadas a la práctica.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Explora análisis originales en español para entender ideas clave,
            descubrir aplicaciones prácticas y decidir qué lectura profundizar.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink className="min-h-12 px-7" href="/registro">
              Empieza gratis
            </ButtonLink>
            <ButtonLink
              className="min-h-12 border-slate-950/[0.12] bg-white px-7 text-slate-950 hover:bg-slate-50"
              href="/#como-funciona"
              variant="secondary"
            >
              <PlayCircle aria-hidden="true" size={17} />
              Ver cómo funciona
            </ButtonLink>
          </div>
        </div>

        <PublicHeroStack books={books} />
      </section>

      <section className="ceoteca-container pb-16">
        <div className="grid gap-4 lg:grid-cols-[1fr_190px]">
          <label className="relative block">
            <span className="sr-only">Buscar en biblioteca</span>
            <Search
              aria-hidden="true"
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
              size={22}
            />
            <input
              className="h-16 w-full rounded-[16px] border border-slate-950/[0.10] bg-white pl-14 pr-5 text-base text-slate-700 shadow-[0_16px_44px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar libros, autores o temas..."
              value={query}
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Ordenar biblioteca</span>
            <select
              className="h-16 w-full appearance-none rounded-[16px] border border-slate-950/[0.10] bg-white px-5 pr-11 text-sm font-bold text-slate-800 shadow-[0_16px_44px_rgba(15,23,42,0.04)] outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              onChange={(event) =>
                setSortBy(event.target.value as "popular" | "short" | "recent")
              }
              value={sortBy}
            >
              <option value="popular">Más populares</option>
              <option value="short">Más rápidos</option>
              <option value="recent">Más recientes</option>
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />
          </label>
        </div>

        <div className="relative mt-5">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#fbfaf8] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#fbfaf8] to-transparent" />
          <div className="scrollbar-none flex gap-3 overflow-x-auto scroll-smooth py-1">
            <button
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-2 rounded-[12px] border px-5 text-sm font-bold transition",
                category === "Todos"
                  ? "border-violet-200 bg-violet-100 text-violet-700"
                  : "border-slate-950/[0.10] bg-white text-slate-700 hover:border-violet-200 hover:text-violet-700",
              )}
              onClick={() => setCategory("Todos")}
              type="button"
            >
              <LibraryBig aria-hidden="true" size={16} />
              Todos
            </button>
            {chipCategories.map((item) => (
              <button
                className={cn(
                  "inline-flex h-11 shrink-0 items-center gap-2 rounded-[12px] border px-5 text-sm font-bold transition",
                  category === item
                    ? "border-violet-200 bg-violet-100 text-violet-700"
                    : "border-slate-950/[0.10] bg-white text-slate-700 hover:border-violet-200 hover:text-violet-700",
                )}
                key={item}
                onClick={() => setCategory(item)}
                type="button"
              >
                <Target aria-hidden="true" size={15} />
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 grid gap-6 rounded-[18px] border border-slate-950/[0.08] bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.05)] md:grid-cols-2 xl:grid-cols-4">
          <PublicStat icon={BookOpen} label="análisis disponibles" value={`${Math.max(400, books.length)}+`} />
          <PublicStat icon={Grid3X3} label="categorías editoriales" value={`${Math.max(50, availableCategories.length)}+`} />
          <PublicStat icon={RotateCcw} label="actualizaciones cada semana" value="Nuevas" />
          <PublicStat icon={Star} label="contenido original" value="100%" />
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleBooks.map((book) => (
            <PublicCatalogCard book={book} key={book.id} />
          ))}
        </div>

        {filteredBooks.length === 0 ? (
          <div className="mt-8 rounded-[18px] border border-dashed border-slate-950/[0.14] bg-white p-8 text-center">
            <p className="text-xl font-black">No encontramos resultados</p>
            <p className="mt-2 text-sm text-slate-500">
              Prueba con otro título, autor, tema o categoría.
            </p>
          </div>
        ) : null}

        {!showAll && filteredBooks.length > visibleBooks.length ? (
          <div className="mt-8 flex justify-center">
            <button
              className="inline-flex h-12 items-center gap-2 rounded-[14px] border border-slate-950/[0.10] bg-white px-6 text-sm font-black text-violet-700 shadow-[0_16px_38px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-violet-300"
              onClick={() => setShowAll(true)}
              type="button"
            >
              Ver todos los libros
              <ArrowDown aria-hidden="true" size={16} />
            </button>
          </div>
        ) : null}
      </section>

      <section className="ceoteca-container pb-9">
        <div className="grid overflow-hidden rounded-[22px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6 shadow-[0_22px_70px_rgba(109,40,217,0.08)] lg:grid-cols-[1fr_330px] lg:p-8">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Cada análisis incluye
            </h2>
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Ideas clave", "Lo más importante explicado con claridad.", BookOpen],
                ["Ejercicios prácticos", "Prompts para llevar una idea a tu contexto.", Sparkles],
                ["Lenguaje simple", "Sin relleno y con aplicación directa.", CheckCircle2],
                ["Contenido original", "Análisis editoriales propios de Ceoteca.", LibraryBig],
              ].map(([title, copy, Icon]) => (
                <div className="flex gap-3" key={title as string}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-white text-violet-700 shadow-sm">
                    <Icon aria-hidden="true" size={19} />
                  </span>
                  <div>
                    <p className="font-black text-slate-950">{title as string}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{copy as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 rounded-[18px] border border-slate-950/[0.08] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.07)] lg:mt-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">
              Vista de análisis
            </p>
            <h3 className="mt-4 text-xl font-black text-slate-950">
              De una idea a una acción concreta
            </h3>
            <div className="mt-5 space-y-3">
              {["Idea clave", "Ejemplo", "Ejercicio", "Próximo paso"].map((item) => (
                <div
                  className="flex items-center justify-between rounded-[12px] bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"
                  key={item}
                >
                  {item}
                  <CheckCircle2 aria-hidden="true" className="text-emerald-500" size={16} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="ceoteca-container pb-16">
        <div className="grid gap-8 rounded-[22px] bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-600 p-8 text-white shadow-[0_26px_80px_rgba(109,40,217,0.22)] lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
          <div className="flex gap-5">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-white/16">
              <Sparkles aria-hidden="true" size={28} />
            </span>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.20em] text-white/72">
                Empieza a aprender hoy
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-normal lg:text-4xl">
                Convierte ideas de libros en mejores decisiones.
              </h2>
              <p className="mt-3 max-w-3xl leading-7 text-white/82">
                Únete gratis y accede a análisis, ejercicios y herramientas para
                complementar tus lecturas con aplicación práctica.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink className="bg-white text-violet-700 hover:bg-white/92" href="/registro">
              Empieza gratis
            </ButtonLink>
            <ButtonLink
              className="border-white/25 bg-white/10 text-white hover:bg-white/15"
              href="/#como-funciona"
              variant="secondary"
            >
              Ver cómo funciona
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}

function PrivateLibrary({ books }: { books: Book[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Todos" | BookCategory>("Todos");
  const [difficulty, setDifficulty] = useState<"Todas" | BookDifficulty>("Todas");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Todos");
  const [planAccess, setPlanAccess] = useState<PlanAccessFilter>("Todos");
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("Todos");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [plan, setPlan] = useState<PlanKey>("free");
  const [progressRows, setProgressRows] = useState<ProgressRow[]>([]);
  const bookIndexById = useMemo(
    () => new Map(books.map((book, index) => [book.id, index])),
    [books],
  );

  const filteredBooks = useMemo(() => {
    const baseBooks = filterBooks(books, query, category).filter((book) => {
      const bookIndex = bookIndexById.get(book.id) ?? 0;
      const progress = getBookProgress(progressRows, book);
      const included = isBookIncludedInPlan(bookIndex, plan);
      const matchesDifficulty =
        difficulty === "Todas" || book.difficulty === difficulty;
      const matchesTime =
        timeFilter === "Todos" || getTimeBucket(book.readingTime) === timeFilter;
      const matchesPlan =
        planAccess === "Todos" ||
        (planAccess === "included" && included) ||
        (planAccess === "upgrade" && !included);
      const matchesProgress =
        progressFilter === "Todos" ||
        getProgressState(progress) === progressFilter;

      return (
        matchesDifficulty &&
        matchesTime &&
        matchesPlan &&
        matchesProgress
      );
    });

    return [...baseBooks].sort((firstBook, secondBook) => {
      const firstIndex = bookIndexById.get(firstBook.id) ?? 0;
      const secondIndex = bookIndexById.get(secondBook.id) ?? 0;

      if (sortBy === "recent") {
        return firstIndex - secondIndex;
      }

      if (sortBy === "popular") {
        return getPopularityScore(secondBook) - getPopularityScore(firstBook);
      }

      if (sortBy === "continue") {
        const firstProgress = getProgressRow(progressRows, firstBook.id);
        const secondProgress = getProgressRow(progressRows, secondBook.id);
        const firstUpdated = firstProgress
          ? new Date(firstProgress.updated_at).getTime()
          : 0;
        const secondUpdated = secondProgress
          ? new Date(secondProgress.updated_at).getTime()
          : 0;

        if (secondUpdated !== firstUpdated) {
          return secondUpdated - firstUpdated;
        }
      }

      if (firstBook.isFeatured !== secondBook.isFeatured) {
        return firstBook.isFeatured ? -1 : 1;
      }

      return firstIndex - secondIndex;
    });
  }, [
    bookIndexById,
    books,
    category,
    difficulty,
    plan,
    planAccess,
    progressFilter,
    progressRows,
    query,
    sortBy,
    timeFilter,
  ]);
  const activeFilterCount = [
    category !== "Todos",
    difficulty !== "Todas",
    timeFilter !== "Todos",
    planAccess !== "Todos",
    progressFilter !== "Todos",
  ].filter(Boolean).length;

  useEffect(() => {
    let isMounted = true;

    async function loadPlan() {
      if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
        setPlan("pro");
        return;
      }

      try {
        const supabase = createBrowserSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          return;
        }

        const [profileResponse, subscriptionResponse, progressResponse] = await Promise.all([
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
          supabase
            .from("user_book_progress")
            .select("*")
            .eq("user_id", userData.user.id)
            .order("updated_at", { ascending: false }),
        ]);

        if (isMounted) {
          const effectivePlan = resolvePlanFromSubscriptions({
            profilePlan: profileResponse.data?.plan ?? "free",
            subscriptions: subscriptionResponse.data ?? [],
          }).plan;
          setPlan(effectivePlan);
          setProgressRows(progressResponse.data ?? []);
        }
      } catch {
        if (isMounted) {
          setPlan("free");
        }
      }
    }

    void loadPlan();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-clip bg-[#fbfaf8] pb-12 pl-0 text-slate-950 transition-[padding] duration-300 ease-out sm:pl-[var(--dashboard-sidebar-offset,240px)]">
      <DashboardSidebar active="library" tone="light" />

      <section className="mx-auto w-full max-w-[1380px] px-5 pt-8 sm:px-7 lg:px-10">
        <header className="grid gap-5 border-b border-slate-950/[0.08] pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,auto)] lg:items-start">
          <div>
            <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950">
              Biblioteca
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Todos tus análisis organizados para que sigas aprendiendo.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <label className="relative w-full sm:w-[340px]">
              <span className="sr-only">Buscar en biblioteca</span>
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={19}
              />
              <input
                className="min-h-12 w-full rounded-[14px] border border-slate-950/[0.10] bg-white pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar libros, autores o temas..."
                value={query}
              />
            </label>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-slate-950/[0.10] bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
              type="button"
            >
              <Filter aria-hidden="true" size={18} />
              Filtros
            </button>
            <NotificationBell tone="light" />
            <DashboardAccountMenu />
          </div>
        </header>

        <section className="mt-10">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                aria-expanded={isCategoryOpen}
                className="inline-flex min-h-12 min-w-[220px] items-center justify-between gap-3 rounded-[14px] border border-violet-200 bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-violet-300"
                onClick={() => setIsCategoryOpen((current) => !current)}
                type="button"
              >
                <span className="inline-flex items-center gap-3">
                  <Grid3X3 aria-hidden="true" className="text-violet-600" size={18} />
                  {category === "Todos" ? "Todas las categorías" : category}
                </span>
                <ChevronDown aria-hidden="true" size={16} />
              </button>

              {isCategoryOpen ? (
                <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[280px] overflow-hidden rounded-[16px] border border-slate-950/[0.08] bg-white">
                  {bookCategories.map((item) => (
                    <button
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-5 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700",
                        category === item && "bg-violet-50 text-violet-700",
                      )}
                      key={item}
                      onClick={() => {
                        setCategory(item);
                        setIsCategoryOpen(false);
                      }}
                      type="button"
                    >
                      <span>{item === "Todos" ? "Todas las categorías" : item}</span>
                      {category === item ? (
                        <CheckCircle2 aria-hidden="true" size={17} />
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <select
              aria-label="Estado de lectura"
              className="min-h-12 rounded-[14px] border border-slate-950/[0.10] bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-violet-300"
              onChange={(event) =>
                setProgressFilter(event.target.value as ProgressFilter)
              }
              value={progressFilter}
            >
              <option value="Todos">Estado: Todos</option>
              <option value="not-started">Estado: Sin iniciar</option>
              <option value="in-progress">Estado: En progreso</option>
              <option value="completed">Estado: Completados</option>
            </select>

            <select
              aria-label="Ordenar biblioteca"
              className="min-h-12 rounded-[14px] border border-slate-950/[0.10] bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-violet-300"
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              value={sortBy}
            >
              <option value="featured">Ordenar: Destacados</option>
              <option value="recent">Ordenar: Recientes</option>
              <option value="popular">Ordenar: Populares</option>
              <option value="continue">Ordenar: Continuar</option>
            </select>

            <select
              aria-label="Dificultad"
              className="min-h-12 rounded-[14px] border border-slate-950/[0.10] bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-violet-300"
              onChange={(event) =>
                setDifficulty(event.target.value as "Todas" | BookDifficulty)
              }
              value={difficulty}
            >
              <option value="Todas">Dificultad: Todas</option>
              <option value="Inicial">Dificultad: Inicial</option>
              <option value="Intermedio">Dificultad: Intermedio</option>
              <option value="Avanzado">Dificultad: Avanzado</option>
            </select>

            <div className="inline-flex min-h-12 overflow-hidden rounded-[14px] border border-slate-950/[0.10] bg-white">
              <button
                aria-label="Vista en cuadrícula"
                className={cn(
                  "grid w-12 place-items-center text-slate-500 transition hover:text-violet-700",
                  viewMode === "grid" && "bg-violet-50 text-violet-700",
                )}
                onClick={() => setViewMode("grid")}
                type="button"
              >
                <Grid3X3 aria-hidden="true" size={18} />
              </button>
              <button
                aria-label="Vista en lista"
                className={cn(
                  "grid w-12 place-items-center border-l border-slate-950/[0.08] text-slate-500 transition hover:text-violet-700",
                  viewMode === "list" && "bg-violet-50 text-violet-700",
                )}
                onClick={() => setViewMode("list")}
                type="button"
              >
                <List aria-hidden="true" size={18} />
              </button>
            </div>

            {activeFilterCount > 0 || query ? (
              <button
                className="inline-flex min-h-12 items-center gap-2 rounded-[14px] border border-slate-950/[0.10] bg-white px-4 text-sm font-bold text-slate-600 transition hover:text-violet-700"
                onClick={() => {
                  setQuery("");
                  setCategory("Todos");
                  setDifficulty("Todas");
                  setTimeFilter("Todos");
                  setPlanAccess("Todos");
                  setProgressFilter("Todos");
                  setSortBy("featured");
                }}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={16} />
                Limpiar
              </button>
            ) : null}
          </div>
        </section>

        <section className="mt-5 rounded-[18px] border border-slate-950/[0.08] bg-white p-4">
          {filteredBooks.length > 0 ? (
            <div
              className={cn(
                "grid gap-4",
                viewMode === "grid"
                  ? "grid-cols-[repeat(auto-fill,minmax(210px,1fr))]"
                  : "grid-cols-1 md:grid-cols-2",
              )}
            >
              {filteredBooks.map((book) => {
                const bookIndex = bookIndexById.get(book.id) ?? 0;
                const isPlanLocked = !isBookIncludedInPlan(bookIndex, plan);

                return (
                  <PrivateBookCard
                    book={book}
                    href={isPlanLocked ? "/planes" : `/libro/${book.slug}`}
                    key={book.id}
                    planLocked={isPlanLocked}
                    progress={getBookProgress(progressRows, book)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-[16px] border border-dashed border-slate-950/[0.12] bg-slate-50 p-8 text-center">
              <p className="text-xl font-black text-slate-950">
                No encontramos resultados
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Ajusta los filtros o busca por otro título, autor o tema.
              </p>
              <button
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[12px] border border-slate-950/[0.10] bg-white px-4 text-sm font-bold text-slate-700 transition hover:text-violet-700"
                onClick={() => {
                  setQuery("");
                  setCategory("Todos");
                  setDifficulty("Todas");
                  setTimeFilter("Todos");
                  setPlanAccess("Todos");
                  setProgressFilter("Todos");
                  setSortBy("featured");
                }}
                type="button"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </section>

      </section>
    </main>
  );
}

export function PublicLibraryView({ books }: PublicLibraryViewProps) {
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
        setAuthState("private");
        return;
      }

      try {
        const supabase = createBrowserSupabaseClient();
        const { data } = await supabase.auth.getSession();

        if (isMounted) {
          setAuthState(data.session ? "private" : "public");
        }
      } catch {
        if (isMounted) {
          setAuthState("public");
        }
      }
    }

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (authState === "private") {
    return <PrivateLibrary books={books} />;
  }

  return (
    <>
      <PublicHeader />
      <PublicLibrary books={books} />
      <Footer />
    </>
  );
}

