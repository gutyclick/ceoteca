"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";

import { searchTrainingCatalog } from "@/lib/training/taxonomy";

const resultHref = {
  category: (slug: string) => `/ejercicios/categorias/${slug}`,
  skill: (slug: string) => `/ejercicios/habilidades/${slug}`,
  path: (slug: string) => `/ejercicios/rutas/${slug}`,
};

export function TrainingSearch() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const results = searchTrainingCatalog(deferredQuery);
  const isOpen = query.trim().length >= 2;

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
      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 max-h-80 w-full overflow-y-auto rounded-[8px] border border-slate-200 bg-white p-2">
          {results.length ? (
            <ul>
              {results.map((result) => (
                <li key={`${result.type}-${result.slug}`}>
                  <Link
                    className="block rounded-[6px] px-3 py-2.5 hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600"
                    href={resultHref[result.type](result.slug)}
                    onClick={() => setQuery("")}
                  >
                    <span className="block text-sm font-bold text-slate-900">
                      {result.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {result.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-5 text-center text-sm text-slate-500">
              No encontramos resultados con ese término.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
