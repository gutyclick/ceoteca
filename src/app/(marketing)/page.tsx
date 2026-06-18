import { ArrowRight } from "lucide-react";

import { siteConfig } from "@/config/site";
import { clientEnv } from "@/lib/env";

export default function MarketingHomePage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-text-primary">
      <section className="mx-auto flex max-w-5xl flex-col gap-8">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-text-secondary">
          {clientEnv.NEXT_PUBLIC_DEMO_MODE ? "Modo demo activo" : "Modo real"}
        </p>
        <div className="space-y-5">
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
            {siteConfig.tagline}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-text-secondary">
            Base técnica inicial lista para construir Ceoteca por fases.
          </p>
        </div>
        <div>
          <span className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium">
            Fase 0 en progreso
            <ArrowRight aria-hidden="true" size={16} />
          </span>
        </div>
      </section>
    </main>
  );
}
