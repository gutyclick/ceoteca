"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { editorialRequest } from "@/lib/training/editorial-api";
type Dashboard = {
  role: string;
  total: number;
  draft: number;
  inReview: number;
  published: number;
  archived: number;
  activeTemplates: number;
  pendingReviews: number;
  activity: Array<{ action: string; entity_type: string; created_at: string }>;
};
export function AdminTrainingDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    editorialRequest<Dashboard>("/api/admin/training/dashboard")
      .then(setData)
      .catch((error) =>
        setError(error instanceof Error ? error.message : "Sin acceso"),
      );
  }, []);
  if (error)
    return (
      <section className="mx-auto mt-20 max-w-lg rounded-[8px] border border-rose-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-black">Acceso editorial restringido</h1>
        <p className="mt-2 text-slate-600">{error}</p>
      </section>
    );
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-bold text-violet-700">CEOTECA Training</p>
          <h1 className="mt-1 text-3xl font-black">Panel editorial</h1>
          <p className="mt-1 text-slate-500">
            Crea, valida y publica experiencias de aprendizaje.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center rounded-[8px] bg-violet-700 px-5 font-bold text-white"
          href="/admin/training/exercises/new"
        >
          Crear ejercicio
        </Link>
      </header>
      {!data ? (
        <p className="mt-8 text-slate-500">Cargando resumen editorial…</p>
      ) : (
        <div className="mt-6 space-y-6">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total", data.total],
              ["Borradores", data.draft],
              ["En revisión", data.inReview],
              ["Publicados", data.published],
              ["Archivados", data.archived],
              ["Plantillas activas", data.activeTemplates],
              ["Revisiones pendientes", data.pendingReviews],
              ["Rol", data.role],
            ].map(([label, value]) => (
              <article
                className="rounded-[8px] border border-slate-200 bg-white p-5"
                key={label}
              >
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black capitalize">{value}</p>
              </article>
            ))}
          </section>
          <section className="rounded-[8px] border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-black">Actividad reciente</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {data.activity.length ? (
                data.activity.map((item, index) => (
                  <div
                    className="flex justify-between gap-4 py-3 text-sm"
                    key={`${item.created_at}-${index}`}
                  >
                    <span className="font-bold">
                      {item.action.replaceAll("_", " ")}
                    </span>
                    <time className="text-slate-500">
                      {new Date(item.created_at).toLocaleDateString("es")}
                    </time>
                  </div>
                ))
              ) : (
                <p className="py-4 text-slate-500">
                  Todavía no hay actividad editorial.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
