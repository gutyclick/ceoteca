"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Filter,
  LibraryBig,
  Lock,
  Search,
  Sparkles,
} from "lucide-react";

import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { FloatingSiteChat } from "@/components/chat/FloatingSiteChat";
import { NotificationBell } from "@/components/app/NotificationBell";
import { BookCover } from "@/components/books/BookCover";
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

const categoryHighlights: Array<{
  title: BookCategory;
  description: string;
}> = [
  {
    title: "Emprendimiento",
    description: "Ideas para validar mercados, clientes y modelos de negocio.",
  },
  {
    title: "Finanzas personales",
    description: "Criterios prácticos para ordenar decisiones de dinero.",
  },
  {
    title: "Productividad",
    description: "Métodos para cuidar el foco y convertir ideas en acción.",
  },
  {
    title: "Desarrollo personal",
    description: "Lecturas aplicables a hábitos, mentalidad y aprendizaje.",
  },
];

function getCategoryCount(books: Book[], category: BookCategory) {
  return books.filter((book) => book.category === category).length;
}

function pluralizeBooks(count: number) {
  return `${count} ${count === 1 ? "libro" : "libros"}`;
}

function PublicBookPreview({ book, index }: { book: Book; index: number }) {
  return (
    <Card
      className="group overflow-hidden rounded-[18px] bg-white/[0.035] p-3"
      interactive
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <Link className="block" href="/registro">
        <div className="relative">
          <BookCover book={book} size="sm" />
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs text-white backdrop-blur-md">
            <Lock aria-hidden="true" size={13} />
            Vista previa
          </span>
        </div>
        <div className="p-3">
          <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
            <span className="inline-flex items-center gap-1">
              <Clock3 aria-hidden="true" size={14} />
              {book.readingTime} min
            </span>
            <span className="inline-flex items-center gap-1">
              <Sparkles aria-hidden="true" size={14} />
              {book.difficulty}
            </span>
          </div>
          <h3 className="mt-3 line-clamp-2 text-lg font-semibold">
            {book.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">
            {book.description}
          </p>
        </div>
      </Link>
    </Card>
  );
}

function CatalogBookCard({ book }: { book: Book }) {
  return (
    <Link className="group block min-w-0" href={`/libro/${book.slug}`}>
      <Card className="grid h-full min-h-[220px] grid-cols-[92px_minmax(0,1fr)] gap-4 overflow-hidden rounded-[16px] bg-white/[0.035] p-3 sm:grid-cols-[108px_minmax(0,1fr)]">
        <BookCover book={book} size="sm" />
        <div className="flex min-w-0 flex-col justify-between py-2 pr-1">
          <div className="min-w-0">
            <p className="line-clamp-1 text-xs font-medium uppercase tracking-[0.16em] text-brand-purple">
              {book.category}
            </p>
            <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-tight">
              {book.title}
            </h3>
            <p className="mt-1 line-clamp-1 text-sm text-text-muted">
              {book.author}
            </p>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-secondary">
              {book.description}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.055] px-2.5 py-1">
              <Clock3 aria-hidden="true" size={13} />
              {book.readingTime} min
            </span>
            <span className="rounded-full bg-white/[0.055] px-2.5 py-1">
              {book.difficulty}
            </span>
            <span className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-white/[0.07] text-text-secondary transition group-hover:bg-brand-purple group-hover:text-white">
              <ArrowRight aria-hidden="true" size={16} />
            </span>
          </div>
        </div>
      </Card>
    </Link>
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
  const previewBooks = books.slice(0, 6);
  const totalMinutes = books.reduce((total, book) => total + book.readingTime, 0);

  return (
    <main className="min-h-screen overflow-x-clip bg-[#03040b] text-text-primary">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_24%_12%,rgba(124,58,237,0.22),transparent_30%),radial-gradient(circle_at_76%_8%,rgba(79,99,255,0.12),transparent_28%),linear-gradient(180deg,#02030a_0%,#050611_48%,#03040b_100%)]" />
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-3 sm:flex" aria-label="Biblioteca pública">
          <ButtonLink href="/login" variant="ghost">
            Iniciar sesión
          </ButtonLink>
          <ButtonLink href="/registro">
            Crear cuenta
          </ButtonLink>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end xl:pt-14">
        <div className="min-w-0">
          <p className="text-base font-medium text-brand-purple">
            Biblioteca Ceoteca
          </p>
          <h1 className="mt-5 max-w-4xl text-balance text-[clamp(2.6rem,7vw,6rem)] font-black leading-[0.95] tracking-normal">
            Explora ideas clave antes de entrar.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-text-secondary">
            Descubre análisis editoriales diseñados para complementar tus
            lecturas, aplicar conceptos y elegir tu próxima experiencia de
            aprendizaje.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/registro" className="sm:min-w-44">
              Crear cuenta gratis
            </ButtonLink>
            <ButtonLink href="/pricing" variant="secondary" className="sm:min-w-44">
              Ver planes
            </ButtonLink>
          </div>
        </div>

        <Card className="rounded-[22px] bg-white/[0.04] p-6">
          <p className="text-sm font-semibold">Contenido disponible</p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-4xl font-bold">{books.length}</p>
              <p className="mt-1 text-sm text-text-secondary">análisis publicados</p>
            </div>
            <div>
              <p className="text-4xl font-bold">{totalMinutes}</p>
              <p className="mt-1 text-sm text-text-secondary">minutos editoriales</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {[
              "Aplicaciones prácticas",
              "Ejercicios y reflexión",
              "Chat contextual por libro",
            ].map((item) => (
              <p className="flex items-center gap-2 text-sm text-text-secondary" key={item}>
                <CheckCircle2 aria-hidden="true" className="text-success" size={16} />
                {item}
              </p>
            ))}
          </div>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-5 pb-10 sm:px-8">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-5">
          {categoryHighlights.map((category) => {
            const count = getCategoryCount(books, category.title);

            return (
              <Card className="rounded-[18px] bg-white/[0.035] p-5" key={category.title}>
                <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-brand-purple/16 text-brand-purple">
                  <BookOpen aria-hidden="true" size={24} />
                </span>
                <h2 className="mt-5 text-xl font-semibold">{category.title}</h2>
                <p className="mt-2 text-sm text-text-muted">
                  {pluralizeBooks(count)}
                </p>
                <p className="mt-4 text-sm leading-6 text-text-secondary">
                  {category.description}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-5 pb-20 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-brand-purple">
              Vista previa
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              Algunos títulos para empezar
            </h2>
          </div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-purple transition hover:text-white"
            href="/registro"
          >
            Ver biblioteca completa
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-5">
          {previewBooks.map((book, index) => (
            <PublicBookPreview book={book} index={index} key={book.id} />
          ))}
        </div>
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
      bookCategories
        .filter((item): item is BookCategory => item !== "Todos")
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
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_22%_10%,rgba(124,58,237,0.18),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.1),transparent_25%),linear-gradient(180deg,#02030a_0%,#050611_45%,#03040b_100%)]" />

      <section className="mx-auto w-full max-w-[1500px] px-4 pt-4 sm:px-5 md:px-8 xl:px-10">
        <header className="flex items-center justify-end">
          <NotificationBell />
        </header>

        <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div className="min-w-0">
            <p className="text-lg font-medium text-brand-purple">
              Biblioteca completa
            </p>
            <h1 className="mt-5 max-w-3xl text-balance text-[clamp(2.35rem,6vw,4.8rem)] font-black leading-[0.96] tracking-normal">
              Elige tu próxima experiencia.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-text-secondary">
              Explora el catálogo por categorías oficiales, encuentra análisis
              para tu momento actual y guarda tu progreso al entrar en cada
              libro.
            </p>
          </div>

          <Card className="rounded-[20px] bg-white/[0.04] p-6">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm font-semibold">Catálogo activo</p>
                <p className="mt-5 text-5xl font-bold">{books.length}</p>
                <p className="mt-2 text-sm text-text-secondary">
                  análisis disponibles
                </p>
              </div>
              <span className="grid h-16 w-16 place-items-center rounded-[18px] bg-brand-purple/16 text-brand-purple shadow-[0_0_40px_rgba(124,58,237,0.28)]">
                <LibraryBig aria-hidden="true" size={30} />
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <span className="rounded-full bg-white/[0.055] px-3 py-2 text-text-secondary">
                {bookCategories.length - 1} categorías
              </span>
              <span className="rounded-full bg-white/[0.055] px-3 py-2 text-text-secondary">
                IA contextual
              </span>
            </div>
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
              className="flex max-w-full gap-2 overflow-x-auto pb-1 lg:max-w-[640px]"
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

        <section className="mt-8 space-y-10">
          {visibleCategories.length > 0 ? (
            visibleCategories.map(({ category: currentCategory, books: categoryBooks }) => (
              <section key={currentCategory}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">{currentCategory}</h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      {pluralizeBooks(categoryBooks.length)}
                    </p>
                  </div>
                  <button
                    className="w-fit text-sm text-brand-purple transition hover:text-white"
                    onClick={() => setCategory(currentCategory)}
                    type="button"
                  >
                    Ver solo esta categoría
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,330px),1fr))] gap-5">
                  {categoryBooks.map((book) => (
                    <CatalogBookCard book={book} key={book.id} />
                  ))}
                </div>
              </section>
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
