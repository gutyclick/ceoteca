"use client";

import { ArrowRight, LockKeyhole, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { TaxonomyIcon } from "@/components/training/TaxonomyIcon";
import type {
  TrainingCategoryCardViewModel,
  TrainingModeSlug,
} from "@/lib/training/navigation-model";
import {
  getTrainingNavigationCategories,
  trackTrainingNavigationEvent,
} from "@/lib/training/api-client";

const modes: Array<{ slug: "all" | TrainingModeSlug; label: string }> = [
  { slug: "all", label: "Todas" },
  { slug: "analiza", label: "Analiza" },
  { slug: "construye", label: "Construye" },
  { slug: "practica", label: "Practica" },
];
const accessLabels = {
  available: "Disponible",
  partially_available: "Acceso parcial",
  locked: "Requiere otro plan",
  coming_soon: "Próximamente",
} as const;

export function TrainingCategoriesExplorer({
  categories,
  initialMode = "all",
  initialPlan = "all",
  initialProgress = "all",
}: {
  categories: TrainingCategoryCardViewModel[];
  initialMode?: "all" | TrainingModeSlug;
  initialPlan?: "all" | "free" | "pro" | "unlimited";
  initialProgress?: "all" | "not_started" | "in_progress" | "completed";
}) {
  const [resolvedCategories, setResolvedCategories] = useState(categories);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"all" | TrainingModeSlug>(initialMode);
  const [sort, setSort] = useState<"recommended" | "name">("recommended");
  const [plan, setPlan] = useState(initialPlan);
  const [progress, setProgress] = useState(initialProgress);
  const visibleCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    const result = resolvedCategories.filter((category) => {
      const searchable =
        `${category.name} ${category.shortDescription} ${category.highlightedSkills.join(" ")}`.toLocaleLowerCase(
          "es",
        );
      const matchesPlan = plan === "all" || category.minimumPlan === plan;
      const matchesProgress =
        progress === "all" ||
        (progress === "not_started" && category.progress === 0) ||
        (progress === "in_progress" &&
          category.progress > 0 &&
          category.progress < 100) ||
        (progress === "completed" && category.progress === 100);
      return (
        matchesPlan &&
        matchesProgress &&
        (mode === "all" || category.availableModes.includes(mode)) &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      );
    });
    return sort === "name"
      ? result.toSorted((a, b) => a.name.localeCompare(b.name, "es"))
      : result;
  }, [mode, plan, progress, query, resolvedCategories, sort]);
  useEffect(() => {
    let active = true;
    void trackTrainingNavigationEvent("training_categories_viewed").catch(
      () => undefined,
    );
    getTrainingNavigationCategories()
      .then((value) => {
        if (active) setResolvedCategories(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <section aria-labelledby="training-categories-title">
      <h2 className="sr-only" id="training-categories-title">
        Catálogo de categorías
      </h2>
      <div className="grid gap-3 border-b border-slate-200 pb-5 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-end">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Buscar una habilidad
            <span className="relative block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                className="min-h-11 w-full rounded-[8px] border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ejemplo: negociación o propuesta de valor"
                type="search"
                value={query}
              />
            </span>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Plan
            <select
              className="min-h-11 rounded-[8px] border border-slate-200 bg-white px-3 text-sm"
              onChange={(event) => setPlan(event.target.value as typeof plan)}
              value={plan}
            >
              <option value="all">Todos</option>
              <option value="free">Gratis</option>
              <option value="pro">Pro</option>
              <option value="unlimited">Ilimitado</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Progreso
            <select
              className="min-h-11 rounded-[8px] border border-slate-200 bg-white px-3 text-sm"
              onChange={(event) =>
                setProgress(event.target.value as typeof progress)
              }
              value={progress}
            >
              <option value="all">Todos</option>
              <option value="not_started">Sin iniciar</option>
              <option value="in_progress">En progreso</option>
              <option value="completed">Completado</option>
            </select>
          </label>
        </div>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Ordenar
          <select
            className="min-h-11 rounded-[8px] border border-slate-200 bg-white px-3 text-sm"
            onChange={(event) =>
              setSort(event.target.value as "recommended" | "name")
            }
            value={sort}
          >
            <option value="recommended">Recomendadas</option>
            <option value="name">Nombre</option>
          </select>
        </label>
      </div>
      <div
        aria-label="Filtrar por modo de entrenamiento"
        className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {modes.map((item) => (
          <button
            aria-pressed={mode === item.slug}
            className={`min-h-10 shrink-0 rounded-[8px] border px-4 text-sm font-bold ${mode === item.slug ? "border-violet-600 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"}`}
            key={item.slug}
            onClick={() => {
              setMode(item.slug);
              if (item.slug !== "all")
                void trackTrainingNavigationEvent("training_filters_changed", {
                  mode: item.slug,
                  filter_count: 1,
                  source: "categories",
                }).catch(() => undefined);
            }}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-5 text-sm text-slate-500">
        {visibleCategories.length}{" "}
        {visibleCategories.length === 1 ? "categoría" : "categorías"}
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleCategories.map((category) => (
          <article
            className="flex min-h-64 flex-col rounded-[8px] border border-slate-200 bg-white p-5"
            key={category.slug}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
                <TaxonomyIcon name={category.icon ?? "Megaphone"} />
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                {category.accessState === "locked" ? (
                  <LockKeyhole aria-hidden="true" size={13} />
                ) : null}
                {accessLabels[category.accessState]}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-black">{category.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {category.shortDescription}
            </p>
            {category.highlightedSkills.length ? (
              <p className="mt-3 text-xs leading-5 text-slate-500">
                {category.highlightedSkills.join(" · ")}
              </p>
            ) : null}
            <div className="mt-auto flex items-end justify-between gap-3 pt-5">
              <span className="text-xs font-bold text-slate-500">
                {category.skillCount}{" "}
                {category.skillCount === 1 ? "habilidad" : "habilidades"}
              </span>
              {category.accessState === "coming_soon" ? (
                <span className="inline-flex min-h-10 items-center text-sm font-bold text-slate-400">
                  Próximamente
                </span>
              ) : (
                <Link
                  aria-label={`Explorar ${category.name}`}
                  className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-violet-700 hover:text-violet-900"
                  href={`/ejercicios/categorias/${category.slug}`}
                  onClick={() =>
                    void trackTrainingNavigationEvent(
                      "training_category_card_clicked",
                      {
                        category: category.slug,
                        access_state: category.accessState,
                        source: "categories",
                      },
                    ).catch(() => undefined)
                  }
                >
                  Explorar <ArrowRight aria-hidden="true" size={15} />
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
      {!visibleCategories.length ? (
        <div className="mt-4 rounded-[8px] border border-dashed border-slate-300 p-8 text-center">
          <h3 className="font-black">No encontramos coincidencias</h3>
          <p className="mt-2 text-sm text-slate-500">
            Prueba otro término o vuelve a mostrar todos los modos.
          </p>
          <button
            className="mt-4 min-h-10 text-sm font-bold text-violet-700"
            onClick={() => {
              setQuery("");
              setMode("all");
              setPlan("all");
              setProgress("all");
            }}
            type="button"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : null}
    </section>
  );
}
