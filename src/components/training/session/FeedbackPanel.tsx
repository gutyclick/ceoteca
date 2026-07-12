import { ArrowRight, RotateCcw } from "lucide-react";
import type { Exercise, FeedbackState } from "@/types/training-engine";

export function FeedbackPanel({
  feedback,
  exercise,
  canRetry,
  onContinue,
  onRetry,
}: {
  feedback: NonNullable<FeedbackState>;
  exercise: Exercise;
  canRetry: boolean;
  onContinue: () => void;
  onRetry: () => void;
}) {
  const correct = feedback.kind === "correct";
  return (
    <section
      aria-live="polite"
      className={`mt-6 rounded-[8px] border p-5 ${correct ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
    >
      <h2 className="text-lg font-black">
        {correct
          ? "Buena decisión"
          : "Esta opción parece atractiva, pero tiene un problema"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        {feedback.explanation}
      </p>
      {exercise.type === "scenario" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase text-slate-500">
              Consecuencia
            </p>
            <p className="mt-1 text-sm leading-6">{exercise.consequence}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-slate-500">
              Aplicación práctica
            </p>
            <p className="mt-1 text-sm leading-6">
              {exercise.practicalApplication}
            </p>
          </div>
        </div>
      ) : null}
      <div className="mt-4 border-t border-black/10 pt-4">
        <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">
          Principio aplicado
        </p>
        <p className="mt-1 text-sm font-semibold">{feedback.principle}</p>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {!correct && canRetry ? (
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] border border-slate-300 px-5 font-bold"
            onClick={onRetry}
            type="button"
          >
            <RotateCcw size={17} />
            Intentar de nuevo
          </button>
        ) : null}
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-violet-700 px-5 font-bold text-white"
          onClick={onContinue}
          type="button"
        >
          Continuar
          <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}
