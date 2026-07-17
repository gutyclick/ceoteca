import { z } from "zod";

import { trainingPlans } from "@/lib/training/taxonomy-model";

export const trainingSearchTypes = [
  "category",
  "subcategory",
  "skill",
  "concept",
  "path",
  "exercise",
  "book",
  "simulation",
] as const;

const optionalSlug = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .optional();

export const trainingSearchQuerySchema = z.object({
  q: z.string().trim().max(80).default(""),
  type: z.enum(trainingSearchTypes).optional(),
  category: optionalSlug,
  mode: optionalSlug,
  format: optionalSlug,
  difficulty: z
    .enum(["fundamentals", "application", "advanced", "expert"])
    .optional(),
  plan: z.enum(trainingPlans).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(6).max(30).default(12),
});

export type TrainingSearchQuery = z.infer<typeof trainingSearchQuerySchema>;

export type TrainingSearchResultViewModel = {
  id: string;
  type: (typeof trainingSearchTypes)[number];
  title: string;
  description: string;
  href: string;
  category: string | null;
  mode: string | null;
  format: string | null;
  difficulty: string | null;
  minimumPlan: "free" | "pro" | "unlimited";
  access: "available" | "locked";
  preview: string;
};
