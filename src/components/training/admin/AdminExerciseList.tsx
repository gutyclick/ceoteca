"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { editorialRequest } from "@/lib/training/editorial-api";
type Row = {
  id: string;
  title: string | null;
  type: string;
  difficulty: string;
  status: string;
  version: number;
  updated_at: string;
  training_skills: { name: string } | null;
  training_concepts: { name: string } | null;
};
export function AdminExerciseList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const load = () =>
    editorialRequest<Row[]>("/api/admin/training/exercises")
      .then(setRows)
      .catch((error) =>
        setError(error instanceof Error ? error.message : "No pudimos cargar"),
      );
  useEffect(() => {
    void load();
  }, []);
  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (status === "all" || row.status === status) &&
          `${row.title} ${row.type} ${row.training_skills?.name}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [rows, query, status],
  );
  async function action(id: string, value: string) {
    if (!confirm(`¿Confirmas la acción ${value.replaceAll("_", " ")}?`)) return;
    try {
      await editorialRequest(`/api/admin/training/exercises/${id}/actions`, {
        method: "POST",
        body: JSON.stringify({ action: value }),
      });
      load();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No pudimos completar la acción",
      );
    }
  }
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black">Ejercicios</h1>
          <p className="mt-1 text-slate-500">
            Contenido, versiones y estado editorial.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center rounded-[8px] bg-violet-700 px-5 font-bold text-white"
          href="/admin/training/exercises/new"
        >
          Crear ejercicio
        </Link>
      </header>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          aria-label="Buscar ejercicios"
          className="min-h-11 flex-1 rounded-[8px] border border-slate-200 bg-white px-4"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por título, tipo o habilidad"
        />
        <select
          aria-label="Filtrar por estado"
          className="min-h-11 rounded-[8px] border border-slate-200 bg-white px-4"
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">Todos los estados</option>
          {[
            "draft",
            "in_review",
            "approved",
            "published",
            "archived",
            "rejected",
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      {error ? (
        <p className="mt-4 text-sm font-bold text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-5 overflow-hidden rounded-[8px] border border-slate-200 bg-white">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_100px_220px] gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-500 md:grid">
          <span>Ejercicio</span>
          <span>Tipo</span>
          <span>Habilidad</span>
          <span>Estado</span>
          <span>Versión</span>
          <span>Acciones</span>
        </div>
        {filtered.map((row) => (
          <article
            className="grid gap-3 border-b border-slate-100 p-4 last:border-0 md:grid-cols-[2fr_1fr_1fr_1fr_100px_220px] md:items-center"
            key={row.id}
          >
            <div>
              <p className="font-black">{row.title ?? "Sin título"}</p>
              <p className="text-xs text-slate-500">
                {row.training_concepts?.name}
              </p>
            </div>
            <span className="text-sm">{row.type}</span>
            <span className="text-sm">{row.training_skills?.name}</span>
            <span className="w-fit rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">
              {row.status}
            </span>
            <span className="text-sm">v{row.version}</span>
            <div className="flex flex-wrap gap-2">
              {row.status === "draft" ? (
                <button
                  className="text-sm font-bold text-violet-700"
                  onClick={() => action(row.id, "submit_review")}
                >
                  Enviar
                </button>
              ) : null}
              {row.status === "in_review" ? (
                <button
                  className="text-sm font-bold text-emerald-700"
                  onClick={() => action(row.id, "publish")}
                >
                  Publicar
                </button>
              ) : null}
              <button
                className="text-sm font-bold text-slate-600"
                onClick={() => action(row.id, "duplicate")}
              >
                Duplicar
              </button>
              {row.status === "published" ? (
                <button
                  className="text-sm font-bold text-rose-700"
                  onClick={() => action(row.id, "archive")}
                >
                  Archivar
                </button>
              ) : null}
            </div>
          </article>
        ))}
        {!filtered.length ? (
          <p className="p-8 text-center text-slate-500">
            No hay ejercicios con estos filtros.
          </p>
        ) : null}
      </div>
    </>
  );
}
