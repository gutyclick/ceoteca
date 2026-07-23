import { describe, expect, it } from "vitest";

import { CHAT_USAGE_POLICY, resolveChatUsageWindow } from "@/lib/chat/usage-policy";
import type { EffectiveSubscription } from "@/lib/subscriptions/service";

const freeSubscription: EffectiveSubscription = {
  plan: "free",
  source: "profile",
  subscription: null,
};

describe("chat usage policy", () => {
  it("uses a UTC calendar month without an active billing window", () => {
    const window = resolveChatUsageWindow(freeSubscription, new Date("2026-07-22T15:00:00-05:00"));
    expect(window).toEqual({
      kind: "calendar_month",
      start: "2026-07-01T00:00:00.000Z",
      end: "2026-08-01T00:00:00.000Z",
    });
  });

  it("uses the active subscription billing cycle when available", () => {
    const subscription: EffectiveSubscription = {
      plan: "pro",
      source: "subscription",
      subscription: {
        id: "subscription-id",
        user_id: "user-id",
        provider: "stripe",
        provider_customer_id: null,
        provider_subscription_id: null,
        plan: "pro",
        status: "active",
        current_period_start: "2026-07-10T00:00:00.000Z",
        current_period_end: "2026-08-10T00:00:00.000Z",
        cancel_at_period_end: false,
        created_at: "2026-07-10T00:00:00.000Z",
        updated_at: "2026-07-10T00:00:00.000Z",
      },
    };
    expect(resolveChatUsageWindow(subscription, new Date("2026-07-22T12:00:00.000Z"))).toEqual({
      kind: "billing_cycle",
      start: "2026-07-10T00:00:00.000Z",
      end: "2026-08-10T00:00:00.000Z",
    });
  });

  it("documents consumption at the first valid CEO fragment", () => {
    expect(CHAT_USAGE_POLICY).toMatchObject({
      consumeAt: "first_valid_assistant_delta",
      regenerationConsumes: true,
      contextualActionsConsume: true,
      releaseBeforeFirstDelta: true,
    });
  });
});
