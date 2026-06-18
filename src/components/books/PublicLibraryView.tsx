"use client";

import { useMemo, useState } from "react";

import { BookCard } from "@/components/books/BookCard";
import { CategoryFilter } from "@/components/books/CategoryFilter";
import { EmptyState } from "@/components/books/EmptyState";
import { SearchInput } from "@/components/books/SearchInput";
import { ButtonLink } from "@/components/ui/Button";
import { bookCategories, demoBooks, filterBooks } from "@/data/books";
import type { BookCategory } from "@/types";

export function PublicLibraryView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Todos" | BookCategory>("Todos");

  const books = useMemo(
    () => filterBooks(demoBooks, query, category),
    [query, category],
  );

  const visibleBooks = books.slice(0, 6);
  const hiddenCount = Math.max(books.length - visibleBooks.length, 0);

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <section className="ceoteca-container ceoteca-section">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-purple">
            Biblioteca pública
          </p>
          <h1 className="mt-4 text-balance text-5xl font-semibold leading-tight">
            Explora análisis demo antes de registrarte.
          </h1>
          <p className="mt-5 text-lg leading-8 text-text-secondary">
            Busca por título, autor, categoría o etiqueta. El contenido completo
            se desbloquea al crear una cuenta demo.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-4">
          <SearchInput onChange={setQuery} value={query} />
          <CategoryFilter onChange={setCategory} value={category} />
        </div>

        <p className="mt-4 text-sm text-text-muted">
          Categorías disponibles: {bookCategories.slice(1).join(", ")}.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleBooks.map((book) => (
            <BookCard book={book} key={book.id} locked />
          ))}
        </div>

        {visibleBooks.length === 0 ? <EmptyState /> : null}

        {hiddenCount > 0 ? (
          <div className="mt-10 rounded-card border border-white/10 bg-white/[0.04] p-6 text-center">
            <p className="text-lg font-semibold">
              {hiddenCount} libros más esperan dentro de Ceoteca.
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Regístrate para acceder a la experiencia completa en modo demo.
            </p>
            <ButtonLink className="mt-5" href="/registro">
              Crear cuenta gratis
            </ButtonLink>
          </div>
        ) : null}
      </section>
    </main>
  );
}
