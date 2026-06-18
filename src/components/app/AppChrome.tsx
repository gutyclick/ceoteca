"use client";

import { usePathname } from "next/navigation";

import { Footer } from "@/components/marketing/Footer";
import { PublicHeader } from "@/components/marketing/PublicHeader";

type AppChromeProps = {
  children: React.ReactNode;
};

export function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const isHome = pathname === "/home";

  if (isHome) {
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
