"use client";

import { CheckCircle2, Info, Sparkles } from "lucide-react";
import { useState } from "react";

import { SectionHeading } from "@/components/marketing/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  billingPeriods,
  plans,
  pricingFaqs,
  pricingFeatureRows,
  type BillingPeriod,
  type PlanKey,
} from "@/config/plans";
import { cn } from "@/lib/utils/cn";

const planOrder: PlanKey[] = ["free", "pro", "unlimited", "founder"];

const billingLabels: Record<BillingPeriod, string> = {
  monthly: "Mensual",
  annual: "Anual",
};

function formatPrice(planKey: PlanKey, period: BillingPeriod) {
  const plan = plans[planKey];
  const amount =
    period === "annual" ? plan.annualPriceUsd ?? plan.monthlyPriceUsd * 10 : plan.monthlyPriceUsd;

  if (amount === 0) {
    return "Gratis";
  }

  return `USD ${amount.toFixed(2)}`;
}

function getPeriodLabel(planKey: PlanKey, period: BillingPeriod) {
  if (plans[planKey].monthlyPriceUsd === 0) {
    return "para empezar";
  }

  return period === "annual" ? "al año" : "al mes";
}

export function PricingPage() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <main className="min-h-screen overflow-hidden bg-background text-text-primary">
      <section className="ceoteca-container ceoteca-section relative">
        <div className="ambient-drift absolute left-1/2 top-10 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-glow-violet blur-3xl" />
        <SectionHeading
          eyebrow="Precios"
          title="Elige cómo quieres aprender."
          description="Planes centralizados, modo demo activo y pagos deshabilitados hasta definir proveedor real."
        />

        <div className="mx-auto mt-8 flex w-fit rounded-full border border-white/10 bg-white/[0.04] p-1">
          {billingPeriods.map((billingPeriod) => (
            <button
              className={cn(
                "min-h-11 rounded-full px-5 text-sm font-medium text-text-secondary transition",
                period === billingPeriod &&
                  "bg-brand-gradient text-white shadow-[0_0_32px_rgba(168,85,247,0.22)]",
              )}
              key={billingPeriod}
              onClick={() => setPeriod(billingPeriod)}
              type="button"
            >
              {billingLabels[billingPeriod]}
            </button>
          ))}
        </div>

        <div className="mt-12 grid gap-5 xl:grid-cols-4">
          {planOrder.map((planKey) => {
            const plan = plans[planKey];

            return (
              <Card
                className={cn(
                  "relative flex flex-col p-6",
                  plan.isRecommended && "border-brand-purple/70",
                )}
                interactive
                key={plan.key}
              >
                {plan.isRecommended ? (
                  <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-brand-purple/20 px-3 py-1 text-xs font-medium text-brand-purple">
                    <Sparkles aria-hidden="true" size={14} />
                    Popular
                  </span>
                ) : null}
                <p className="text-sm font-medium text-text-secondary">
                  {plan.tagline}
                </p>
                <h2 className="mt-3 text-3xl font-semibold">{plan.name}</h2>
                <p className="mt-3 min-h-14 text-sm leading-6 text-text-secondary">
                  {plan.description}
                </p>
                <div className="mt-6">
                  <p className="text-4xl font-semibold">
                    {formatPrice(planKey, period)}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    {getPeriodLabel(planKey, period)}
                  </p>
                  {plan.setupFeeUsd ? (
                    <p className="mt-2 text-xs text-warning">
                      Entrada inicial: USD {plan.setupFeeUsd.toFixed(2)}
                    </p>
                  ) : null}
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.highlights.map((highlight) => (
                    <li
                      className="flex gap-3 text-sm leading-6 text-text-secondary"
                      key={highlight}
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-success"
                        size={18}
                      />
                      {highlight}
                    </li>
                  ))}
                </ul>
                <ButtonLink
                  className="mt-7"
                  href={`/registro?plan=${plan.key}`}
                  variant={plan.isRecommended ? "primary" : "secondary"}
                >
                  {plan.ctaLabel}
                </ButtonLink>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6 flex items-start gap-3 p-5">
          <Info aria-hidden="true" className="mt-0.5 text-info" size={20} />
          <p className="text-sm leading-6 text-text-secondary">
            Integración de pagos pendiente. Los CTAs preparan el plan seleccionado,
            pero no ejecutan checkout ni simulan cobros.
          </p>
        </Card>
      </section>

      <section className="ceoteca-container pb-20">
        <SectionHeading
          eyebrow="Comparativa"
          title="Qué incluye cada plan."
          description="La lógica visible sale de configuración central para poder cambiar precios y límites sin tocar componentes."
        />
        <Card className="mt-12 overflow-hidden p-0">
          <div className="grid border-b border-white/10 bg-white/[0.04] p-5 text-sm font-semibold text-text-secondary lg:grid-cols-5">
            <span>Función</span>
            {planOrder.map((planKey) => (
              <span key={planKey}>{plans[planKey].name}</span>
            ))}
          </div>
          {pricingFeatureRows.map((row) => (
            <div
              className="grid gap-3 border-b border-white/10 p-5 text-sm last:border-b-0 lg:grid-cols-5"
              key={row.label}
            >
              <p className="font-medium text-text-primary">{row.label}</p>
              {planOrder.map((planKey) => (
                <p className="text-text-secondary" key={planKey}>
                  {row.values[planKey]}
                </p>
              ))}
            </div>
          ))}
        </Card>
      </section>

      <section className="ceoteca-container pb-24">
        <SectionHeading
          eyebrow="FAQ"
          title="Preguntas de planes."
          description="Información honesta sobre el estado actual del MVP y las integraciones pendientes."
        />
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
          {pricingFaqs.map((faq) => (
            <Card className="p-6" key={faq.question}>
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="mt-3 text-sm leading-7 text-text-secondary">
                {faq.answer}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
