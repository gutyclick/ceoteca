export function getMonthlyAIQuotaSnapshot(input: {
  plan: "free" | "pro" | "unlimited" | "founder";
  completedUsage: number;
  now: Date;
  freeLimit: number;
  paidLimit: number;
}) {
  const limit = input.plan === "free" ? input.freeLimit : input.paidLimit;
  return {
    limit,
    used: Math.min(input.completedUsage, limit),
    remaining: Math.max(0, limit - input.completedUsage),
    resetsAt: new Date(
      Date.UTC(input.now.getUTCFullYear(), input.now.getUTCMonth() + 1, 1),
    ).toISOString(),
  };
}
