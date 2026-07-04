import { plans, type PlanKey } from "@/config/plans";
import { serverEnv } from "@/lib/env";
import { parsePlanKey } from "@/lib/plans/parse";
import { resolvePlanFromSubscriptions } from "@/lib/subscriptions/resolve";
import type { Database } from "@/lib/supabase/database.types";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import {
  isActiveSubscriptionStatus,
  isPaidPlan,
  type SubscriptionStatus,
} from "@/lib/subscriptions/status";

export type SubscriptionRow =
  Database["public"]["Tables"]["subscriptions"]["Row"];

export type EffectiveSubscription = {
  plan: PlanKey;
  source: "profile" | "subscription";
  subscription: SubscriptionRow | null;
};

export function resolveEffectiveSubscription({
  profilePlan,
  subscriptions,
}: {
  profilePlan: PlanKey;
  subscriptions: SubscriptionRow[];
}): EffectiveSubscription {
  const resolvedPlan = resolvePlanFromSubscriptions({
    profilePlan,
    subscriptions,
  });
  const activeSubscription =
    subscriptions.find(
      (subscription) =>
        subscription.plan === resolvedPlan.plan &&
        isActiveSubscriptionStatus(subscription.status),
    ) ?? null;

  if (resolvedPlan.source === "subscription" && activeSubscription) {
    return {
      plan: resolvedPlan.plan,
      source: "subscription",
      subscription: activeSubscription,
    };
  }

  return {
    plan: profilePlan,
    source: "profile",
    subscription: null,
  };
}

export async function getEffectiveSubscriptionForUser(userId: string) {
  const supabase = createServiceSupabaseClient();
  const [profileResponse, subscriptionResponse] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", userId).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  if (profileResponse.error || !profileResponse.data) {
    throw profileResponse.error ?? new Error("No encontramos el perfil.");
  }

  if (subscriptionResponse.error) {
    throw subscriptionResponse.error;
  }

  return resolveEffectiveSubscription({
    profilePlan: profileResponse.data.plan,
    subscriptions: subscriptionResponse.data ?? [],
  });
}

export async function createPlanSelection({
  userId,
  plan,
}: {
  userId: string;
  plan: PlanKey;
}) {
  const supabase = createServiceSupabaseClient();
  const now = new Date().toISOString();
  const provider = serverEnv.PAYMENTS_PROVIDER;
  const status: SubscriptionStatus = isPaidPlan(plan) ? "pending_payment" : "active";
  const normalizedPlan = parsePlanKey(plan);

  if (!plans[normalizedPlan]) {
    throw new Error("Plan inválido.");
  }

  if (!isPaidPlan(normalizedPlan)) {
    const [subscriptionResponse, profileResponse] = await Promise.all([
      supabase.from("subscriptions").insert({
        user_id: userId,
        provider,
        plan: normalizedPlan,
        status,
        current_period_start: now,
        current_period_end: null,
        cancel_at_period_end: false,
      }),
      supabase
        .from("profiles")
        .update({
          plan: normalizedPlan,
          founder: false,
          onboarding_completed: true,
          plan_selected_at: now,
        })
        .eq("id", userId),
    ]);

    if (subscriptionResponse.error) {
      throw subscriptionResponse.error;
    }

    if (profileResponse.error) {
      throw profileResponse.error;
    }

    return {
      plan: normalizedPlan,
      status,
      checkoutUrl: null,
      message: "Plan Gratis activado.",
    };
  }

  const { data: existingPending } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("status", "pending_payment")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const subscriptionResponse = existingPending
    ? await supabase
        .from("subscriptions")
        .update({
          plan: normalizedPlan,
          status,
          current_period_start: null,
          current_period_end: null,
          cancel_at_period_end: false,
        })
        .eq("id", existingPending.id)
    : await supabase.from("subscriptions").insert({
        user_id: userId,
        provider,
        plan: normalizedPlan,
        status,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
      });

  if (subscriptionResponse.error) {
    throw subscriptionResponse.error;
  }

  const profileResponse = await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      plan_selected_at: now,
    })
    .eq("id", userId);

  if (profileResponse.error) {
    throw profileResponse.error;
  }

  return {
    plan: normalizedPlan,
    status,
    checkoutUrl: null,
    message:
      "Solicitud de suscripción registrada. Stripe podrá activar este plan cuando el checkout esté integrado.",
  };
}
