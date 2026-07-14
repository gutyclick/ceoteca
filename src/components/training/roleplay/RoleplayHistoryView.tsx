"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, Loader2, MessagesSquare } from "lucide-react";
import { getRoleplayHistory } from "@/lib/training/api-client";
const statusLabels: Record<string, string> = {
  ready: "En progreso",
  active: "En progreso",
  paused: "Pausada",
  completed: "Completada",
  expired: "Expirada",
  failed: "Error",
};
export function RoleplayHistoryView() {
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof getRoleplayHistory>>["items"] | null
  >(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void getRoleplayHistory()
      .then((data) => setItems(data.items))
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "No pudimos cargar el historial.",
        ),
      );
  }, []);
  return (
    <main className="min-h-screen bg-[#fbfaf8] px-4 py-7 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-600"
          href="/ejercicios/simulaciones"
        >
          <ArrowLeft size={17} /> Simulaciones
        </Link>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.03em]">
          Tu historial
        </h1>
        <p className="mt-2 text-slate-500">
          Continúa sesiones pausadas y revisa tus resultados anteriores.
        </p>
        {!items && !error ? (
          <div className="grid min-h-[40vh] place-items-center">
            <Loader2 className="animate-spin text-violet-600" />
          </div>
        ) : null}
        {error ? (
          <div className="mt-6 rounded-[8px] border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : null}
        {items?.length === 0 ? (
          <div className="mt-8 rounded-[8px] border border-dashed border-slate-300 p-12 text-center">
            <MessagesSquare className="mx-auto text-violet-500" />
            <h2 className="mt-4 font-black">Todavía no tienes simulaciones</h2>
            <Link
              className="mt-5 inline-flex min-h-11 items-center rounded-[8px] bg-violet-600 px-4 font-bold text-white"
              href="/ejercicios/simulaciones"
            >
              Explorar escenarios
            </Link>
          </div>
        ) : null}
        <div className="mt-7 space-y-3">
          {items?.map((item) => {
            const snapshot = item.scenario_snapshot;
            const evaluation = Array.isArray(item.training_roleplay_evaluations)
              ? item.training_roleplay_evaluations[0]
              : item.training_roleplay_evaluations;
            return (
              <article
                className="grid gap-4 rounded-[8px] border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center"
                key={item.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black">
                      {String(snapshot.title ?? "Simulación")}
                    </h2>
                    <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">
                      {statusLabels[item.status] ?? item.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock3 size={14} />
                      {new Date(item.started_at).toLocaleDateString("es-PA")}
                    </span>
                    <span className="capitalize">{item.difficulty}</span>
                    <span>{item.turn_count} turnos</span>
                    {evaluation?.overall_score != null ? (
                      <strong className="text-violet-700">
                        {Math.round(evaluation.overall_score)} puntos
                      </strong>
                    ) : null}
                  </div>
                </div>
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-[8px] border border-slate-200 px-4 text-sm font-bold hover:border-violet-300"
                  href={
                    item.status === "paused" ||
                    item.status === "active" ||
                    item.status === "ready"
                      ? `/ejercicios/simulaciones/sesiones/${item.id}`
                      : `/ejercicios/simulaciones/sesiones/${item.id}/resultados`
                  }
                >
                  {item.status === "paused" ? "Continuar" : "Ver resultado"}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
