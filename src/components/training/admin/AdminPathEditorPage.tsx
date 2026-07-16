"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PathEditor } from "@/components/training/admin/PathEditor";
import { VersionHistory } from "@/components/training/admin/VersionHistory";
import {
  actEditorial,
  getEditorial,
  getEditorialMetadata,
  listEditorial,
  type EditorialDetail,
  type EditorialMetadata,
} from "@/lib/training/admin-editorial-client";

export function AdminPathEditorPage({ pathId }: { pathId: string }) {
  const [detail, setDetail] = useState<EditorialDetail | null>(null);
  const [metadata, setMetadata] = useState<EditorialMetadata | null>(null);
  const [role, setRole] = useState("viewer");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    try {
      const [list, meta] = await Promise.all([
        listEditorial("paths"),
        getEditorialMetadata(),
      ]);
      setRole(list.role);
      setMetadata(meta);
      if (pathId !== "new") setDetail(await getEditorial("paths", pathId));
    } catch {
      setMessage("No pudimos cargar el editor de rutas.");
    }
  }, [pathId]);
  useEffect(() => {
    void load();
  }, [load]);
  const perform = async (action: string, versionId?: string) => {
    if (!detail) return;
    try {
      await actEditorial("paths", detail.id, {
        action,
        versionId,
        reason: action === "restore" ? "Restauración editorial" : undefined,
      });
      await load();
    } catch {
      setMessage("No pudimos completar la acción editorial.");
    }
  };
  if (!metadata)
    return <div className="h-80 animate-pulse rounded-[8px] bg-slate-100" />;
  const canEdit = role === "admin" || role === "editor";
  return (
    <div>
      <header className="border-b border-slate-200 pb-5">
        <Link
          className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-600"
          href="/admin/training/paths"
        >
          <ArrowLeft size={17} />
          Volver a rutas
        </Link>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
          {detail?.draft && typeof detail.draft.name === "string"
            ? detail.draft.name
            : "Nueva ruta"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Editor de progresión, módulos y compatibilidad por plan.
        </p>
      </header>
      {message ? (
        <p className="mt-4 rounded-[8px] border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {message}
        </p>
      ) : null}
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PathEditor
          canEdit={canEdit}
          detail={detail}
          metadata={metadata}
          onCreated={(id) =>
            window.location.assign(`/admin/training/paths/${id}`)
          }
          onSaved={load}
        />
        <aside className="grid content-start gap-4">
          {detail?.version ? (
            <section className="rounded-[8px] border border-slate-200 bg-white p-5">
              <h2 className="font-black">Flujo editorial</h2>
              <p className="mt-2 text-sm text-slate-500">
                Versión {detail.version.version} · {detail.version.status}
              </p>
              <div className="mt-4 grid gap-2">
                {canEdit &&
                ["draft", "changes_requested"].includes(
                  detail.version.status,
                ) ? (
                  <button
                    className="min-h-11 rounded-[8px] border border-violet-300 font-bold text-violet-700"
                    onClick={() =>
                      void perform("submit_review", detail.version!.id)
                    }
                    type="button"
                  >
                    Enviar a revisión
                  </button>
                ) : null}
                {role === "reviewer" &&
                detail.version.status === "in_review" ? (
                  <>
                    <button
                      className="min-h-11 rounded-[8px] bg-emerald-600 font-bold text-white"
                      onClick={() =>
                        void perform("approve", detail.version!.id)
                      }
                      type="button"
                    >
                      Aprobar
                    </button>
                    <button
                      className="min-h-11 rounded-[8px] border border-amber-300 font-bold text-amber-800"
                      onClick={() =>
                        void perform("request_changes", detail.version!.id)
                      }
                      type="button"
                    >
                      Solicitar cambios
                    </button>
                  </>
                ) : null}
                {role === "admin" && detail.version.status === "approved" ? (
                  <button
                    className="min-h-11 rounded-[8px] bg-violet-700 font-bold text-white"
                    onClick={() => void perform("publish", detail.version!.id)}
                    type="button"
                  >
                    Publicar ruta
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}
          {detail ? (
            <VersionHistory
              canRestore={canEdit}
              history={detail.history}
              onRestore={(id) => void perform("restore", id)}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
