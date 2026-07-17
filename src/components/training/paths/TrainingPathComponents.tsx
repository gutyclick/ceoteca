"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Lock,
  Play,
  Route,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { TrainingProgressBar } from "@/components/training/TrainingPrimitives";
import type {
  TrainingPathCardViewModel,
  TrainingPathItemViewModel,
  TrainingPathModuleViewModel,
  TrainingPathPageViewModel,
} from "@/lib/training/path-model";
import { cn } from "@/lib/utils/cn";

const difficultyLabel = {
  fundamentals: "Fundamentos",
  application: "Aplicación",
  advanced: "Avanzado",
  expert: "Experto",
} as const;
const planLabel = {
  free: "Gratis",
  pro: "Pro",
  unlimited: "Ilimitado",
} as const;

export function TrainingPathCard({
  path,
}: {
  path: TrainingPathCardViewModel;
}) {
  const cta =
    path.status === "locked"
      ? "Ver ruta"
      : path.status === "completed"
        ? "Repasar"
        : path.status === "in_progress"
          ? "Continuar"
          : "Comenzar";
  return (
    <article className="flex min-h-64 flex-col rounded-[8px] border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
          <Route aria-hidden="true" size={21} />
        </span>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            path.status === "completed"
              ? "bg-emerald-50 text-emerald-700"
              : path.status === "locked"
                ? "bg-slate-100 text-slate-500"
                : "bg-violet-50 text-violet-700",
          )}
        >
          {path.status === "completed"
            ? "Completada"
            : path.status === "in_progress"
              ? "En progreso"
              : path.status === "locked"
                ? "Bloqueada"
                : "Disponible"}
        </span>
      </div>
      <p className="mt-4 text-xs font-bold uppercase text-violet-700">
        {path.category?.name ?? "Ruta práctica"}
      </p>
      <h3 className="mt-1 text-xl font-black tracking-[-0.02em]">
        {path.name}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{path.promise}</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-slate-500">
        <span>{difficultyLabel[path.difficulty]}</span>
        <span>{path.moduleCount} módulos</span>
        <span>Plan {planLabel[path.minimumPlan]}</span>
      </div>
      {path.progress > 0 ? (
        <div className="mt-4">
          <TrainingProgressBar
            label={`Progreso de ${path.name}`}
            value={path.progress}
          />
          <p className="mt-2 text-xs font-bold text-slate-500">
            {path.progress}% completado
          </p>
        </div>
      ) : null}
      <Link
        className="mt-auto inline-flex min-h-11 items-center justify-between border-t border-slate-100 pt-4 text-sm font-black text-violet-700"
        href={`/ejercicios/rutas/${path.slug}`}
      >
        {cta}{" "}
        {path.status === "locked" ? (
          <Lock size={16} />
        ) : (
          <ArrowRight size={16} />
        )}
      </Link>
    </article>
  );
}

export function TrainingPathFilters({
  categories,
}: {
  categories: Array<{ slug: string; name: string }>;
}) {
  const params = useSearchParams();
  return (
    <form
      className="grid gap-3 rounded-[8px] border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-7"
      method="get"
    >
      <label className="xl:col-span-2">
        <span className="sr-only">Buscar rutas</span>
        <input
          className="min-h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-500"
          defaultValue={params.get("q") ?? ""}
          name="q"
          placeholder="Buscar una ruta..."
        />
      </label>
      <Select
        defaultValue={params.get("category") ?? ""}
        name="category"
        label="Categoría"
      >
        <option value="">Todas</option>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </Select>
      <Select
        defaultValue={params.get("difficulty") ?? ""}
        name="difficulty"
        label="Nivel"
      >
        <option value="">Todos</option>
        <option value="fundamentals">Fundamentos</option>
        <option value="application">Aplicación</option>
        <option value="advanced">Avanzado</option>
      </Select>
      <Select
        defaultValue={params.get("progress") ?? "all"}
        name="progress"
        label="Progreso"
      >
        <option value="all">Todos</option>
        <option value="not_started">Sin iniciar</option>
        <option value="in_progress">En progreso</option>
        <option value="completed">Completadas</option>
      </Select>
      <Select defaultValue={params.get("plan") ?? ""} name="plan" label="Plan">
        <option value="">Plan</option>
        <option value="free">Gratis</option>
        <option value="pro">Pro</option>
        <option value="unlimited">Ilimitado</option>
      </Select>
      <button
        className="min-h-11 rounded-[8px] bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-700"
        type="submit"
      >
        Aplicar filtros
      </button>
    </form>
  );
}

function Select({
  name,
  label,
  children,
  defaultValue,
}: {
  name: string;
  label: string;
  children: React.ReactNode;
  defaultValue?: string;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        className="min-h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-500"
        defaultValue={defaultValue}
        name={name}
      >
        {children}
      </select>
    </label>
  );
}

export function TrainingPathHeader({
  page,
}: {
  page: TrainingPathPageViewModel;
}) {
  return (
    <section className="rounded-[8px] border border-slate-200 bg-white p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase text-violet-700">
            {page.path.category?.name ?? "Ruta CEOTECA"}
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            {page.path.name}
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            {page.path.description}
          </p>
        </div>
        <span className="rounded-full bg-violet-50 px-4 py-2 text-sm font-black text-violet-700">
          Plan {planLabel[page.path.minimumPlan]}
        </span>
      </div>
      <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
        <Meta
          icon={Route}
          label="Recorrido"
          value={`${page.path.moduleCount} módulos`}
        />
        <Meta
          icon={Sparkles}
          label="Nivel"
          value={difficultyLabel[page.path.difficulty]}
        />
      </div>
      <div className="mt-6 rounded-[8px] bg-slate-50 p-4">
        <p className="text-sm font-black">Resultado esperado</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {page.path.expectedOutcome}
        </p>
      </div>
    </section>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Route;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
        <Icon size={18} />
      </span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-black">{value}</p>
      </div>
    </div>
  );
}

export function TrainingPathProgress({ value }: { value: number }) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-black">Tu progreso</h3>
        <span className="text-sm font-black text-violet-700">{value}%</span>
      </div>
      <div className="mt-3">
        <TrainingProgressBar label="Progreso total de la ruta" value={value} />
      </div>
    </div>
  );
}

export function TrainingPathItemRow({
  item,
  onStart,
  pending,
}: {
  item: TrainingPathItemViewModel;
  onStart: (item: TrainingPathItemViewModel) => void;
  pending: boolean;
}) {
  const completed = item.status === "completed";
  return (
    <li className="grid gap-3 border-t border-slate-100 py-4 first:border-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex min-w-0 gap-3">
        <span
          className={cn(
            "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full",
            completed
              ? "bg-emerald-50 text-emerald-700"
              : item.status === "locked"
                ? "bg-slate-100 text-slate-400"
                : "bg-violet-50 text-violet-700",
          )}
        >
          {completed ? (
            <Check size={16} />
          ) : item.status === "locked" ? (
            <Lock size={15} />
          ) : (
            <Play size={15} />
          )}
        </span>
        <div className="min-w-0">
          <h4 className="text-sm font-black">{item.title}</h4>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            {item.description}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-400">
            {item.required ? "Requerido" : "Opcional"}
          </p>
          {item.lockedReason ? (
            <p className="mt-1 text-xs text-slate-500">{item.lockedReason}</p>
          ) : null}
        </div>
      </div>
      <button
        className={cn(
          "min-h-9 rounded-[8px] border px-3 text-xs font-black disabled:border-slate-200 disabled:text-slate-400",
          completed
            ? "border-emerald-200 text-emerald-700"
            : "border-violet-200 text-violet-700",
        )}
        disabled={item.status === "locked" || pending}
        onClick={() => onStart(item)}
        type="button"
      >
        {pending
          ? "Abriendo..."
          : completed
            ? "Repasar"
            : item.status === "in_progress"
              ? "Continuar"
              : "Iniciar"}
      </button>
    </li>
  );
}

export function TrainingPathModuleCard({
  module,
  onStartItem,
  pendingItemId,
}: {
  module: TrainingPathModuleViewModel;
  onStartItem: (item: TrainingPathItemViewModel) => void;
  pendingItemId: string | null;
}) {
  return (
    <article
      className={cn(
        "rounded-[8px] border bg-white p-5",
        module.status === "locked"
          ? "border-slate-200 bg-slate-50/60"
          : module.status === "completed"
            ? "border-emerald-200"
            : "border-slate-200",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black">{module.title}</h3>
            {module.status === "completed" ? (
              <CheckCircle2 className="text-emerald-600" size={18} />
            ) : module.status === "locked" ? (
              <Lock className="text-slate-400" size={17} />
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {module.description}
          </p>
        </div>
        <span className="text-xs font-bold text-slate-500">
          {module.itemCount} actividades
        </span>
      </div>
      {module.lockedReason ? (
        <p className="mt-4 rounded-[8px] bg-slate-100 p-3 text-sm text-slate-600">
          {module.lockedReason}
        </p>
      ) : (
        <>
          <div className="mt-4">
            <TrainingProgressBar
              label={`Progreso de ${module.title}`}
              value={module.progress}
            />
          </div>
          <ul className="mt-3">
            {module.items.map((item) => (
              <TrainingPathItemRow
                item={item}
                key={item.id}
                onStart={onStartItem}
                pending={pendingItemId === item.id}
              />
            ))}
          </ul>
        </>
      )}
    </article>
  );
}

export function TrainingPathModuleList(props: {
  modules: TrainingPathModuleViewModel[];
  onStartItem: (item: TrainingPathItemViewModel) => void;
  pendingItemId: string | null;
}) {
  return (
    <section aria-labelledby="modules-title">
      <h2 className="text-2xl font-black" id="modules-title">
        Módulos de la ruta
      </h2>
      <div className="mt-4 space-y-4">
        {props.modules.map((module, index) => (
          <div className="grid gap-3 sm:grid-cols-[42px_1fr]" key={module.id}>
            <span className="grid h-10 w-10 place-items-center rounded-full border border-violet-200 bg-white text-sm font-black text-violet-700">
              {index + 1}
            </span>
            <TrainingPathModuleCard
              module={module}
              onStartItem={props.onStartItem}
              pendingItemId={props.pendingItemId}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function TrainingPathContinueCard({
  page,
  onAction,
  pending,
}: {
  page: TrainingPathPageViewModel;
  onAction: () => void;
  pending: boolean;
}) {
  return (
    <aside className="rounded-[8px] border border-violet-200 bg-white p-5 xl:sticky xl:top-5">
      <h3 className="font-black">Siguiente paso</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {page.currentModule
          ? `Continúa en “${page.currentModule.title}”.`
          : "Inicia esta ruta y avanza módulo por módulo."}
      </p>
      {page.nextAction.kind === "upgrade" ? (
        <Link
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-violet-600 px-4 text-sm font-black text-white"
          href="/planes"
        >
          Ver planes <ArrowRight size={16} />
        </Link>
      ) : (
        <button
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-violet-600 px-4 text-sm font-black text-white disabled:opacity-60"
          disabled={pending || page.nextAction.kind === "disabled"}
          onClick={onAction}
          type="button"
        >
          {pending ? "Preparando..." : page.nextAction.label}
          <ArrowRight size={16} />
        </button>
      )}
    </aside>
  );
}

export function TrainingPathLockedState({
  minimumPlan,
}: {
  minimumPlan: "free" | "pro" | "unlimited";
}) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-5">
      <Lock className="text-slate-500" size={22} />
      <h3 className="mt-3 font-black">Contenido bloqueado</h3>
      <p className="mt-1 text-sm text-slate-600">
        Puedes explorar la ruta. Para iniciarla necesitas el plan{" "}
        {planLabel[minimumPlan]}.
      </p>
    </div>
  );
}
export function TrainingPathEmptyState() {
  return (
    <div className="rounded-[8px] border border-dashed border-slate-300 bg-white p-8 text-center">
      <Route className="mx-auto text-slate-400" size={28} />
      <h2 className="mt-3 text-lg font-black">No encontramos rutas</h2>
      <p className="mt-1 text-sm text-slate-500">
        Cambia los filtros o prueba otra búsqueda.
      </p>
    </div>
  );
}
