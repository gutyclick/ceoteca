import { notFound } from "next/navigation";
import Link from "next/link";

import { CategorySkillBrowser } from "@/components/training/CategorySkillBrowser";
import { TaxonomyIcon } from "@/components/training/TaxonomyIcon";
import { TrainingPageShell } from "@/components/training/TrainingPageShell";
import { TrainingProgressBar } from "@/components/training/TrainingPrimitives";
import { serverEnv } from "@/lib/env";
import {
  findCategory,
  learningPaths,
  taxonomyCategories,
} from "@/lib/training/taxonomy";

export function generateStaticParams() {
  return taxonomyCategories.map((category) => ({
    categorySlug: category.slug,
  }));
}

export default async function TrainingCategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  if (
    !serverEnv.TRAINING_TAXONOMY_ENABLED ||
    !serverEnv.TRAINING_CATEGORIES_ENABLED
  )
    notFound();
  const { categorySlug } = await params;
  const category = findCategory(categorySlug);
  if (!category) notFound();
  const paths = learningPaths.filter(
    (path) => path.categorySlug === category.slug,
  );
  return (
    <TrainingPageShell
      description={category.shortDescription}
      title={category.name}
    >
      <div className="space-y-7">
        <section className="grid gap-6 rounded-[8px] border border-slate-200 bg-white p-5 md:grid-cols-[auto_1fr_220px] md:items-center sm:p-6">
          <span className="grid h-16 w-16 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
            <TaxonomyIcon name={category.icon} size={30} />
          </span>
          <div>
            <p className="max-w-3xl text-sm leading-7 text-slate-600">
              {category.description}
            </p>
            <p className="mt-3 text-sm font-bold text-slate-700">
              {category.subcategories.length} subcategorías ·{" "}
              {category.skills.length} habilidades publicadas
            </p>
          </div>
          <div>
            <div className="flex justify-between text-sm font-bold">
              <span>Tu progreso</span>
              <span>24%</span>
            </div>
            <div className="mt-2">
              <TrainingProgressBar label={category.name} value={24} />
            </div>
          </div>
        </section>
        <CategorySkillBrowser category={category} />
        {paths.length ? (
          <section>
            <h2 className="text-xl font-black">Rutas relacionadas</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {paths.map((path) => (
                <Link
                  className="rounded-[8px] border border-slate-200 bg-white p-5 hover:border-violet-300"
                  href={`/ejercicios/rutas/${path.slug}`}
                  key={path.slug}
                >
                  <span className="text-xs font-bold text-violet-700">
                    {path.minutes} min ·{" "}
                    {path.minimumPlan === "free"
                      ? "Todos los planes"
                      : "Plan Pro"}
                  </span>
                  <h3 className="mt-2 font-black">{path.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{path.promise}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </TrainingPageShell>
  );
}
