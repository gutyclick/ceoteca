import {
  ArrowRight,
  Blocks,
  MessagesSquare,
  ScanSearch,
  Target,
} from "lucide-react";
import Link from "next/link";

import { ContinueTrainingCard } from "@/components/training/ContinueTrainingCard";
import { TaxonomyIcon } from "@/components/training/TaxonomyIcon";
import { TrainingHeroCard } from "@/components/training/TrainingHeroCard";
import { TrainingPageShell } from "@/components/training/TrainingPageShell";
import { TrainingProgressOverview } from "@/components/training/TrainingProgressOverview";
import { TrainingProgressBar } from "@/components/training/TrainingPrimitives";
import { continueTraining, todayTraining } from "@/data/training";
import { learningPaths, taxonomyCategories } from "@/lib/training/taxonomy";

const modes = [
  {
    slug: "analiza",
    name: "Analiza",
    description: "Compara casos y detecta lo que importa.",
    icon: ScanSearch,
  },
  {
    slug: "construye",
    name: "Construye",
    description: "Crea mensajes, propuestas y sistemas.",
    icon: Blocks,
  },
  {
    slug: "practica",
    name: "Practica",
    description: "Toma decisiones y recibe feedback.",
    icon: Target,
  },
] as const;

type TrainingViewFeatures = {
  taxonomy?: boolean;
  categories?: boolean;
  paths?: boolean;
  modes?: boolean;
  search?: boolean;
};

export function TrainingView({
  features = {},
}: {
  features?: TrainingViewFeatures;
}) {
  const taxonomyEnabled = features.taxonomy ?? true;
  const categoriesEnabled = taxonomyEnabled && (features.categories ?? true);
  const pathsEnabled = taxonomyEnabled && (features.paths ?? true);
  const modesEnabled = taxonomyEnabled && (features.modes ?? true);

  return (
    <TrainingPageShell
      description="Entrena lo que aprendes y conviértelo en criterio."
      search={taxonomyEnabled && (features.search ?? true)}
      title="Ejercicios"
    >
      <div className="space-y-8">
        <TrainingHeroCard recommendation={todayTraining} />

        <section aria-labelledby="continue-title">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black" id="continue-title">
              Continúa donde lo dejaste
            </h2>
            <Link className="text-sm font-bold text-violet-700" href="/perfil">
              Ver actividad
            </Link>
          </div>
          <div className="mt-3 grid gap-4 xl:grid-cols-2">
            {continueTraining.map((activity) => (
              <ContinueTrainingCard activity={activity} key={activity.id} />
            ))}
          </div>
        </section>

        {modesEnabled ? (
          <section aria-labelledby="modes-title">
            <h2 className="text-xl font-black" id="modes-title">
              ¿Cómo quieres entrenar?
            </h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {modes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <Link
                    className="group flex min-h-28 items-start gap-4 rounded-[8px] border border-slate-200 bg-white p-5 hover:border-violet-300"
                    href={`/ejercicios?modo=${mode.slug}`}
                    key={mode.slug}
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
                      <Icon size={22} />
                    </span>
                    <span>
                      <strong className="block text-base font-black">
                        {mode.name}
                      </strong>
                      <span className="mt-1 block text-sm leading-6 text-slate-500">
                        {mode.description}
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
                Ver todas <ArrowRight size={15} />
              </Link>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {taxonomyCategories.map((category, index) => (
                <Link
                  className="group flex min-h-40 flex-col rounded-[8px] border border-slate-200 bg-white p-4 hover:border-violet-300"
                  href={`/ejercicios/categorias/${category.slug}`}
                  key={category.slug}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
                    <TaxonomyIcon name={category.icon} size={20} />
                  </span>
                  <h3 className="mt-4 text-sm font-black">{category.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {category.shortDescription}
                  </p>
                  <span className="mt-auto pt-4 text-xs font-bold text-violet-700">
                    {category.skills.length} habilidades · {index * 7 + 12}% de
                    dominio
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {pathsEnabled ? (
          <section aria-labelledby="paths-title">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black" id="paths-title">
                  Rutas prácticas
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Avanza por módulos con una meta concreta.
                </p>
              </div>
              <Link
                className="text-sm font-bold text-violet-700"
                href="/ejercicios/rutas"
              >
                Ver rutas
              </Link>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
              {learningPaths.slice(0, 4).map((path, index) => (
                <Link
                  className="rounded-[8px] border border-slate-200 bg-white p-4 hover:border-violet-300"
                  href={`/ejercicios/rutas/${path.slug}`}
                  key={path.slug}
                >
                  <span className="text-xs font-bold text-violet-700">
                    {path.minutes} min · {path.difficulty}
                  </span>
                  <h3 className="mt-2 font-black">{path.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {path.promise}
                  </p>
                  <div className="mt-4">
                    <TrainingProgressBar
                      label={path.name}
                      value={index === 0 ? 34 : 0}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <TrainingProgressOverview />

        <section
          aria-labelledby="roleplay-title"
          className="grid gap-4 rounded-[8px] border border-violet-200 bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"
        >
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
              <MessagesSquare size={23} />
            </div>
            <div>
              <h2 className="text-xl font-black" id="roleplay-title">
                Simulaciones conversacionales
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Practica ventas, liderazgo y decisiones empresariales. El acceso
                y la cuota se validan siempre en el servidor.
              </p>
            </div>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-violet-600 px-5 text-sm font-bold text-white hover:bg-violet-700"
            href="/ejercicios/simulaciones"
          >
            Abrir simulaciones <ArrowRight size={17} />
          </Link>
        </section>
      </div>
    </TrainingPageShell>
  );
}
