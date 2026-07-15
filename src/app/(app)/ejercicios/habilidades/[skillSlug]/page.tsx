import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TrainingPageShell } from "@/components/training/TrainingPageShell";
import { TrainingSkillDetails } from "@/components/training/TrainingSkillDetails";
import { serverEnv } from "@/lib/env";
import { getTrainingNavigationService } from "@/lib/training/navigation-service";
import { taxonomySlugSchema } from "@/lib/training/taxonomy-schemas";

type Props = { params: Promise<{ skillSlug: string }> };
async function loadSkill(rawSlug: string) {
  const parsed = taxonomySlugSchema.safeParse(rawSlug);
  if (!parsed.success) return null;
  return getTrainingNavigationService().getSkillPage(
    "catalog",
    "free",
    parsed.data,
  );
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { skillSlug } = await params;
  const data = await loadSkill(skillSlug);
  return data
    ? {
        title: `${data.skill.name} | CEOTECA Training`,
        description: data.skill.description,
      }
    : { title: "Habilidad no encontrada | CEOTECA" };
}
export default async function TrainingSkillPage({ params }: Props) {
  if (!serverEnv.TRAINING_TAXONOMY_ENABLED) notFound();
  const { skillSlug } = await params;
  const data = await loadSkill(skillSlug);
  if (!data) notFound();
  return (
    <TrainingPageShell
      description={`${data.category.name}${data.subcategory ? ` · ${data.subcategory.name}` : ""}`}
      title={data.skill.name}
    >
      <TrainingSkillDetails initialData={data} />
    </TrainingPageShell>
  );
}
