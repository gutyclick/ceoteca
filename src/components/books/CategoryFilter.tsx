"use client";

import { bookCategories } from "@/data/books";
import type { BookCategory } from "@/types";
import { cn } from "@/lib/utils/cn";

type CategoryFilterProps = {
  value: "Todos" | BookCategory;
  onChange: (value: "Todos" | BookCategory) => void;
};

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div
      aria-label="Filtrar por categoría"
      className="flex gap-2 overflow-x-auto pb-2"
      role="list"
    >
      {bookCategories.map((category) => (
        <button
          className={cn(
            "min-h-11 shrink-0 rounded-full border border-white/10 px-4 text-sm text-text-secondary transition hover:bg-white/[0.06]",
            value === category && "border-brand-purple bg-brand-purple/15 text-white",
          )}
          key={category}
          onClick={() => onChange(category)}
          type="button"
        >
          {category}
        </button>
      ))}
    </div>
  );
}
