import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, CreditCard, Sparkles } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { planKeys, plans, type PlanKey } from "@/config/plans";
import { parsePlanKey } from "@/lib/plans/parse";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Elige tu plan",
  description: "Onboarding de planes de Ceoteca.",
};

type PlansPageProps = {
  searchParams: Promise<{
    plan?: string | string[];
    status?: string | string[];
  }>;
};

function formatPlanPrice(planKey: PlanKey) {
  const plan = plans[planKey];

  if (plan.monthlyPriceUsd === 0) {
    return "Gratis";
  }

  return `USD ${plan.monthlyPriceUsd.toFixed(2)}/mes`;
}

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const params = await searchParams;
  const selectedPlanKey = parsePlanKey(params.plan);
  const selectedPlan = plans[selectedPlanKey];
  const status = Array.isArray(params.status) ? params.status[0] : params.status;
  const isPaymentPending = selectedPlanKey !== "free" && status === "pending";

  if (isPaymentPending) {
    return (
      <main className="min-h-screen bg-background text-text-primary">
        <section className="ceoteca-container ceoteca-section">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-purple">
              Suscripcion
            </p>
            <h1 className="mt-4 text-balance text-5xl font-semibold leading-tight">
              Tu cuenta esta lista. Falta activar el pago.
            </h1>
            <p className="mt-5 text-lg leading-8 text-text-secondary">
              Elegiste {selectedPlan.name}, pero la pasarela todavia no esta
              integrada. No se realizo ningun cobro.
            </p>

            <Card className="mt-10 p-6">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-purple/15 text-brand-purple">
                  <CreditCard aria-hidden="true" size={24} />
                </span>
                <div>
                  <h2 className="text-2xl font-semibold">{selectedPlan.name}</h2>
                  <p className="mt-2 text-sm leading-7 text-text-secondary">
                    {selectedPlan.description}
                  </p>
                  <p className="mt-4 text-sm text-warning">
                    Pago pendiente: integraremos la pasarela antes de activar
                    cobros reales.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <ButtonLink href="/planes">
                  <ArrowLeft aria-hidden="true" size={18} />
                  Elegir otro plan
                </ButtonLink>
                <ButtonLink href="/home" variant="secondary">
                  Ir a home
                </ButtonLink>
              </div>
            </Card>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <section className="ceoteca-container ceoteca-section">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-purple">
            Onboarding
          </p>
          <h1 className="mt-4 text-balance text-5xl font-semibold leading-tight">
            Elige como quieres empezar.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-text-secondary">
            El plan Gratis activa el acceso de inmediato. Los planes de pago te
            llevaran a la compra de suscripcion cuando la pasarela este lista.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-4">
          {planKeys.map((planKey) => {
            const plan = plans[planKey];
            const isFree = planKey === "free";

            return (
              <Card
                className={cn(
                  "flex flex-col p-6",
                  plan.isRecommended && "border-brand-purple/70",
                )}
                interactive
                key={plan.key}
              >
                {plan.isRecommended ? (
                  <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-purple/20 px-3 py-1 text-xs font-medium text-brand-purple">
                    <Sparkles aria-hidden="true" size={14} />
                    Popular
                  </span>
                ) : null}
                <p className="text-sm text-text-secondary">{plan.tagline}</p>
                <h2 className="mt-3 text-3xl font-semibold">{plan.name}</h2>
                <p className="mt-3 text-2xl font-semibold">
                  {formatPlanPrice(planKey)}
                </p>
                <p className="mt-3 min-h-20 text-sm leading-6 text-text-secondary">
                  {plan.description}
                </p>
                <ul className="mt-5 flex-1 space-y-3">
                  {plan.highlights.slice(0, 3).map((highlight) => (
                    <li
                      className="flex gap-2 text-sm leading-6 text-text-secondary"
                      key={highlight}
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-success"
                        size={17}
                      />
                      {highlight}
                    </li>
                  ))}
                </ul>
                <ButtonLink
                  className="mt-7 w-full"
                  href={
                    isFree
                      ? "/home"
                      : `/planes?plan=${plan.key}&status=pending`
                  }
                  variant={plan.isRecommended ? "primary" : "secondary"}
                >
                  {isFree ? "Activar gratis" : "Continuar a pago"}
                </ButtonLink>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
