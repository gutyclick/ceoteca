"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  cognitiveLevelLabels,
  trainingFormats,
  type TaxonomyCategory,
  type TrainingCognitiveLevel,
  type TrainingFormat,
} from "@/lib/training/taxonomy";

export function CategorySkillBrowser({
  category,
}: {
  category: TaxonomyCategory;
}) {
  const [subcategory, setSubcategory] = useState("all");
  const [level, setLevel] = useState<TrainingCognitiveLevel>("application");
  const [format, setFormat] = useState<TrainingFormat>("case-analysis");
  const visibleSkills = useMemo(
    () =>
      subcategory === "all"
        ? category.skills
        : category.skills.filter((item) => item.subcategory === subcategory),
    [category.skills, subcategory],
  );

  return (
    <section aria-labelledby="skills-title">
      <div className="flex flex-wrap items-end gap-3 rounded-[8px] border border-slate-200 bg-white p-4">
        <label className="grid min-w-52 gap-1 text-xs font-bold text-slate-600">
          Subcategoría
          <select
            className="min-h-11 rounded-[8px] border border-slate-200 bg-white px-3 text-sm"
            onChange={(event) => setSubcategory(event.target.value)}
            value={subcategory}
          >
            <option value="all">Todas</option>
            {category.subcategories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="grid min-w-44 gap-1 text-xs font-bold text-slate-600">
          Nivel cognitivo
          <select
            className="min-h-11 rounded-[8px] border border-slate-200 bg-white px-3 text-sm"
            onChange={(event) =>
              setLevel(event.target.value as TrainingCognitiveLevel)
            }
            value={level}
          >
            {Object.entries(cognitiveLevelLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-52 gap-1 text-xs font-bold text-slate-600">
          Formato
          <select
            className="min-h-11 rounded-[8px] border border-slate-200 bg-white px-3 text-sm"
            onChange={(event) =>
              setFormat(event.target.value as TrainingFormat)
            }
            value={format}
          >
            {trainingFormats.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <h2 className="mt-6 text-xl font-black" id="skills-title">
        Habilidades
      </h2>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {visibleSkills.map((item) => (
          <article
            className="rounded-[8px] border border-slate-200 bg-white p-5"
            key={item.slug}
          >
            <span className="text-xs font-bold text-violet-700">
              {item.subcategory}
            </span>
            <h3 className="mt-2 text-lg font-black">{item.name}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {item.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.concepts.map((concept) => (
                <span
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                  key={concept}
                >
                  {concept}
                </span>
              ))}
            </div>
            <Link
              className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-violet-700"
              href={`/ejercicios/habilidades/${item.slug}?nivel=${level}&formato=${format}`}
            >
              Explorar habilidad <ArrowRight size={15} />
            </Link>
          </article>
        ))}
      </div>
      {!visibleSkills.length ? (
        <p className="mt-3 rounded-[8px] border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Esta subcategoría está lista para recibir contenido editorial.
        </p>
      ) : null}
    </section>
  );
}
