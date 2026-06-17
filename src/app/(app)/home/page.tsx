'use client';

import { useMemo, useState } from 'react';
import { BookCarousel } from '@/components/books/BookCarousel';
import { BookCard } from '@/components/books/BookCard';
import { BookCover } from '@/components/books/BookCover';
import {
  CategoryFilter,
  type CategoryOption,
} from '@/components/books/CategoryFilter';
import { SearchInput } from '@/components/books/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { GradientButton, SecondaryButton } from '@/components/ui/Buttons';
import { demoBooks } from '@/data/books';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryOption>('Todos');

  const filteredBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return demoBooks.filter((book) => {
      const matchesCategory = category === 'Todos' || book.category === category;
      const searchable = [book.title, book.author, book.category, ...book.tags]
        .join(' ')
        .toLowerCase();

      return matchesCategory && searchable.includes(normalizedQuery);
    });
  }, [query, category]);

  const featuredBook = demoBooks[0];

  return (
    <main className="container py-10">
      <section className="glass grid gap-8 rounded-[2rem] p-6 md:grid-cols-[1fr_auto] md:p-8">
        <div>
          <p className="text-zinc-300">Buenos días, Alex Demo</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-black md:text-6xl">
            ¿Qué idea quieres descubrir hoy?
          </h1>
          <p className="mt-4 max-w-xl text-zinc-300">
            Continúa con un análisis interactivo, escucha la versión audio o conversa con el
            libro desde una experiencia tipo streaming.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <GradientButton href={`/libro/${featuredBook.slug}`}>Continuar</GradientButton>
            <SecondaryButton href={`/libro/${featuredBook.slug}`}>Ver detalles</SecondaryButton>
          </div>
        </div>
        <BookCover book={featuredBook} />
      </section>

      <section id="categorias" className="mt-8 space-y-5">
        <CategoryFilter value={category} onChange={setCategory} />
        <SearchInput value={query} onChange={setQuery} />
      </section>

      <section className="mt-8" aria-live="polite">
        {filteredBooks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>

      <BookCarousel title="Continúa aprendiendo" books={demoBooks.slice(0, 5)} />
      <BookCarousel title="Más populares" books={demoBooks.slice(0, 6)} />
      <BookCarousel title="Finanzas personales" books={demoBooks.filter((b) => b.category === 'Finanzas')} />
      <BookCarousel
        title="Hábitos y productividad"
        books={demoBooks.filter((b) => ['Hábitos', 'Productividad'].includes(b.category))}
      />
      <BookCarousel title="Emprendimiento" books={demoBooks.filter((b) => b.category === 'Emprendimiento')} />
      <BookCarousel title="Psicología" books={demoBooks.filter((b) => b.category === 'Psicología')} />
      <BookCarousel title="Recomendados para ti" books={[...demoBooks].reverse()} />
    </main>
  );
}
