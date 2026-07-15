import { z } from "zod";
import {
  cognitiveLevels,
  trainingDifficulties,
  trainingPlans,
} from "@/lib/training/taxonomy-model";

export const trainingModeSlugSchema = z.enum([
  "analiza",
  "construye",
  "practica",
]);
export const trainingCategoryFiltersSchema = z
  .object({
    mode: trainingModeSlugSchema.optional(),
    progress: z.enum(["not_started", "in_progress", "completed"]).optional(),
    plan: z.enum(trainingPlans).optional(),
    query: z.string().trim().max(100).optional(),
    sort: z.enum(["recommended", "name", "progress"]).default("recommended"),
  })
  .catch({ sort: "recommended" });
export const trainingCategoryPageFiltersSchema = z
  .object({
    subcategory: z.string().trim().max(100).optional(),
    mode: trainingModeSlugSchema.optional(),
    format: z.string().trim().max(100).optional(),
    cognitiveLevel: z.enum(cognitiveLevels).optional(),
    difficulty: z.enum(trainingDifficulties).optional(),
    duration: z.enum(["short", "medium", "long"]).optional(),
    plan: z.enum(trainingPlans).optional(),
  })
  .catch({});
