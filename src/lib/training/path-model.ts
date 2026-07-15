import type {
  TrainingAccessState,
} from "@/lib/training/navigation-model";
import type {
  TrainingDifficulty,
  TrainingPlan,
} from "@/lib/training/taxonomy-model";

export type TrainingPathStatus =
  | "available"
  | "locked"
  | "in_progress"
  | "completed"
  | "coming_soon";
export type TrainingPathModuleStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed";
export type TrainingPathItemType =
  | "exercise"
  | "skill_session"
  | "concept_session"
  | "template"
  | "roleplay"
  | "review";

export type TrainingPathItemViewModel = {
  id: string;
  title: string;
  description: string;
  type: TrainingPathItemType;
  estimatedMinutes: number;
  required: boolean;
  status: "locked" | "available" | "in_progress" | "completed";
  accessState: TrainingAccessState;
  minimumPlan: TrainingPlan;
  lockedReason: string | null;
  href: string | null;
};

export type TrainingPathModuleViewModel = {
  id: string;
  slug: string;
  title: string;
  description: string;
  progress: number;
  status: TrainingPathModuleStatus;
  estimatedMinutes: number;
  itemCount: number;
  items: TrainingPathItemViewModel[];
  lockedReason: string | null;
};

export type TrainingPathCardViewModel = {
  slug: string;
  name: string;
  promise: string;
  category: { slug: string; name: string } | null;
  difficulty: TrainingDifficulty;
  estimatedMinutes: number;
  moduleCount: number;
  progress: number;
  status: TrainingPathStatus;
  accessState: TrainingAccessState;
  minimumPlan: TrainingPlan;
};

export type TrainingPathNextAction = {
  label: "Comenzar ruta" | "Continuar ruta" | "Repasar ruta" | "Ver planes" | "Próximamente";
  kind: "start" | "continue" | "review" | "upgrade" | "disabled";
  href: string | null;
  moduleId: string | null;
  itemId: string | null;
};

export type TrainingPathPageViewModel = {
  path: TrainingPathCardViewModel & {
    description: string;
    expectedOutcome: string;
    requirements: string[];
  };
  progress: number;
  currentModule: TrainingPathModuleViewModel | null;
  modules: TrainingPathModuleViewModel[];
  relatedSkills: Array<{ slug: string; name: string }>;
  relatedBooks: Array<{ slug: string; title: string; author: string }>;
  accessState: TrainingAccessState;
  nextAction: TrainingPathNextAction;
};

export type TrainingPathsPageViewModel = {
  recommended: TrainingPathCardViewModel[];
  inProgress: TrainingPathCardViewModel[];
  paths: TrainingPathCardViewModel[];
  categories: Array<{ slug: string; name: string }>;
};

export type TrainingPathFilters = {
  query?: string;
  category?: string;
  difficulty?: TrainingDifficulty;
  duration?: "short" | "medium" | "long";
  progress?: "all" | "not_started" | "in_progress" | "completed";
  plan?: TrainingPlan;
};
