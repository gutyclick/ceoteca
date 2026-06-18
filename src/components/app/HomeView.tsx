"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Flame,
  Home,
  LibraryBig,
  LineChart,
  MessageCircle,
  Play,
  Star,
  Target,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BookCover } from "@/components/books/BookCover";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import type { Book, BookCategory } from "@/types";
import { cn } from "@/lib/utils/cn";

type HomeViewProps = {
  books: Book[];
};

type CategoryCard = {
  category: BookCategory;
  title: string;
  detail: string;
  icon: typeof BarChart3;
  accent: string;
};

const categoryCards: CategoryCard[] = [
  {
    category: "Finanzas",
    title: "Finanzas",
    detail: "Dinero, inversion y criterio",
    icon: LineChart,
    accent: "from-emerald-300/25 via-emerald-500/10 to-cyan-500/10",
  },
  {
    category: "Productividad",
    title: "Productividad",
    detail: "Foco, energia y sistemas",
    icon: Zap,
    accent: "from-blue-400/25 via-blue-600/10 to-indigo-500/10",
  },
  {
    category: "Emprendimiento",
    title: "Negocios",
    detail: "Ventas, oferta y estrategia",
    icon: BriefcaseBusiness,
    accent: "from-orange-400/25 via-rose-500/10 to-orange-700/10",
  },
  {
    category: "Psicología",
    title: "Mentalidad",
    detail: "Decisiones, calma y sesgos",
    icon: Brain,
    accent: "from-cyan-300/25 via-teal-500/10 to-blue-600/10",
  },
  {
    category: "Liderazgo",
    title: "Liderazgo",
    detail: "Influencia, equipos y voz",
    icon: Target,
    accent: "from-purple-400/25 via-fuchsia-500/10 to-violet-700/10",
  },
];

const aiSuggestions = [
  "Que leo si quiero ordenar mi dinero?",
  "Como ser mas productivo sin agotarme?",
  "Que libro me ayuda a crear mejores habitos?",
  "Que deberia leer para liderar mejor?",
] as const;

const navItems = [
  { href: "/home", label: "Inicio", icon: Home, active: true },
  { href: "/biblioteca", label: "Biblioteca", icon: BookOpen, active: false },
  { href: "/home#ia", label: "IA", icon: Bot, active: false },
  { href: "/biblioteca", label: "Favoritos", icon: Star, active: false },
  { href: "/planes", label: "Perfil", icon: User, active: false },
] as const;

const popularCollections: Array<{
  title: string;
  icon: LucideIcon;
  category: BookCategory;
}> = [
  { title: "Construye riqueza", icon: Trophy, category: "Finanzas" },
  { title: "Emprende desde cero", icon: BriefcaseBusiness, category: "Emprendimiento" },
  { title: "Aprende a vender", icon: MessageCircle, category: "Liderazgo" },
  { title: "Piensa como CEO", icon: Crown, category: "Productividad" },
  { title: "Productividad extrema", icon: Zap, category: "Productividad" },
];

const progressStats: Array<{
  value: string;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "23", label: "Libros explorados", icon: LibraryBig },
  { value: "7.4", label: "Horas aprendidas", icon: CheckCircle2 },
  { value: "12", label: "Dias seguidos", icon: Flame },
  { value: "324", label: "Preguntas realizadas", icon: MessageCircle },
];

function getBooksByCategory(books: Book[], category: BookCategory) {
  return books.filter((book) => book.category === category);
}

function getBookProgress(index: number) {
  const values = [73, 35, 20, 58, 44];

  return values[index % values.length];
}

function getRemainingMinutes(book: Book, progress: number) {
  return Math.max(Math.ceil(book.readingTime * (1 - progress / 100)), 3);
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-xl font-semibold md:text-2xl">{title}</h2>
      <div className="flex items-center gap-2 text-sm text-brand-purple">
        <Link href="/biblioteca">Ver todo</Link>
        <button
          aria-label="Anterior"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-text-secondary transition hover:text-text-primary"
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={17} />
        </button>
        <button
          aria-label="Siguiente"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-text-secondary transition hover:text-text-primary"
          type="button"
        >
          <ChevronRight aria-hidden="true" size={17} />
        </button>
      </div>
    </div>
  );
}

export function HomeView({ books }: HomeViewProps) {
  const featuredBook = books[0];
  const recommendedBook =
    books.find((book) => book.category === "Productividad") ?? featuredBook;
  const continueBooks = books.slice(0, 3);
  const trendingBooks = books.slice(0, 5);

  if (!featuredBook) {
    return (
      <main className="min-h-screen bg-background text-text-primary">
        <section className="ceoteca-container ceoteca-section">
          <h1 className="text-3xl font-semibold">Biblioteca en preparacion</h1>
          <p className="mt-3 text-text-secondary">
            Aun no hay libros publicados en Supabase.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background pb-28 text-text-primary">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(124,58,237,0.16),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(79,99,255,0.12),transparent_30%),linear-gradient(180deg,#05050a_0%,#070711_55%,#05050a_100%)]" />

      <section className="ceoteca-container pt-6">
        <header className="flex items-center justify-between">
          <Logo className="[&>span]:tracking-[0.28em]" />
          <button
            aria-label="Notificaciones"
            className="relative grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-text-secondary transition hover:text-text-primary"
            type="button"
          >
            <Bell aria-hidden="true" size={19} />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-brand-purple ring-2 ring-background" />
          </button>
        </header>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_305px] lg:items-end">
          <div className="reveal-up">
            <p className="text-lg text-brand-purple">Hola, bienvenido</p>
            <h1 className="mt-4 max-w-3xl text-balance text-5xl font-semibold leading-[0.98] tracking-normal md:text-7xl">
              Que quieres mejorar{" "}
              <span className="text-gradient-brand">hoy?</span>
            </h1>
          </div>

          <Card className="reveal-up overflow-hidden p-6 [animation-delay:120ms]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">Racha actual</p>
                <p className="mt-4 text-5xl font-semibold">12</p>
                <p className="mt-1 text-sm text-text-secondary">dias seguidos</p>
              </div>
              <div className="flex h-24 items-end gap-2">
                {[22, 36, 48, 64, 76, 96].map((height, index) => (
                  <span
                    className="w-2.5 rounded-full bg-brand-gradient"
                    key={height}
                    style={{ height: `${height}%`, opacity: 0.5 + index * 0.08 }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-7 text-center text-xs text-text-muted">
              {["L", "M", "M", "J", "V", "S", "D"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categoryCards.map((item, index) => {
            const Icon = item.icon;
            const count = getBooksByCategory(books, item.category).length;

            return (
              <Link
                className="group reveal-up"
                href="/biblioteca"
                key={item.category}
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <Card
                  className={cn(
                    "relative min-h-48 overflow-hidden bg-gradient-to-br p-5 transition duration-300 group-hover:-translate-y-1",
                    item.accent,
                  )}
                >
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                  <Icon
                    aria-hidden="true"
                    className="text-white drop-shadow-[0_0_22px_rgba(168,85,247,0.5)]"
                    size={48}
                  />
                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold">{item.title}</h2>
                        <p className="mt-1 text-sm text-text-secondary">
                          {count || "Nuevos"} libros
                        </p>
                        <p className="mt-2 text-xs text-text-muted">
                          {item.detail}
                        </p>
                      </div>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-text-secondary transition group-hover:bg-brand-purple group-hover:text-white">
                        <ArrowRight aria-hidden="true" size={17} />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </section>

        <section className="mt-8">
          <SectionHeader title="Continuar aprendiendo" />
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {continueBooks.map((book, index) => {
              const progress = getBookProgress(index);

              return (
                <Card className="p-4" key={book.id}>
                  <div className="grid grid-cols-[84px_1fr_44px] items-center gap-4">
                    <div className="overflow-hidden rounded-button">
                      <BookCover book={book} size="sm" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{book.title}</p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {progress}% completado
                      </p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-brand-gradient"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-3 text-xs text-text-muted">
                        {getRemainingMinutes(book, progress)} min restantes
                      </p>
                    </div>
                    <Link
                      aria-label={`Continuar ${book.title}`}
                      className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-brand-purple"
                      href={`/libro/${book.slug}`}
                    >
                      <Play aria-hidden="true" size={17} />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold md:text-2xl">Recomendado para ti</h2>
          <Card className="mt-4 overflow-hidden p-5">
            <div className="grid gap-6 lg:grid-cols-[130px_1fr_1fr_280px] lg:items-center">
              <div className="overflow-hidden rounded-button">
                <BookCover book={recommendedBook} size="sm" />
              </div>
              <div>
                <span className="inline-flex rounded-full bg-brand-purple/20 px-4 py-1 text-sm text-brand-purple">
                  Recomendacion Ceoteca
                </span>
                <h3 className="mt-4 text-2xl font-semibold">
                  Basado en tus lecturas
                </h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  Este libro puede llevar tu aprendizaje al siguiente nivel por
                  su mezcla de accion, foco y criterio practico.
                </p>
              </div>
              <div className="space-y-3 text-sm text-text-secondary">
                <p className="text-text-primary">Porque has leido:</p>
                {books.slice(0, 2).map((book) => (
                  <p className="flex items-center gap-2" key={book.id}>
                    <CheckCircle2
                      aria-hidden="true"
                      className="text-success"
                      size={16}
                    />
                    {book.title}
                  </p>
                ))}
              </div>
              <div className="relative min-h-48">
                <div className="ceoteca-orbit absolute inset-0" />
                <ButtonLink
                  className="absolute bottom-0 right-0 min-w-44"
                  href={`/libro/${recommendedBook.slug}`}
                >
                  Explorar libro
                  <ArrowRight aria-hidden="true" size={18} />
                </ButtonLink>
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-8">
          <SectionHeader title="Trending en Ceoteca" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {trendingBooks.map((book, index) => (
              <Link href={`/libro/${book.slug}`} key={book.id}>
                <Card className="min-h-52 p-5" interactive>
                  <p className="text-balance text-xl font-semibold uppercase">
                    {book.title}
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">{book.author}</p>
                  <div className="mt-8 space-y-2 text-sm text-text-secondary">
                    <p className="flex items-center gap-2">
                      <Clock3 aria-hidden="true" size={15} />
                      {book.readingTime} min
                    </p>
                    <p className="flex items-center gap-2">
                      <Star
                        aria-hidden="true"
                        className="text-brand-purple"
                        size={15}
                      />
                      {(5 - index * 0.07).toFixed(1)}
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

        <section className="mt-8" id="ia">
          <h2 className="flex items-center gap-2 text-xl font-semibold md:text-2xl">
            Habla con el conocimiento
            <span className="rounded-full bg-brand-purple/20 px-2.5 py-1 text-xs text-brand-purple">
              IA
            </span>
          </h2>
          <Card className="pulse-glow mt-4 overflow-hidden border-brand-purple/40 p-5">
            <div className="grid gap-5 lg:grid-cols-[96px_1fr_56px] lg:items-center">
              <span className="grid h-20 w-20 place-items-center rounded-[1.6rem] border border-brand-purple/50 bg-brand-purple/15 text-brand-purple shadow-[0_0_38px_rgba(168,85,247,0.35)]">
                <Bot aria-hidden="true" size={34} />
              </span>
              <div>
                <h2 className="text-2xl font-semibold">
                  Que quieres aprender hoy?
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Pregunta por recomendaciones, rutas de lectura, ejercicios o
                  que libro elegir segun tu objetivo. La IA usa solo el catalogo
                  y contenido autorizado de Ceoteca.
                </p>
              </div>
              <button
                aria-label="Abrir chat de recomendaciones"
                className="grid h-14 w-14 place-items-center rounded-button bg-brand-gradient text-white shadow-ambient transition hover:brightness-110"
                type="button"
              >
                <ArrowRight aria-hidden="true" size={22} />
              </button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {aiSuggestions.map((suggestion) => (
                <button
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-text-secondary transition hover:border-brand-purple/60 hover:text-text-primary"
                  key={suggestion}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-8">
          <SectionHeader title="Colecciones populares" />
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {popularCollections.map(({ title, icon: Icon, category }) => (
              <Link href="/biblioteca" key={title}>
                <Card className="flex min-h-28 items-center justify-between p-5" interactive>
                  <div>
                    <h3 className="max-w-32 text-lg font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      {getBooksByCategory(books, category).length || 1} libros
                    </p>
                  </div>
                  <Icon
                    aria-hidden="true"
                    className="text-brand-purple"
                    size={42}
                  />
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Tu progreso</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {progressStats.map(({ value, label, icon: Icon }) => (
                <div className="flex gap-3" key={label}>
                  <span className="grid h-10 w-10 place-items-center rounded-button bg-white/[0.06] text-brand-purple">
                    <Icon aria-hidden="true" size={18} />
                  </span>
                  <div>
                    <p className="text-xl font-semibold">{value}</p>
                    <p className="text-xs leading-4 text-text-secondary">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Actividad reciente</h2>
              <Link className="text-sm text-brand-purple" href="/biblioteca">
                Ver todo
              </Link>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              {[
                ["Hoy", `Terminaste ${featuredBook.title}`],
                ["Ayer", "Preguntaste sobre inversion"],
                ["Hace 3 dias", "Empezaste una ruta de habitos"],
              ].map(([time, action]) => (
                <div className="grid grid-cols-[120px_1fr] gap-3" key={time}>
                  <p className="flex items-center gap-2 text-text-secondary">
                    <CheckCircle2
                      aria-hidden="true"
                      className="text-success"
                      size={16}
                    />
                    {time}
                  </p>
                  <p>{action}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </section>

      <nav className="fixed bottom-4 left-1/2 z-40 w-[min(92vw,1080px)] -translate-x-1/2 rounded-[1.5rem] border border-white/10 bg-background/80 px-4 py-3 shadow-ambient backdrop-blur-xl">
        <div className="grid grid-cols-5">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className={cn(
                  "flex flex-col items-center gap-1 rounded-button px-2 py-2 text-xs text-text-secondary transition hover:text-text-primary md:flex-row md:justify-center md:text-sm",
                  item.active && "text-brand-purple",
                  item.label === "IA" &&
                    "-mt-8 mx-auto grid h-16 w-16 place-items-center rounded-full border border-brand-purple/60 bg-brand-purple/20 text-brand-purple shadow-[0_0_44px_rgba(168,85,247,0.42)] md:flex md:h-auto md:w-auto md:rounded-button md:border-0 md:bg-transparent md:shadow-none",
                )}
                href={item.href}
                key={item.label}
              >
                <Icon aria-hidden="true" size={22} />
                <span className={item.label === "IA" ? "sr-only md:not-sr-only" : ""}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
