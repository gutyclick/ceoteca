import { AlertTriangle, CheckCircle2, Network, Route } from "lucide-react";

import { learningPaths, taxonomyCategories } from "@/lib/training/taxonomy";
import { validateTaxonomy } from "@/lib/training/taxonomy-validation";

export function AdminTaxonomyDashboard() {
  const issues = validateTaxonomy(taxonomyCategories, learningPaths);
  const errors = issues.filter((item) => item.severity === "error");
  const warnings = issues.filter((item) => item.severity === "warning");
  return (
    <div>
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-black tracking-[-0.04em]">
          Taxonomía y rutas
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Revisa la estructura pedagógica antes de publicar contenido.
        </p>
      </header>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <article className="rounded-[8px] border border-slate-200 bg-white p-5">
          <Network className="text-violet-700" size={22} />
          <strong className="mt-3 block text-2xl">
            {taxonomyCategories.length}
          </strong>
          <span className="text-sm text-slate-500">categorías</span>
        </article>
        <article className="rounded-[8px] border border-slate-200 bg-white p-5">
          <Route className="text-violet-700" size={22} />
          <strong className="mt-3 block text-2xl">
            {learningPaths.length}
          </strong>
          <span className="text-sm text-slate-500">rutas</span>
        </article>
        <article className="rounded-[8px] border border-slate-200 bg-white p-5">
          {errors.length ? (
            <AlertTriangle className="text-rose-600" size={22} />
          ) : (
            <CheckCircle2 className="text-emerald-600" size={22} />
          )}
          <strong className="mt-3 block text-2xl">{errors.length}</strong>
          <span className="text-sm text-slate-500">errores bloqueantes</span>
        </article>
      </div>
      <section className="mt-6 rounded-[8px] border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Estado editorial</h2>
          <span className="text-sm font-bold text-amber-700">
            {warnings.length} advertencias
          </span>
        </div>
        <div className="mt-4 divide-y divide-slate-200">
          {taxonomyCategories.map((category) => (
            <div
              className="grid gap-2 py-4 sm:grid-cols-[1fr_120px_120px] sm:items-center"
              key={category.slug}
            >
              <div>
                <h3 className="font-black">{category.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {category.subcategories.length} subcategorías
                </p>
              </div>
              <span className="text-sm font-bold">
                {category.skills.length} habilidades
              </span>
              <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                Publicado
              </span>
            </div>
          ))}
        </div>
      </section>
      {warnings.length ? (
        <section className="mt-6 rounded-[8px] border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-black text-amber-950">
            Advertencias editoriales
          </h2>
          <ul className="mt-3 grid gap-2 text-sm text-amber-900">
            {warnings.slice(0, 12).map((issue) => (
              <li key={`${issue.code}-${issue.entity}`}>
                <strong>{issue.entity}:</strong> {issue.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
