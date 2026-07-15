import type { TrainingPlan } from "@/lib/training/taxonomy-model";

const trainingPlanRank: Record<TrainingPlan, number> = {
  free: 0,
  pro: 1,
  unlimited: 2,
};

export function normalizeTrainingPlan(value: unknown): TrainingPlan {
  if (value === "unlimited") return "unlimited";
  if (value === "pro" || value === "founder") return "pro";
  return "free";
}

export function canAccessTrainingPath(
  minimumPlan: TrainingPlan,
  currentPlan: TrainingPlan,
) {
  return trainingPlanRank[currentPlan] >= trainingPlanRank[minimumPlan];
}
