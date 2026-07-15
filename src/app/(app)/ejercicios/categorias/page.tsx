import { notFound } from "next/navigation";

import { TrainingCategoriesExplorer } from "@/components/training/TrainingCategoriesExplorer";
import { TrainingPageShell } from "@/components/training/TrainingPageShell";
import { serverEnv } from "@/lib/env";
import { getTrainingNavigationService } from "@/lib/training/navigation-service";
import { trainingCategoryFiltersSchema } from "@/lib/training/navigation-schemas";

export default async function TrainingCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (
    !serverEnv.TRAINING_TAXONOMY_ENABLED ||
    !serverEnv.TRAINING_CATEGORIES_ENABLED
  )
    notFound();
  const categories = await getTrainingNavigationService().getCategories(
    "catalog",
    "free",
  );
  const raw = await searchParams;
  const filters = trainingCategoryFiltersSchema.parse({
    mode: typeof raw.mode === "string" ? raw.mode : undefined,
    plan: typeof raw.plan === "string" ? raw.plan : undefined,
    progress: typeof raw.progress === "string" ? raw.progress : undefined,
  });
  return (
    <TrainingPageShell
      description="Elige el área que quieres fortalecer y encuentra una habilidad concreta."
      title="Categorías"
    >
      <TrainingCategoriesExplorer
        categories={categories}
        initialMode={filters.mode ?? "all"}
        initialPlan={filters.plan ?? "all"}
        initialProgress={filters.progress ?? "all"}
      />
    </TrainingPageShell>
  );
}
