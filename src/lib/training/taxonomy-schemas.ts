import { z } from "zod";

import {
  cognitiveLevels,
  taxonomyStatuses,
  trainingDifficulties,
  trainingModuleItemTypes,
  trainingPlans,
} from "@/lib/training/taxonomy-model";

export const taxonomyStatusSchema = z.enum(taxonomyStatuses);
export const taxonomyPlanSchema = z.enum(trainingPlans);
export const taxonomyDifficultySchema = z.enum(trainingDifficulties);
export const taxonomyCognitiveLevelSchema = z.enum(cognitiveLevels);
export const taxonomySlugSchema = z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const idSchema = z.string().uuid();
const text = (max: number) => z.string().trim().min(2).max(max);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const planFields = { minimumPlan: taxonomyPlanSchema.default("free") };
const baseCreate = { slug: taxonomySlugSchema, name: text(120), status: taxonomyStatusSchema.default("draft") };

export const createTrainingCategorySchema = z.object({
  ...baseCreate,
  ...planFields,
  shortDescription: optionalText(180), description: optionalText(2000), icon: optionalText(80),
  sortOrder: z.number().int().min(0).max(10000),
});
export const updateTrainingCategorySchema = createTrainingCategorySchema.partial().refine((value) => Object.keys(value).length > 0);
export const createTrainingSubcategorySchema = z.object({
  ...baseCreate, categoryId: idSchema, description: optionalText(1200), sortOrder: z.number().int().min(0).max(10000),
});
export const updateTrainingSubcategorySchema = createTrainingSubcategorySchema.omit({ categoryId: true }).partial().refine((value) => Object.keys(value).length > 0);
export const createTrainingSkillSchema = z.object({
  ...baseCreate, ...planFields, categoryId: idSchema, subcategoryId: idSchema.nullable().optional(),
  description: optionalText(2000), learningObjectives: z.array(text(240)).max(20).default([]),
  difficultyStart: taxonomyDifficultySchema, difficultyMax: taxonomyDifficultySchema,
}).superRefine((value, context) => {
  if (trainingDifficulties.indexOf(value.difficultyStart) > trainingDifficulties.indexOf(value.difficultyMax))
    context.addIssue({ code: "custom", path: ["difficultyMax"], message: "La dificultad máxima no puede ser menor que la inicial." });
});
export const updateTrainingSkillSchema = z.object({
  slug: taxonomySlugSchema.optional(), name: text(120).optional(), status: taxonomyStatusSchema.optional(), minimumPlan: taxonomyPlanSchema.optional(),
  subcategoryId: idSchema.nullable().optional(), description: optionalText(2000), learningObjectives: z.array(text(240)).max(20).optional(),
  difficultyStart: taxonomyDifficultySchema.optional(), difficultyMax: taxonomyDifficultySchema.optional(),
}).refine((value) => Object.keys(value).length > 0);
export const createTrainingConceptSchema = z.object({
  ...baseCreate, ...planFields, skillId: idSchema, description: optionalText(1500), editorialSummary: optionalText(1000),
  explanation: optionalText(4000), recommendedCognitiveLevel: taxonomyCognitiveLevelSchema,
});
export const updateTrainingConceptSchema = createTrainingConceptSchema.omit({ skillId: true }).partial().refine((value) => Object.keys(value).length > 0);
export const createTrainingFormatSchema = z.object({ ...baseCreate, description: text(1200), icon: optionalText(80) });
export const createTrainingPathSchema = z.object({
  ...baseCreate, ...planFields, promise: text(240), description: text(2400), estimatedMinutes: z.number().int().positive().max(10000), difficulty: taxonomyDifficultySchema,
});
export const createTrainingModuleSchema = z.object({
  pathId: idSchema, slug: taxonomySlugSchema, title: text(160), description: optionalText(1600), sortOrder: z.number().int().positive(),
  estimatedMinutes: z.number().int().positive().max(2000).nullable().optional(), minimumPlan: taxonomyPlanSchema.default("free"), status: taxonomyStatusSchema.default("draft"),
});

const moduleItemBase = { moduleId: idSchema, sortOrder: z.number().int().positive(), isRequired: z.boolean().default(true), unlockRule: z.record(z.unknown()).nullable().optional(), minimumMastery: z.number().min(0).max(1).default(0) };
export const createTrainingModuleItemSchema = z.discriminatedUnion("itemType", [
  z.object({ ...moduleItemBase, itemType: z.enum(["exercise", "review"]), exerciseId: idSchema }),
  z.object({ ...moduleItemBase, itemType: z.literal("skill_session"), skillId: idSchema }),
  z.object({ ...moduleItemBase, itemType: z.literal("concept_session"), conceptId: idSchema }),
  z.object({ ...moduleItemBase, itemType: z.literal("template"), templateId: idSchema }),
  z.object({ ...moduleItemBase, itemType: z.literal("roleplay"), roleplayScenarioId: idSchema }),
]);
export const createTrainingPrerequisiteSchema = z.object({ itemId: idSchema, prerequisiteId: idSchema, minimumMastery: z.number().min(0).max(1) }).refine((value) => value.itemId !== value.prerequisiteId, { message: "Una entidad no puede ser su propio prerrequisito." });
export const createTrainingVisualAssetSchema = z.object({
  storagePath: z.string().trim().min(3).max(500).refine((value) => !value.startsWith("http"), "Guarda una ruta de Storage, no una URL firmada."),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "image/avif"]), width: z.number().int().positive(), height: z.number().int().positive(),
  altText: z.string().trim().min(8).max(300), sourceType: z.enum(["original", "licensed", "generated", "editorial", "user_provided"]),
  copyrightStatus: z.enum(["approved", "needs_review", "restricted", "rejected"]),
});
export const trainingTaxonomyFiltersSchema = z.object({ status: taxonomyStatusSchema.optional(), plan: taxonomyPlanSchema.optional(), categoryId: idSchema.optional(), subcategoryId: idSchema.optional() });
export { trainingModuleItemTypes };

