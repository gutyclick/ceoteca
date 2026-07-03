import type { Metadata } from "next";

import { PlanSelector } from "@/components/subscription/PlanSelector";

export const metadata: Metadata = {
  title: "Elige tu plan",
  description: "Onboarding de planes de Ceoteca.",
};

export default function PlansPage() {
  return (
    <main className="min-h-screen bg-background text-text-primary">
      <section className="ceoteca-container ceoteca-section">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-purple">
            Onboarding
          </p>
          <h1 className="mt-4 text-balance text-5xl font-semibold leading-tight">
            Elige cómo quieres empezar.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-text-secondary">
            El plan Gratis se activa de inmediato. Los planes de pago quedarán
            registrados para activar checkout cuando integremos Stripe.
          </p>
        </div>

        <PlanSelector />
      </section>
    </main>
  );
}
