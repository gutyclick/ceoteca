import Link from "next/link";
import { notFound } from "next/navigation";

import { TaxonomyIcon } from "@/components/training/TaxonomyIcon";
import { TrainingPageShell } from "@/components/training/TrainingPageShell";
import { taxonomyCategories } from "@/lib/training/taxonomy";
import { serverEnv } from "@/lib/env";

export default function TrainingCategoriesPage() {
  if (
    !serverEnv.TRAINING_TAXONOMY_ENABLED ||
    !serverEnv.TRAINING_CATEGORIES_ENABLED
  )
    notFound();
  return (
    <TrainingPageShell
      description="Elige el área que quieres fortalecer."
      title="Categorías"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {taxonomyCategories.map((category) => (
          <Link
            className="flex min-h-56 flex-col rounded-[8px] border border-slate-200 bg-white p-5 hover:border-violet-300"
            href={`/ejercicios/categorias/${category.slug}`}
            key={category.slug}
          >
            <span className="grid h-12 w-12 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
              <TaxonomyIcon name={category.icon} />
            </span>
            <h2 className="mt-5 text-lg font-black">{category.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {category.shortDescription}
            </p>
            <span className="mt-auto pt-4 text-xs font-bold text-violet-700">
              {category.subcategories.length} áreas · {category.skills.length}{" "}
              habilidades iniciales
            </span>
          </Link>
        ))}
      </div>
    </TrainingPageShell>
  );
}
