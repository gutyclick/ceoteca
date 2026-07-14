import type { Metadata } from "next";
import { RoleplayCatalogView } from "@/components/training/roleplay/RoleplayCatalogView";
export const metadata: Metadata = {
  title: "Simulaciones | Ceoteca",
  description:
    "Practica conversaciones profesionales con escenarios guiados y evaluación estructurada.",
};
export default function RoleplayCatalogPage() {
  return <RoleplayCatalogView />;
}
