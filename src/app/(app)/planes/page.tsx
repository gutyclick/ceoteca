import type { Metadata } from "next";
import { AlertCircle, ArrowLeft, CreditCard } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { plans } from "@/config/plans";
import { parsePlanKey } from "@/lib/plans/parse";

export const metadata: Metadata = {
  title: "Planes",
  description: "Gestiona el plan de Ceoteca.",
};

type PlansPageProps = {
  searchParams: Promise<{
    plan?: string | string[];
    status?: string | string[];
  }>;
};

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const params = await searchParams;
  const selectedPlanKey = parsePlanKey(params.plan);
  const selectedPlan = plans[selectedPlanKey];
  const status = Array.isArray(params.status) ? params.status[0] : params.status;
  const isPaymentPending = selectedPlanKey !== "free" && status === "pending";

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <section className="ceoteca-container ceoteca-section">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-purple">
            Planes
          </p>
          <h1 className="mt-4 text-balance text-5xl font-semibold leading-tight">
            {isPaymentPending
              ? "Tu cuenta esta lista. Falta activar el pago."
              : "Gestiona tu plan."}
          </h1>
          <p className="mt-5 text-lg leading-8 text-text-secondary">
            {isPaymentPending
              ? "Elegiste un plan de pago, pero la pasarela todavia no esta integrada. No se realizo ningun cobro."
              : "Aqui podras revisar, cambiar o activar planes cuando la gestion de pagos este disponible."}
          </p>

          <Card className="mt-10 p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-purple/15 text-brand-purple">
                {isPaymentPending ? (
                  <CreditCard aria-hidden="true" size={24} />
                ) : (
                  <AlertCircle aria-hidden="true" size={24} />
                )}
              </span>
              <div>
                <h2 className="text-2xl font-semibold">{selectedPlan.name}</h2>
                <p className="mt-2 text-sm leading-7 text-text-secondary">
                  {selectedPlan.description}
                </p>
                <p className="mt-4 text-sm text-warning">
                  Pago pendiente: integraremos la pasarela antes de activar cobros
                  reales.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <ButtonLink href="/home">
                <ArrowLeft aria-hidden="true" size={18} />
                Ir a home
              </ButtonLink>
              <ButtonLink href="/pricing" variant="secondary">
                Ver precios
              </ButtonLink>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
