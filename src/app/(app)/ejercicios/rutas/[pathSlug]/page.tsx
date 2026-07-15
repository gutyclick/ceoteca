import { notFound } from "next/navigation";

import { TrainingPageShell } from "@/components/training/TrainingPageShell";
import { TrainingPathPage } from "@/components/training/paths/TrainingPathPage";
import { serverEnv } from "@/lib/env";
import { trainingPathSlugSchema } from "@/lib/training/path-schemas";

export default async function LearningPathPage({ params }: { params: Promise<{ pathSlug: string }> }) {
  if (!serverEnv.TRAINING_TAXONOMY_ENABLED || !serverEnv.TRAINING_LEARNING_PATHS_ENABLED) notFound();
  const parsed = trainingPathSlugSchema.safeParse((await params).pathSlug);
  if (!parsed.success) notFound();
  return <TrainingPageShell description="Avanza en orden, completa actividades y desbloquea el siguiente módulo." search={false} title="Ruta de aprendizaje"><TrainingPathPage pathSlug={parsed.data} /></TrainingPageShell>;
}
