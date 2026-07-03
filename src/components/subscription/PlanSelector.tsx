"use client";

import { CheckCircle2, Crown, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { Card } from "@/components/ui/Card";
import { planKeys, plans, type PlanKey } from "@/config/plans";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

type SelectionStatus =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

function formatPlanPrice(planKey: PlanKey) {
  const plan = plans[planKey];

  if (plan.monthlyPriceUsd === 0) {
    return "Gratis";
  }

  return `USD ${plan.monthlyPriceUsd.toFixed(2)}/mes`;
}

async function selectPlan(plan: PlanKey) {
  const supabase = createBrowserSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!accessToken) {
    throw new Error("Inicia sesión para elegir un plan.");
  }

  const response = await fetch("/api/subscription", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plan }),
  });
  const payload = (await response.json()) as {
    data?: {
      checkoutUrl: string | null;
      message: string;
      plan: PlanKey;
      status: string;
    };
    error?: { message: string };
  };

  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message ?? "No pudimos seleccionar el plan.");
  }

  return payload.data;
}

export function PlanSelector() {
  const [pendingPlan, setPendingPlan] = useState<PlanKey | null>(null);
  const [status, setStatus] = useState<SelectionStatus>({ type: "idle" });

  async function handleSelect(plan: PlanKey) {
    setPendingPlan(plan);
    setStatus({ type: "idle" });

    try {
      const result = await selectPlan(plan);

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      setStatus({
        type: "success",
        message:
          result.status === "active"
            ? "Tu plan ya está activo. Te llevaremos a tu home."
            : "Tu selección quedó guardada. Activaremos el plan cuando conectemos Stripe.",
      });

      window.setTimeout(() => {
        window.location.href = result.status === "active" ? "/home" : "/planes";
      }, 900);
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No pudimos seleccionar el plan.",
      });
    } finally {
      setPendingPlan(null);
    }
  }

  return (
    <div className="mt-12">
      {status.type !== "idle" ? (
        <div
          className={cn(
            "mx-auto mb-6 max-w-3xl rounded-[16px] border p-4 text-sm leading-6",
            status.type === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-danger/30 bg-danger/10 text-danger",
          )}
        >
          {status.message}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-4">
        {planKeys.map((planKey) => {
          const plan = plans[planKey];
          const isFree = planKey === "free";
          const isLoading = pendingPlan === planKey;

          return (
            <Card
              className={cn(
                "relative flex flex-col overflow-hidden p-6",
                plan.isRecommended && "border-brand-purple/70",
                plan.isFounderOffer &&
                  "border-brand-purple/80 bg-brand-purple/10 shadow-[0_0_45px_rgba(168,85,247,0.2)]",
              )}
              interactive
              key={plan.key}
            >
              {plan.isRecommended ? (
                <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-purple/20 px-3 py-1 text-xs font-medium text-brand-purple">
                  <Sparkles aria-hidden="true" size={14} />
                  Más elegido
                </span>
              ) : null}
              {plan.isFounderOffer ? (
                <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-brand-pink/35 bg-brand-pink/15 px-3 py-1 text-xs font-medium text-brand-pink">
                  <Crown aria-hidden="true" size={14} />
                  Primeros 100
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
              <button
                className={cn(
                  "mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-button px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70",
                  plan.isRecommended || plan.isFounderOffer
                    ? "bg-brand-gradient text-white hover:brightness-110"
                    : "border border-white/10 bg-white/[0.045] text-text-primary hover:border-brand-purple/50",
                )}
                disabled={pendingPlan !== null}
                onClick={() => void handleSelect(planKey)}
                type="button"
              >
                {isLoading ? (
                  <Loader2 aria-hidden="true" className="animate-spin" size={17} />
                ) : null}
                {isFree ? "Activar gratis" : "Continuar a pago"}
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
