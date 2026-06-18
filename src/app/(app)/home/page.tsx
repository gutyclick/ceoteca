import type { Metadata } from "next";

import { HomeView } from "@/components/app/HomeView";
import { createBookRepository } from "@/lib/books/repository";

export const metadata: Metadata = {
  title: "Home",
  description: "Home privada de Ceoteca con catálogo y carruseles.",
};

export default async function HomePage() {
  const books = await createBookRepository().list();

  return <HomeView books={books} />;
}
