import type { PlanKey } from "@/config/plans";

export const subscriptionStatuses = [
  "incomplete",
  "pending_payment",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
] as const;

export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export const activeSubscriptionStatuses = ["trialing", "active"] as const;

export type ActiveSubscriptionStatus = (typeof activeSubscriptionStatuses)[number];

export function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return subscriptionStatuses.some((status) => status === value);
}

export function isActiveSubscriptionStatus(
  value: string,
): value is ActiveSubscriptionStatus {
  return activeSubscriptionStatuses.some((status) => status === value);
}

export function isPaidPlan(plan: PlanKey) {
  return plan !== "free";
}
