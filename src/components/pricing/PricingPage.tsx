"use client";

import {
  Check,
  Crown,
  FileText,
  Infinity,
  Leaf,
  MonitorSmartphone,
  RefreshCw,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { ButtonLink } from "@/components/ui/Button";
import type { BillingPeriod, PlanKey } from "@/config/plans";
import { cn } from "@/lib/utils/cn";

type PricingPlan = {
  key: PlanKey;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  priceLabel?: string;
  periodLabel: string;
  icon: typeof Leaf;
  iconClassName: string;
  borderClassName?: string;
  glowClassName?: string;
  badge?: string;
  badgeClassName?: string;
  cta: string;
  ctaClassName: string;
  note: string;
  noteIcon: typeof Zap;
  features: Array<{ label: string; included?: boolean }>;
  founder?: boolean;
};

const founderSlotsTotal = 50;
const founderSlotsLeft = 27;
const founderProgress =
  ((founderSlotsTotal - founderSlotsLeft) / founderSlotsTotal) * 100;

const pricingPlans: PricingPlan[] = [
  {
    key: "free",
    name: "Gratis",
    description:
      "Explora Ceoteca, descubre análisis seleccionados y conoce la experiencia.",
    monthlyPrice: 0,
    annualPrice: 0,
    priceLabel: "Gratis",
    periodLabel: "para empezar",
    icon: Leaf,
    iconClassName: "bg-violet-100 text-violet-700",
    cta: "Empezar gratis",
    ctaClassName: "border-slate-950/[0.10] bg-white text-violet-700 hover:bg-violet-50",
    note: "Para empezar",
    noteIcon: Sparkles,
    features: [
      { label: "3 análisis para comenzar" },
      { label: "Biblioteca con vista previa" },
      { label: "Sin audio", included: false },
      { label: "Sin Chat con CEO", included: false },
    ],
  },
  {
    key: "pro",
    name: "Pro",
    description: "Accede al catálogo completo, audio y apoyo contextual de CEO.",
    monthlyPrice: 7.99,
    annualPrice: 79.99,
    periodLabel: "al mes",
    icon: Sparkles,
    iconClassName: "bg-violet-100 text-violet-700",
    borderClassName: "border-violet-400",
    glowClassName:
      "bg-[radial-gradient(circle_at_50%_18%,rgba(124,58,237,0.13),transparent_48%)]",
    badge: "Más elegido",
    badgeClassName: "bg-violet-700 text-white",
    cta: "Elegir Pro",
    ctaClassName:
      "bg-gradient-to-r from-violet-700 to-indigo-600 text-white shadow-[0_18px_48px_rgba(124,58,237,0.24)] hover:brightness-105",
    note: "Para avanzar cada semana",
    noteIcon: Zap,
    features: [
      { label: "Catálogo completo de análisis" },
      { label: "Audio incluido" },
      { label: "50 preguntas a CEO al mes" },
      { label: "Actividades, progreso e historial" },
    ],
  },
  {
    key: "unlimited",
    name: "Ilimitado",
    description: "Todo Pro, más acceso anticipado y consultas ampliadas con CEO.",
    monthlyPrice: 14.99,
    annualPrice: 149.99,
    periodLabel: "al mes",
    icon: Infinity,
    iconClassName: "bg-emerald-100 text-emerald-700",
    cta: "Elegir Ilimitado",
    ctaClassName: "border-slate-950/[0.10] bg-white text-emerald-700 hover:bg-emerald-50",
    note: "Para aprender sin fricción",
    noteIcon: Zap,
    features: [
      { label: "Todo lo incluido en Pro" },
      { label: "Consultas ampliadas con uso responsable" },
      { label: "Acceso anticipado a nuevos análisis" },
      { label: "Funciones premium prioritarias" },
    ],
  },
  {
    key: "founder",
    name: "Fundador",
    description:
      "Asegura una tarifa especial de lanzamiento mientras mantengas tu suscripción activa.",
    monthlyPrice: 4.99,
    annualPrice: 49.99,
    periodLabel: "al mes",
    icon: Crown,
    iconClassName: "bg-orange-100 text-orange-600",
    borderClassName: "border-orange-200",
    glowClassName:
      "bg-[radial-gradient(circle_at_50%_16%,rgba(249,115,22,0.16),transparent_50%)]",
    badge: "Oferta limitada",
    badgeClassName: "bg-orange-100 text-orange-600",
    cta: "Quiero ser fundador",
    ctaClassName:
      "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_18px_48px_rgba(249,115,22,0.22)] hover:brightness-105",
    note: "Primeros 50 miembros",
    noteIcon: Crown,
    founder: true,
    features: [
      { label: "Cupo limitado a 50 fundadores" },
      { label: "Tarifa protegida de lanzamiento" },
      { label: "Catálogo completo, audio y CEO" },
      { label: "Beneficios equivalentes a Pro" },
    ],
  },
];

const includedItems = [
  { title: "Análisis originales de alta calidad", icon: FileText },
  { title: "Ideas clave aplicables", icon: Sparkles },
  { title: "Contenido claro y sin relleno", icon: Star },
  { title: "Actualizaciones cada semana", icon: RefreshCw },
  { title: "Acceso desde cualquier dispositivo", icon: MonitorSmartphone },
] as const;

const faqs = [
  {
    question: "¿Ceoteca reemplaza la lectura del libro original?",
    answer:
      "No. Ceoteca complementa tus lecturas con análisis editoriales propios, ideas clave, ejercicios y rutas de aplicación. Siempre recomendamos profundizar en las obras originales cuando un tema conecte contigo.",
  },
  {
    question: "¿Qué incluye el plan Gratis?",
    answer:
      "Incluye acceso a una selección inicial de análisis y vista previa de la biblioteca. Es ideal para conocer la experiencia antes de activar audio, CEO y el catálogo completo.",
  },
  {
    question: "¿Qué hace CEO, la IA de Ceoteca?",
    answer:
      "CEO te ayuda a elegir análisis, construir rutas de lectura, aplicar ideas a tu contexto y resolver dudas sobre el contenido autorizado dentro de Ceoteca.",
  },
  {
    question: "¿Puedo cambiar de plan después?",
    answer:
      "Sí. Puedes empezar gratis y mejorar tu plan cuando necesites más acceso. Cuando integremos Stripe, la gestión de cambios, cancelaciones y facturas estará disponible desde tu cuenta.",
  },
] as const;

function formatPrice(plan: PricingPlan, period: BillingPeriod) {
  if (plan.priceLabel) {
    return plan.priceLabel;
  }

  const amount = period === "annual" ? plan.annualPrice : plan.monthlyPrice;

  return `USD ${amount.toFixed(2)}`;
}

function periodLabel(plan: PricingPlan, period: BillingPeriod) {
  if (plan.priceLabel) {
    return plan.periodLabel;
  }

  return period === "annual" ? "al año" : plan.periodLabel;
}

export function PricingPage() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfaf8] text-slate-950">
      <section className="ceoteca-container pb-10 pt-16 text-center lg:pt-20">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-700">
          Planes simples, valor real
        </p>
        <h1 className="mx-auto mt-5 max-w-4xl text-balance text-[clamp(2.5rem,5vw,4.6rem)] font-black leading-[1.02] tracking-[-0.04em]">
          Elige el plan que se adapta a tu momento de aprendizaje
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          Análisis de libros, audio, herramientas y apoyo de IA para que
          apliques lo aprendido en tu vida y negocio.
        </p>

        <div className="mx-auto mt-8 grid w-full max-w-[560px] grid-cols-2 rounded-[22px] border border-slate-950/[0.08] bg-white p-1.5 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
          <button
            className={cn(
              "rounded-[17px] px-5 py-3 text-sm font-black transition",
              period === "monthly"
                ? "bg-violet-50 text-violet-700 shadow-sm"
                : "text-slate-600 hover:text-violet-700",
            )}
            onClick={() => setPeriod("monthly")}
            type="button"
          >
            Mensual
            <span className="block text-xs font-semibold opacity-75">
              Paga mes a mes
            </span>
          </button>
          <button
            className={cn(
              "rounded-[17px] px-5 py-3 text-sm font-black transition",
              period === "annual"
                ? "bg-violet-50 text-violet-700 shadow-sm"
                : "text-slate-600 hover:text-violet-700",
            )}
            onClick={() => setPeriod("annual")}
            type="button"
          >
            Anual
            <span className="block text-xs font-semibold opacity-75">
              Ahorra 20%
            </span>
          </button>
        </div>
      </section>

      <section className="ceoteca-container pb-10">
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {pricingPlans.map((plan) => {
            const Icon = plan.icon;
            const NoteIcon = plan.noteIcon;

            return (
              <article
                className={cn(
                  "relative flex min-h-[560px] flex-col rounded-[24px] border border-slate-950/[0.10] bg-white p-7 shadow-[0_22px_70px_rgba(15,23,42,0.06)]",
                  plan.borderClassName,
                  plan.glowClassName,
                )}
                key={plan.key}
              >
                {plan.badge ? (
                  <span
                    className={cn(
                      "absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full px-5 py-2 text-xs font-black uppercase tracking-wide",
                      plan.badgeClassName,
                    )}
                  >
                    {plan.badge}
                  </span>
                ) : null}

                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-slate-50">
                  <span
                    className={cn(
                      "grid h-16 w-16 place-items-center rounded-full",
                      plan.iconClassName,
                    )}
                  >
                    <Icon aria-hidden="true" size={31} />
                  </span>
                </div>

                <h2 className="mt-6 text-center text-3xl font-black">
                  {plan.name}
                </h2>
                <p className="mx-auto mt-3 min-h-[64px] max-w-[260px] text-center text-sm leading-6 text-slate-600">
                  {plan.description}
                </p>

                <div className="mt-6 text-center">
                  <p
                    className={cn(
                      "text-4xl font-black tracking-[-0.04em]",
                      plan.founder && "text-orange-600",
                    )}
                  >
                    {formatPrice(plan, period)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {periodLabel(plan, period)}
                  </p>
                </div>

                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map((feature) => {
                    const included = feature.included !== false;

                    return (
                      <li
                        className="grid grid-cols-[22px_1fr] gap-3 text-sm leading-6 text-slate-700"
                        key={feature.label}
                      >
                        <span
                          className={cn(
                            "mt-1 grid h-5 w-5 place-items-center rounded-full",
                            included
                              ? plan.founder
                                ? "bg-orange-100 text-orange-600"
                                : "bg-violet-100 text-violet-700"
                              : "bg-slate-100 text-slate-400",
                          )}
                        >
                          {included ? (
                            <Check aria-hidden="true" size={14} strokeWidth={3} />
                          ) : (
                            <X aria-hidden="true" size={13} strokeWidth={3} />
                          )}
                        </span>
                        {feature.label}
                      </li>
                    );
                  })}
                </ul>

                {plan.founder ? (
                  <div className="mt-5 rounded-[14px] border border-orange-200 bg-orange-50 p-4">
                    <div className="flex items-center justify-between text-sm font-black text-slate-800">
                      <span>
                        Quedan {founderSlotsLeft} cupos de {founderSlotsTotal}
                      </span>
                    </div>
                    <div className="mt-3 h-2.5 rounded-full bg-orange-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400"
                        style={{ width: `${founderProgress}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                <ButtonLink
                  className={cn("mt-7 min-h-14 rounded-[14px]", plan.ctaClassName)}
                  href={`/registro?plan=${plan.key}`}
                  variant="secondary"
                >
                  {plan.cta}
                </ButtonLink>

                <p
                  className={cn(
                    "mt-5 inline-flex items-center justify-center gap-2 text-sm font-black",
                    plan.founder ? "text-orange-600" : "text-violet-700",
                  )}
                >
                  <NoteIcon aria-hidden="true" size={16} />
                  {plan.note}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="ceoteca-container pb-16">
        <div className="grid gap-6 rounded-[22px] border border-slate-950/[0.08] bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.05)] md:grid-cols-[180px_1fr] md:items-center">
          <h2 className="text-2xl font-black leading-tight">
            Todos los planes incluyen
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {includedItems.map((item) => {
              const Icon = item.icon;

              return (
                <div className="flex items-center gap-3" key={item.title}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-violet-50 text-violet-700">
                    <Icon aria-hidden="true" size={20} />
                  </span>
                  <p className="text-sm font-semibold leading-5 text-slate-700">
                    {item.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="ceoteca-container pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-violet-700">
            Preguntas frecuentes
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.035em]">
            Resolvemos tus dudas
          </h2>
        </div>
        <div className="mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-2">
          {faqs.map((faq) => (
            <article
              className="rounded-[20px] border border-slate-950/[0.08] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
              key={faq.question}
            >
              <h3 className="text-lg font-black">{faq.question}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {faq.answer}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
