import { Check, Clock3, Lock, Route } from "lucide-react";
import { notFound } from "next/navigation";

import { StartPathButton } from "@/components/training/StartPathButton";
import { TrainingPageShell } from "@/components/training/TrainingPageShell";
import { serverEnv } from "@/lib/env";
import { findLearningPath, learningPaths } from "@/lib/training/taxonomy";

export function generateStaticParams() {
  return learningPaths.map((path) => ({ pathSlug: path.slug }));
}

export default async function LearningPathPage({
  params,
}: {
  params: Promise<{ pathSlug: string }>;
}) {
  if (
    !serverEnv.TRAINING_TAXONOMY_ENABLED ||
    !serverEnv.TRAINING_LEARNING_PATHS_ENABLED
  )
    notFound();

  const { pathSlug } = await params;
  const path = findLearningPath(pathSlug);
  if (!path) notFound();

  return (
    <TrainingPageShell description={path.promise} title={path.name}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <section className="rounded-[8px] border border-slate-200 bg-white p-6">
            <span className="grid h-12 w-12 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
              <Route size={24} />
            </span>
            <h2 className="mt-5 text-xl font-black">Resultado esperado</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              {path.promise} Al terminar tendrás una herramienta concreta y un
              criterio para volver a aplicarla.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold text-slate-600">
              <span className="inline-flex items-center gap-2">
                <Clock3 size={16} /> {path.minutes} minutos
              </span>
              <span>{path.difficulty}</span>
              <span>
                {path.minimumPlan === "free" ? "Todos los planes" : "Desde Pro"}
              </span>
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-black">Módulos</h2>
            <ol className="mt-3 space-y-3">
              {path.modules.map((module, index) => {
                const available = index === 0;
                return (
                  <li
                    className="grid gap-4 rounded-[8px] border border-slate-200 bg-white p-5 sm:grid-cols-[44px_1fr_auto] sm:items-center"
                    key={module}
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-violet-50 font-black text-violet-700">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-black">{module}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Práctica progresiva ·{" "}
                        {Math.round(path.minutes / path.modules.length)} min
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
                      {available ? (
                        <>
                          <Check className="text-emerald-600" size={16} />
                          Disponible
                        </>
                      ) : (
                        <>
                          <Lock size={15} /> Requiere el módulo anterior
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <aside className="h-fit rounded-[8px] border border-violet-200 bg-white p-5 xl:sticky xl:top-5">
          <h2 className="text-lg font-black">Tu avance</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            La ruta guarda cada módulo y se puede reanudar después.
          </p>
          <div className="mt-5">
            <StartPathButton pathSlug={path.slug} />
          </div>
        </aside>
      </div>
    </TrainingPageShell>
  );
}
