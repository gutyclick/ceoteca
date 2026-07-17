"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  ChartNoAxesCombined,
  Crown,
  Handshake,
  Headphones,
  History,
  Loader2,
  LockKeyhole,
  MessagesSquare,
  Rocket,
  SlidersHorizontal,
} from "lucide-react";

import { DashboardAccountMenu } from "@/components/app/DashboardAccountMenu";
import { DashboardSidebar } from "@/components/app/DashboardSidebar";
import { NotificationBell } from "@/components/app/NotificationBell";
import {
  getRoleplayCatalog,
  type RoleplayCatalogDto,
  type RoleplayDifficulty,
} from "@/lib/training/api-client";

const icons = {
  "badge-dollar-sign": BadgeDollarSign,
  crown: Crown,
  handshake: Handshake,
  headphones: Headphones,
  "messages-square": MessagesSquare,
  rocket: Rocket,
  "chart-no-axes-combined": ChartNoAxesCombined,
};
const difficultyLabels: Record<RoleplayDifficulty, string> = {
  fundamentals: "Fundamentos",
  application: "Aplicación",
  advanced: "Avanzado",
  expert: "Experto",
};

export function RoleplayCatalogView({
  initialCategory,
}: {
  initialCategory?: string;
}) {
  const [catalog, setCatalog] = useState<RoleplayCatalogDto | null>(null);
  const [category, setCategory] = useState(initialCategory ?? "all");
  const [difficulty, setDifficulty] = useState<"all" | RoleplayDifficulty>(
    "all",
  );
  const [error, setError] = useState("");
  useEffect(() => {
    void getRoleplayCatalog()
      .then(setCatalog)
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "No pudimos cargar las simulaciones.",
        ),
      );
  }, []);
  const scenarios = useMemo(
    () =>
      catalog?.scenarios.filter(
        (scenario) =>
          (category === "all" || scenario.category?.slug === category) &&
          (difficulty === "all" || scenario.level === difficulty),
      ) ?? [],
    [catalog, category, difficulty],
  );

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-slate-950 [padding-left:var(--dashboard-sidebar-offset,292px)] max-sm:!pl-0">
      <DashboardSidebar active="training" tone="light" />
      <div className="mx-auto max-w-[1560px] px-4 pb-14 pt-5 sm:px-6 lg:px-8">
        <header className="flex min-h-16 items-start justify-between gap-4 border-b border-slate-200 pb-5 pl-14 sm:pl-0">
          <div>
            <p className="text-sm font-bold text-violet-700">
              CEOTECA Training
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.03em]">
              Simulaciones
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Practica conversaciones profesionales en escenarios guiados.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="hidden min-h-10 items-center gap-2 rounded-[8px] border border-slate-200 px-3 text-sm font-bold sm:inline-flex"
              href="/ejercicios/simulaciones/historial"
            >
              <History size={17} /> Historial
            </Link>
            <NotificationBell tone="light" />
            <DashboardAccountMenu />
          </div>
        </header>

        {!catalog && !error ? (
          <div className="grid min-h-[50vh] place-items-center">
            <Loader2 className="animate-spin text-violet-600" />
            <span className="sr-only">Cargando simulaciones</span>
          </div>
        ) : null}
        {error ? (
          <div className="mt-8 rounded-[8px] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {catalog ? (
          <>
            {!catalog.enabled ? (
              <div className="mt-6 rounded-[8px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Las simulaciones no están disponibles en este entorno.
              </div>
            ) : null}
            <section
              className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
              aria-label="Resumen de acceso"
            >
              <div className="rounded-[8px] border border-slate-200 bg-white p-4">
                <span className="text-xs font-bold uppercase text-slate-400">
                  Tu plan
                </span>
                <p className="mt-1 text-xl font-black capitalize">
                  {catalog.access.plan}
                </p>
              </div>
              <div className="rounded-[8px] border border-slate-200 bg-white p-4">
                <span className="text-xs font-bold uppercase text-slate-400">
                  Disponibles
                </span>
                <p className="mt-1 text-xl font-black">
                  {catalog.access.unlimited
                    ? "Acceso completo"
                    : `${catalog.access.remaining ?? 0} este mes`}
                </p>
              </div>
              <div className="rounded-[8px] border border-slate-200 bg-white p-4 sm:col-span-2">
                <span className="text-xs font-bold uppercase text-slate-400">
                  Cómo funciona
                </span>
                <p className="mt-1 text-sm text-slate-600">
                  Elige un escenario, conversa con el personaje y recibe una
                  evaluación basada en evidencia.
                </p>
              </div>
            </section>

            <section className="mt-8" aria-labelledby="category-title">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black" id="category-title">
                  Explora por categoría
                </h2>
                <SlidersHorizontal className="text-slate-400" size={18} />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {catalog.categories.map((item) => {
                  const Icon =
                    icons[item.icon as keyof typeof icons] ?? MessagesSquare;
                  const active = category === item.slug;
                  return (
                    <button
                      className={`min-h-28 rounded-[8px] border p-4 text-left transition ${active ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-white hover:border-violet-300"}`}
                      key={item.id}
                      onClick={() => setCategory(active ? "all" : item.slug)}
                      type="button"
                    >
                      <Icon className="text-violet-600" size={22} />
                      <strong className="mt-3 block">{item.name}</strong>
                      <span className="text-xs text-slate-500">
                        {item.scenarioCount} escenarios
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-8" aria-labelledby="scenario-title">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black" id="scenario-title">
                    Escenarios disponibles
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Cada práctica tiene un objetivo, un personaje y una rúbrica
                    específica.
                  </p>
                </div>
                <label className="text-sm font-bold">
                  Dificultad{" "}
                  <select
                    className="ml-2 min-h-10 rounded-[8px] border border-slate-200 bg-white px-3 font-medium"
                    onChange={(event) =>
                      setDifficulty(
                        event.target.value as "all" | RoleplayDifficulty,
                      )
                    }
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
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {scenarios.map((scenario) => (
                  <article
                    className="flex min-h-64 flex-col rounded-[8px] border border-slate-200 bg-white p-5"
                    key={scenario.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                        {scenario.category?.name}
                      </span>
                      {!scenario.canStart ? (
                        <LockKeyhole className="text-slate-400" size={18} />
                      ) : null}
                    </div>
                    <h3 className="mt-5 text-xl font-black">
                      {scenario.public_title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                      {scenario.short_description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{difficultyLabels[scenario.level]}</span>
                      <span>•</span>
                      <span>{scenario.max_turns} turnos máx.</span>
                    </div>
                    <Link
                      className={`mt-auto flex min-h-11 items-center justify-center rounded-[8px] px-4 text-sm font-bold ${scenario.canStart ? "bg-violet-600 text-white hover:bg-violet-700" : "border border-slate-200 text-slate-600 hover:border-violet-300"}`}
                      href={`/ejercicios/simulaciones/escenarios/${scenario.slug}`}
                    >
                      {scenario.canStart
                        ? "Ver preparación"
                        : scenario.lockedReason === "quota"
                          ? "Ver alternativas"
                          : "Ver escenario"}
                    </Link>
                  </article>
                ))}
              </div>
              {scenarios.length === 0 ? (
                <div className="mt-4 rounded-[8px] border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                  No hay escenarios con estos filtros.
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
