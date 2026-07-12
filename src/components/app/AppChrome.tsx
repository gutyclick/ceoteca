"use client";

import { usePathname } from "next/navigation";

import { AchievementToastHost } from "@/components/app/AchievementToastHost";
import { Footer } from "@/components/marketing/Footer";
import { PublicHeader } from "@/components/marketing/PublicHeader";

type AppChromeProps = {
  children: React.ReactNode;
};

export function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const usesDashboardChrome =
    pathname === "/home" ||
    pathname === "/perfil" ||
    pathname === "/chat" ||
    pathname.startsWith("/ejercicios") ||
    pathname === "/configuracion" ||
    pathname === "/planes" ||
    pathname.startsWith("/libro/");

  if (usesDashboardChrome) {
    return (
      <>
        {children}
        <AchievementToastHost />
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      {children}
      <Footer />
    </>
  );
}
