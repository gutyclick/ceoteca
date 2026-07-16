"use client";

import { ArrowRight, LockKeyhole } from "lucide-react";
import Link from "next/link";

import type { TrainingSearchResultViewModel } from "@/lib/training/search-schemas";
import { trackTrainingNavigationEvent } from "@/lib/training/api-client";

const typeLabels: Record<TrainingSearchResultViewModel["type"], string> = {
  category: "Categoría",
  subcategory: "Subcategoría",
  skill: "Habilidad",
  concept: "Concepto",
  path: "Ruta",
  exercise: "Ejercicio",
  book: "Libro",
  simulation: "Simulación",
};

export function TrainingSearchResult({
  result,
}: {
  result: TrainingSearchResultViewModel;
}) {
  return (
    <article className="flex min-h-52 flex-col rounded-[8px] border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-[0.08em] text-violet-700">
          {typeLabels[result.type]}
        </span>
        {result.access === "locked" ? (
          <LockKeyhole
            aria-label={`Requiere plan ${result.minimumPlan}`}
            className="text-amber-600"
            size={18}
          />
        ) : null}
      </div>
      <h2 className="mt-3 text-lg font-black">{result.title}</h2>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
        {result.preview}
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
        {result.category ? <span>{result.category}</span> : null}
        {result.format ? <span>· {result.format}</span> : null}
        {result.durationMinutes ? (
          <span>· {result.durationMinutes} min</span>
        ) : null}
      </div>
      <Link
        className="mt-auto inline-flex min-h-11 items-center gap-2 pt-4 text-sm font-black text-violet-700"
        href={result.access === "locked" ? "/planes" : result.href}
        onClick={() =>
          void trackTrainingNavigationEvent("training_search_result_clicked", {
            source: result.type,
            access_state: result.access === "locked" ? "locked" : "available",
          })
        }
      >
        {result.access === "locked" ? "Ver acceso" : "Abrir"}
        <ArrowRight size={17} />
      </Link>
    </article>
  );
}
