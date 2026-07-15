export const trainingPlans = ["free", "pro", "unlimited"] as const;
export const taxonomyStatuses = ["draft", "published", "archived"] as const;
export const trainingDifficulties = [
  "fundamentals",
  "application",
  "advanced",
  "expert",
] as const;
export const cognitiveLevels = [
  "recognition",
  "understanding",
  "application",
  "analysis",
  "transfer",
  "synthesis",
] as const;
export const trainingModuleItemTypes = [
  "exercise",
  "skill_session",
  "concept_session",
  "template",
  "roleplay",
  "review",
] as const;

export type TrainingPlan = (typeof trainingPlans)[number];
export type TrainingTaxonomyStatus = (typeof taxonomyStatuses)[number];
export type TrainingDifficulty = (typeof trainingDifficulties)[number];
export type TrainingCognitiveLevel = (typeof cognitiveLevels)[number];

type TaxonomyBase = {
  id: string;
  slug: string;
  name: string;
  status: TrainingTaxonomyStatus;
  createdAt: string;
  updatedAt: string;
};

export type TrainingCategory = TaxonomyBase & {
  shortDescription: string | null;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  minimumPlan: TrainingPlan;
};

export type TrainingSubcategory = TaxonomyBase & {
  categoryId: string;
  description: string | null;
  sortOrder: number;
};

export type TrainingSkill = TaxonomyBase & {
  categoryId: string;
  subcategoryId: string | null;
  description: string | null;
  learningObjectives: string[];
  difficultyStart: TrainingDifficulty;
  difficultyMax: TrainingDifficulty;
  minimumPlan: TrainingPlan;
};

export type TrainingConcept = TaxonomyBase & {
  skillId: string;
  description: string | null;
  editorialSummary: string | null;
  explanation: string | null;
  recommendedCognitiveLevel: TrainingCognitiveLevel;
  minimumPlan: TrainingPlan;
};

export type TrainingFormat = TaxonomyBase & {
  description: string;
  icon: string | null;
};

export type TrainingLearningPath = TaxonomyBase & {
  promise: string;
  description: string;
  estimatedMinutes: number;
  difficulty: TrainingDifficulty;
  minimumPlan: TrainingPlan;
};

export type TrainingLearningPathModule = {
  id: string;
  pathId: string;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  estimatedMinutes: number | null;
  minimumPlan: TrainingPlan;
  status: TrainingTaxonomyStatus;
  createdAt: string;
  updatedAt: string;
};

type ModuleItemBase = {
  id: string;
  moduleId: string;
  sortOrder: number;
  isRequired: boolean;
  unlockRule: Record<string, unknown> | null;
  minimumMastery: number;
};

export type TrainingModuleItem =
  | (ModuleItemBase & { itemType: "exercise" | "review"; exerciseId: string })
  | (ModuleItemBase & { itemType: "skill_session"; skillId: string })
  | (ModuleItemBase & { itemType: "concept_session"; conceptId: string })
  | (ModuleItemBase & { itemType: "template"; templateId: string })
  | (ModuleItemBase & { itemType: "roleplay"; roleplayScenarioId: string });

export type TrainingLearningPathModuleItem = TrainingModuleItem;
export type TrainingSkillPrerequisite = {
  skillId: string;
  prerequisiteSkillId: string;
  minimumMastery: number;
  createdAt: string;
};
export type TrainingConceptPrerequisite = {
  conceptId: string;
  prerequisiteConceptId: string;
  minimumMastery: number;
  createdAt: string;
};
export type TrainingVisualAsset = {
  id: string;
  storagePath: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp" | "image/avif";
  width: number;
  height: number;
  altText: string;
  sourceType: "original" | "licensed" | "generated" | "editorial" | "user_provided";
  copyrightStatus: "approved" | "needs_review" | "restricted" | "rejected";
  createdBy: string | null;
  createdAt: string;
};

export type TrainingSkillWithConcepts = TrainingSkill & { concepts: TrainingConcept[] };
export type TrainingCategoryWithChildren = TrainingCategory & {
  subcategories: TrainingSubcategory[];
  skills: TrainingSkillWithConcepts[];
};
export type TrainingTaxonomyTree = { categories: TrainingCategoryWithChildren[] };
export type TrainingLearningPathWithModules = TrainingLearningPath & {
  modules: Array<TrainingLearningPathModule & { items: TrainingModuleItem[] }>;
};

export type TrainingSkillFilters = {
  categoryId?: string;
  subcategoryId?: string;
  status?: TrainingTaxonomyStatus;
  minimumPlan?: TrainingPlan;
};
export type TrainingPathFilters = {
  status?: TrainingTaxonomyStatus;
  minimumPlan?: TrainingPlan;
};

export type TrainingProgressDimension =
  | "category"
  | "subcategory"
  | "skill"
  | "concept"
  | "path"
  | "module"
  | "cognitive_level"
  | "format";
export type TrainingProgressSnapshot = {
  dimension: TrainingProgressDimension;
  entityId: string;
  progress: number;
  updatedAt: string;
};

