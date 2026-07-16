import { History } from "lucide-react";

import type { EditorialDetail } from "@/lib/training/admin-editorial-client";

export function VersionHistory({
  history,
  canRestore,
  onRestore,
}: {
  history: EditorialDetail["history"];
  canRestore: boolean;
  onRestore: (id: string) => void;
}) {
  return (
    <section className="rounded-[8px] border border-slate-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-lg font-black">
        <History className="text-violet-700" size={20} />
        Historial de versiones
      </h2>
      <div className="mt-4 divide-y divide-slate-100">
        {history.map((version) => (
          <div
            className="flex items-center justify-between gap-3 py-3"
            key={version.id}
          >
            <div>
              <p className="text-sm font-black">
                Versión {version.version} · {version.status}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(version.created_at).toLocaleString("es")}
                {version.change_reason ? ` · ${version.change_reason}` : ""}
              </p>
            </div>
            {canRestore && version.status === "published" ? (
              <button
                className="min-h-10 rounded-[8px] border border-slate-200 px-3 text-xs font-bold hover:bg-slate-50"
                onClick={() => onRestore(version.id)}
                type="button"
              >
                Restaurar como borrador
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
