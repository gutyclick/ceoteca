import Link from "next/link";
import { Lock, Route } from "lucide-react";
import { notFound } from "next/navigation";

import { TrainingPageShell } from "@/components/training/TrainingPageShell";
import { learningPaths } from "@/lib/training/taxonomy";
import { serverEnv } from "@/lib/env";

export default function TrainingPathsPage() {
  if (
    !serverEnv.TRAINING_TAXONOMY_ENABLED ||
    !serverEnv.TRAINING_LEARNING_PATHS_ENABLED
  )
    notFound();
  return (
    <TrainingPageShell
      description="Programas breves para lograr un resultado concreto."
      title="Rutas prácticas"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {learningPaths.map((path) => (
          <Link
            className="flex min-h-60 flex-col rounded-[8px] border border-slate-200 bg-white p-5 hover:border-violet-300"
            href={`/ejercicios/rutas/${path.slug}`}
            key={path.slug}
          >
            <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
              <Route size={22} />
            </span>
            <span className="mt-4 text-xs font-bold text-violet-700">
              {path.minutes} min · {path.difficulty}
            </span>
            <h2 className="mt-2 text-lg font-black">{path.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {path.promise}
            </p>
            <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-bold text-slate-600">
              {path.minimumPlan === "free" ? (
                "Disponible"
              ) : (
                <>
                  <Lock size={13} /> Desde Pro
                </>
              )}
            </span>
          </Link>
        ))}
      </div>
    </TrainingPageShell>
  );
}
