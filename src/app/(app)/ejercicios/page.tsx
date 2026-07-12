import type { Metadata } from "next";

import { TrainingView } from "@/components/training/TrainingView";

export const metadata: Metadata = {
  title: "Ejercicios | Ceoteca",
  description: "Entrena lo que aprendes con ejercicios breves y progreso por habilidad.",
};

export default function TrainingPage() {
  return <TrainingView />;
}
