"use client";

import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  MessagesSquare,
  ScanSearch,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { TaxonomyIcon } from "@/components/training/TaxonomyIcon";
import { TrainingHeroCard } from "@/components/training/TrainingHeroCard";
import { TrainingPageShell } from "@/components/training/TrainingPageShell";
import { TrainingProgressBar } from "@/components/training/TrainingPrimitives";
import type {
  TrainingHomeViewModel,
  TrainingModeSlug,
} from "@/lib/training/navigation-model";
import {
  getTrainingNavigationHome,
  trackTrainingNavigationEvent,
} from "@/lib/training/api-client";

const modeIcons: Record<TrainingModeSlug, typeof ScanSearch> = {
  analiza: ScanSearch,
  construye: Blocks,
  practica: Target,
};
type TrainingViewFeatures = {
  taxonomy?: boolean;
  categories?: boolean;
  paths?: boolean;
  modes?: boolean;
  search?: boolean;
  roleplay?: boolean;
};

export function TrainingView({
  features = {},
  navigation,
}: {
  features?: TrainingViewFeatures;
  navigation: TrainingHomeViewModel;
}) {
  const [view, setView] = useState(navigation);
  useEffect(() => {
    let active = true;
    void trackTrainingNavigationEvent("training_home_viewed").catch(
      () => undefined,
    );
    getTrainingNavigationHome()
      .then((value) => {
        if (active) setView(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  const taxonomyEnabled = features.taxonomy ?? true;
  const categoriesEnabled = taxonomyEnabled && (features.categories ?? true);
  const pathsEnabled = taxonomyEnabled && (features.paths ?? true);
  const modesEnabled = taxonomyEnabled && (features.modes ?? true);
  return (
    <TrainingPageShell
      description="Entrena lo que aprendes y conviértelo en criterio."
      search={taxonomyEnabled && (features.search ?? true)}
      showPaths={pathsEnabled}
      showSimulations={features.roleplay ?? false}
      title="Training"
    >
      <div className="space-y-8">
        <TrainingHeroCard recommendation={view.recommendation} />
        {view.continueItems.length ? (
          <section aria-labelledby="continue-title">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black" id="continue-title">
                Continúa donde lo dejaste
              </h2>
              <Link
                className="text-sm font-bold text-violet-700"
                href="/perfil"
              >
                Ver actividad
              </Link>
            </div>
            <div className="mt-3 grid gap-4 xl:grid-cols-2">
              {view.continueItems.slice(0, 2).map((item) => (
                <article
                  className="rounded-[8px] border border-slate-200 bg-white p-5"
                  key={item.id}
                >
                  <h3 className="font-black">{item.title}</h3>
                  <div className="mt-4">
                    <TrainingProgressBar
                      label={item.title}
                      value={item.progress}
                    />
                  </div>
                  <Link
                    className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-violet-700"
                    href={item.href}
                  >
                    Continuar <ArrowRight aria-hidden="true" size={15} />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        {modesEnabled ? (
          <section aria-labelledby="modes-title">
            <h2 className="text-xl font-black" id="modes-title">
              ¿Cómo quieres entrenar?
            </h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {view.modes.map((mode) => {
                const Icon = modeIcons[mode.slug];
                return (
                  <Link
                    className="flex min-h-32 items-start gap-4 rounded-[8px] border border-slate-200 bg-white p-5 hover:border-violet-300"
                    href={`/ejercicios/categorias?mode=${mode.slug}`}
                    key={mode.slug}
                    onClick={() =>
                      void trackTrainingNavigationEvent(
                        "training_mode_selected",
                        { mode: mode.slug, source: "training_home" },
                      ).catch(() => undefined)
                    }
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
                      <Icon aria-hidden="true" size={22} />
                    </span>
                    <span>
                      <strong className="block text-base font-black">
                        {mode.name}
                      </strong>
                      <span className="mt-1 block text-sm leading-6 text-slate-500">
                        {mode.description}
                      </span>
                      <span className="mt-2 block text-xs font-bold text-violet-700">
                        {mode.skillCount} habilidades
                        {mode.exerciseCount !== null
                          ? ` · ${mode.exerciseCount} ejercicios`
                          : ""}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
        {categoriesEnabled ? (
          <section aria-labelledby="categories-title">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black" id="categories-title">
                Explora por categoría
              </h2>
              <Link
                className="inline-flex items-center gap-1 text-sm font-bold text-violet-700"
                href="/ejercicios/categorias"
              >
                Ver todas <ArrowRight aria-hidden="true" size={15} />
              </Link>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {view.categories.map((category) => (
                <article
                  className="flex min-h-44 flex-col rounded-[8px] border border-slate-200 bg-white p-4"
                  key={category.slug}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
                    <TaxonomyIcon
                      name={category.icon ?? "Megaphone"}
                      size={20}
                    />
                  </span>
                  <h3 className="mt-4 text-sm font-black">{category.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {category.shortDescription}
                  </p>
                  <span className="pt-4 text-xs font-bold text-slate-500">
                    {category.skillCount} habilidades
                    {category.exerciseCount !== null
                      ? ` · ${category.exerciseCount} ejercicios`
                      : ""}
                  </span>
                  {category.accessState === "coming_soon" ? (
                    <span className="mt-auto pt-3 text-xs font-bold text-slate-400">
                      Próximamente
                    </span>
                  ) : (
                    <Link
                      aria-label={`Explorar ${category.name}`}
                      className="mt-auto inline-flex min-h-10 items-center pt-3 text-xs font-bold text-violet-700 hover:text-violet-900"
                      href={`/ejercicios/categorias/${category.slug}`}
                      onClick={() =>
                        void trackTrainingNavigationEvent(
                          "training_category_card_clicked",
                          {
                            category: category.slug,
                            access_state: category.accessState,
                            source: "training_home",
                          },
                        ).catch(() => undefined)
                      }
                    >
                      Explorar categoría
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </section>
        ) : null}
        {pathsEnabled && view.pathPreviews.length ? (
          <section aria-labelledby="paths-title">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black" id="paths-title">
                  Rutas recomendadas
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Una vista previa de recorridos con una meta concreta.
                </p>
              </div>
              <Link
                className="text-sm font-bold text-violet-700"
                href="/ejercicios/rutas"
              >
                Ver rutas
              </Link>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {view.pathPreviews.slice(0, 3).map((path) => (
                <article
                  className="rounded-[8px] border border-slate-200 bg-white p-4"
                  key={path.slug}
                >
                  <span className="text-xs font-bold text-violet-700">
                    {path.moduleCount} módulos
                  </span>
                  <h3 className="mt-2 font-black">{path.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {path.promise}
                  </p>
                  <span className="mt-4 block text-xs font-semibold text-slate-500">
                    Plan mínimo: {path.minimumPlan}
                  </span>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        <section aria-labelledby="progress-title">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black" id="progress-title">
              Tu progreso
            </h2>
            <Link className="text-sm font-bold text-violet-700" href="/perfil">
              Ver progreso
            </Link>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              ["Habilidades practicadas", view.progressSummary.skillsPracticed],
              [
                "Ejercicios completados",
                view.progressSummary.exercisesCompleted,
              ],
              ["Repasos pendientes", view.progressSummary.reviewsPending],
            ].map(([label, value]) => (
              <article
                className="rounded-[8px] border border-slate-200 bg-white p-5"
                key={String(label)}
              >
                <strong className="text-2xl font-black text-violet-700">
                  {value}
                </strong>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </article>
            ))}
          </div>
        </section>
        <section
          aria-labelledby="reviews-title"
          className="flex flex-wrap items-center justify-between gap-4 rounded-[8px] border border-slate-200 bg-white p-5"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-emerald-50 text-emerald-700">
              <CheckCircle2 aria-hidden="true" size={21} />
            </span>
            <div>
              <h2 className="font-black" id="reviews-title">
                Repasos
              </h2>
              <p className="text-sm text-slate-500">
                {view.reviews.pending
                  ? `${view.reviews.pending} pendientes`
                  : view.reviews.label}
              </p>
            </div>
          </div>
          {view.reviews.pending ? (
            <Link
              className="text-sm font-bold text-violet-700"
              href="/ejercicios?vista=repasos"
            >
              Repasar ahora
            </Link>
          ) : null}
        </section>
        {features.roleplay ? (
          <section
            aria-labelledby="roleplay-title"
            className="grid gap-4 rounded-[8px] border border-violet-200 bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
                <MessagesSquare aria-hidden="true" size={23} />
              </span>
              <div>
                <h2 className="text-xl font-black" id="roleplay-title">
                  Simulaciones conversacionales
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Practica ventas, liderazgo y negociación con personajes
                  simulados.
                </p>
              </div>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-violet-300 px-5 text-sm font-bold text-violet-700"
              href="/ejercicios/simulaciones"
            >
              Explorar simulaciones
            </Link>
          </section>
        ) : null}
      </div>
    </TrainingPageShell>
  );
}
