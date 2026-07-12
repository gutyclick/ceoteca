export type TrainingStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "needs_review"
  | "locked"
  | "loading"
  | "error";

export type TrainingIconKey =
  | "target"
  | "calendar"
  | "megaphone"
  | "leaf"
  | "crown"
  | "chart"
  | "rocket";

export type WeeklyStreakData = {
  completedDays: number;
  days: Array<{ label: string; completed: boolean }>;
};

export type TrainingRecommendation = {
  id: string;
  category: string;
  title: string;
  description: string;
  durationMinutes: number;
  exerciseCount: number;
  level: "Inicial" | "Intermedio" | "Avanzado";
  icon: TrainingIconKey;
  bookCovers: Array<{ title: string; imagePath: string }>;
  streak: WeeklyStreakData;
};

export type TrainingActivity = {
  id: string;
  title: string;
  description: string;
  status: TrainingStatus;
  progress: number;
  progressLabel?: string;
  detail: string;
  ctaLabel: string;
  icon: TrainingIconKey;
};

export type TrainingCategory = {
  id: string;
  name: string;
  mastery: number;
  recommendation: string;
  icon: TrainingIconKey;
};

export type SkillProgress = {
  id: string;
  label: string;
  progress: number;
  level: "Competente" | "En desarrollo" | "Por reforzar" | "Descubriendo";
};
