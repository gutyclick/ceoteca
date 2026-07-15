"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { TrainingPathContinueCard, TrainingPathHeader, TrainingPathLockedState, TrainingPathModuleList, TrainingPathProgress } from "@/components/training/paths/TrainingPathComponents";
import { continueLearningPath, getTrainingPath, startLearningPath, startTrainingPathItem, trackTrainingNavigationEvent } from "@/lib/training/api-client";
import type { TrainingPathItemViewModel, TrainingPathPageViewModel } from "@/lib/training/path-model";

export function TrainingPathPage({ pathSlug }: { pathSlug: string }) {
  const router = useRouter();
  const [page, setPage] = useState<TrainingPathPageViewModel | null>(null);
  const [pending, setPending] = useState(false);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getTrainingPath(pathSlug).then((data) => { if (active) setPage(data); }).catch(() => { if (active) setError("No pudimos cargar esta ruta."); });
    void trackTrainingNavigationEvent("training_path_viewed", { path: pathSlug }).catch(() => undefined);
    return () => { active = false; };
  }, [pathSlug]);

  async function startItem(item: TrainingPathItemViewModel) {
    if (item.href) { router.push(item.href); return; }
    setPendingItemId(item.id); setError(null);
    try {
      const result = await startTrainingPathItem(item.id);
      void trackTrainingNavigationEvent("training_path_item_started", { path: pathSlug }).catch(() => undefined);
      router.push(result.href);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos abrir esta actividad."); }
    finally { setPendingItemId(null); }
  }

  async function primaryAction() {
    if (!page) return;
    const item = page.currentModule?.items.find((entry) => entry.status === "in_progress" || entry.status === "available") ?? page.modules[0]?.items[0];
    if ((page.nextAction.kind === "continue" || page.nextAction.kind === "review") && item) { await startItem(item); return; }
    setPending(true); setError(null);
    try {
      const next = page.nextAction.kind === "start" ? (await startLearningPath(pathSlug)).path : await continueLearningPath(pathSlug);
      setPage(next);
      void trackTrainingNavigationEvent(page.nextAction.kind === "start" ? "training_path_started" : "training_path_continued", { path: pathSlug }).catch(() => undefined);
      const first = next.currentModule?.items.find((entry) => entry.status === "available" || entry.status === "in_progress");
      if (first) await startItem(first);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos continuar."); }
    finally { setPending(false); }
  }

  if (error && !page) return <div className="rounded-[8px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">{error}</div>;
  if (!page) return <div className="h-80 animate-pulse rounded-[8px] border border-slate-200 bg-white motion-reduce:animate-none" aria-label="Cargando ruta" />;
  return <div className="space-y-6"><TrainingPathHeader page={page} />{error ? <p className="rounded-[8px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">{error}</p> : null}<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="space-y-6"><TrainingPathProgress value={page.progress} />{page.accessState === "locked" ? <TrainingPathLockedState minimumPlan={page.path.minimumPlan} /> : <TrainingPathModuleList modules={page.modules} onStartItem={startItem} pendingItemId={pendingItemId} />}</div><TrainingPathContinueCard page={page} onAction={primaryAction} pending={pending} /></div></div>;
}
