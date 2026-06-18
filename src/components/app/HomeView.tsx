"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Play } from "lucide-react";

import { BookCarousel } from "@/components/books/BookCarousel";
import { BookCover } from "@/components/books/BookCover";
import { BookCard } from "@/components/books/BookCard";
import { CategoryFilter } from "@/components/books/CategoryFilter";
import { EmptyState } from "@/components/books/EmptyState";
import { SearchInput } from "@/components/books/SearchInput";
import { ButtonLink } from "@/components/ui/Button";
import { filterBooks } from "@/data/books";
import type { Book, BookCategory } from "@/types";

type HomeViewProps = {
  books: Book[];
};

function getBooksByCategory(books: Book[], category: BookCategory) {
  return books.filter((book) => book.category === category);
}

export function HomeView({ books }: HomeViewProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Todos" | BookCategory>("Todos");
  const featuredBook = books.find((book) => book.isFeatured) ?? books[0];

  const filteredBooks = useMemo(
    () => filterBooks(books, query, category),
    [books, query, category],
  );

  const continueBooks = books.filter((book) => (book.progress ?? 0) > 0);

  if (!featuredBook) {
    return (
      <main className="min-h-screen bg-background text-text-primary">
        <section className="ceoteca-container ceoteca-section">
          <h1 className="text-3xl font-semibold">Biblioteca en preparación</h1>
          <p className="mt-3 text-text-secondary">
            Aún no hay libros publicados en Supabase.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <section className="ceoteca-container pb-20 pt-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-purple">
              Hola
            </p>
            <h1 className="mt-4 max-w-3xl text-balance text-5xl font-semibold leading-tight">
              Continúa aprendiendo ideas que puedes aplicar hoy.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-text-secondary">
              Home privada con catálogo navegable, progreso y carruseles por tema.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={`/libro/${featuredBook.slug}`}>
                <Play aria-hidden="true" size={18} />
                Continuar destacado
              </ButtonLink>
              <ButtonLink href="/planes" variant="secondary">
                Ver plan
                <ArrowRight aria-hidden="true" size={18} />
              </ButtonLink>
            </div>
          </div>
          <div className="float-soft">
            <BookCover book={featuredBook} size="lg" />
          </div>
        </div>

        <div className="mt-12 grid gap-4">
          <SearchInput onChange={setQuery} value={query} />
          <CategoryFilter onChange={setCategory} value={category} />
        </div>

        {query || category !== "Todos" ? (
          <section className="mt-10">
            <h2 className="text-2xl font-semibold">Resultados</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredBooks.map((book) => (
                <BookCard book={book} key={book.id} />
              ))}
            </div>
            {filteredBooks.length === 0 ? <EmptyState /> : null}
          </section>
        ) : (
          <div className="mt-12 space-y-12">
            <BookCarousel books={continueBooks} title="Continúa aprendiendo" />
            <BookCarousel books={books.slice(0, 6)} title="Más populares" />
            <BookCarousel
              books={getBooksByCategory(books, "Finanzas")}
              title="Finanzas personales"
            />
            <BookCarousel
              books={getBooksByCategory(books, "Hábitos").concat(
                getBooksByCategory(books, "Productividad"),
              )}
              title="Hábitos y productividad"
            />
            <BookCarousel
              books={getBooksByCategory(books, "Emprendimiento")}
              title="Emprendimiento"
            />
            <BookCarousel
              books={getBooksByCategory(books, "Psicología")}
              title="Psicología"
            />
          </div>
        )}
      </section>
    </main>
  );
}
