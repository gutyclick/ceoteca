"use client";

import { usePathname } from "next/navigation";

import { Footer } from "@/components/marketing/Footer";
import { PublicHeader } from "@/components/marketing/PublicHeader";

type AppChromeProps = {
  children: React.ReactNode;
};

export function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const usesDashboardChrome =
    pathname === "/home" || pathname.startsWith("/libro/");

  if (usesDashboardChrome) {
    return children;
  }

  return (
    <>
      <PublicHeader />
      {children}
      <Footer />
    </>
  );
}
