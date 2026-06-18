"use client";

import { Search } from "lucide-react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <label className="relative block">
      <span className="sr-only">Buscar libros</span>
      <Search
        aria-hidden="true"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
        size={18}
      />
      <input
        className="min-h-12 w-full rounded-button border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm outline-none transition placeholder:text-text-muted focus:border-brand-purple"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por título, autor, categoría o etiqueta"
        value={value}
      />
    </label>
  );
}
