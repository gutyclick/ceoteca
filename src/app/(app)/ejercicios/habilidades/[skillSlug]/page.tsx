import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TrainingPageShell } from "@/components/training/TrainingPageShell";
import { TrainingProgressBar } from "@/components/training/TrainingPrimitives";
import { serverEnv } from "@/lib/env";
import {
  cognitiveLevelLabels,
  findSkill,
  taxonomyCategories,
} from "@/lib/training/taxonomy";

export function generateStaticParams() {
  return taxonomyCategories.flatMap((category) =>
    category.skills.map((item) => ({ skillSlug: item.slug })),
  );
}

export default async function TrainingSkillPage({
  params,
}: {
  params: Promise<{ skillSlug: string }>;
}) {
  if (!serverEnv.TRAINING_TAXONOMY_ENABLED) notFound();
  const { skillSlug } = await params;
  const result = findSkill(skillSlug);
  if (!result) notFound();
  return (
    <TrainingPageShell
      description={`${result.category.name} · ${result.subcategory}`}
      title={result.name}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-[8px] border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-black">Por qué importa</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              {result.description} Practicarla por niveles evita confundir
              reconocimiento con dominio real.
            </p>
            <div className="mt-6 flex justify-between text-sm font-bold">
              <span>Dominio actual</span>
              <span>18%</span>
            </div>
            <div className="mt-2">
              <TrainingProgressBar label={result.name} value={18} />
            </div>
          </section>
          <section>
            <h2 className="text-xl font-black">Conceptos</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {result.concepts.map((concept) => (
                <article
                  className="rounded-[8px] border border-slate-200 bg-white p-4"
                  key={concept}
                >
                  <CheckCircle2 className="text-violet-600" size={20} />
                  <h3 className="mt-3 font-black">{concept}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Comprende, aplica y analiza este concepto en contextos
                    distintos.
                  </p>
                </article>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-xl font-black">Progreso por nivel</h2>
            <div className="mt-3 rounded-[8px] border border-slate-200 bg-white p-5">
              <div className="grid gap-5 md:grid-cols-2">
                {Object.entries(cognitiveLevelLabels).map(
                  ([level, label], index) => (
                    <div key={level}>
                      <div className="flex justify-between text-sm font-bold">
                        <span>{label}</span>
                        <span>{Math.max(0, 42 - index * 8)}%</span>
                      </div>
                      <div className="mt-2">
                        <TrainingProgressBar
                          label={label}
                          value={Math.max(0, 42 - index * 8)}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </section>
        </div>
        <aside className="h-fit rounded-[8px] border border-violet-200 bg-white p-5 xl:sticky xl:top-5">
          <span className="text-xs font-bold text-violet-700">
            Próximo entrenamiento
          </span>
          <h2 className="mt-2 text-lg font-black">
            Practica {result.name.toLowerCase()}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sesión adaptativa de 7 minutos con casos, aplicación y feedback.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-violet-600 px-4 text-sm font-bold text-white"
            href={`/ejercicios?habilidad=${result.slug}`}
          >
            Entrenar esta habilidad <ArrowRight size={16} />
          </Link>
        </aside>
      </div>
    </TrainingPageShell>
  );
}
