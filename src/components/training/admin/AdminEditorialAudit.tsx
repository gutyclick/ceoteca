"use client";
import { useEffect, useState } from "react";
import { editorialRequest } from "@/lib/training/editorial-api";
type Event = {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_version: number | null;
  created_at: string;
};
export function AdminEditorialAudit() {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    editorialRequest<Event[]>("/api/admin/training/audit")
      .then(setEvents)
      .catch((error) =>
        setError(error instanceof Error ? error.message : "Sin acceso"),
      );
  }, []);
  return (
    <>
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-black">Auditoría</h1>
        <p className="mt-1 text-slate-500">
          Historial inmutable de acciones editoriales.
        </p>
      </header>
      {error ? (
        <p className="mt-6 text-rose-700" role="alert">
          {error}
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-[8px] border border-slate-200 bg-white">
          {events.map((event) => (
            <article
              className="grid gap-2 border-b border-slate-100 p-4 sm:grid-cols-[1fr_1fr_160px]"
              key={event.id}
            >
              <span className="font-bold">
                {event.action.replaceAll("_", " ")}
              </span>
              <span className="text-sm text-slate-600">
                {event.entity_type}
                {event.entity_version ? ` · v${event.entity_version}` : ""}
              </span>
              <time className="text-sm text-slate-500">
                {new Date(event.created_at).toLocaleString("es")}
              </time>
            </article>
          ))}
          {!events.length ? (
            <p className="p-8 text-center text-slate-500">
              No hay acciones registradas.
            </p>
          ) : null}
        </div>
      )}
    </>
  );
}
