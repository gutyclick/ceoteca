import { Card } from "@/components/ui/Card";
import { howItWorksSteps } from "@/data/landing";

import { SectionHeading } from "./SectionHeading";

export function HowItWorksSection() {
  return (
    <section className="ceoteca-container ceoteca-section">
      <SectionHeading
        eyebrow="Cómo funciona"
        title="Una forma más ligera de aprender de libros."
        description="Ceoteca transforma análisis editoriales en una experiencia breve, visual y accionable."
      />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {howItWorksSteps.map((step, index) => {
          const Icon = step.icon;

          return (
            <Card className="reveal-up p-6" interactive key={step.title}>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-purple/15 text-brand-purple">
                <Icon aria-hidden="true" size={24} />
              </span>
              <p className="mt-6 text-sm font-medium text-text-muted">
                0{index + 1}
              </p>
              <h3 className="mt-2 text-2xl font-semibold">{step.title}</h3>
              <p className="mt-4 text-sm leading-7 text-text-secondary">
                {step.description}
              </p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
