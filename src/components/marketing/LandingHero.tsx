import { ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import {
  featuredBookFacts,
  heroActions,
  heroBadgeAvatars,
  visualCards,
} from "@/data/landing";
import { cn } from "@/lib/utils/cn";

export function LandingHero() {
  const PrimaryIcon = heroActions.primary.icon;
  const SecondaryIcon = heroActions.secondary.icon;

  return (
    <section className="ceoteca-container relative flex min-h-[calc(100svh-80px)] flex-col items-center justify-center overflow-hidden pb-10 pt-16 text-center">
      <div className="ambient-drift absolute left-1/2 top-6 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-glow-violet blur-3xl" />
      <div className="ambient-drift absolute bottom-2 left-1/2 -z-10 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-glow-pink blur-3xl [animation-delay:1.4s]" />

      <div className="reveal-up inline-flex max-w-full items-center gap-3 rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-sm text-text-secondary shadow-ambient backdrop-blur-xl">
        <span className="flex -space-x-2" aria-hidden="true">
          {heroBadgeAvatars.map((avatar, index) => (
            <span
              className="grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-brand-gradient text-[11px] font-semibold text-white"
              key={avatar}
              style={{ animationDelay: `${index * 120}ms` }}
            >
              {avatar}
            </span>
          ))}
        </span>
        <span>Únete a +25,000 lectores</span>
        <span className="h-1.5 w-1.5 rounded-full bg-brand-purple shadow-[0_0_16px_rgba(168,85,247,0.9)]" />
      </div>

      <div className="reveal-up mt-7 max-w-5xl [animation-delay:100ms]">
        <h1 className="text-balance text-[clamp(3rem,8vw,6.5rem)] font-semibold leading-[0.95] tracking-normal">
          Aprende las mejores ideas del mundo.
          <span className="block text-gradient-brand">En 15 minutos.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-text-secondary sm:text-xl">
          Libros transformados en experiencias interactivas impulsadas por IA.
        </p>
      </div>

      <div className="reveal-up mt-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:justify-center [animation-delay:180ms]">
        <ButtonLink className="sm:flex-1" href={heroActions.primary.href}>
          <PrimaryIcon aria-hidden="true" size={18} />
          {heroActions.primary.label}
          <ArrowRight aria-hidden="true" size={18} />
        </ButtonLink>
        <ButtonLink
          className="sm:flex-1"
          href={heroActions.secondary.href}
          variant="secondary"
        >
          <SecondaryIcon aria-hidden="true" size={18} />
          {heroActions.secondary.label}
        </ButtonLink>
      </div>

      <div className="relative mt-14 flex w-full max-w-6xl items-end justify-center gap-3 lg:gap-0">
        {visualCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <article
              className={cn(
                "float-soft hidden min-h-[330px] w-[190px] shrink-0 rounded-[1.5rem] border bg-surface-gradient p-5 text-left backdrop-blur-xl transition duration-300 hover:-translate-y-3 sm:block",
                card.border,
                card.glow,
                card.rotate,
                card.offset,
                card.featured
                  ? "z-20 min-h-[410px] w-[270px] p-7"
                  : "z-10 -mx-1 opacity-90 lg:-mx-3",
              )}
              key={card.title}
              style={{ animationDelay: `${index * 220}ms` }}
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <p className="text-sm text-text-secondary">{card.subtitle}</p>
                  <h2
                    className={cn(
                      "mt-2 font-semibold uppercase leading-tight",
                      card.featured ? "text-3xl" : "text-xl",
                    )}
                  >
                    {card.title}
                  </h2>
                </div>

                <div className="grid place-items-center py-8">
                  <div
                    className={cn(
                      "relative grid rounded-full bg-gradient-to-br text-white shadow-ambient",
                      card.accent,
                      card.featured ? "h-36 w-36" : "h-24 w-24",
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      className="m-auto drop-shadow-xl"
                      size={card.featured ? 68 : 46}
                    />
                    {card.featured ? (
                      <span className="absolute inset-[-18px] rounded-full border border-brand-pink/50" />
                    ) : null}
                  </div>
                </div>

                {card.featured ? (
                  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.045] p-3">
                    {featuredBookFacts.map((fact) => {
                      const FactIcon = fact.icon;

                      return (
                        <span
                          className="flex items-center gap-2 text-xs text-text-secondary"
                          key={fact.label}
                        >
                          <FactIcon
                            aria-hidden="true"
                            className="text-brand-purple"
                            size={15}
                          />
                          {fact.label}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
                    <Icon aria-hidden="true" size={18} />
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
