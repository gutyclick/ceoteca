import type { Metadata } from "next";

import { ProfileSettingsView } from "@/components/app/ProfileSettingsView";

export const metadata: Metadata = {
  title: "Perfil",
  description: "Perfil, progreso, logros y ajustes de cuenta de Ceoteca.",
};

export default function ProfilePage() {
  return <ProfileSettingsView />;
}
