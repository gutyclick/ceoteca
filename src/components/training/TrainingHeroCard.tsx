"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clientEnv } from "@/lib/env";
import {
  acceptAdaptiveRecommendation,
  createRemoteTraining,
  getAdaptiveRecommendation,
  trackTrainingNavigationEvent,
} from "@/lib/training/api-client";
import { ArrowRight, ListChecks, Loader2, Signal } from "lucide-react";

import {
  BookThumbnailGroup,
  TrainingIcon,
  WeeklyStreak,
} from "@/components/training/TrainingPrimitives";
import type { TrainingRecommendation } from "@/types/training";
import type { TrainingHomeViewModel } from "@/lib/training/navigation-model";
import { todayTraining } from "@/data/training";

export function TrainingHeroCard({
  recommendation,
  disabled = false,
}: {
  recommendation: TrainingHomeViewModel["recommendation"];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [adaptive, setAdaptive] = useState<Awaited<
    ReturnType<typeof getAdaptiveRecommendation>
  > | null>(null);
  const display: TrainingRecommendation = {
    ...todayTraining,
    title: recommendation?.title ?? todayTraining.title,
    category: recommendation?.category ?? todayTraining.category,
    description: recommendation?.reason ?? todayTraining.description,
    exerciseCount: recommendation?.exerciseCount ?? todayTraining.exerciseCount,
    level: recommendation
      ? recommendation.difficulty === "fundamentals"
        ? "Inicial"
        : recommendation.difficulty === "application"
          ? "Intermedio"
          : "Avanzado"
      : todayTraining.level,
  };

  useEffect(() => {
    void trackTrainingNavigationEvent("training_recommendation_viewed", {
      skill: recommendation?.skillSlug,
      source: "training_home",
    }).catch(() => undefined);
  }, [recommendation?.skillSlug]);

  useEffect(() => {
    if (clientEnv.NEXT_PUBLIC_TRAINING_DATA_SOURCE !== "supabase") return;
    let active = true;
    getAdaptiveRecommendation(recommendation?.skillSlug || undefined)
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
  }, [recommendation?.skillSlug]);

  async function startTraining() {
    setIsLoading(true);
    setNotice("");
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    try {
      if (clientEnv.NEXT_PUBLIC_TRAINING_DATA_SOURCE === "supabase") {
        const remote = adaptive
          ? await acceptAdaptiveRecommendation(adaptive.id)
          : await createRemoteTraining("propuestas-de-valor");
        await trackTrainingNavigationEvent("training_recommendation_started", {
          skill: recommendation?.skillSlug,
          source: "training_home",
        }).catch(() => undefined);
        router.push(`/ejercicios/${remote.sessionId}`);
      } else {
        router.push(`/ejercicios/${display.id}`);
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
          <TrainingIcon icon={display.icon} size={52} />
        </span>
        <div className="min-w-0 max-w-full">
          <span className="inline-flex rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
            {display.category}
          </span>
          <h3 className="mt-3 break-words text-xl font-black tracking-[-0.03em] text-slate-950 sm:text-2xl">
            {display.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {display.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-2">
              <ListChecks size={16} />
              {adaptive?.exerciseIds.length ?? display.exerciseCount} ejercicios
            </span>
            <span className="inline-flex items-center gap-2">
              <Signal size={16} />
              Nivel{" "}
              {(adaptive?.difficulty ?? display.level).toLocaleLowerCase("es")}
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
        <BookThumbnailGroup books={display.bookCovers} />
        <div className="min-w-0 max-w-full">
          <WeeklyStreak data={display.streak} />
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
