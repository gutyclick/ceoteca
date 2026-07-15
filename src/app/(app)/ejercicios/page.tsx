import type { Metadata } from "next";

import { TrainingView } from "@/components/training/TrainingView";
import { serverEnv } from "@/lib/env";
import { getTrainingNavigationService } from "@/lib/training/navigation-service";

export const metadata: Metadata = {
  title: "Ejercicios | Ceoteca",
  description:
    "Entrena lo que aprendes con ejercicios breves y progreso por habilidad.",
};

export default async function TrainingPage() {
  const navigation=await getTrainingNavigationService().getHome("catalog","free");
  return (
    <TrainingView
      navigation={navigation}
      features={{
        taxonomy: serverEnv.TRAINING_TAXONOMY_ENABLED,
        categories: serverEnv.TRAINING_CATEGORIES_ENABLED,
        paths: serverEnv.TRAINING_LEARNING_PATHS_ENABLED,
        modes: serverEnv.TRAINING_TRAINING_MODES_ENABLED,
        search: serverEnv.TRAINING_TRAINING_SEARCH_ENABLED,
        roleplay: serverEnv.TRAINING_ROLEPLAY_ENABLED,
      }}
    />
  );
}
