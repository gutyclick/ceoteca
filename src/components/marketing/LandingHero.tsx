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
    <section className="relative mx-auto w-full max-w-[1480px] px-6 pb-14 pt-16 sm:px-8 md:pb-18 md:pt-20 xl:px-10">
      <div className="absolute left-[38%] top-14 -z-10 h-[460px] w-[560px] -translate-x-1/2 rounded-full bg-[#eee7ff] blur-3xl" />
      <div className="grid gap-10 lg:grid-cols-[0.98fr_0.82fr] lg:items-center">
        <div className="max-w-[760px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-950/[0.08] bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_0_5px_rgba(244,63,94,0.12)]" />
            Análisis originales y prácticos, sin relleno.
          </div>
          <h1 className="mt-9 text-balance text-[clamp(3.35rem,5.35vw,5.8rem)] font-black leading-[0.96] tracking-[-0.055em] text-[#060917]">
            Aprende ideas clave.
            <span className="block bg-gradient-to-r from-violet-700 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
              Convierte lectura en acción.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-slate-600">
            Análisis profundos en español para complementar tus lecturas con
            contexto, ejemplos y una aplicación inmediata.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink className="shadow-[0_18px_42px_rgba(124,58,237,0.22)]" href={heroActions.primary.href}>
              {heroActions.primary.label}
              <PrimaryIcon aria-hidden="true" size={18} />
            </ButtonLink>
            <ButtonLink className="border-slate-950/10 bg-white text-slate-950 hover:bg-slate-50" href={heroActions.secondary.href} variant="secondary">
              <SecondaryIcon aria-hidden="true" size={18} />
              {heroActions.secondary.label}
            </ButtonLink>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            {trustBullets.map((item) => {
              const Icon = item.icon;

              return (
                <span
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
                  key={item.label}
                >
                  <Icon aria-hidden="true" className="text-slate-500" size={17} />
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="relative mx-auto min-h-[430px] w-full max-w-[600px]">
          <article className="float-soft absolute left-0 top-4 w-[280px] rounded-[1.8rem] border border-slate-950/[0.07] bg-white p-5 shadow-[0_34px_95px_rgba(15,23,42,0.13)] sm:left-7 sm:w-[330px]">
            <div className="flex items-center justify-between text-sm font-bold text-slate-600">
              <span>En progreso</span>
              <span>{heroBookCover.progress}%</span>
            </div>
            <div className="mt-5 min-h-[278px] rounded-[1.2rem] bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 p-7 text-white shadow-[inset_0_0_60px_rgba(255,255,255,0.16)]">
              <h2 className="max-w-[190px] text-3xl font-black leading-tight">
                {heroBookCover.title}
              </h2>
              <p className="mt-4 text-sm font-semibold text-white/85">
                {heroBookCover.author}
              </p>
              <div className="mt-12 grid place-items-center">
                <Brain aria-hidden="true" className="text-white/42" size={78} />
              </div>
              <div className="mt-8 flex flex-wrap gap-2 text-xs font-bold">
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

          <article className="float-soft absolute right-0 top-20 w-[260px] rounded-[1.5rem] border border-slate-950/[0.07] bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.11)] [animation-delay:700ms]">
            <p className="mb-5 text-sm font-black text-slate-700">
              Continuar leyendo
            </p>
            <div className="grid gap-4">
              {heroMiniReads.map((book) => (
                <div className="grid grid-cols-[48px_1fr] gap-3" key={book.title}>
                  <div className="rounded-lg bg-gradient-to-br from-[#120032] to-[#351071]" />
                  <div>
                    <p className="line-clamp-2 text-sm font-black leading-tight text-slate-950">
                      {book.title}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {book.author}
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500"
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <div className="absolute bottom-10 left-5 hidden items-center gap-2 rounded-full border border-slate-950/[0.06] bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:flex">
            <CheckCircle2 aria-hidden="true" className="text-teal-600" size={18} />
            Ideas listas para aplicar
            <ArrowRight aria-hidden="true" size={16} />
          </div>
        </div>
      </div>
    </section>
  );
}
