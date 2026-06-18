import type { Metadata } from "next";

import { PublicLibraryView } from "@/components/books/PublicLibraryView";

export const metadata: Metadata = {
  title: "Biblioteca",
  description:
    "Explora la biblioteca pública parcial de Ceoteca con libros demo y portadas conceptuales.",
};

export default function LibraryPage() {
  return <PublicLibraryView />;
}
