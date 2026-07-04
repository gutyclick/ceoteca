import { ArrowRight, Brain, CheckCircle2 } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import {
  featuredBookFacts,
  heroActions,
  heroBookCover,
  heroMiniReads,
  trustBullets,
} from "@/data/landing";

export function LandingHero() {
  const PrimaryIcon = heroActions.primary.icon;
  const SecondaryIcon = heroActions.secondary.icon;

  return (
    <section className="ceoteca-container relative pb-16 pt-16 md:pb-20 md:pt-20">
      <div className="absolute left-1/2 top-10 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-100/70 blur-3xl" />
      <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-950/[0.08] bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-pink-500 shadow-[0_0_0_5px_rgba(236,72,153,0.12)]" />
            Análisis originales y prácticos, sin relleno.
          </div>
          <h1 className="mt-10 text-balance text-[clamp(3.2rem,7.4vw,6.6rem)] font-black leading-[0.94] tracking-[-0.04em] text-slate-950">
            Aprende ideas clave.
            <span className="block bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Convierte lectura en acción.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-slate-600">
            Análisis profundos en español para complementar tus lecturas con
            contexto, ejemplos y una aplicación inmediata.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={heroActions.primary.href}>
              {heroActions.primary.label}
              <PrimaryIcon aria-hidden="true" size={18} />
            </ButtonLink>
            <ButtonLink href={heroActions.secondary.href} variant="secondary">
              <SecondaryIcon aria-hidden="true" size={18} />
              {heroActions.secondary.label}
            </ButtonLink>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            {trustBullets.map((item) => {
              const Icon = item.icon;

              return (
                <span
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
                  key={item.label}
                >
                  <Icon aria-hidden="true" className="text-slate-500" size={17} />
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="relative mx-auto min-h-[420px] w-full max-w-[560px]">
          <article className="float-soft absolute left-5 top-10 w-[250px] rotate-[-2deg] rounded-[2rem] border border-slate-950/[0.07] bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.12)] sm:left-10 sm:w-[300px]">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>En progreso</span>
              <span>{heroBookCover.progress}%</span>
            </div>
            <div className="mt-5 min-h-[250px] rounded-[1.25rem] bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 p-6 text-white shadow-[inset_0_0_60px_rgba(255,255,255,0.16)]">
              <h2 className="max-w-[170px] text-3xl font-black leading-tight">
                {heroBookCover.title}
              </h2>
              <p className="mt-4 text-sm text-white/85">{heroBookCover.author}</p>
              <div className="mt-12 grid place-items-center">
                <Brain aria-hidden="true" className="text-white/45" size={72} />
              </div>
              <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold">
                {featuredBookFacts.map((fact) => (
                  <span
                    className="rounded-full bg-slate-950/25 px-3 py-2 backdrop-blur"
                    key={fact.label}
                  >
                    {fact.label}
                  </span>
                ))}
              </div>
            </div>
          </article>

          <article className="float-soft absolute right-0 top-24 w-[230px] rotate-[4deg] rounded-[1.5rem] border border-slate-950/[0.07] bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.1)] [animation-delay:700ms]">
            <p className="mb-4 text-sm font-semibold text-slate-700">
              Continuar leyendo
            </p>
            <div className="grid gap-4">
              {heroMiniReads.map((book) => (
                <div className="grid grid-cols-[42px_1fr] gap-3" key={book.title}>
                  <div className="rounded-lg bg-gradient-to-br from-slate-950 to-violet-800" />
                  <div>
                    <p className="line-clamp-2 text-sm font-bold leading-tight text-slate-950">
                      {book.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{book.author}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-violet-600"
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <div className="absolute bottom-4 left-12 hidden items-center gap-2 rounded-full border border-slate-950/[0.06] bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:flex">
            <CheckCircle2 aria-hidden="true" className="text-violet-600" size={18} />
            Ideas listas para aplicar
            <ArrowRight aria-hidden="true" size={16} />
          </div>
        </div>
      </div>
    </section>
  );
}
