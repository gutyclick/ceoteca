"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { TaxonomyTable } from "@/components/training/admin/TaxonomyTable";
import {
  actEditorial,
  listEditorial,
  type EditorialListItem,
} from "@/lib/training/admin-editorial-client";

export function AdminPathsPage() {
  const [items, setItems] = useState<EditorialListItem[]>([]);
  const [role, setRole] = useState("viewer");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const result = await listEditorial("paths");
      setItems(result.items);
      setRole(result.role);
    } catch {
      setError("No pudimos cargar las rutas.");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const act = async (id: string, action: "archive" | "duplicate") => {
    try {
      await actEditorial("paths", id, { action });
      await load();
    } catch {
      setError("No pudimos completar la acción.");
    }
  };
  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em]">
            Rutas de aprendizaje
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Construye progresiones por módulos y valida su compatibilidad
            pedagógica.
          </p>
        </div>
        {role === "admin" || role === "editor" ? (
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-violet-700 px-4 text-sm font-bold text-white"
            href="/admin/training/paths/new"
          >
            <Plus size={18} />
            Crear ruta
          </Link>
        ) : null}
      </header>
      {error ? (
        <p className="mt-4 rounded-[8px] border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      <div className="mt-6">
        <TaxonomyTable
          items={items}
          onArchive={(id) => void act(id, "archive")}
          onDuplicate={(id) => void act(id, "duplicate")}
          resource="paths"
        />
      </div>
    </div>
  );
}
