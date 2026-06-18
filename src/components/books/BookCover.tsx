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

export function BookCover({ book, size = "md" }: BookCoverProps) {
  const Icon = variantIcons[book.cover.variant] ?? Brain;

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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          {book.category}
        </p>
        <div className="grid place-items-center py-8">
          <span className="grid h-20 w-20 place-items-center rounded-[1.5rem] bg-white/15 text-white backdrop-blur-md">
            <Icon aria-hidden="true" size={38} />
          </span>
        </div>
        <div>
          <h3 className="text-balance text-2xl font-semibold leading-tight text-white">
            {book.title}
          </h3>
          <p className="mt-2 text-sm text-white/70">{book.author}</p>
        </div>
      </div>
    </div>
  );
}
