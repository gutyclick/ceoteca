import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TrainingPageShell } from "@/components/training/TrainingPageShell";
import { TrainingPathsPage } from "@/components/training/paths/TrainingPathsPage";
import { serverEnv } from "@/lib/env";

export default function PathsPage() {
  if (!serverEnv.TRAINING_TAXONOMY_ENABLED || !serverEnv.TRAINING_LEARNING_PATHS_ENABLED) notFound();
  return <TrainingPageShell description="Programas progresivos para convertir práctica en dominio." search={false} title="Rutas de aprendizaje"><Suspense fallback={<div className="h-64 rounded-[8px] border border-slate-200 bg-white" />}><TrainingPathsPage /></Suspense></TrainingPageShell>;
}
