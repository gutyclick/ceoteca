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
import { demoUser } from "@/lib/auth/demo";
import { demoBooks, filterBooks, getBooksByCategory } from "@/data/books";
import type { BookCategory } from "@/types";

export function HomeView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"Todos" | BookCategory>("Todos");
  const featuredBook = demoBooks.find((book) => book.isFeatured) ?? demoBooks[0];

  const filteredBooks = useMemo(
    () => filterBooks(demoBooks, query, category),
    [query, category],
  );

  const continueBooks = demoBooks.filter((book) => (book.progress ?? 0) > 0);

  return (
    <main className="min-h-screen bg-background text-text-primary">
      <section className="ceoteca-container pb-20 pt-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-brand-purple">
              Hola, {demoUser.fullName}
            </p>
            <h1 className="mt-4 max-w-3xl text-balance text-5xl font-semibold leading-tight">
              Continúa aprendiendo ideas que puedes aplicar hoy.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-text-secondary">
              Home privada en modo demo: catálogo navegable, progreso simulado y
              carruseles por tema.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={`/libro/${featuredBook.slug}`}>
                <Play aria-hidden="true" size={18} />
                Continuar destacado
              </ButtonLink>
              <ButtonLink href="/planes" variant="secondary">
                Ver plan demo
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
            <BookCarousel books={demoBooks.slice(0, 6)} title="Más populares" />
            <BookCarousel
              books={getBooksByCategory("Finanzas")}
              title="Finanzas personales"
            />
            <BookCarousel
              books={getBooksByCategory("Hábitos").concat(
                getBooksByCategory("Productividad"),
              )}
              title="Hábitos y productividad"
            />
            <BookCarousel
              books={getBooksByCategory("Emprendimiento")}
              title="Emprendimiento"
            />
            <BookCarousel
              books={getBooksByCategory("Psicología")}
              title="Psicología"
            />
          </div>
        )}
      </section>
    </main>
  );
}
