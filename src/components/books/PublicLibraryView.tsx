"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bolt,
  Brain,
  CircleDot,
  Clock3,
  Crown,
  Filter,
  Grid3X3,
  LibraryBig,
  Lock,
  RotateCcw,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";

import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { NotificationBell } from "@/components/app/NotificationBell";
import { FloatingSiteChat } from "@/components/chat/FloatingSiteChat";
import { Footer } from "@/components/marketing/Footer";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { plans, type PlanKey } from "@/config/plans";
import { bookCategories, filterBooks } from "@/data/books";
import { clientEnv } from "@/lib/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
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

function pluralizeBooks(count: number) {
  return `${count} ${count === 1 ? "libro" : "libros"}`;
}

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

function ShelfCover({ book }: { book: Book }) {
  const Icon = coverIcons[book.cover.variant] ?? Brain;

  return (
    <div
      className={cn(
        "relative aspect-[2/3] w-full overflow-hidden rounded-[12px] border border-white/10 bg-gradient-to-br p-3 shadow-[0_18px_42px_rgba(0,0,0,0.34)] transition duration-300 group-hover:-translate-y-1 group-hover:border-brand-purple/45",
        book.cover.gradient,
      )}
    >
      <div className="absolute inset-0 bg-black/32" />
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full border border-white/20" />
      <div className="absolute bottom-4 left-4 h-20 w-20 rounded-full bg-white/18 blur-2xl" />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <p className="line-clamp-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/72 sm:text-[10px]">
          {book.category}
        </p>
        <div className="grid flex-1 place-items-center py-3">
          <span className="grid h-12 w-12 place-items-center rounded-[16px] bg-white/15 text-white backdrop-blur-md sm:h-14 sm:w-14">
            <Icon aria-hidden="true" size={28} />
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-4 break-words text-[clamp(1rem,4.8vw,1.28rem)] font-black leading-[0.94] text-white sm:text-[1.22rem]">
            {book.title}
          </h3>
          <p className="mt-2 line-clamp-1 text-[11px] text-white/74">
            {book.author}
          </p>
        </div>
      </div>
    </div>
  );
}

function LibraryBookTile({
  book,
  href,
  locked = false,
  planLocked = false,
  progress = 0,
}: {
  book: Book;
  href: string;
  locked?: boolean;
  planLocked?: boolean;
  progress?: number;
}) {
  return (
    <Link className="group block min-w-0" href={href}>
      <div className="relative">
        <ShelfCover book={book} />
        {planLocked ? (
          <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/55 text-brand-purple backdrop-blur-md">
            <Lock aria-hidden="true" size={15} />
          </span>
        ) : null}
      </div>
      <div className="mt-3 min-w-0">
        <h3 className="line-clamp-2 min-h-[2.45rem] text-sm font-semibold leading-tight text-white sm:text-[15px]">
          {book.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs text-text-muted">
          {book.author}
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
          <Clock3 aria-hidden="true" size={13} />
          <span>{book.readingTime} min</span>
          {locked ? (
            <span className="ml-auto rounded-full bg-brand-purple/15 px-2 py-0.5 text-[10px] text-brand-purple">
              Vista previa
            </span>
          ) : planLocked ? (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-brand-purple/15 px-2 py-0.5 text-[10px] text-brand-purple">
              <Crown aria-hidden="true" size={11} />
              Pro
            </span>
          ) : null}
        </div>
        {!locked && progress > 0 ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-blue"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function CategoryShelf({
  books,
  category,
  onFilter,
  getBookIndex,
  plan = "pro",
  progressRows = [],
}: {
  books: Book[];
  category: BookCategory;
  onFilter?: (category: BookCategory) => void;
  getBookIndex?: (book: Book) => number;
  plan?: PlanKey;
  progressRows?: ProgressRow[];
}) {
  const categoryBooks = books.filter((book) => book.category === category);

  if (categoryBooks.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold sm:text-2xl">{category}</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {pluralizeBooks(categoryBooks.length)}
          </p>
        </div>
        {onFilter ? (
          <button
            className="shrink-0 text-sm text-brand-purple transition hover:text-white"
            onClick={() => onFilter(category)}
            type="button"
          >
            Ver solo esta categoría
          </button>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-x-4 gap-y-8 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(170px,1fr))]">
        {categoryBooks.map((book) => {
          const bookIndex = getBookIndex?.(book) ?? 0;
          const isPlanLocked = !isBookIncludedInPlan(bookIndex, plan);

          return (
            <LibraryBookTile
              book={book}
              href={isPlanLocked ? "/planes" : `/libro/${book.slug}`}
              key={book.id}
              planLocked={isPlanLocked}
              progress={getBookProgress(progressRows, book)}
            />
          );
        })}
      </div>
    </section>
  );
}

function PublicBookCarousel({ books }: { books: Book[] }) {
  const carouselBooks = books.slice(0, 8);
  const radius = 270;

  if (carouselBooks.length === 0) {
    return null;
  }

  return (
    <div className="relative mx-auto mt-12 h-[390px] w-full max-w-[860px] overflow-hidden [perspective:1200px] sm:h-[430px]">
      <div className="absolute inset-x-0 bottom-6 mx-auto h-20 w-[min(82vw,560px)] rounded-full bg-brand-purple/20 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-[220px] w-[150px] -translate-x-1/2 -translate-y-1/2 sm:h-[250px] sm:w-[170px]">
        <div className="book-carousel-3d relative h-full w-full">
          {carouselBooks.map((book, index) => {
            const angle = (360 / carouselBooks.length) * index;

            return (
              <Link
                className="group absolute inset-0 block"
                href="/registro"
                key={book.id}
                style={{
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                }}
              >
                <ShelfCover book={book} />
              </Link>
            );
          })}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#03040b] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#03040b] to-transparent" />
    </div>
  );
}

function LoadingLibrary() {
  return (
    <main className="min-h-screen bg-[#03040b] text-text-primary">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5">
        <Card className="w-full max-w-md rounded-[20px] bg-white/[0.035] p-6 text-center">
          <div className="mx-auto grid h-14 w-14 animate-pulse place-items-center rounded-2xl bg-brand-purple/20 text-brand-purple">
            <LibraryBig aria-hidden="true" size={26} />
          </div>
          <p className="mt-4 text-lg font-semibold">Preparando biblioteca</p>
          <p className="mt-2 text-sm text-text-secondary">
            Estamos ajustando tu experiencia de lectura.
          </p>
        </Card>
      </section>
    </main>
  );
}

function PublicLibrary({ books }: { books: Book[] }) {
  const availableCategories = getBookCategories().filter((category) =>
    books.some((book) => book.category === category),
  );
  const previewBooks = books.slice(0, 10);

  return (
    <main className="min-h-screen overflow-x-clip bg-[#03040b] text-text-primary">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_24%_12%,rgba(124,58,237,0.18),transparent_30%),linear-gradient(180deg,#02030a_0%,#050611_48%,#03040b_100%)]" />

      <section className="mx-auto flex w-full max-w-[1180px] flex-col items-center px-5 pb-12 pt-12 text-center sm:px-8 lg:pt-16">
        <p className="text-base font-medium text-brand-purple">
          Biblioteca Ceoteca
        </p>
        <h1 className="mt-4 max-w-4xl text-balance text-[clamp(2.55rem,7vw,5.8rem)] font-black leading-[0.94] tracking-normal">
          Análisis de libros para aprender ideas clave y aplicarlas mejor.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-text-secondary sm:text-lg">
          Explora análisis editoriales de negocios, finanzas, productividad,
          liderazgo y desarrollo personal. Ceoteca complementa tus lecturas con
          ideas clave, ejercicios prácticos y rutas para convertir conocimiento
          en acción.
        </p>
        <div className="mt-8 flex w-full max-w-md flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink className="sm:min-w-44" href="/registro">
            Crear cuenta gratis
          </ButtonLink>
          <ButtonLink className="sm:min-w-44" href="/login" variant="secondary">
            Ya tengo cuenta
          </ButtonLink>
        </div>

        <PublicBookCarousel books={books} />

        <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs text-text-secondary">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
            {books.length} análisis publicados
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
            {availableCategories.length} categorías
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
            Chat contextual
          </span>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 pb-20 sm:px-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-brand-purple">
            Vista previa
          </p>
          <h2 className="text-3xl font-semibold">Explora algunos análisis destacados</h2>
          <p className="max-w-2xl text-sm leading-6 text-text-secondary">
            Encuentra títulos seleccionados para mejorar tus decisiones, hábitos, finanzas y forma de trabajar.
          </p>
        </div>
        <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-x-5 gap-y-9 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(165px,1fr))]">
          {previewBooks.map((book) => (
            <LibraryBookTile book={book} href="/registro" key={book.id} locked />
          ))}
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
  const visibleCategories = useMemo(
    () =>
      getBookCategories()
        .map((item) => ({
          category: item,
          books: filteredBooks.filter((book) => book.category === item),
        }))
        .filter((item) => item.books.length > 0),
    [filteredBooks],
  );
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

        const [profileResponse, progressResponse] = await Promise.all([
          supabase
            .from("profiles")
            .select("plan")
            .eq("id", userData.user.id)
            .maybeSingle(),
          supabase
            .from("user_book_progress")
            .select("*")
            .eq("user_id", userData.user.id)
            .order("updated_at", { ascending: false }),
        ]);

        if (isMounted) {
          setPlan(profileResponse.data?.plan ?? "free");
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
    <main className="min-h-screen overflow-x-clip bg-[#03040b] pb-16 pl-[var(--dashboard-sidebar-offset,84px)] text-text-primary transition-[padding] duration-300 ease-out">
      <DashboardSidebar active="library" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_22%_10%,rgba(124,58,237,0.16),transparent_30%),linear-gradient(180deg,#02030a_0%,#050611_45%,#03040b_100%)]" />

      <section className="mx-auto w-full max-w-[1540px] px-4 pt-4 sm:px-5 md:px-8 xl:px-10">
        <header className="flex items-center justify-end">
          <NotificationBell />
        </header>

        <section className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-lg font-medium text-brand-purple">
              Biblioteca completa
            </p>
            <h1 className="mt-4 max-w-3xl text-balance text-[clamp(2.25rem,5.4vw,4.5rem)] font-black leading-[0.98] tracking-normal">
              Encuentra tu próxima lectura aplicada.
            </h1>
          </div>
          <Card className="w-full rounded-[18px] bg-white/[0.035] p-5 lg:max-w-xs">
            <p className="text-sm text-text-secondary">Disponibles</p>
            <p className="mt-2 text-4xl font-bold">{books.length}</p>
            <p className="mt-1 text-sm text-text-secondary">
              análisis publicados
            </p>
          </Card>
        </section>

        <Card className="sticky top-3 z-20 mt-7 rounded-[20px] bg-[#101119]/92 p-3 backdrop-blur-xl">
          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_auto] xl:items-start">
            <label className="relative block">
              <span className="sr-only">Buscar en biblioteca</span>
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                size={18}
              />
              <input
                className="min-h-12 w-full rounded-[14px] border border-white/10 bg-white/[0.045] pl-11 pr-4 text-sm outline-none transition placeholder:text-text-muted focus:border-brand-purple"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por título, autor, categoría o etiqueta"
                value={query}
              />
            </label>

            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                <label className="grid gap-1 text-xs text-text-muted">
                  Ordenar
                  <select
                    className="min-h-10 rounded-[12px] border border-white/10 bg-[#151722] px-3 text-sm text-text-primary outline-none"
                    onChange={(event) => setSortBy(event.target.value as SortOption)}
                    value={sortBy}
                  >
                    <option value="featured">Destacado</option>
                    <option value="recent">Reciente</option>
                    <option value="popular">Popular</option>
                    <option value="continue">Continuar</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-text-muted">
                  Dificultad
                  <select
                    className="min-h-10 rounded-[12px] border border-white/10 bg-[#151722] px-3 text-sm text-text-primary outline-none"
                    onChange={(event) =>
                      setDifficulty(event.target.value as "Todas" | BookDifficulty)
                    }
                    value={difficulty}
                  >
                    <option value="Todas">Todas</option>
                    <option value="Inicial">Inicial</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-text-muted">
                  Tiempo
                  <select
                    className="min-h-10 rounded-[12px] border border-white/10 bg-[#151722] px-3 text-sm text-text-primary outline-none"
                    onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}
                    value={timeFilter}
                  >
                    <option value="Todos">Todos</option>
                    <option value="short">Hasta 10 min</option>
                    <option value="medium">11 a 15 min</option>
                    <option value="long">Más de 15 min</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-text-muted">
                  Plan
                  <select
                    className="min-h-10 rounded-[12px] border border-white/10 bg-[#151722] px-3 text-sm text-text-primary outline-none"
                    onChange={(event) =>
                      setPlanAccess(event.target.value as PlanAccessFilter)
                    }
                    value={planAccess}
                  >
                    <option value="Todos">Todos</option>
                    <option value="included">Incluidos</option>
                    <option value="upgrade">Requieren plan</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs text-text-muted">
                  Progreso
                  <select
                    className="min-h-10 rounded-[12px] border border-white/10 bg-[#151722] px-3 text-sm text-text-primary outline-none"
                    onChange={(event) =>
                      setProgressFilter(event.target.value as ProgressFilter)
                    }
                    value={progressFilter}
                  >
                    <option value="Todos">Todos</option>
                    <option value="not-started">Sin iniciar</option>
                    <option value="in-progress">En progreso</option>
                    <option value="completed">Completados</option>
                  </select>
                </label>
                <button
                  className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] border border-white/10 px-3 text-sm text-text-secondary transition hover:bg-white/[0.06] hover:text-white"
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
                  <RotateCcw aria-hidden="true" size={15} />
                  Limpiar
                </button>
              </div>

              <div
                aria-label="Filtrar por categoría"
                className="flex max-w-full gap-2 overflow-x-auto pb-1"
                role="list"
              >
                {bookCategories.map((item) => (
                  <button
                    className={cn(
                      "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-white/10 px-4 text-sm text-text-secondary transition hover:bg-white/[0.06] hover:text-white",
                      category === item &&
                        "border-brand-purple bg-brand-purple/15 text-white",
                    )}
                    key={item}
                    onClick={() => setCategory(item)}
                    type="button"
                  >
                    {item === "Todos" ? <Filter aria-hidden="true" size={15} /> : null}
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <span>{filteredBooks.length} resultados</span>
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-brand-purple/15 px-2 py-1 text-brand-purple">
                {activeFilterCount} filtros activos
              </span>
            ) : null}
          </div>
        </Card>

        <section className="mt-10 space-y-12">
          {visibleCategories.length > 0 ? (
            <>
              {visibleCategories.map(({ category: currentCategory }) => (
                <CategoryShelf
                  books={filteredBooks}
                  category={currentCategory}
                  getBookIndex={(book) => bookIndexById.get(book.id) ?? 0}
                  key={currentCategory}
                  onFilter={setCategory}
                  plan={plan}
                  progressRows={progressRows}
                />
              ))}
              {visibleCategories.length <= 2 && activeFilterCount === 0 ? (
                <Card className="rounded-[20px] border-dashed border-white/15 bg-white/[0.025] p-6">
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div>
                      <p className="text-lg font-semibold">
                        Más categorías están en camino
                      </p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                        Estamos ampliando la biblioteca con análisis de ventas,
                        marketing, negociación, innovación y casos de éxito.
                      </p>
                    </div>
                    <ButtonLink href="/home" variant="secondary">
                      Volver al inicio
                    </ButtonLink>
                  </div>
                </Card>
              ) : null}
            </>
          ) : (
            <Card className="rounded-[20px] border-dashed border-white/15 bg-white/[0.025] p-8 text-center">
              <p className="text-xl font-semibold">No encontramos resultados</p>
              <p className="mt-2 text-sm text-text-secondary">
                Ajusta los filtros o prueba con otra búsqueda. También puedes
                explorar categorías cercanas para descubrir nuevos análisis.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {getBookCategories()
                  .slice(0, 5)
                  .map((item) => (
                    <button
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-text-secondary transition hover:bg-white/[0.06] hover:text-white"
                      key={item}
                      onClick={() => setCategory(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
              </div>
              <button
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-button border border-white/10 px-4 text-sm text-text-secondary transition hover:bg-white/[0.06] hover:text-white"
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
            </Card>
          )}
        </section>

        <footer className="mt-12 border-t border-white/10 py-8 text-sm text-text-muted">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p>&copy; 2026 Ceoteca. Todos los derechos reservados.</p>
            <nav
              aria-label="Legal de biblioteca"
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
      <FloatingSiteChat plan={plan} />
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

  if (authState === "loading") {
    return <LoadingLibrary />;
  }

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

