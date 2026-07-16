"use client";

import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  FolderTree,
  Route,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { EditorialValidationPanel } from "@/components/training/admin/EditorialValidationPanel";
import {
  listEditorial,
  validateEditorial,
} from "@/lib/training/admin-editorial-client";

const resources = [
  ["categories", "Categorías"],
  ["subcategories", "Subcategorías"],
  ["skills", "Habilidades"],
  ["concepts", "Conceptos"],
  ["formats", "Formatos"],
  ["paths", "Rutas"],
] as const;

export function AdminTaxonomyDashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [validation, setValidation] = useState<Awaited<
    ReturnType<typeof validateEditorial>
  > | null>(null);
  useEffect(() => {
    void Promise.all(
      resources.map(
        async ([resource]) =>
          [resource, (await listEditorial(resource)).items.length] as const,
      ),
    ).then((entries) => setCounts(Object.fromEntries(entries)));
    void validateEditorial().then(setValidation);
  }, []);
  return (
    <div>
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-black tracking-[-0.04em]">
          Taxonomía editorial
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Administra, valida y publica la estructura pedagógica de Training.
        </p>
      </header>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {resources.map(([resource, label]) => {
          const Icon =
            resource === "paths"
              ? Route
              : resource === "categories" || resource === "subcategories"
                ? FolderTree
                : Boxes;
          return (
            <Link
              className="rounded-[8px] border border-slate-200 bg-white p-5 transition-colors hover:border-violet-300"
              href={`/admin/training/${resource}`}
              key={resource}
            >
              <Icon className="text-violet-700" size={22} />
              <strong className="mt-4 block text-2xl">
                {counts[resource] ?? "—"}
              </strong>
              <span className="text-sm text-slate-500">{label}</span>
            </Link>
          );
        })}
      </div>
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <article className="rounded-[8px] border border-slate-200 bg-white p-5">
          <AlertTriangle className="text-rose-600" size={22} />
          <strong className="mt-3 block text-2xl">
            {validation?.summary.errors ?? "—"}
          </strong>
          <span className="text-sm text-slate-500">errores bloqueantes</span>
        </article>
        <article className="rounded-[8px] border border-slate-200 bg-white p-5">
          <AlertTriangle className="text-amber-600" size={22} />
          <strong className="mt-3 block text-2xl">
            {validation?.summary.warnings ?? "—"}
          </strong>
          <span className="text-sm text-slate-500">advertencias</span>
        </article>
        <article className="rounded-[8px] border border-slate-200 bg-white p-5">
          <CheckCircle2 className="text-emerald-600" size={22} />
          <strong className="mt-3 block text-2xl">Versionado</strong>
          <span className="text-sm text-slate-500">
            publicaciones inmutables
          </span>
        </article>
      </section>
      <div className="mt-6">
        {validation ? (
          <EditorialValidationPanel issues={validation.issues} />
        ) : (
          <div className="h-36 animate-pulse rounded-[8px] bg-slate-100" />
        )}
      </div>
    </div>
  );
}
