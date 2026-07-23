import { z } from "zod";

import { plans, type PlanKey } from "@/config/plans";
import { clientEnv } from "@/lib/env";
import { resolveChatUsageWindow } from "@/lib/chat/usage-policy";
import type { EffectiveSubscription } from "@/lib/subscriptions/service";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const chatUsageTypes = [
  "message",
  "regeneration",
  "contextual_action",
  "book_chat",
  "general_chat",
  "promotional",
  "adjustment",
] as const;

export type ChatUsageType = (typeof chatUsageTypes)[number];
export type ChatUsageStatus = "pending" | "consumed" | "released" | "refunded" | "failed";
export type ChatUsageReason = "usage_limit_reached" | "reservation_released" | "generation_not_started" | null;

export type ChatUsageSnapshot = {
  allowed: boolean;
  reason: ChatUsageReason;
  plan: PlanKey;
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
  periodStart: string;
  periodEnd: string;
  usageId: string | null;
  usageStatus: ChatUsageStatus | null;
  replayed: boolean;
};

type ReserveInput = {
  userId: string;
  subscription: EffectiveSubscription;
  idempotencyKey: string;
  usageType: ChatUsageType;
  bookId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

const snapshotSchema = z.object({
  allowed: z.boolean(),
  reason: z.enum(["usage_limit_reached", "reservation_released", "generation_not_started"]).nullable(),
  plan: z.enum(["free", "pro", "unlimited", "founder"]),
  used: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative().nullable(),
  remaining: z.number().int().nonnegative().nullable(),
  unlimited: z.boolean(),
  periodStart: z.string(),
  periodEnd: z.string(),
  usageId: z.string().uuid().nullable(),
  usageStatus: z.enum(["pending", "consumed", "released", "refunded", "failed"]).nullable(),
  replayed: z.boolean(),
});

const demoReservations = new Map<string, ChatUsageSnapshot>();
const demoConsumed = new Map<string, number>();

export type DemoChatUsageScenario = "reset" | "one_remaining" | "exhausted";

function planLimit(subscription: EffectiveSubscription) {
  return plans[subscription.plan].chatMonthlyLimit;
}

function demoSnapshot(subscription: EffectiveSubscription, usageId: string | null = null): ChatUsageSnapshot {
  const window = resolveChatUsageWindow(subscription);
  const limit = planLimit(subscription);
  const key = `${subscription.plan}:${window.start}`;
  const used = demoConsumed.get(key) ?? 0;
  return {
    allowed: limit === null || used < limit,
    reason: limit !== null && used >= limit ? "usage_limit_reached" : null,
    plan: subscription.plan,
    used,
    limit,
    remaining: limit === null ? null : Math.max(limit - used, 0),
    unlimited: limit === null,
    periodStart: window.start,
    periodEnd: window.end,
    usageId,
    usageStatus: null,
    replayed: false,
  };
}

export function configureDemoChatUsage(subscription: EffectiveSubscription, scenario: DemoChatUsageScenario) {
  if (!clientEnv.NEXT_PUBLIC_DEMO_MODE) return;
  const window = resolveChatUsageWindow(subscription);
  const limit = planLimit(subscription);
  const key = `${subscription.plan}:${window.start}`;
  if (scenario === "reset") demoConsumed.set(key, 0);
  if (scenario === "one_remaining" && limit !== null) demoConsumed.set(key, Math.max(limit - 1, 0));
  if (scenario === "exhausted" && limit !== null) demoConsumed.set(key, limit);
}

function parseSnapshot(value: unknown): ChatUsageSnapshot {
  return snapshotSchema.parse(value);
}

export async function getChatUsageSnapshot(userId: string, subscription: EffectiveSubscription) {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) return demoSnapshot(subscription);
  const window = resolveChatUsageWindow(subscription);
  const { data, error } = await createServiceSupabaseClient().rpc("get_chat_usage_snapshot", {
    target_user_id: userId,
    target_plan: subscription.plan,
    target_limit: planLimit(subscription),
    target_period_start: window.start,
    target_period_end: window.end,
  });
  if (error) throw error;
  return parseSnapshot(data);
}

export async function reserveChatUsage(input: ReserveInput): Promise<ChatUsageSnapshot> {
  const window = resolveChatUsageWindow(input.subscription);
  const limit = planLimit(input.subscription);
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    const existing = demoReservations.get(input.idempotencyKey);
    if (existing) return { ...existing, replayed: true };
    const snapshot = demoSnapshot(input.subscription);
    if (!snapshot.allowed) return snapshot;
    const reserved: ChatUsageSnapshot = {
      ...snapshot,
      remaining: snapshot.remaining === null ? null : Math.max(snapshot.remaining - 1, 0),
      usageId: crypto.randomUUID(),
      usageStatus: "pending",
    };
    demoReservations.set(input.idempotencyKey, reserved);
    return reserved;
  }

  const { data, error } = await createServiceSupabaseClient().rpc("reserve_chat_usage", {
    target_user_id: input.userId,
    target_plan: input.subscription.plan,
    target_limit: limit,
    target_period_start: window.start,
    target_period_end: window.end,
    target_period_kind: window.kind,
    target_idempotency_key: input.idempotencyKey,
    target_usage_type: input.usageType,
    target_book_id: input.bookId ?? null,
    target_metadata: { ...input.metadata, limit },
  });
  if (error) throw error;
  return parseSnapshot(data);
}

export async function attachChatUsage(usageId: string, userId: string, conversationId: string, messageId: string) {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) return;
  const { error } = await createServiceSupabaseClient()
    .from("chat_usage_events")
    .update({ conversation_id: conversationId, message_id: messageId, updated_at: new Date().toISOString() })
    .eq("id", usageId)
    .eq("user_id", userId)
    .eq("status", "pending");
  if (error) throw error;
}

export async function confirmChatUsage(usageId: string, userId: string, subscription: EffectiveSubscription) {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    const entry = [...demoReservations.entries()].find(([, value]) => value.usageId === usageId);
    if (!entry) throw new Error("Usage reservation not found");
    const [key, reservation] = entry;
    if (reservation.usageStatus !== "consumed") {
      const periodKey = `${subscription.plan}:${reservation.periodStart}`;
      demoConsumed.set(periodKey, (demoConsumed.get(periodKey) ?? 0) + 1);
      demoReservations.set(key, { ...reservation, usageStatus: "consumed" });
    }
    return { ...demoSnapshot(subscription, usageId), usageStatus: "consumed" as const };
  }
  const { data, error } = await createServiceSupabaseClient().rpc("confirm_chat_usage", {
    target_usage_id: usageId,
    target_user_id: userId,
  });
  if (error) throw error;
  return parseSnapshot(data);
}

export async function releaseChatUsage(usageId: string, userId: string, subscription: EffectiveSubscription, reason = "generation_not_started") {
  if (clientEnv.NEXT_PUBLIC_DEMO_MODE) {
    const entry = [...demoReservations.entries()].find(([, value]) => value.usageId === usageId);
    if (entry && entry[1].usageStatus === "pending") demoReservations.delete(entry[0]);
    return { ...demoSnapshot(subscription, usageId), allowed: false, reason: "generation_not_started" as const, usageStatus: "released" as const };
  }
  const { data, error } = await createServiceSupabaseClient().rpc("release_chat_usage", {
    target_usage_id: usageId,
    target_user_id: userId,
    target_reason: reason,
  });
  if (error) throw error;
  return parseSnapshot(data);
}
