import { z } from "zod";

import { taxonomySlugSchema } from "@/lib/training/taxonomy-schemas";

const optionalQuery = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.string().trim().max(100).optional(),
);

export const trainingPathFiltersSchema = z.object({
  q: optionalQuery,
  category: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    taxonomySlugSchema.optional(),
  ),
  difficulty: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.enum(["fundamentals", "application", "advanced", "expert"]).optional(),
  ),
  duration: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.enum(["short", "medium", "long"]).optional(),
  ),
  progress: z.preprocess(
    (value) => (value === "" || value == null ? "all" : value),
    z.enum(["all", "not_started", "in_progress", "completed"]),
  ),
  plan: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.enum(["free", "pro", "unlimited"]).optional(),
  ),
});

export const trainingPathSlugSchema = taxonomySlugSchema;
export const trainingPathItemIdSchema = z.string().uuid();
