"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { TaxonomyForm } from "@/components/training/admin/TaxonomyForm";
import { TaxonomyTable } from "@/components/training/admin/TaxonomyTable";
import { VersionHistory } from "@/components/training/admin/VersionHistory";
import {
  actEditorial,
  getEditorial,
  getEditorialMetadata,
  listEditorial,
  type EditorialDetail,
  type EditorialListItem,
  type EditorialMetadata,
} from "@/lib/training/admin-editorial-client";
import type { EditorialResourceType } from "@/lib/training/editorial-content-schemas";

const labels: Record<
  Exclude<EditorialResourceType, "paths">,
  { title: string; description: string }
> = {
  categories: {
    title: "Categorías",
    description: "Organiza los grandes territorios de aprendizaje.",
  },
  subcategories: {
    title: "Subcategorías",
    description: "Agrupa habilidades dentro de una categoría.",
  },
  skills: {
    title: "Habilidades",
    description: "Define capacidades observables y progresivas.",
  },
  concepts: {
    title: "Conceptos",
    description: "Conecta conocimientos concretos con ejercicios publicados.",
  },
  formats: {
    title: "Formatos",
    description: "Administra los formatos disponibles para la práctica.",
  },
};

export function AdminEditorialResourcePage({
  resource,
}: {
  resource: Exclude<EditorialResourceType, "paths">;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("id");
  const [items, setItems] = useState<EditorialListItem[]>([]);
  const [detail, setDetail] = useState<EditorialDetail | null>(null);
  const [metadata, setMetadata] = useState<EditorialMetadata | null>(null);
  const [role, setRole] = useState("viewer");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [list, meta] = await Promise.all([
          listEditorial(resource),
          getEditorialMetadata(),
        ]);
        setItems(list.items);
        setRole(list.role);
        setMetadata(meta);
        if (selectedId && selectedId !== "new")
          setDetail(await getEditorial(resource, selectedId));
        else setDetail(null);
      } catch {
        setMessage("No pudimos cargar esta sección editorial.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [resource, selectedId],
  );

  useEffect(() => {
    void load();
  }, [load]);
  const perform = async (id: string, action: string, versionId?: string) => {
    setMessage("");
    try {
      await actEditorial(resource, id, {
        action,
        versionId,
        reason:
          action === "restore"
            ? "Restauración solicitada desde el historial"
            : undefined,
      });
      await load();
    } catch {
      setMessage("No pudimos completar la acción editorial.");
    }
  };
  const canEdit = role === "admin" || role === "editor";
  const config = labels[resource];

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em]">
            {config.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{config.description}</p>
        </div>
        {canEdit && !selectedId ? (
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-violet-700 px-4 text-sm font-bold text-white"
            onClick={() => router.push(`/admin/training/${resource}?id=new`)}
            type="button"
          >
            <Plus size={18} />
            Crear
          </button>
        ) : null}
      </header>
      <nav
        className="mt-4 flex flex-wrap gap-2 text-sm"
        aria-label="Recursos editoriales"
      >
        {Object.entries(labels).map(([key, value]) => (
          <button
            className={`min-h-10 rounded-[8px] px-3 font-bold ${key === resource ? "bg-violet-100 text-violet-800" : "text-slate-600 hover:bg-slate-100"}`}
            key={key}
            onClick={() => router.push(`/admin/training/${key}`)}
            type="button"
          >
            {value.title}
          </button>
        ))}
      </nav>
      {message ? (
        <p
          className="mt-4 rounded-[8px] border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
          role="alert"
        >
          {message}
        </p>
      ) : null}
      {loading || !metadata ? (
        <div className="mt-6 h-56 animate-pulse rounded-[8px] bg-slate-100" />
      ) : selectedId ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6">
            <button
              className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-slate-600"
              onClick={() => router.push(`/admin/training/${resource}`)}
              type="button"
            >
              <ArrowLeft size={17} />
              Volver al listado
            </button>
            <TaxonomyForm
              canEdit={canEdit}
              detail={selectedId === "new" ? null : detail}
              metadata={metadata}
              onCreated={(id) =>
                router.replace(`/admin/training/${resource}?id=${id}`)
              }
              onSaved={() => {
                void load(true);
              }}
              resource={resource}
            />
          </section>
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
                        perform(detail.id, "submit_review", detail.version!.id)
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
                          perform(detail.id, "approve", detail.version!.id)
                        }
                        type="button"
                      >
                        Aprobar versión
                      </button>
                      <button
                        className="min-h-11 rounded-[8px] border border-amber-300 font-bold text-amber-800"
                        onClick={() =>
                          perform(
                            detail.id,
                            "request_changes",
                            detail.version!.id,
                          )
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
                      onClick={() =>
                        perform(detail.id, "publish", detail.version!.id)
                      }
                      type="button"
                    >
                      Publicar versión
                    </button>
                  ) : null}
                </div>
              </section>
            ) : null}
            {detail ? (
              <VersionHistory
                canRestore={role === "admin" || role === "editor"}
                history={detail.history}
                onRestore={(versionId) =>
                  perform(detail.id, "restore", versionId)
                }
              />
            ) : null}
          </aside>
        </div>
      ) : (
        <div className="mt-6">
          <TaxonomyTable
            items={items}
            onArchive={(id) => void perform(id, "archive")}
            onDuplicate={(id) => void perform(id, "duplicate")}
            resource={resource}
          />
        </div>
      )}
    </div>
  );
}
