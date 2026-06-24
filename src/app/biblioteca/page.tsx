import type { Metadata } from "next";

import { PublicLibraryView } from "@/components/books/PublicLibraryView";
import { createBookRepository } from "@/lib/books/repository";

export const metadata: Metadata = {
  title: "Biblioteca de análisis de libros",
  description:
    "Explora análisis de libros de negocios, finanzas, productividad, liderazgo y desarrollo personal con ideas clave, ejercicios prácticos y aprendizaje aplicado.",
};

export default async function LibraryPage() {
  const books = await createBookRepository().list();

  return <PublicLibraryView books={books} />;
}
