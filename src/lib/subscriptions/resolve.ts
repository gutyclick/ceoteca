import type { PlanKey } from "@/config/plans";
import { isActiveSubscriptionStatus } from "@/lib/subscriptions/status";

export type PlanSubscription = {
  plan: PlanKey;
  status: string;
  updated_at: string;
};

export type ResolvedPlan = {
  plan: PlanKey;
  source: "profile" | "subscription";
};

function compareUpdatedAt(first: PlanSubscription, second: PlanSubscription) {
  return new Date(second.updated_at).getTime() - new Date(first.updated_at).getTime();
}

export function resolvePlanFromSubscriptions({
  profilePlan,
  subscriptions,
}: {
  profilePlan: PlanKey;
  subscriptions: PlanSubscription[];
}): ResolvedPlan {
  const activeSubscription =
    [...subscriptions]
      .filter((subscription) => isActiveSubscriptionStatus(subscription.status))
      .sort(compareUpdatedAt)[0] ?? null;

  if (activeSubscription) {
    return {
      plan: activeSubscription.plan,
      source: "subscription",
    };
  }

  return {
    plan: profilePlan,
    source: "profile",
  };
}
