import type { EffectiveSubscription } from "@/lib/subscriptions/service";

export type ChatUsageWindow = {
  kind: "calendar_month" | "billing_cycle";
  start: string;
  end: string;
};

export const CHAT_USAGE_POLICY = {
  consumeAt: "first_valid_assistant_delta",
  regenerationConsumes: true,
  contextualActionsConsume: true,
  releaseBeforeFirstDelta: true,
} as const;

export function resolveChatUsageWindow(subscription: EffectiveSubscription, now = new Date()): ChatUsageWindow {
  const current = subscription.subscription;
  if (current?.current_period_start && current.current_period_end) {
    const start = new Date(current.current_period_start);
    const end = new Date(current.current_period_end);
    if (Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && start <= now && end > now) {
      return { kind: "billing_cycle", start: start.toISOString(), end: end.toISOString() };
    }
  }

  return {
    kind: "calendar_month",
    start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(),
    end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString(),
  };
}
