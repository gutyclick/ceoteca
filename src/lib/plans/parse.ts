import { planKeys, type PlanKey } from "@/config/plans";

function isPlanKey(value: string | undefined): value is PlanKey {
  return planKeys.some((planKey) => planKey === value);
}

export function parsePlanKey(value: string | string[] | undefined): PlanKey {
  const plan = Array.isArray(value) ? value[0] : value;

  if (isPlanKey(plan)) {
    return plan;
  }

  return "free";
}
