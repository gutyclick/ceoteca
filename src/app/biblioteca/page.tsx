import type { Metadata } from "next";

import { PublicLibraryView } from "@/components/books/PublicLibraryView";
import { createBookRepository } from "@/lib/books/repository";

export const metadata: Metadata = {
  title: "Biblioteca",
  description:
    "Explora la biblioteca de Ceoteca con análisis editoriales, ejercicios y experiencias interactivas.",
};

export default async function LibraryPage() {
  const books = await createBookRepository().list();

  return <PublicLibraryView books={books} />;
}
