import { z } from "zod";

import {
  cognitiveLevels,
  trainingDifficulties,
  trainingModuleItemTypes,
  trainingPlans,
} from "@/lib/training/taxonomy-model";
import { taxonomySlugSchema } from "@/lib/training/taxonomy-schemas";

export const editorialResourceTypes = [
  "categories",
  "subcategories",
  "skills",
  "concepts",
  "formats",
  "paths",
] as const;

export type EditorialResourceType = (typeof editorialResourceTypes)[number];

export const editorialResourceSchema = z.enum(editorialResourceTypes);

const nullableUuid = z.string().uuid().nullable().optional();

const taxonomyDraftObjectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: taxonomySlugSchema,
  description: z.string().trim().max(1200).default(""),
  shortDescription: z.string().trim().max(240).default(""),
  icon: z.string().trim().max(80).default("book-open"),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  minimumPlan: z.enum(trainingPlans).default("free"),
  categoryId: nullableUuid,
  subcategoryId: nullableUuid,
  skillId: nullableUuid,
  learningObjectives: z
    .array(z.string().trim().min(2).max(240))
    .max(20)
    .default([]),
  difficultyStart: z.enum(trainingDifficulties).default("fundamentals"),
  difficultyMax: z.enum(trainingDifficulties).default("advanced"),
  recommendedCognitiveLevel: z.enum(cognitiveLevels).default("understanding"),
  promise: z.string().trim().max(260).default(""),
  expectedOutcome: z.string().trim().max(600).default(""),
  estimatedMinutes: z.number().int().min(1).max(10_000).default(15),
  difficulty: z.enum(trainingDifficulties).default("fundamentals"),
  bookIds: z.array(z.string().uuid()).max(100).default([]),
  prerequisiteIds: z.array(z.string().uuid()).max(100).default([]),
  changeReason: z.string().trim().max(500).default(""),
});

export const taxonomyDraftSchema = taxonomyDraftObjectSchema.superRefine(
  (value, context) => {
    if (value.difficultyStart === "expert" && value.difficultyMax !== "expert")
      context.addIssue({
        code: "custom",
        path: ["difficultyMax"],
        message: "El nivel máximo debe incluir el nivel inicial.",
      });
  },
);

export type TaxonomyDraft = z.infer<typeof taxonomyDraftSchema>;

export const pathModuleItemDraftSchema = z.object({
  id: z.string().uuid().optional(),
  itemType: z.enum(trainingModuleItemTypes),
  referenceId: z.string().uuid(),
  sortOrder: z.number().int().min(1),
  isRequired: z.boolean().default(true),
  minimumMastery: z.number().min(0).max(100).default(0),
  minimumPlan: z.enum(trainingPlans).default("free"),
  previewAllowed: z.boolean().default(false),
  alternativeItemId: z.string().uuid().nullable().optional(),
});

export const pathModuleDraftSchema = z.object({
  id: z.string().uuid().optional(),
  slug: taxonomySlugSchema,
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(800).default(""),
  sortOrder: z.number().int().min(1),
  estimatedMinutes: z.number().int().min(1).max(1000),
  minimumPlan: z.enum(trainingPlans).default("free"),
  items: z.array(pathModuleItemDraftSchema).max(100),
});

export const editorialPathDraftSchema = taxonomyDraftObjectSchema
  .extend({
    promise: z.string().trim().min(8).max(260),
    expectedOutcome: z.string().trim().min(8).max(600),
    modules: z.array(pathModuleDraftSchema).min(1).max(50),
    categoryIds: z.array(z.string().uuid()).min(1).max(20),
    skillIds: z.array(z.string().uuid()).min(1).max(100),
  })
  .superRefine((value, context) => {
    if (value.difficultyStart === "expert" && value.difficultyMax !== "expert")
      context.addIssue({
        code: "custom",
        path: ["difficultyMax"],
        message: "El nivel máximo debe incluir el nivel inicial.",
      });
  });

export type EditorialPathDraft = z.infer<typeof editorialPathDraftSchema>;

export const editorialActionSchema = z
  .object({
    action: z.enum([
      "submit_review",
      "approve",
      "request_changes",
      "publish",
      "archive",
      "duplicate",
      "restore",
    ]),
    versionId: z.string().uuid().optional(),
    reason: z.string().trim().min(3).max(500).optional(),
  })
  .superRefine((value, context) => {
    if (
      [
        "submit_review",
        "approve",
        "request_changes",
        "publish",
        "restore",
      ].includes(value.action) &&
      !value.versionId
    )
      context.addIssue({
        code: "custom",
        path: ["versionId"],
        message: "Selecciona una versión.",
      });
  });
