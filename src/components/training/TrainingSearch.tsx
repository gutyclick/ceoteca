"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function TrainingSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  return (
    <div className="relative min-w-0 flex-1 sm:w-full sm:max-w-md">
      <label className="flex min-h-11 items-center gap-3 rounded-[8px] border border-slate-200 bg-white px-3 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
        <Search aria-hidden="true" className="text-slate-400" size={18} />
        <span className="sr-only">Buscar en Training</span>
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar habilidades, conceptos o rutas"
          type="search"
          value={query}
          onKeyDown={(event) => {
            if (event.key === "Enter" && query.trim())
              router.push(
                `/training/search?q=${encodeURIComponent(query.trim())}`,
              );
          }}
        />
        {query ? (
          <button
            aria-label="Limpiar búsqueda"
            className="grid h-8 w-8 place-items-center text-slate-500 hover:text-slate-950"
            onClick={() => setQuery("")}
            type="button"
          >
            <X size={16} />
          </button>
        ) : null}
      </label>
      <Link
        className="sr-only"
        href={
          query.trim()
            ? `/training/search?q=${encodeURIComponent(query.trim())}`
            : "/training/search"
        }
      >
        Abrir búsqueda avanzada
      </Link>
    </div>
  );
}
