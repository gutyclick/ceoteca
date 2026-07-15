import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategorySkillBrowser } from "@/components/training/CategorySkillBrowser";
import { TrainingPageShell } from "@/components/training/TrainingPageShell";
import { serverEnv } from "@/lib/env";
import { getTrainingNavigationService } from "@/lib/training/navigation-service";
import { taxonomySlugSchema } from "@/lib/training/taxonomy-schemas";

type Props = { params: Promise<{ categorySlug: string }> };
async function loadCategory(rawSlug: string) {
  const parsed = taxonomySlugSchema.safeParse(rawSlug);
  if (!parsed.success) return null;
  return getTrainingNavigationService().getCategoryPage(
    "catalog",
    "free",
    parsed.data,
  );
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const data = await loadCategory(categorySlug);
  return data
    ? {
        title: `${data.category.name} | CEOTECA Training`,
        description: data.category.shortDescription,
      }
    : { title: "Categoría no encontrada | CEOTECA" };
}

export default async function TrainingCategoryPage({ params }: Props) {
  if (
    !serverEnv.TRAINING_TAXONOMY_ENABLED ||
    !serverEnv.TRAINING_CATEGORIES_ENABLED
  )
    notFound();
  const { categorySlug } = await params;
  const data = await loadCategory(categorySlug);
  if (!data) notFound();
  return (
    <TrainingPageShell
      description={data.category.shortDescription}
      title={data.category.name}
    >
      <CategorySkillBrowser data={data} />
    </TrainingPageShell>
  );
}
