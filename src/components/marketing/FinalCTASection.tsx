import { ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { finalCta } from "@/data/landing";

export function FinalCTASection() {
  const PrimaryIcon = finalCta.primary.icon;
  const SecondaryIcon = finalCta.secondary.icon;

  return (
    <section className="ceoteca-container pb-24">
      <Card className="relative overflow-hidden px-6 py-14 text-center md:px-12">
        <div className="ambient-drift absolute left-1/2 top-0 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-glow-pink blur-3xl" />
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-purple">
          {finalCta.eyebrow}
        </p>
        <h2 className="mx-auto mt-4 max-w-3xl text-balance text-4xl font-semibold leading-tight sm:text-5xl">
          {finalCta.title}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-8 text-text-secondary">
          {finalCta.description}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href={finalCta.primary.href}>
            <PrimaryIcon aria-hidden="true" size={18} />
            {finalCta.primary.label}
            <ArrowRight aria-hidden="true" size={18} />
          </ButtonLink>
          <ButtonLink href={finalCta.secondary.href} variant="secondary">
            <SecondaryIcon aria-hidden="true" size={18} />
            {finalCta.secondary.label}
          </ButtonLink>
        </div>
      </Card>
    </section>
  );
}
