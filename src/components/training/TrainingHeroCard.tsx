"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clientEnv } from "@/lib/env";
import {
  acceptAdaptiveRecommendation,
  createRemoteTraining,
  getAdaptiveRecommendation,
} from "@/lib/training/api-client";
import { ArrowRight, Clock3, ListChecks, Loader2, Signal } from "lucide-react";

import {
  BookThumbnailGroup,
  TrainingIcon,
  WeeklyStreak,
} from "@/components/training/TrainingPrimitives";
import type { TrainingRecommendation } from "@/types/training";

export function TrainingHeroCard({
  recommendation,
  disabled = false,
}: {
  recommendation: TrainingRecommendation;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [duration, setDuration] = useState<3 | 5 | 7 | 10 | 15>(7);
  const [adaptive, setAdaptive] = useState<Awaited<
    ReturnType<typeof getAdaptiveRecommendation>
  > | null>(null);

  useEffect(() => {
    if (clientEnv.NEXT_PUBLIC_TRAINING_DATA_SOURCE !== "supabase") return;
    let active = true;
    getAdaptiveRecommendation(duration)
      .then((value) => {
        if (active) setAdaptive(value);
      })
      .catch(() => {
        if (active)
          setNotice("Usaremos la recomendación editorial disponible.");
      });
    return () => {
      active = false;
    };
  }, [duration]);

  async function startTraining() {
    setIsLoading(true);
    setNotice("");
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    try {
      if (clientEnv.NEXT_PUBLIC_TRAINING_DATA_SOURCE === "supabase") {
        const remote = adaptive
          ? await acceptAdaptiveRecommendation(adaptive.id)
          : await createRemoteTraining("propuestas-de-valor");
        router.push(`/ejercicios/${remote.sessionId}`);
      } else {
        router.push(`/ejercicios/${recommendation.id}`);
      }
    } catch {
      setNotice("No pudimos preparar el entrenamiento. Inténtalo nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="w-full min-w-0 max-w-full rounded-[8px] border border-slate-950/[0.08] bg-white p-5 sm:p-6">
      <h2 className="text-lg font-black">Entrenamiento de hoy</h2>
      <div className="mt-5 grid min-w-0 max-w-full gap-6 md:grid-cols-[112px_minmax(0,1fr)] md:items-center xl:grid-cols-[112px_minmax(0,1.35fr)_210px_220px]">
        <span className="grid aspect-square w-full max-w-[112px] place-items-center rounded-[8px] bg-violet-50 text-violet-700">
          <TrainingIcon icon={recommendation.icon} size={52} />
        </span>
        <div className="min-w-0 max-w-full">
          <span className="inline-flex rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
            {recommendation.category}
          </span>
          <h3 className="mt-3 break-words text-xl font-black tracking-[-0.03em] text-slate-950 sm:text-2xl">
            {recommendation.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {recommendation.description}
          </p>
          <label className="mt-4 inline-flex items-center gap-3 text-sm font-bold text-slate-700">
            Tengo
            <select
              aria-label="Duración del entrenamiento"
              className="min-h-10 rounded-[8px] border border-slate-200 bg-white px-3"
              value={duration}
              onChange={(event) =>
                setDuration(Number(event.target.value) as 3 | 5 | 7 | 10 | 15)
              }
            >
              {[3, 5, 7, 10, 15].map((value) => (
                <option key={value} value={value}>
                  {value} min
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Clock3 size={16} />
              {adaptive?.calculatedDurationMinutes ??
                recommendation.durationMinutes}{" "}
              min
            </span>
            <span className="inline-flex items-center gap-2">
              <ListChecks size={16} />
              {adaptive?.exerciseIds.length ??
                recommendation.exerciseCount}{" "}
              ejercicios
            </span>
            <span className="inline-flex items-center gap-2">
              <Signal size={16} />
              Nivel{" "}
              {(adaptive?.difficulty ?? recommendation.level).toLocaleLowerCase(
                "es",
              )}
            </span>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            {adaptive?.explanation.primaryReason ??
              "Recomendado según tus lecturas y ejercicios anteriores."}
          </p>
          {adaptive?.includesDeepAIEvaluation ? (
            <span className="mt-3 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
              Evaluación profunda incluida
            </span>
          ) : null}
        </div>
        <BookThumbnailGroup books={recommendation.bookCovers} />
        <div className="min-w-0 max-w-full">
          <WeeklyStreak data={recommendation.streak} />
          <button
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-violet-700 px-5 text-sm font-black text-white transition duration-200 hover:bg-violet-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 motion-reduce:transition-none"
            disabled={disabled || isLoading}
            onClick={() => void startTraining()}
            type="button"
          >
            {isLoading ? (
              <Loader2
                className="animate-spin motion-reduce:animate-none"
                size={17}
              />
            ) : null}
            {isLoading ? "Preparando..." : "Empezar entrenamiento"}
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
      <p
        aria-live="polite"
        className="mt-3 text-right text-xs font-semibold text-violet-700"
      >
        {notice}
      </p>
    </section>
  );
}
