import { Archive, Copy, Eye, Pencil } from "lucide-react";
import Link from "next/link";

import type { EditorialListItem } from "@/lib/training/admin-editorial-client";
import type { EditorialResourceType } from "@/lib/training/editorial-content-schemas";

export function TaxonomyTable({
  items,
  resource,
  onDuplicate,
  onArchive,
}: {
  items: EditorialListItem[];
  resource: EditorialResourceType;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  if (!items.length)
    return (
      <div className="rounded-[8px] border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        Todavía no hay contenido en esta sección.
      </div>
    );
  return (
    <div className="overflow-x-auto rounded-[8px] border border-slate-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Slug</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-4 font-black">
                {item.name ?? item.title}
              </td>
              <td className="px-4 py-4 text-slate-500">{item.slug}</td>
              <td className="px-4 py-4">
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                  {item.status}
                </span>
              </td>
              <td className="px-4 py-4 text-slate-600">
                {item.minimum_plan ?? "free"}
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-1">
                  <Link
                    aria-label="Editar"
                    className="grid h-10 w-10 place-items-center rounded-[8px] hover:bg-slate-100"
                    href={
                      resource === "paths"
                        ? `/admin/training/paths/${item.id}`
                        : `/admin/training/${resource}?id=${item.id}`
                    }
                  >
                    <Pencil size={17} />
                  </Link>
                  {item.status === "published" ? (
                    <Link
                      aria-label="Previsualizar como usuario"
                      className="grid h-10 w-10 place-items-center rounded-[8px] hover:bg-slate-100"
                      href={
                        resource === "paths"
                          ? `/ejercicios/rutas/${item.slug}`
                          : `/training/search?q=${encodeURIComponent(item.name ?? item.title ?? "")}`
                      }
                      target="_blank"
                    >
                      <Eye size={17} />
                    </Link>
                  ) : null}
                  <button
                    aria-label="Duplicar"
                    className="grid h-10 w-10 place-items-center rounded-[8px] hover:bg-slate-100"
                    onClick={() => onDuplicate(item.id)}
                    type="button"
                  >
                    <Copy size={17} />
                  </button>
                  <button
                    aria-label="Archivar"
                    className="grid h-10 w-10 place-items-center rounded-[8px] text-rose-600 hover:bg-rose-50"
                    onClick={() => onArchive(item.id)}
                    type="button"
                  >
                    <Archive size={17} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
