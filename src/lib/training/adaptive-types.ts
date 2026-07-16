import type { ExerciseType, TrainingDifficulty } from "@/types/training-engine";
import type {
  TrainingCognitiveLevel,
  TrainingFormat,
  TrainingPlan,
} from "@/lib/training/taxonomy";

export type AdaptiveCandidate = {
  id: string;
  skillId: string;
  conceptId: string;
  type: ExerciseType;
  difficulty: TrainingDifficulty;
  estimatedSeconds: number;
  mastery: number;
  dueReview: boolean;
  recentErrors: number;
  alignedWithGoal: boolean;
  lastPracticedAt?: string;
  isNew: boolean;
  prerequisiteEligible: boolean;
  categoryId?: string;
  cognitiveLevel?: TrainingCognitiveLevel;
  format?: TrainingFormat;
  pathId?: string;
  minimumPlan?: TrainingPlan;
  hasApprovedVisualAssets?: boolean;
  activeSession?: boolean;
  activePathModule?: boolean;
  preferredCategory?: boolean;
  weakSkill?: boolean;
  nextCognitiveLevel?: boolean;
  rendererAvailable?: boolean;
  recentlyUsedFormat?: boolean;
};
export type AdaptiveTrainingInput = {
  userId: string;
  plan: "free" | "pro" | "unlimited" | "founder";
  requestedDurationMinutes: 3 | 5 | 7 | 10 | 15;
  preferredExerciseTypes?: ExerciseType[];
  now: string;
  aiQuotaRemaining: number;
  candidates: AdaptiveCandidate[];
};
export type RecommendationExplanation = {
  primaryReason: string;
  supportingReasons: string[];
  skills: string[];
  estimatedDuration: number;
  includesReview: boolean;
  includesNewContent: boolean;
  includesDeepAIEvaluation: boolean;
  category?: string;
  concept?: string;
  cognitiveLevel?: TrainingCognitiveLevel;
  format?: TrainingFormat;
  path?: string;
  planEligibility: boolean;
  reasonCode?:
    | "active_session"
    | "active_module"
    | "due_review"
    | "weak_skill"
    | "next_cognitive_level"
    | "goal"
    | "format_variety"
    | "new_content";
};
export type AdaptiveTrainingRecommendation = {
  primarySkillId: string;
  secondarySkillIds: string[];
  exerciseIds: string[];
  difficulty: TrainingDifficulty;
  explanation: RecommendationExplanation;
  requestedDurationMinutes: number;
  calculatedDurationMinutes: number;
  includesDeepAIEvaluation: boolean;
};
export interface AdaptiveTrainingEngine {
  buildRecommendation(
    input: AdaptiveTrainingInput,
  ): Promise<AdaptiveTrainingRecommendation>;
}
