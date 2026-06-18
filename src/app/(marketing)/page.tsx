import { ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { siteConfig } from "@/config/site";
import { clientEnv } from "@/lib/env";

const systemCards = [
  {
    title: "Tokens",
    description: "Paleta oscura, gradientes de marca y superficies editoriales.",
  },
  {
    title: "Componentes",
    description: "Botones, tarjetas, logo, header publico y footer base.",
  },
  {
    title: "Accesibilidad",
    description: "Focus visible, contraste inicial y soporte para reduced motion.",
  },
] as const;

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-text-primary">
      <section className="ceoteca-container ceoteca-section relative">
        <div className="absolute left-1/2 top-16 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-glow-violet blur-3xl" />
        <div className="max-w-3xl space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-text-secondary">
            {clientEnv.NEXT_PUBLIC_DEMO_MODE ? "Modo demo activo" : "Modo real"}
          </p>
          <h1 className="text-balance text-5xl font-semibold leading-tight sm:text-6xl lg:text-7xl">
            {siteConfig.name}
          </h1>
          <p className="text-pretty text-lg leading-8 text-text-secondary sm:text-xl">
            {siteConfig.tagline}
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/registro">
              Empieza gratis
              <ArrowRight aria-hidden="true" size={18} />
            </ButtonLink>
            <ButtonLink href="/biblioteca" variant="secondary">
              Ver biblioteca
            </ButtonLink>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {systemCards.map((card) => (
            <Card className="p-6" key={card.title}>
              <h2 className="text-lg font-semibold">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                {card.description}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
