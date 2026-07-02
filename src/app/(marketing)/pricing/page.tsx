import type { Metadata } from "next";

import { PricingPage } from "@/components/pricing/PricingPage";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Planes de Ceoteca para aprender con análisis editoriales, audio, CEO y herramientas prácticas de lectura.",
};

export default function PricingRoutePage() {
  return <PricingPage />;
}
