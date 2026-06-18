import type { Metadata } from "next";

import { SettingsView } from "@/components/app/SettingsView";

export const metadata: Metadata = {
  title: "Configuracion",
  description: "Ajustes de cuenta, seguridad, pagos y preferencias de Ceoteca.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
