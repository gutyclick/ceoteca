"use client";

import { useState } from "react";
import { ArrowRight, Clock3, ListChecks, Loader2, Signal } from "lucide-react";

import { BookThumbnailGroup, TrainingIcon, WeeklyStreak } from "@/components/training/TrainingPrimitives";
import type { TrainingRecommendation } from "@/types/training";

export function TrainingHeroCard({ recommendation, disabled = false }: { recommendation: TrainingRecommendation; disabled?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function startTraining() {
    setIsLoading(true);
    setNotice("");
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    setNotice("El entrenamiento interactivo estará disponible en la próxima fase.");
    setIsLoading(false);
  }

  return (
    <section className="w-full min-w-0 max-w-full rounded-[8px] border border-slate-950/[0.08] bg-white p-5 sm:p-6">
      <h2 className="text-lg font-black">Entrenamiento de hoy</h2>
      <div className="mt-5 grid min-w-0 max-w-full gap-6 lg:grid-cols-[112px_minmax(0,1.35fr)_210px_220px] lg:items-center">
        <span className="grid aspect-square w-full max-w-[112px] place-items-center rounded-[8px] bg-violet-50 text-violet-700"><TrainingIcon icon={recommendation.icon} size={52} /></span>
        <div className="min-w-0 max-w-full">
          <span className="inline-flex rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">{recommendation.category}</span>
          <h3 className="mt-3 break-words text-xl font-black tracking-[-0.03em] text-slate-950 sm:text-2xl">{recommendation.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{recommendation.description}</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-2"><Clock3 size={16} />{recommendation.durationMinutes} min</span>
            <span className="inline-flex items-center gap-2"><ListChecks size={16} />{recommendation.exerciseCount} ejercicios</span>
            <span className="inline-flex items-center gap-2"><Signal size={16} />Nivel {recommendation.level.toLocaleLowerCase("es")}</span>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">Recomendado según tus lecturas y ejercicios anteriores.</p>
        </div>
        <BookThumbnailGroup books={recommendation.bookCovers} />
        <div className="min-w-0 max-w-full">
          <WeeklyStreak data={recommendation.streak} />
          <button className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-violet-700 px-5 text-sm font-black text-white transition duration-200 hover:bg-violet-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 motion-reduce:transition-none" disabled={disabled || isLoading} onClick={() => void startTraining()} type="button">
            {isLoading ? <Loader2 className="animate-spin motion-reduce:animate-none" size={17} /> : null}{isLoading ? "Preparando..." : "Empezar entrenamiento"}<ArrowRight size={17} />
          </button>
        </div>
      </div>
      <p aria-live="polite" className="mt-3 text-right text-xs font-semibold text-violet-700">{notice}</p>
    </section>
  );
}
