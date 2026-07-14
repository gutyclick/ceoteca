"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import { getRoleplayEvaluation } from "@/lib/training/api-client";
export function RoleplayResultsView({ sessionId }: { sessionId: string }) {
  const [evaluation, setEvaluation] = useState<Awaited<
    ReturnType<typeof getRoleplayEvaluation>
  > | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void getRoleplayEvaluation(sessionId)
      .then(setEvaluation)
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "La evaluación todavía no está disponible.",
        ),
      );
  }, [sessionId]);
  if (!evaluation && !error)
    return (
      <div className="grid min-h-screen place-items-center bg-[#fbfaf8]">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-violet-600" />
          <h1 className="mt-4 text-xl font-black">Evaluando tu simulación</h1>
          <p className="mt-2 text-sm text-slate-500">
            Estamos revisando decisiones y momentos clave.
          </p>
        </div>
      </div>
    );
  const result = evaluation?.result;
  return (
    <main className="min-h-screen bg-[#fbfaf8] px-4 py-8 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <p className="font-bold text-violet-700">CEOTECA Training</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.03em]">
          Simulación completada
        </h1>
        {error || !result ? (
          <div className="mt-8 rounded-[8px] border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-black">Tu conversación quedó guardada</h2>
            <p className="mt-2 text-sm text-amber-900">
              La evaluación está tardando más de lo esperado. Podrás consultarla
              desde tu historial.
            </p>
            <Link
              className="mt-5 inline-flex min-h-11 items-center rounded-[8px] bg-violet-600 px-4 font-bold text-white"
              href="/ejercicios/simulaciones/historial"
            >
              Ver historial
            </Link>
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-[240px_1fr]">
              <div className="rounded-[8px] border border-slate-200 bg-white p-6 text-center">
                <span className="text-sm font-bold text-slate-500">
                  Puntuación total
                </span>
                <p className="mt-3 text-6xl font-black text-violet-700">
                  {Math.round(result.overallScore)}
                </p>
                <p className="mt-2 text-sm text-slate-500">de 100</p>
              </div>
              <div className="rounded-[8px] border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-black">Resultado general</h2>
                <p className="mt-3 text-slate-600">
                  {result.outcome === "objective_achieved"
                    ? "Alcanzaste el objetivo con decisiones claras y consistentes."
                    : result.outcome === "partial_progress"
                      ? "Lograste avances importantes; todavía hay oportunidades para concretar el cierre."
                      : "Esta práctica revela habilidades concretas para seguir entrenando."}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[8px] bg-emerald-50 p-4">
                    <CheckCircle2 className="text-emerald-600" />
                    <strong className="mt-2 block">Fortalezas</strong>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700">
                      {result.strengths.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-[8px] bg-amber-50 p-4">
                    <TrendingUp className="text-amber-600" />
                    <strong className="mt-2 block">Áreas a mejorar</strong>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700">
                      {result.improvements.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
            <section className="mt-5 rounded-[8px] border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-black">Criterios</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {result.criteria.map((item) => (
                  <div
                    className="rounded-[8px] border border-slate-200 p-4"
                    key={item.criterionId}
                  >
                    <div className="flex justify-between gap-3">
                      <strong className="capitalize">
                        {item.criterionId.replaceAll("-", " ")}
                      </strong>
                      <span className="font-black text-violet-700">
                        {Math.round(item.score)}/{item.maxScore}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.feedback}
                    </p>
                  </div>
                ))}
              </div>
            </section>
            <section className="mt-5 rounded-[8px] border border-slate-200 bg-white p-6">
              <MessageSquareText className="text-violet-600" />
              <h2 className="mt-3 text-xl font-black">Frases alternativas</h2>
              <div className="mt-4 space-y-2">
                {result.suggestedPhrases.map((item) => (
                  <blockquote
                    className="rounded-[8px] bg-violet-50 p-4 text-sm text-violet-950"
                    key={item}
                  >
                    “{item}”
                  </blockquote>
                ))}
              </div>
            </section>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-violet-600 px-4 font-bold text-white"
                href="/ejercicios/simulaciones"
              >
                Volver a simulaciones <ArrowRight size={17} />
              </Link>
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-slate-200 px-4 font-bold"
                href="/ejercicios/simulaciones/historial"
              >
                Revisar conversación
              </Link>
              <Link
                className="inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-slate-200 px-4 font-bold"
                href="/ejercicios/simulaciones"
              >
                <RotateCcw size={17} /> Practicar otra vez
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
