import Image from "next/image";
import {
  BarChart3,
  Bolt,
  Brain,
  CircleDot,
  Grid3X3,
  TrendingUp,
  Users,
} from "lucide-react";

import type { Book } from "@/types";
import { cn } from "@/lib/utils/cn";

const variantIcons = {
  orb: CircleDot,
  steps: BarChart3,
  bolt: Bolt,
  growth: TrendingUp,
  people: Users,
  grid: Grid3X3,
} as const;

type BookCoverProps = {
  book: Book;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "min-h-52",
  md: "min-h-72",
  lg: "min-h-[360px]",
};

function getCoverTitleSize(title: string) {
  if (title.length > 34) {
    return "text-[clamp(1.15rem,4vw,1.45rem)]";
  }

  if (title.length > 24) {
    return "text-[clamp(1.3rem,4.5vw,1.75rem)]";
  }

  return "text-[clamp(1.55rem,5vw,2rem)]";
}

export function BookCover({ book, size = "md" }: BookCoverProps) {
  const Icon = variantIcons[book.cover.variant] ?? Brain;

  if (book.cover.imagePath) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-card border border-white/10 bg-[#11111e] shadow-ambient",
          sizeClasses[size],
        )}
      >
        <Image
          alt={`Portada editorial de ${book.title}`}
          className="object-cover"
          fill
          sizes={
            size === "lg"
              ? "(min-width: 1024px) 360px, 90vw"
              : "(min-width: 1024px) 220px, 45vw"
          }
          src={book.cover.imagePath}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-white/10 bg-gradient-to-br p-5 shadow-ambient",
        book.cover.gradient,
        sizeClasses[size],
      )}
    >
      <div className="absolute inset-0 bg-black/38" />
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/25" />
      <div className="absolute bottom-8 left-8 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
      <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-between">
        <p className="line-clamp-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
          {book.category}
        </p>
        <div className="grid place-items-center py-8">
          <span className="grid h-20 w-20 place-items-center rounded-[1.5rem] bg-white/15 text-white backdrop-blur-md">
            <Icon aria-hidden="true" size={38} />
          </span>
        </div>
        <div>
          <h3
            className={cn(
              "line-clamp-4 break-words font-semibold leading-tight text-white",
              getCoverTitleSize(book.title),
            )}
          >
            {book.title}
          </h3>
          <p className="mt-2 line-clamp-1 text-sm text-white/70">{book.author}</p>
        </div>
      </div>
    </div>
  );
}
