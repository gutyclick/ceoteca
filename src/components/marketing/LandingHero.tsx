import Image from "next/image";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  MessageCircle,
  Target,
  Zap,
} from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import {
  featuredBookFacts,
  heroActions,
  heroBookCover,
  heroMiniReads,
  trustBullets,
} from "@/data/landing";

const valueItems = [
  {
    title: "Análisis originales",
    description: "Contenido propio que va más allá del resumen.",
    icon: Brain,
  },
  {
    title: "Aplicación inmediata",
    description: "Ejemplos, marcos y pasos para aplicar hoy.",
    icon: Zap,
  },
  {
    title: "Chat con IA",
    description: "Resuelve dudas y profundiza en cada idea.",
    icon: MessageCircle,
  },
  {
    title: "Progreso real",
    description: "Convierte lo aprendido en resultados medibles.",
    icon: Target,
  },
] as const;

export function LandingHero() {
  const PrimaryIcon = heroActions.primary.icon;
  const SecondaryIcon = heroActions.secondary.icon;

  return (
    <section className="relative mx-auto grid min-h-[calc(100vh-74px)] w-full max-w-[1480px] content-center px-5 pb-12 pt-8 sm:px-7 lg:pb-14 lg:pt-9 xl:px-9">
      <div className="absolute right-0 top-0 -z-10 h-[520px] w-[52%] rounded-bl-[6rem] bg-gradient-to-br from-violet-50 via-fuchsia-50 to-transparent" />
      <div className="absolute right-10 top-8 -z-10 hidden h-[360px] w-[360px] rounded-full bg-violet-100/60 blur-3xl lg:block" />

      <div className="grid gap-7 lg:grid-cols-[0.94fr_0.86fr] lg:items-center">
        <div className="max-w-[650px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white px-3.5 py-2 text-xs font-black uppercase tracking-[0.05em] text-violet-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 shadow-[0_0_0_5px_rgba(124,58,237,0.10)]" />
            Análisis originales y prácticos, sin relleno.
          </div>

          <h1 className="mt-6 text-balance text-[clamp(2.75rem,4.75vw,5rem)] font-black leading-[0.96] tracking-[-0.055em] text-[#060917]">
            Aprende ideas clave.
            <span className="block bg-gradient-to-r from-violet-700 via-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">
              Convierte lectura en acción.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-slate-600">
            Análisis profundos en español para complementar tus lecturas con
            contexto, ejemplos y una aplicación inmediata.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              className="min-h-12 rounded-[1rem] px-6 shadow-[0_16px_36px_rgba(124,58,237,0.18)]"
              href={heroActions.primary.href}
            >
              {heroActions.primary.label}
              <PrimaryIcon aria-hidden="true" size={18} />
            </ButtonLink>
            <ButtonLink
              className="min-h-12 rounded-[1rem] border-slate-950/10 bg-white px-6 font-black text-slate-900 shadow-none hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800"
              href={heroActions.secondary.href}
              variant="secondary"
            >
              <SecondaryIcon aria-hidden="true" size={18} />
              {heroActions.secondary.label}
            </ButtonLink>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3">
            {trustBullets.map((item) => {
              const Icon = item.icon;

              return (
                <span
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
                  key={item.label}
                >
                  <Icon aria-hidden="true" className="text-slate-500" size={16} />
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="relative mx-auto hidden min-h-[360px] w-full max-w-[560px] lg:block">
          <article className="float-soft absolute left-2 top-0 w-[286px] rounded-[1.5rem] border border-slate-950/[0.07] bg-white p-5 shadow-[0_26px_72px_rgba(15,23,42,0.11)] xl:left-8 xl:w-[310px]">
            <div className="flex items-center justify-between text-sm font-bold text-slate-600">
              <span>En progreso</span>
              <span>{heroBookCover.progress}%</span>
            </div>
            <div className="relative mt-4 min-h-[245px] overflow-hidden rounded-[1rem] bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 p-6 text-white shadow-[inset_0_0_60px_rgba(255,255,255,0.16)]">
              {heroBookCover.imagePath ? (
                <Image
                  alt={`Portada editorial de ${heroBookCover.title}`}
                  className="object-cover"
                  fill
                  priority
                  sizes="310px"
                  src={heroBookCover.imagePath}
                />
              ) : (
                <>
                  <h2 className="max-w-[180px] text-3xl font-black leading-tight">
                    {heroBookCover.title}
                  </h2>
                  <p className="mt-4 text-sm font-semibold text-white/85">
                    {heroBookCover.author}
                  </p>
                  <div className="mt-12 grid place-items-center">
                    <Brain aria-hidden="true" className="text-white/42" size={74} />
                  </div>
                </>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/55 to-transparent" />
              <div className="relative z-10 mt-[174px] flex flex-wrap gap-2 text-xs font-bold">
                {featuredBookFacts.map((fact) => (
                  <span
                    className="rounded-full bg-slate-950/35 px-3 py-2 backdrop-blur"
                    key={fact.label}
                  >
                    {fact.label}
                  </span>
                ))}
              </div>
            </div>
          </article>

          <article className="float-soft absolute right-0 top-64 w-[255px] rounded-[1.35rem] border border-slate-950/[0.07] bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,0.10)] [animation-delay:700ms] xl:top-20">
            <p className="mb-4 text-sm font-black text-slate-700">
              Continuar leyendo
            </p>
            <div className="grid gap-3">
              {heroMiniReads.map((book) => (
                <div className="grid grid-cols-[44px_1fr] gap-3" key={book.title}>
                  <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[#120032] to-[#351071]">
                    <Image
                      alt={`Portada editorial de ${book.title}`}
                      className="object-cover"
                      fill
                      sizes="44px"
                      src={book.imagePath}
                    />
                  </div>
                  <div>
                    <p className="line-clamp-2 text-sm font-black leading-tight text-slate-950">
                      {book.title}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {book.author}
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <div className="absolute bottom-0 left-0 hidden items-center gap-2 rounded-full border border-slate-950/[0.06] bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-[0_18px_42px_rgba(15,23,42,0.08)] xl:flex">
            <CheckCircle2 aria-hidden="true" className="text-teal-600" size={18} />
            Ideas listas para aplicar
            <ArrowRight aria-hidden="true" size={16} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid rounded-[1.35rem] border border-slate-950/[0.07] bg-white/88 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:grid-cols-2 lg:grid-cols-4">
        {valueItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              className="flex items-start gap-4 p-5 lg:p-6 [&:not(:last-child)]:border-slate-950/[0.06] max-sm:[&:not(:last-child)]:border-b sm:[&:nth-child(odd)]:border-r lg:[&:not(:last-child)]:border-r"
              key={item.title}
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600">
                <Icon aria-hidden="true" size={23} />
              </span>
              <span>
                <span className="block text-sm font-black text-slate-950">
                  {item.title}
                </span>
                <span className="mt-1 block text-sm leading-5 text-slate-600">
                  {item.description}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
