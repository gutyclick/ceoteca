"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Clock3,
  Flame,
  Home,
  LibraryBig,
  MessageCircle,
  Play,
  Star,
  User,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils/cn";
import type { Book } from "@/types";

type HomeViewProps = {
  books: Book[];
};

const categoryCards = [
  {
    title: "Finanzas",
    count: "95 libros",
    icon: "💰",
    className: "from-emerald-400/18 via-emerald-900/20 to-black",
    border: "border-emerald-300/20",
  },
  {
    title: "Productividad",
    count: "112 libros",
    icon: "⚡",
    className: "from-blue-500/20 via-blue-950/35 to-black",
    border: "border-blue-400/20",
  },
  {
    title: "Negocios",
    count: "97 libros",
    icon: "🚀",
    className: "from-orange-500/22 via-red-950/30 to-black",
    border: "border-orange-400/20",
  },
  {
    title: "Mentalidad",
    count: "124 libros",
    icon: "🧠",
    className: "from-cyan-400/20 via-teal-950/30 to-black",
    border: "border-cyan-300/20",
  },
  {
    title: "Liderazgo",
    count: "78 libros",
    icon: "🎯",
    className: "from-purple-500/22 via-violet-950/32 to-black",
    border: "border-purple-300/20",
  },
] as const;

const suggestions = [
  "¿Como invertir con poco dinero?",
  "¿Como ser mas productivo?",
  "¿Como construir buenos habitos?",
  "¿Como liderar mejor?",
] as const;

const navItems = [
  { label: "Inicio", href: "/home", icon: Home, active: true },
  { label: "Biblioteca", href: "/biblioteca", icon: BookOpen, active: false },
  { label: "IA", href: "/home#ia", icon: Bot, active: false },
  { label: "Favoritos", href: "/biblioteca", icon: Star, active: false },
  { label: "Perfil", href: "/planes", icon: User, active: false },
] as const;

function getBookProgress(index: number) {
  return [73, 35, 20][index] ?? 28;
}

function getRemainingMinutes(book: Book, progress: number) {
  return Math.max(Math.ceil(book.readingTime * (1 - progress / 100)), 3);
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

function MiniCover({
  book,
  index,
  className,
}: {
  book: Book;
  index: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-white/15 bg-gradient-to-br p-3 shadow-[0_14px_35px_rgba(0,0,0,0.35)]",
        getGradient(index),
        className,
      )}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full border border-white/25" />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
          {book.category}
        </p>
        <div>
          <h3 className="text-balance text-lg font-black uppercase leading-none text-white">
            {book.title}
          </h3>
          <p className="mt-2 text-[11px] text-white/72">{book.author}</p>
        </div>
      </div>
    </div>
  );
}

function HeaderControls({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-[22px] font-semibold tracking-normal">{title}</h2>
      <div className="flex items-center gap-2">
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
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const primaryBook = books[0];
  const continueBooks = books.slice(0, 3);
  const trendingBooks = books.slice(0, 5);
  const recommendedBook =
    books.find((book) => book.slug.includes("deep")) ?? books[2] ?? primaryBook;

  if (!primaryBook) {
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
    <main
      className={cn(
        "min-h-screen overflow-hidden bg-[#03040b] text-text-primary transition-[padding] duration-300",
        isNavCollapsed ? "pb-24" : "pb-44",
      )}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_22%_12%,rgba(124,58,237,0.18),transparent_30%),radial-gradient(circle_at_70%_0%,rgba(79,99,255,0.1),transparent_24%),linear-gradient(180deg,#02030a_0%,#050612_42%,#04040a_100%)]" />

      <section className="mx-auto w-full max-w-[1180px] px-5 pt-6 md:px-8">
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

        <section className="mt-12 grid gap-7 lg:grid-cols-[1fr_305px] lg:items-end">
          <div className="reveal-up">
            <p className="text-lg font-medium text-brand-purple">Hola, Andres 👋</p>
            <h1 className="mt-5 max-w-[650px] text-balance text-[52px] font-black leading-[0.98] tracking-normal text-white md:text-[72px]">
              ¿Que quieres mejorar{" "}
              <span className="bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">
                hoy?
              </span>
            </h1>
          </div>

          <Card className="reveal-up h-[170px] rounded-[18px] border-white/10 bg-white/[0.035] p-6 [animation-delay:120ms]">
            <div className="flex h-full items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Racha actual 🔥</p>
                <p className="mt-6 text-5xl font-bold">12</p>
                <p className="mt-2 text-sm text-text-secondary">dias seguidos</p>
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

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {categoryCards.map((card, index) => (
            <Link className="group reveal-up" href="/biblioteca" key={card.title}>
              <Card
                className={cn(
                  "relative h-[210px] overflow-hidden rounded-[14px] bg-gradient-to-br p-5 transition duration-300 group-hover:-translate-y-1",
                  card.className,
                  card.border,
                )}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.13),transparent_33%)]" />
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div className="grid place-items-center pt-2">
                    <span className="text-[58px] drop-shadow-[0_0_30px_rgba(124,58,237,0.55)]">
                      {card.icon}
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">{card.title}</h2>
                      <p className="mt-1 text-sm text-text-secondary">
                        {card.count}
                      </p>
                    </div>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.07] text-text-secondary transition group-hover:bg-white/[0.14] group-hover:text-white">
                      <ArrowRight aria-hidden="true" size={18} />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </section>

        <section className="mt-8">
          <HeaderControls title="Continuar aprendiendo" />
          <div className="mt-4 grid gap-5 lg:grid-cols-3">
            {continueBooks.map((book, index) => {
              const progress = getBookProgress(index);

              return (
                <Card
                  className="h-[156px] rounded-[14px] border-white/10 bg-white/[0.035] p-4"
                  key={book.id}
                >
                  <div className="grid h-full grid-cols-[88px_1fr_46px] items-center gap-5">
                    <MiniCover book={book} className="h-[120px]" index={index} />
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
            })}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-[22px] font-semibold">Recomendado para ti</h2>
          <Card className="mt-4 rounded-[14px] border-white/10 bg-white/[0.032] p-5">
            <div className="grid gap-6 lg:grid-cols-[140px_1.2fr_1fr_280px] lg:items-center">
              <MiniCover
                book={recommendedBook}
                className="h-[190px] w-[120px]"
                index={2}
              />
              <div>
                <span className="inline-flex rounded-full bg-brand-purple/20 px-4 py-1 text-sm text-brand-purple">
                  Recomendacion CEOTECA
                </span>
                <h3 className="mt-5 text-2xl font-semibold">
                  Basado en tus lecturas
                </h3>
                <p className="mt-4 max-w-sm text-sm leading-7 text-text-secondary">
                  Creemos que este libro puede llevar tu aprendizaje al
                  siguiente nivel.
                </p>
              </div>
              <div className="space-y-4 text-sm">
                <p className="text-text-secondary">Porque has leido:</p>
                {books.slice(0, 2).map((book) => (
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
              <div className="relative min-h-[190px]">
                <div className="ceoteca-orbit absolute inset-0 opacity-90" />
                <Link
                  className="absolute bottom-0 right-0 inline-flex min-h-14 min-w-52 items-center justify-center gap-3 rounded-button border border-brand-purple/80 bg-brand-purple/20 px-5 text-white shadow-[0_0_32px_rgba(168,85,247,0.42)] transition hover:bg-brand-purple/35"
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
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
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

        <section className="mt-7" id="ia">
          <h2 className="flex items-center gap-2 text-[22px] font-semibold">
            Habla con el conocimiento
            <span className="rounded-full bg-brand-purple/20 px-2.5 py-1 text-xs text-brand-purple">
              IA
            </span>
          </h2>
          <Card className="pulse-glow mt-3 rounded-[14px] border-brand-purple/50 bg-white/[0.035] p-5">
            <div className="grid gap-5 lg:grid-cols-[92px_1fr_54px] lg:items-center">
              <span className="grid h-20 w-20 place-items-center rounded-[1.4rem] border border-brand-purple/60 bg-brand-purple/15 text-brand-purple shadow-[0_0_40px_rgba(124,58,237,0.55)]">
                <Bot aria-hidden="true" size={36} />
              </span>
              <div>
                <h2 className="text-2xl font-semibold">
                  ¿Que quieres aprender hoy?
                </h2>
                <p className="mt-2 text-sm text-text-secondary">
                  Pregunta cualquier cosa sobre un libro o idea...
                </p>
              </div>
              <button
                aria-label="Abrir chat con IA"
                className="grid h-14 w-14 place-items-center rounded-button bg-brand-gradient text-white shadow-[0_0_28px_rgba(124,58,237,0.5)] transition hover:brightness-110"
                type="button"
              >
                <ArrowRight aria-hidden="true" size={22} />
              </button>
            </div>
            <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 md:grid-cols-4">
              {suggestions.map((suggestion) => (
                <button
                  className="rounded-full border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-text-secondary transition hover:border-brand-purple/50 hover:text-white"
                  key={suggestion}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-7">
          <HeaderControls title="Colecciones populares" />
          <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {[
              ["Construye riqueza", "💵", "15 libros"],
              ["Emprende desde cero", "🚀", "12 libros"],
              ["Aprende a vender", "📣", "8 libros"],
              ["Piensa como CEO", "👑", "20 libros"],
              ["Productividad extrema", "⚡", "11 libros"],
            ].map(([title, icon, count]) => (
              <Link href="/biblioteca" key={title}>
                <Card className="flex min-h-[116px] items-center justify-between rounded-[13px] bg-white/[0.035] p-5" interactive>
                  <div>
                    <h3 className="max-w-36 text-lg font-semibold leading-tight">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm text-text-secondary">{count}</p>
                  </div>
                  <span className="text-[42px] drop-shadow-[0_0_24px_rgba(124,58,237,0.45)]">
                    {icon}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-[13px] bg-white/[0.035] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Tu progreso</h2>
              <Link className="text-sm text-brand-purple" href="/biblioteca">
                Ver estadisticas
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                ["23", "Libros explorados", LibraryBig, "text-emerald-300"],
                ["7.4", "Horas aprendidas", CheckCircle2, "text-yellow-300"],
                ["12", "Dias seguidos", Flame, "text-red-300"],
                ["324", "Preguntas realizadas", MessageCircle, "text-blue-300"],
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
              {[
                ["Hoy", "Terminaste Deep Work"],
                ["Ayer", "Preguntaste 12 veces sobre inversion"],
                ["Hace 3 dias", "Empezaste Habitos Atomicos"],
              ].map(([time, activity]) => (
                <div className="grid grid-cols-[110px_1fr] gap-3" key={time}>
                  <p className="flex items-center gap-2 text-text-secondary">
                    <CheckCircle2 aria-hidden="true" className="text-success" size={16} />
                    {time}
                  </p>
                  <p>{activity}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </section>

      <div className="fixed bottom-5 left-1/2 z-40 w-[min(94vw,1120px)] -translate-x-1/2">
        <div
          className={cn(
            "relative mx-auto transition-all duration-300 ease-out",
            isNavCollapsed
              ? "w-fit translate-y-0 opacity-100"
              : "w-full translate-y-0 opacity-100",
          )}
        >
          {isNavCollapsed ? (
            <button
              aria-label="Mostrar menu"
              className="mx-auto flex min-h-14 items-center gap-3 rounded-full border border-brand-purple/45 bg-[#080915]/92 px-5 text-sm text-text-primary shadow-[0_0_38px_rgba(124,58,237,0.28)] backdrop-blur-xl transition hover:border-brand-purple/80"
              onClick={() => setIsNavCollapsed(false)}
              type="button"
            >
              <Bot aria-hidden="true" className="text-brand-purple" size={22} />
              Menu
              <ChevronsUp aria-hidden="true" size={18} />
            </button>
          ) : (
            <nav className="relative rounded-[24px] border border-white/10 bg-[#080915]/92 px-4 pb-3 pt-4 shadow-ambient backdrop-blur-xl">
              <button
                aria-label="Ocultar menu"
                className="absolute -top-4 right-5 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#101121] text-text-secondary shadow-ambient transition hover:border-brand-purple/60 hover:text-white"
                onClick={() => setIsNavCollapsed(true)}
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
      </div>
    </main>
  );
}
