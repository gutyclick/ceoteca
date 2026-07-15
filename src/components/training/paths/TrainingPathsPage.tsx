"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { TrainingPathCard, TrainingPathEmptyState, TrainingPathFilters } from "@/components/training/paths/TrainingPathComponents";
import { getTrainingPaths, trackTrainingNavigationEvent } from "@/lib/training/api-client";
import type { TrainingPathsPageViewModel } from "@/lib/training/path-model";

export function TrainingPathsPage() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<TrainingPathsPageViewModel | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setError(false);
    const query = searchParams.toString();
    getTrainingPaths(query ? `?${query}` : "").then((data) => { if (active) setView(data); }).catch(() => { if (active) setError(true); });
    void trackTrainingNavigationEvent("training_paths_viewed").catch(() => undefined);
    return () => { active = false; };
  }, [searchParams]);
  if (error) return <div className="rounded-[8px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">No pudimos cargar las rutas. Recarga la página para intentarlo de nuevo.</div>;
  if (!view) return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Cargando rutas">{[0,1,2].map((item) => <div className="h-64 animate-pulse rounded-[8px] border border-slate-200 bg-white motion-reduce:animate-none" key={item} />)}</div>;
  return <div className="space-y-8"><TrainingPathFilters categories={view.categories} />{view.inProgress.length ? <PathSection title="Continúa donde lo dejaste" paths={view.inProgress} /> : null}{view.recommended.length ? <PathSection title="Rutas recomendadas" paths={view.recommended} /> : null}{view.paths.length ? <PathSection title="Todas las rutas" paths={view.paths} /> : <TrainingPathEmptyState />}</div>;
}

function PathSection({ title, paths }: { title: string; paths: TrainingPathsPageViewModel["paths"] }) {
  return <section><h2 className="text-xl font-black">{title}</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{paths.map((path) => <TrainingPathCard key={path.slug} path={path} />)}</div></section>;
}
