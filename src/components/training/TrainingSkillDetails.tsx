"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StartSkillTrainingButton } from "@/components/training/StartSkillTrainingButton";
import { TrainingProgressBar } from "@/components/training/TrainingPrimitives";
import {
  getTrainingNavigationSkill,
  trackTrainingNavigationEvent,
} from "@/lib/training/api-client";
import type { TrainingSkillPageViewModel } from "@/lib/training/navigation-model";

const difficultyLabels = {
  fundamentals: "Fundamentos",
  application: "Aplicación",
  advanced: "Avanzado",
  expert: "Experto",
} as const;

export function TrainingSkillDetails({
  initialData,
}: {
  initialData: TrainingSkillPageViewModel;
}) {
  const [data, setData] = useState(initialData);
  useEffect(() => {
    let active = true;
    void trackTrainingNavigationEvent("training_skill_viewed", {
      category: initialData.category.slug,
      skill: initialData.skill.slug,
      access_state: initialData.accessState,
      source: "skill_page",
    }).catch(() => undefined);
    getTrainingNavigationSkill(initialData.skill.slug)
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [
    initialData.accessState,
    initialData.category.slug,
    initialData.skill.slug,
  ]);

  return (
    <div className="space-y-5">
      <nav aria-label="Migas de pan" className="text-sm text-slate-500">
        <Link className="font-bold hover:text-violet-700" href="/ejercicios">
          Training
        </Link>{" "}
        /{" "}
        <Link
          className="font-bold hover:text-violet-700"
          href={`/ejercicios/categorias/${data.category.slug}`}
        >
          {data.category.name}
        </Link>{" "}
        / <span aria-current="page">{data.skill.name}</span>
      </nav>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-[8px] border border-slate-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-700">
              De {difficultyLabels[data.skill.difficultyStart]} a{" "}
              {difficultyLabels[data.skill.difficultyMax]}
            </p>
            <h2 className="mt-3 text-xl font-black">Por qué importa</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              {data.skill.description}
            </p>
            <div className="mt-6 flex justify-between text-sm font-bold">
              <span>Dominio actual</span>
              <span>{data.progress}%</span>
            </div>
            <div className="mt-2">
              <TrainingProgressBar
                label={data.skill.name}
                value={data.progress}
              />
            </div>
          </section>
          <section>
            <h2 className="text-xl font-black">Conceptos que vas a entrenar</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.concepts.map((concept) => (
                <article
                  className="rounded-[8px] border border-slate-200 bg-white p-4"
                  key={concept.id}
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="text-violet-600"
                    size={20}
                  />
                  <h3 className="mt-3 font-black">{concept.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {concept.description}
                  </p>
                </article>
              ))}
            </div>
            {!data.concepts.length ? (
              <p className="mt-3 rounded-[8px] border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                Esta habilidad aún no tiene conceptos editoriales publicados.
              </p>
            ) : null}
          </section>
          <section>
            <h2 className="text-xl font-black">Progreso por nivel cognitivo</h2>
            <div className="mt-3 grid gap-5 rounded-[8px] border border-slate-200 bg-white p-5 md:grid-cols-2">
              {data.cognitiveProgress.map((item) => (
                <div key={item.level}>
                  <div className="flex justify-between text-sm font-bold">
                    <span>{item.label}</span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="mt-2">
                    <TrainingProgressBar
                      label={item.label}
                      value={item.progress}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
          {data.relatedPaths.length ? <section><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">Rutas para seguir avanzando</h2><Link className="text-sm font-bold text-violet-700" href="/ejercicios/rutas">Ver rutas</Link></div><div className="mt-3 grid gap-3 sm:grid-cols-2">{data.relatedPaths.map((path) => <Link className="rounded-[8px] border border-slate-200 bg-white p-4 hover:border-violet-300" href={`/ejercicios/rutas/${path.slug}`} key={path.slug}><h3 className="font-black">{path.name}</h3><span className="mt-2 inline-flex items-center text-sm font-bold text-violet-700">Explorar ruta</span></Link>)}</div></section> : null}
        </div>
        <aside className="h-fit rounded-[8px] border border-violet-200 bg-white p-5 xl:sticky xl:top-5">
          <span className="text-xs font-bold text-violet-700">
            Próximo entrenamiento
          </span>
          <h2 className="mt-2 text-lg font-black">
            Practica {data.skill.name.toLocaleLowerCase("es")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sesión adaptativa de 7 minutos con contenido publicado para esta
            habilidad.
          </p>
          {data.formats.length ? (
            <div className="mt-4" aria-label="Formatos disponibles">
              <p className="text-xs font-bold text-slate-700">
                Formatos disponibles
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.formats.map((format) => (
                  <span
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                    key={format.slug}
                  >
                    {format.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {data.review.pending ? (
            <p className="mt-4 rounded-[8px] bg-amber-50 p-3 text-xs font-semibold text-amber-800">
              Tienes un repaso pendiente de esta habilidad.
            </p>
          ) : null}
          <div className="mt-5">
            <StartSkillTrainingButton
              accessState={data.accessState}
              skillSlug={data.skill.slug}
            />
          </div>
          <Link
            className="mt-4 inline-flex min-h-10 items-center text-sm font-bold text-slate-600"
            href={`/ejercicios/categorias/${data.category.slug}`}
          >
            Volver a {data.category.name}
          </Link>
        </aside>
      </div>
    </div>
  );
}
