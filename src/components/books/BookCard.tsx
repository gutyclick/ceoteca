import Link from "next/link";
import { Clock3, Lock, Sparkles } from "lucide-react";

import { BookCover } from "@/components/books/BookCover";
import { Card } from "@/components/ui/Card";
import type { Book } from "@/types";

type BookCardProps = {
  book: Book;
  locked?: boolean;
};

export function BookCard({ book, locked = false }: BookCardProps) {
  return (
    <Card className="group overflow-hidden p-3" interactive>
      <Link href={locked ? "/registro" : `/libro/${book.slug}`}>
        <div className="relative">
          <BookCover book={book} size="sm" />
          {locked ? (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-md">
              <Lock aria-hidden="true" size={13} />
              Registro
            </span>
          ) : null}
        </div>
        <div className="p-3">
          <div className="flex flex-wrap gap-2 text-xs text-text-secondary">
            <span className="inline-flex items-center gap-1">
              <Clock3 aria-hidden="true" size={14} />
              {book.readingTime} min
            </span>
            <span className="inline-flex items-center gap-1">
              <Sparkles aria-hidden="true" size={14} />
              {book.difficulty}
            </span>
          </div>
          <h3 className="mt-3 line-clamp-2 text-lg font-semibold">
            {book.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">
            {book.description}
          </p>
        </div>
      </Link>
    </Card>
  );
}
