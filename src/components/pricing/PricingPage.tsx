"use client";

import { CheckCircle2, Crown, Sparkles } from "lucide-react";
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
          description="Planes pensados para explorar ideas clave, escuchar análisis y convertir aprendizaje en acción."
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
                  "relative flex flex-col overflow-hidden p-6",
                  plan.isRecommended && "border-brand-purple/60",
                  plan.isFounderOffer &&
                    "border-brand-purple/80 bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.22),transparent_34%),linear-gradient(180deg,rgba(124,58,237,0.12),rgba(255,255,255,0.025))] shadow-[0_0_55px_rgba(168,85,247,0.28)]",
                )}
                interactive
                key={plan.key}
              >
                {plan.isFounderOffer ? (
                  <div className="pointer-events-none absolute inset-x-8 -top-16 h-28 rounded-full bg-brand-purple/35 blur-3xl motion-safe:animate-pulse" />
                ) : null}
                <div className="relative z-10 flex min-h-8 flex-wrap items-center justify-between gap-2">
                  <p
                    className={cn(
                      "text-sm font-medium text-text-secondary",
                      plan.isFounderOffer && "text-brand-purple",
                    )}
                  >
                    {plan.tagline}
                  </p>
                  {plan.isRecommended ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-purple/30 bg-brand-purple/15 px-3 py-1 text-xs font-medium text-brand-purple">
                      <Sparkles aria-hidden="true" size={14} />
                      Más elegido
                    </span>
                  ) : null}
                  {plan.isFounderOffer ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-pink/40 bg-brand-pink/15 px-3 py-1 text-xs font-medium text-brand-pink shadow-[0_0_24px_rgba(217,70,239,0.25)]">
                      <Crown aria-hidden="true" size={14} />
                      Oferta limitada
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-3 text-3xl font-semibold">{plan.name}</h2>
                <p className="mt-3 min-h-14 text-sm leading-6 text-text-secondary">
                  {plan.description}
                </p>
                {plan.isFounderOffer ? (
                  <p className="mt-4 rounded-[14px] border border-brand-purple/30 bg-brand-purple/10 px-4 py-3 text-sm leading-6 text-brand-purple">
                    Disponible solo para los primeros 100 miembros fundadores.
                  </p>
                ) : null}
                <div className="mt-6">
                  <p className="text-4xl font-semibold">
                    {formatPrice(planKey, period)}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    {getPeriodLabel(planKey, period)}
                  </p>
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
                  variant={
                    plan.isRecommended || plan.isFounderOffer ? "primary" : "secondary"
                  }
                >
                  {plan.ctaLabel}
                </ButtonLink>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="ceoteca-container pb-20">
        <SectionHeading
          eyebrow="Comparativa"
          title="Qué incluye cada plan."
          description="Compara acceso, audio, CEO y herramientas de aprendizaje antes de elegir."
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
          title="Preguntas frecuentes."
          description="Respuestas claras sobre acceso, audio, CEO, suscripciones y la oferta Fundador."
        />
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2">
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
