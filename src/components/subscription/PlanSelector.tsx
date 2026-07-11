"use client";

import { CheckCircle2, Crown, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

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
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700",
          )}
        >
          {status.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {planKeys.map((planKey) => {
          const plan = plans[planKey];
          const isFree = planKey === "free";
          const isLoading = pendingPlan === planKey;

          return (
            <article
              className={cn(
                "relative flex min-h-[510px] flex-col overflow-hidden rounded-[20px] border border-slate-950/[0.10] bg-white p-6",
                plan.isRecommended && "border-violet-400",
                plan.isFounderOffer &&
                  "border-orange-300 bg-orange-50/40",
              )}
              key={plan.key}
            >
              {plan.isRecommended ? (
                <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-black text-violet-700">
                  <Sparkles aria-hidden="true" size={14} />
                  Más elegido
                </span>
              ) : null}
              {plan.isFounderOffer ? (
                <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-orange-200 bg-orange-100 px-3 py-1.5 text-xs font-black text-orange-700">
                  <Crown aria-hidden="true" size={14} />
                  Primeros 100
                </span>
              ) : null}
              <p className="text-sm font-semibold text-slate-500">{plan.tagline}</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-slate-950">{plan.name}</h2>
              <p className={cn("mt-3 text-2xl font-black text-slate-950", plan.isFounderOffer && "text-orange-700")}>
                {formatPlanPrice(planKey)}
              </p>
              <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">
                {plan.description}
              </p>
              <ul className="mt-5 flex-1 space-y-3">
                {plan.highlights.slice(0, 3).map((highlight) => (
                  <li
                    className="flex gap-2.5 text-sm leading-6 text-slate-700"
                    key={highlight}
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      className={cn("mt-0.5 shrink-0 text-emerald-600", plan.isFounderOffer && "text-orange-600")}
                      size={17}
                    />
                    {highlight}
                  </li>
                ))}
              </ul>
              <button
                className={cn(
                  "mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[13px] px-5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
                  plan.isRecommended
                    ? "bg-violet-700 text-white hover:bg-violet-800"
                    : plan.isFounderOffer
                      ? "bg-orange-600 text-white hover:bg-orange-700"
                      : "border border-slate-300 bg-white text-slate-800 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700",
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
            </article>
          );
        })}
      </div>
    </div>
  );
}
