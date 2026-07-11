import { ArrowRight } from "lucide-react";

import { howItWorksSteps } from "@/data/landing";
import { cn } from "@/lib/utils/cn";

import { SectionHeading } from "./SectionHeading";

export function HowItWorksSection() {
  return (
    <section className="ceoteca-container pb-20 pt-4 sm:pt-6">
      <SectionHeading
        eyebrow="Cómo funciona"
        title="De la lectura al cambio real"
        description="Un proceso simple para transformar conocimiento en resultados."
      />
      <div className="mt-12 grid gap-5 lg:grid-cols-4">
        {howItWorksSteps.map((step, index) => {
          const Icon = step.icon;

          return (
            <article
              className="relative rounded-[1.25rem] border border-slate-950/[0.08] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
              key={step.title}
            >
              <span
                className={cn(
                  "absolute left-5 top-5 grid h-8 w-8 place-items-center rounded-full text-sm font-black",
                  step.badge,
                )}
              >
                {index + 1}
              </span>
              {index < howItWorksSteps.length - 1 ? (
                <ArrowRight
                  aria-hidden="true"
                  className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-slate-400 lg:block"
                  size={20}
                />
              ) : null}
              <div
                className={cn(
                  "mt-10 grid h-14 w-14 place-items-center rounded-2xl",
                  step.accent,
                )}
              >
                <Icon aria-hidden="true" size={28} />
              </div>
              <h3 className="mt-7 text-xl font-black text-slate-950">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {step.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
