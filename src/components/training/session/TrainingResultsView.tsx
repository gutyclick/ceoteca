"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import { trainingRepository } from "@/lib/training/repository";
import type {
  TrainingSession,
  TrainingSessionResult,
} from "@/types/training-engine";

export function TrainingResultsView({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [result, setResult] = useState<TrainingSessionResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    void Promise.all([
      trainingRepository.getSession(sessionId),
      trainingRepository.getResult(sessionId),
    ])
      .then(([nextSession, nextResult]) => {
        if (active) {
          setSession(nextSession);
          setResult(nextResult);
          setLoaded(true);
        }
      })
      .catch(() => setLoaded(true));
    return () => {
      active = false;
    };
  }, [sessionId]);
  if (!loaded)
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbfaf8]">
        <Loader2
          aria-label="Cargando resultados"
          className="animate-spin text-violet-700"
        />
      </main>
    );
  if (!session || !result)
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbfaf8] p-4">
        <section className="max-w-md text-center">
          <h1 className="text-2xl font-black">Aún no hay resultados</h1>
          <p className="mt-2 text-slate-600">
            Completa el entrenamiento para ver tu avance.
          </p>
          <Link
            className="mt-6 inline-flex min-h-12 items-center rounded-[8px] bg-violet-700 px-6 font-bold text-white"
            href={`/ejercicios/${sessionId}`}
          >
            Abrir entrenamiento
          </Link>
        </section>
      </main>
    );
  const minutes = Math.max(1, Math.round(result.durationSeconds / 60));
  return (
    <main className="min-h-screen bg-[#fbfaf8] px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-[8px] bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={34} />
          </span>
          <h1 className="mt-6 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
            Entrenamiento completado
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Has fortalecido tu capacidad para crear propuestas de valor.
          </p>
        </header>
        <section className="mt-9 rounded-[8px] border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col items-center justify-between gap-5 border-b border-slate-200 pb-7 sm:flex-row">
            <div>
              <p className="text-sm font-bold text-slate-500">Dominio</p>
              <p className="mt-1 text-4xl font-black">
                {result.masteryBefore}%{" "}
                <span className="text-violet-600">
                  → {result.masteryAfter}%
                </span>
              </p>
            </div>
            <span className="grid h-14 w-14 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
              <TrendingUp size={27} />
            </span>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-4">
            {[
              [result.correctAnswers, "Respuestas correctas"],
              [result.retriedAnswers, "Respuestas mejoradas"],
              [result.areasToReview.length, "Conceptos por reforzar"],
              [minutes, "Minutos de práctica"],
            ].map(([value, label]) => (
              <div
                className="rounded-[8px] bg-slate-50 p-4"
                key={String(label)}
              >
                <p className="text-2xl font-black">{value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div>
              <h2 className="font-black">Fortalezas</h2>
              <ul className="mt-3 grid gap-2">
                {result.strengths.map((item) => (
                  <li className="flex gap-2 text-sm text-slate-600" key={item}>
                    <CheckCircle2 className="text-emerald-500" size={17} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-black">Por reforzar</h2>
              <ul className="mt-3 grid gap-2">
                {result.areasToReview.map((item) => (
                  <li className="flex gap-2 text-sm text-slate-600" key={item}>
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-7 rounded-[8px] bg-violet-50 p-4 text-sm font-semibold text-violet-950">
            Recomendamos repetir una sesión breve dentro de 3 días.
          </p>
        </section>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-violet-700 px-4 font-bold text-white"
            href="/ejercicios"
          >
            Continuar entrenando
            <ArrowRight size={17} />
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-slate-300 px-4 font-bold"
            href="/ejercicios"
          >
            Volver a Training
          </Link>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] border border-slate-300 px-4 font-bold"
            onClick={() => {
              void trainingRepository
                .clearSession(sessionId)
                .then(() => router.push(`/ejercicios/${sessionId}`));
            }}
            type="button"
          >
            <RotateCcw size={17} />
            Repetir sesión
          </button>
        </div>
      </div>
    </main>
  );
}
