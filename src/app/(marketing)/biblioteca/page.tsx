import type { Metadata } from "next";

import { PublicLibraryView } from "@/components/books/PublicLibraryView";
import { createBookRepository } from "@/lib/books/repository";

export const metadata: Metadata = {
  title: "Biblioteca",
  description:
    "Explora la biblioteca pública parcial de Ceoteca con análisis editoriales y portadas conceptuales.",
};

export default async function LibraryPage() {
  const books = await createBookRepository().list();

  return <PublicLibraryView books={books} />;
}
