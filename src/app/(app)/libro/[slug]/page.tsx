import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookExperience } from "@/components/books/BookExperience";
import { createBookRepository } from "@/lib/books/repository";

type BookPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const books = await createBookRepository().list();

  return books.map((book) => ({
    slug: book.slug,
  }));
}

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await createBookRepository().getBySlug(slug);

  if (!book) {
    return {
      title: "Libro no encontrado",
    };
  }

  return {
    title: book.title,
    description: book.description,
  };
}

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  const book = await createBookRepository().getBySlug(slug);

  if (!book || !book.isPublished) {
    notFound();
  }

  return <BookExperience book={book} />;
}
