import type { FeatureKey } from "@/config/features";
import { plans, type PlanKey } from "@/config/plans";

export function canAccessFeature(plan: PlanKey, feature: FeatureKey): boolean {
  return plans[plan].features.includes(feature);
}
