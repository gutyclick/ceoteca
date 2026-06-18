import { BookCard } from "@/components/books/BookCard";
import type { Book } from "@/types";

type BookCarouselProps = {
  title: string;
  books: Book[];
};

export function BookCarousel({ title, books }: BookCarouselProps) {
  if (books.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {books.map((book) => (
          <div className="w-[280px] shrink-0" key={book.id}>
            <BookCard book={book} />
          </div>
        ))}
      </div>
    </section>
  );
}
