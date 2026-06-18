import type { Metadata } from "next";

import { HomeView } from "@/components/app/HomeView";

export const metadata: Metadata = {
  title: "Home",
  description: "Home privada demo de Ceoteca con catálogo y carruseles.",
};

export default function HomePage() {
  return <HomeView />;
}
