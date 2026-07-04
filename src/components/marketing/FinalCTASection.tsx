import { ArrowRight, BookOpen } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { finalCta } from "@/data/landing";

export function FinalCTASection() {
  return (
    <section className="ceoteca-container pb-20">
      <div className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700 px-8 py-10 text-white shadow-[0_28px_90px_rgba(124,58,237,0.24)] md:px-12">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex gap-5">
            <span className="hidden h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 md:grid">
              <BookOpen aria-hidden="true" size={28} />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
                {finalCta.eyebrow}
              </p>
              <h2 className="mt-2 max-w-xl text-3xl font-black leading-tight md:text-4xl">
                {finalCta.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
                {finalCta.description}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink className="bg-white text-violet-700 hover:bg-violet-50" href={finalCta.primary.href} variant="secondary">
              {finalCta.primary.label}
              <ArrowRight aria-hidden="true" size={18} />
            </ButtonLink>
            <ButtonLink className="border-white/25 bg-white/10 text-white hover:bg-white/15" href={finalCta.secondary.href} variant="secondary">
              {finalCta.secondary.label}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
