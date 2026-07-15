import type {
  TrainingCognitiveLevel,
  TrainingDifficulty,
  TrainingPlan,
} from "@/lib/training/taxonomy-model";

export type TrainingAccessState =
  | "available"
  | "partially_available"
  | "locked"
  | "coming_soon";
export type TrainingModeSlug = "analiza" | "construye" | "practica";
export type TrainingCategoryCardViewModel = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  icon: string | null;
  progress: number;
  skillCount: number;
  exerciseCount: number | null;
  highlightedSkills: string[];
  availableModes: TrainingModeSlug[];
  accessState: TrainingAccessState;
  minimumPlan: TrainingPlan;
};
export type TrainingModeViewModel = {
  slug: TrainingModeSlug;
  name: string;
  description: string;
  skillCount: number;
  exerciseCount: number | null;
  accessState: TrainingAccessState;
};
export type TrainingHomeViewModel = {
  recommendation: {
    skillSlug: string;
    title: string;
    category: string;
    reason: string;
    durationMinutes: number;
    exerciseCount: number | null;
    difficulty: TrainingDifficulty;
    accessState: TrainingAccessState;
  } | null;
  continueItems: Array<{
    id: string;
    title: string;
    progress: number;
    href: string;
  }>;
  modes: TrainingModeViewModel[];
  categories: TrainingCategoryCardViewModel[];
  pathPreviews: Array<{
    slug: string;
    name: string;
    promise: string;
    estimatedMinutes: number;
    moduleCount: number;
    minimumPlan: TrainingPlan;
    accessState: TrainingAccessState;
  }>;
  progressSummary: {
    skillsPracticed: number;
    reviewsPending: number;
    minutesTrained: number;
  };
  reviews: { pending: number; label: string };
  roleplayPreview: null | {
    accessState: TrainingAccessState;
    remaining: number | null;
  };
};
export type TrainingCategoryPageViewModel = {
  category: TrainingCategoryCardViewModel;
  progress: number;
  recommendedSkills: string[];
  subcategories: Array<{
    id: string;
    slug: string;
    name: string;
    skillCount: number;
  }>;
  trainingItems: Array<{
    slug: string;
    name: string;
    description: string;
    subcategoryId: string | null;
    concepts: string[];
    difficulty: TrainingDifficulty;
    minimumPlan: TrainingPlan;
    accessState: TrainingAccessState;
  }>;
  pathPreviews: TrainingHomeViewModel["pathPreviews"];
  relatedBooks: Array<{ slug: string; title: string; author: string }>;
  reviews: { pending: number };
  roleplays: null;
};
export type TrainingSkillPageViewModel = {
  skill: {
    slug: string;
    name: string;
    description: string;
    difficultyStart: TrainingDifficulty;
    difficultyMax: TrainingDifficulty;
    minimumPlan: TrainingPlan;
  };
  category: { slug: string; name: string };
  subcategory: { slug: string; name: string } | null;
  progress: number;
  cognitiveProgress: Array<{
    level: TrainingCognitiveLevel;
    label: string;
    progress: number;
  }>;
  concepts: Array<{
    id: string;
    slug: string;
    name: string;
    description: string;
  }>;
  formats: Array<{ slug: string; name: string }>;
  relatedPaths: Array<{ slug: string; name: string }>;
  relatedBooks: Array<{ slug: string; title: string; author: string }>;
  review: { pending: boolean };
  accessState: TrainingAccessState;
};
export type TrainingCategoryFilters = {
  mode?: TrainingModeSlug;
  progress?: "not_started" | "in_progress" | "completed";
  plan?: TrainingPlan;
  query?: string;
  sort?: "recommended" | "name" | "progress";
};
export type TrainingCategoryPageFilters = {
  subcategory?: string;
  mode?: TrainingModeSlug;
  format?: string;
  cognitiveLevel?: TrainingCognitiveLevel;
  difficulty?: TrainingDifficulty;
  duration?: "short" | "medium" | "long";
  plan?: TrainingPlan;
};
