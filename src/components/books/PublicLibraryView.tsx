"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bolt,
  Brain,
  CircleDot,
  Clock3,
  Filter,
  Grid3X3,
  LibraryBig,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";

import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { NotificationBell } from "@/components/app/NotificationBell";
import { FloatingSiteChat } from "@/components/chat/FloatingSiteChat";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import type { PlanKey } from "@/config/plans";
import { bookCategories, filterBooks } from "@/data/books";
import { clientEnv } from "@/lib/env";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { Book, BookCategory } from "@/types";

type PublicLibraryViewProps = {
  books: Book[];
};

type AuthState = "loading" | "public" | "private";

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
}: {
  book: Book;
  href: string;
  locked?: boolean;
}) {
  return (
    <Link className="group block min-w-0" href={href}>
      <ShelfCover book={book} />
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
              Preview
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function CategoryShelf({
  books,
  category,
  isPublic = false,
  limit,
  onFilter,
}: {
  books: Book[];
  category: BookCategory;
  isPublic?: boolean;
  limit?: number;
  onFilter?: (category: BookCategory) => void;
}) {
  const categoryBooks = books.filter((book) => book.category === category);
  const visibleBooks = limit ? categoryBooks.slice(0, limit) : categoryBooks;

  if (visibleBooks.length === 0) {
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
        ) : isPublic ? (
          <Link
            className="shrink-0 text-sm text-brand-purple transition hover:text-white"
            href="/registro"
          >
            Ver más
          </Link>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-x-4 gap-y-8 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(170px,1fr))]">
        {visibleBooks.map((book) => (
          <LibraryBookTile
            book={book}
            href={isPublic ? "/registro" : `/libro/${book.slug}`}
            key={book.id}
            locked={isPublic}
          />
        ))}
      </div>
    </section>
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
  const categories = getBookCategories();
  const previewCategories = categories.filter((category) =>
    books.some((book) => book.category === category),
  );

  return (
    <main className="min-h-screen overflow-x-clip bg-[#03040b] text-text-primary">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_24%_12%,rgba(124,58,237,0.18),transparent_30%),linear-gradient(180deg,#02030a_0%,#050611_48%,#03040b_100%)]" />
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-3 sm:flex" aria-label="Biblioteca pública">
          <ButtonLink href="/pricing" variant="ghost">
            Precios
          </ButtonLink>
          <ButtonLink href="/login" variant="ghost">
            Entrar
          </ButtonLink>
          <ButtonLink href="/registro">Empieza gratis</ButtonLink>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-[1440px] px-5 pb-10 pt-6 sm:px-8 lg:pt-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-base font-medium text-brand-purple">
              Biblioteca Ceoteca
            </p>
            <h1 className="mt-4 max-w-4xl text-balance text-[clamp(2.4rem,6vw,5rem)] font-black leading-[0.98] tracking-normal">
              Explora análisis para aprender y aplicar mejor.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-text-secondary sm:text-lg">
              Vista previa de títulos editoriales propios. Cada libro muestra
              ideas clave, ejercicios, audio según plan y chat contextual.
            </p>
          </div>
          <Card className="w-full rounded-[20px] bg-white/[0.035] p-5 lg:max-w-sm">
            <p className="text-sm text-text-secondary">Catálogo actual</p>
            <p className="mt-3 text-5xl font-bold">{books.length}</p>
            <p className="mt-2 text-sm text-text-secondary">
              análisis organizados por categoría.
            </p>
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] space-y-12 px-5 pb-20 sm:px-8">
        {previewCategories.map((category) => (
          <CategoryShelf
            books={books}
            category={category}
            isPublic
            key={category}
            limit={7}
          />
        ))}
      </section>
    </main>
  );
}

function PrivateLibrary({ books }: { books: Book[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Todos" | BookCategory>("Todos");
  const [plan, setPlan] = useState<PlanKey>("free");

  const filteredBooks = useMemo(
    () => filterBooks(books, query, category),
    [books, category, query],
  );
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

        const { data } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (isMounted) {
          setPlan(data?.plan ?? "free");
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
            <p className="mt-1 text-sm text-text-secondary">análisis publicados</p>
          </Card>
        </section>

        <Card className="sticky top-3 z-20 mt-7 rounded-[20px] bg-[#101119]/92 p-3 backdrop-blur-xl">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
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

            <div
              aria-label="Filtrar por categoría"
              className="flex max-w-full gap-2 overflow-x-auto pb-1 lg:max-w-[680px]"
              role="list"
            >
              {bookCategories.map((item) => (
                <button
                  className={cn(
                    "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-white/10 px-4 text-sm text-text-secondary transition hover:bg-white/[0.06] hover:text-white",
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
        </Card>

        <section className="mt-10 space-y-12">
          {visibleCategories.length > 0 ? (
            visibleCategories.map(({ category: currentCategory }) => (
              <CategoryShelf
                books={filteredBooks}
                category={currentCategory}
                key={currentCategory}
                onFilter={setCategory}
              />
            ))
          ) : (
            <Card className="rounded-[20px] border-dashed border-white/15 bg-white/[0.025] p-8 text-center">
              <p className="text-xl font-semibold">No encontramos resultados</p>
              <p className="mt-2 text-sm text-text-secondary">
                Prueba con otro título, autor, etiqueta o categoría.
              </p>
              <button
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-button border border-white/10 px-4 text-sm text-text-secondary transition hover:bg-white/[0.06] hover:text-white"
                onClick={() => {
                  setQuery("");
                  setCategory("Todos");
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

  return <PublicLibrary books={books} />;
}
