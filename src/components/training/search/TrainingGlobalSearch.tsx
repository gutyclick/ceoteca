"use client";

import { Loader2, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  searchTraining,
  trackTrainingNavigationEvent,
} from "@/lib/training/api-client";
import {
  trainingSearchQuerySchema,
  type TrainingSearchQuery,
  type TrainingSearchResultViewModel,
} from "@/lib/training/search-schemas";
import { TrainingSearchEmptyState } from "@/components/training/search/TrainingSearchEmptyState";
import { TrainingSearchFilters } from "@/components/training/search/TrainingSearchFilters";
import { TrainingSearchResult } from "@/components/training/search/TrainingSearchResult";

export function TrainingGlobalSearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = useMemo(
    () => trainingSearchQuerySchema.parse(Object.fromEntries(searchParams)),
    [searchParams],
  );
  const [filters, setFilters] = useState<TrainingSearchQuery>(initial);
  const [query, setQuery] = useState(initial.q);
  const [results, setResults] = useState<TrainingSearchResultViewModel[]>([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const lastQuery = useRef(initial.q);

  const updateUrl = useCallback(
    (next: TrainingSearchQuery) => {
      const params = new URLSearchParams();
      Object.entries(next).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== "" &&
          !(key === "page" && value === 1)
        )
          params.set(key, String(value));
      });
      router.replace(`/training/search?${params}`, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = {
        ...filters,
        q: query,
        page: query !== lastQuery.current ? 1 : filters.page,
      };
      lastQuery.current = query;
      setState("loading");
      updateUrl(next);
      searchTraining(next)
        .then((payload) => {
          setResults(payload.results);
          setMeta({ total: payload.total, pages: payload.pages });
          setState("ready");
          void trackTrainingNavigationEvent("training_search_used", {
            filter_count: Object.values(next).filter(Boolean).length,
            source: "global_training_search",
          });
        })
        .catch(() => setState("error"));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query, filters, updateUrl]);

  const patch = (value: Partial<TrainingSearchQuery>) =>
    setFilters((current) => ({ ...current, ...value }));
  return (
    <div>
      <label className="flex min-h-14 items-center gap-3 rounded-[8px] border border-slate-200 bg-white px-4 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
        <Search className="text-slate-400" size={20} />
        <span className="sr-only">Buscar en Training</span>
        <input
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-base outline-none"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Busca categorías, habilidades, rutas, ejercicios o libros"
          type="search"
          value={query}
        />
      </label>
      <div className="mt-4">
        <TrainingSearchFilters onChange={patch} value={filters} />
      </div>
      <div className="mt-7 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-500">
          {meta.total} resultados
        </p>
        {state === "loading" ? (
          <Loader2
            aria-label="Buscando"
            className="animate-spin text-violet-600"
            size={20}
          />
        ) : null}
      </div>
      {state === "error" ? (
        <div
          className="mt-4 rounded-[8px] border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-800"
          role="alert"
        >
          No pudimos cargar los resultados. Inténtalo nuevamente.
        </div>
      ) : null}
      {state === "ready" && !results.length ? (
        <div className="mt-4">
          <TrainingSearchEmptyState />
        </div>
      ) : null}
      {results.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((result) => (
            <TrainingSearchResult
              key={`${result.type}-${result.id}`}
              result={result}
            />
          ))}
        </div>
      ) : null}
      {meta.pages > 1 ? (
        <nav
          aria-label="Paginación"
          className="mt-7 flex items-center justify-center gap-3"
        >
          <button
            className="min-h-11 rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-bold disabled:opacity-40"
            disabled={filters.page <= 1}
            onClick={() => patch({ page: filters.page - 1 })}
          >
            Anterior
          </button>
          <span className="text-sm font-bold">
            {filters.page} de {meta.pages}
          </span>
          <button
            className="min-h-11 rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-bold disabled:opacity-40"
            disabled={filters.page >= meta.pages}
            onClick={() => patch({ page: filters.page + 1 })}
          >
            Siguiente
          </button>
        </nav>
      ) : null}
    </div>
  );
}
