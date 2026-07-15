"use client";

import { ArrowRight, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  getTrainingNavigationCategory,
  trackTrainingNavigationEvent,
} from "@/lib/training/api-client";
import { TaxonomyIcon } from "@/components/training/TaxonomyIcon";
import { TrainingProgressBar } from "@/components/training/TrainingPrimitives";
import type { TrainingCategoryPageViewModel } from "@/lib/training/navigation-model";
import type {
  TrainingDifficulty,
  TrainingPlan,
} from "@/lib/training/taxonomy-model";

const difficultyLabels: Record<TrainingDifficulty, string> = {
  fundamentals: "Fundamentos",
  application: "Aplicación",
  advanced: "Avanzado",
  expert: "Experto",
};
const planLabels: Record<TrainingPlan, string> = {
  free: "Gratis",
  pro: "Pro",
  unlimited: "Ilimitado",
};

export function CategorySkillBrowser({
  data,
}: {
  data: TrainingCategoryPageViewModel;
}) {
  const [resolvedData, setResolvedData] = useState(data);
  const [subcategory, setSubcategory] = useState("all");
  const [difficulty, setDifficulty] = useState<"all" | TrainingDifficulty>(
    "all",
  );
  const [plan, setPlan] = useState<"all" | TrainingPlan>("all");
  const subcategoryById = useMemo(
    () =>
      new Map(resolvedData.subcategories.map((item) => [item.id, item.name])),
    [resolvedData.subcategories],
  );
  const visibleSkills = useMemo(
    () =>
      resolvedData.trainingItems.filter(
        (item) =>
          (subcategory === "all" || item.subcategoryId === subcategory) &&
          (difficulty === "all" || item.difficulty === difficulty) &&
          (plan === "all" || item.minimumPlan === plan),
      ),
    [resolvedData.trainingItems, difficulty, plan, subcategory],
  );
  useEffect(() => {
    let active = true;
    void trackTrainingNavigationEvent("training_category_viewed", {
      category: data.category.slug,
      access_state: data.category.accessState,
      source: "category_page",
    }).catch(() => undefined);
    getTrainingNavigationCategory(data.category.slug)
      .then((value) => {
        if (active) setResolvedData(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [data.category.accessState, data.category.slug]);

  return (
    <section aria-labelledby="skills-title" className="space-y-7">
      <nav aria-label="Migas de pan" className="text-sm text-slate-500">
        <Link className="font-bold hover:text-violet-700" href="/ejercicios">
          Training
        </Link>{" "}
        / <span aria-current="page">{resolvedData.category.name}</span>
      </nav>
      <section className="grid gap-6 rounded-[8px] border border-slate-200 bg-white p-5 sm:p-6 md:grid-cols-[auto_minmax(0,1fr)_220px] md:items-center">
        <span className="grid h-16 w-16 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
          <TaxonomyIcon
            name={resolvedData.category.icon ?? "Megaphone"}
            size={30}
          />
        </span>
        <div>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            {resolvedData.category.description}
          </p>
          <p className="mt-3 text-sm font-bold text-slate-700">
            {resolvedData.subcategories.length} subcategorías ·{" "}
            {resolvedData.category.skillCount} habilidades publicadas
          </p>
          {resolvedData.recommendedSkills.length ? (
            <p className="mt-2 text-xs text-slate-500">
              Para empezar: {resolvedData.recommendedSkills.join(" · ")}
            </p>
          ) : null}
        </div>
        <div>
          <div className="flex justify-between text-sm font-bold">
            <span>Tu progreso</span>
            <span>{resolvedData.progress}%</span>
          </div>
          <div className="mt-2">
            <TrainingProgressBar
              label={resolvedData.category.name}
              value={resolvedData.progress}
            />
          </div>
        </div>
      </section>
      <div>
        <div className="grid gap-3 rounded-[8px] border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Subcategoría
            <select
              className="min-h-11 rounded-[8px] border border-slate-200 bg-white px-3 text-sm"
              onChange={(event) => {
                const value = event.target.value;
                setSubcategory(value);
                if (value !== "all") {
                  void trackTrainingNavigationEvent(
                    "training_subcategory_selected",
                    {
                      category: resolvedData.category.slug,
                      subcategory: value,
                      filter_count: 1,
                      source: "category_page",
                    },
                  ).catch(() => undefined);
                }
              }}
              value={subcategory}
            >
              <option value="all">Todas</option>
              {resolvedData.subcategories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Dificultad
            <select
              className="min-h-11 rounded-[8px] border border-slate-200 bg-white px-3 text-sm"
              onChange={(event) => {
                const value = event.target.value as "all" | TrainingDifficulty;
                setDifficulty(value);
                void trackTrainingNavigationEvent("training_filters_changed", {
                  category: resolvedData.category.slug,
                  filter_count: value === "all" ? 0 : 1,
                  source: "category_difficulty",
                }).catch(() => undefined);
              }}
              value={difficulty}
            >
              <option value="all">Todas</option>
              {Object.entries(difficultyLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Plan
            <select
              className="min-h-11 rounded-[8px] border border-slate-200 bg-white px-3 text-sm"
              onChange={(event) => {
                const value = event.target.value as "all" | TrainingPlan;
                setPlan(value);
                void trackTrainingNavigationEvent("training_filters_changed", {
                  category: resolvedData.category.slug,
                  plan: value === "all" ? undefined : value,
                  filter_count: value === "all" ? 0 : 1,
                  source: "category_plan",
                }).catch(() => undefined);
              }}
              value={plan}
            >
              <option value="all">Todos</option>
              {Object.entries(planLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-6 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black" id="skills-title">
              Habilidades
            </h2>
            <p aria-live="polite" className="mt-1 text-sm text-slate-500">
              {visibleSkills.length} resultados
            </p>
          </div>
          {subcategory !== "all" || difficulty !== "all" || plan !== "all" ? (
            <button
              className="min-h-10 text-sm font-bold text-violet-700"
              onClick={() => {
                setSubcategory("all");
                setDifficulty("all");
                setPlan("all");
              }}
              type="button"
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {visibleSkills.map((item) => (
            <article
              className="flex min-h-60 flex-col rounded-[8px] border border-slate-200 bg-white p-5"
              key={item.slug}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-bold text-violet-700">
                  {item.subcategoryId
                    ? (subcategoryById.get(item.subcategoryId) ?? "Habilidad")
                    : "Habilidad"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  {item.accessState === "locked" ? (
                    <LockKeyhole aria-hidden="true" size={13} />
                  ) : null}
                  {difficultyLabels[item.difficulty]} ·{" "}
                  {planLabels[item.minimumPlan]}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-black">{item.name}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {item.description}
              </p>
              {item.concepts.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.concepts.slice(0, 4).map((concept) => (
                    <span
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                      key={concept}
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              ) : null}
              <Link
                className="mt-auto inline-flex min-h-10 items-center gap-2 pt-5 text-sm font-bold text-violet-700"
                href={`/ejercicios/habilidades/${item.slug}`}
              >
                Explorar habilidad <ArrowRight aria-hidden="true" size={15} />
              </Link>
            </article>
          ))}
        </div>
        {!visibleSkills.length ? (
          <p className="mt-3 rounded-[8px] border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No hay habilidades publicadas que coincidan con estos filtros.
          </p>
        ) : null}
        {resolvedData.pathPreviews.length ? (
          <section className="mt-8 border-t border-slate-200 pt-6" aria-labelledby="category-paths-title">
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black" id="category-paths-title">Rutas relacionadas</h2><p className="mt-1 text-sm text-slate-500">Avanza por módulos conectados con esta categoría.</p></div><Link className="text-sm font-bold text-violet-700" href="/ejercicios/rutas">Ver todas</Link></div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">{resolvedData.pathPreviews.map((path) => <Link className="rounded-[8px] border border-slate-200 bg-white p-4 hover:border-violet-300" href={`/ejercicios/rutas/${path.slug}`} key={path.slug}><span className="text-xs font-bold text-violet-700">{path.moduleCount} módulos · {path.estimatedMinutes} min</span><h3 className="mt-2 font-black">{path.name}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{path.promise}</p></Link>)}</div>
          </section>
        ) : null}
      </div>
    </section>
  );
}
