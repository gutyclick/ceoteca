import Link from "next/link";

import { taxonomyCategories } from "@/lib/training/taxonomy";

import { TrainingProgressBar } from "./TrainingPrimitives";

const progressSamples = [42, 31, 24, 18];

export function TrainingProgressOverview() {
  const skills = taxonomyCategories
    .flatMap((category) => category.skills)
    .slice(0, progressSamples.length);

  return (
    <section aria-labelledby="training-progress-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black" id="training-progress-title">
            Tu progreso
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Dominio estimado por habilidad a partir de tus prácticas.
          </p>
        </div>
        <Link className="text-sm font-bold text-violet-700" href="/perfil">
          Ver detalle
        </Link>
      </div>
      <div className="mt-3 grid gap-x-8 gap-y-5 rounded-[8px] border border-slate-200 bg-white p-5 md:grid-cols-2">
        {skills.map((skill, index) => (
          <div key={skill.slug}>
            <TrainingProgressBar
              label={skill.name}
              value={progressSamples[index] ?? 0}
            />
            <Link
              className="mt-2 inline-flex text-xs font-bold text-violet-700"
              href={`/ejercicios/habilidades/${skill.slug}`}
            >
              {skill.name}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
