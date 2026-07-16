"use client";

import { Eye, Plus, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ModuleEditor } from "@/components/training/admin/ModuleEditor";
import type {
  EditorialDetail,
  EditorialMetadata,
} from "@/lib/training/admin-editorial-client";
import {
  createEditorial,
  saveEditorial,
} from "@/lib/training/admin-editorial-client";
import {
  editorialPathDraftSchema,
  type EditorialPathDraft,
} from "@/lib/training/editorial-content-schemas";

const defaultPath: EditorialPathDraft = {
  name: "Nueva ruta",
  slug: `nueva-ruta-${Date.now()}`,
  description: "",
  shortDescription: "",
  icon: "route",
  sortOrder: 0,
  minimumPlan: "free",
  categoryId: null,
  subcategoryId: null,
  skillId: null,
  learningObjectives: [],
  difficultyStart: "fundamentals",
  difficultyMax: "advanced",
  recommendedCognitiveLevel: "understanding",
  promise: "Desarrolla una habilidad concreta",
  expectedOutcome: "Aplica lo aprendido en una situación real",
  estimatedMinutes: 30,
  difficulty: "fundamentals",
  bookIds: [],
  prerequisiteIds: [],
  changeReason: "",
  categoryIds: [],
  skillIds: [],
  modules: [
    {
      slug: "introduccion",
      title: "Introducción",
      description: "",
      sortOrder: 1,
      estimatedMinutes: 10,
      minimumPlan: "free",
      items: [],
    },
  ],
};
const field =
  "min-h-11 w-full rounded-[8px] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

export function PathEditor({
  detail,
  metadata,
  canEdit,
  onCreated,
  onSaved,
}: {
  detail: EditorialDetail | null;
  metadata: EditorialMetadata;
  canEdit: boolean;
  onCreated: (id: string) => void;
  onSaved: () => void;
}) {
  const defaults = useMemo(
    () => (detail?.draft ?? defaultPath) as EditorialPathDraft,
    [detail],
  );
  const {
    control,
    register,
    reset,
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: { isDirty },
  } = useForm<EditorialPathDraft>({ defaultValues: defaults });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [validation, setValidation] = useState<string[]>([]);
  const timer = useRef<number | null>(null);
  const modules = watch("modules");
  const categories = watch("categoryIds");
  const skills = watch("skillIds");
  const watchedValues = useWatch({ control });

  useEffect(() => reset(defaults), [defaults, reset]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (isDirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);
  useEffect(() => {
    if (!detail || !canEdit || !isDirty) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      const parsed = editorialPathDraftSchema.safeParse(watchedValues);
      if (!parsed.success) {
        setValidation(
          parsed.error.issues.map(
            (entry) => `${entry.path.join(".")}: ${entry.message}`,
          ),
        );
        return;
      }
      setValidation([]);
      setState("saving");
      try {
        await saveEditorial("paths", detail.id, parsed.data);
        reset(parsed.data);
        setState("saved");
        onSaved();
      } catch {
        setState("error");
      }
    }, 1000);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [canEdit, detail, isDirty, onSaved, reset, watchedValues]);

  const submit = handleSubmit(async (raw) => {
    const parsed = editorialPathDraftSchema.safeParse(raw);
    if (!parsed.success) {
      setValidation(
        parsed.error.issues.map(
          (entry) => `${entry.path.join(".")}: ${entry.message}`,
        ),
      );
      return;
    }
    setState("saving");
    try {
      if (detail) await saveEditorial("paths", detail.id, parsed.data);
      else {
        const created = await createEditorial("paths", parsed.data);
        onCreated(created.id);
      }
      setState("saved");
      reset(parsed.data);
      onSaved();
    } catch {
      setState("error");
    }
  });
  const replaceModule = (
    index: number,
    module: EditorialPathDraft["modules"][number],
  ) =>
    setValue(
      "modules",
      modules.map((current, position) =>
        position === index ? module : current,
      ),
      { shouldDirty: true },
    );
  const moveModule = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;
    const next = [...modules];
    [next[index], next[target]] = [next[target], next[index]];
    setValue(
      "modules",
      next.map((module, position) => ({ ...module, sortOrder: position + 1 })),
      { shouldDirty: true },
    );
  };
  const toggleId = (fieldName: "categoryIds" | "skillIds", id: string) => {
    const values = getValues(fieldName);
    setValue(
      fieldName,
      values.includes(id)
        ? values.filter((value) => value !== id)
        : [...values, id],
      { shouldDirty: true },
    );
  };

  return (
    <form className="grid gap-6" onSubmit={submit}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Configuración de la ruta</h2>
          <p className="mt-1 text-sm text-slate-500">
            Edita una nueva versión sin alterar la publicación vigente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold ${state === "error" ? "text-rose-600" : "text-slate-500"}`}
          >
            {state === "saving"
              ? "Guardando..."
              : state === "saved"
                ? "Guardado"
                : state === "error"
                  ? "Error"
                  : isDirty
                    ? "Cambios pendientes"
                    : "Sin cambios"}
          </span>
          {detail?.sourceStatus === "published" ? (
            <Link
              className="grid h-11 w-11 place-items-center rounded-[8px] border border-slate-300"
              href={`/ejercicios/rutas/${watch("slug")}`}
              target="_blank"
              title="Previsualizar como usuario"
            >
              <Eye size={18} />
            </Link>
          ) : null}
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-violet-700 px-4 text-sm font-bold text-white disabled:opacity-40"
            disabled={!canEdit}
            type="submit"
          >
            <Save size={17} />
            Guardar
          </button>
        </div>
      </div>
      {validation.length ? (
        <div className="rounded-[8px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <strong>Corrige estos campos:</strong>
          <ul className="mt-2 list-disc pl-5">
            {validation.slice(0, 8).map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <section className="grid gap-4 rounded-[8px] border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-bold">
          Nombre
          <input className={field} disabled={!canEdit} {...register("name")} />
        </label>
        <label className="grid gap-1.5 text-sm font-bold">
          Slug
          <input className={field} disabled={!canEdit} {...register("slug")} />
        </label>
        <label className="grid gap-1.5 text-sm font-bold sm:col-span-2">
          Promesa
          <input
            className={field}
            disabled={!canEdit}
            {...register("promise")}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-bold sm:col-span-2">
          Resultado esperado
          <textarea
            className={`${field} min-h-20 py-3`}
            disabled={!canEdit}
            {...register("expectedOutcome")}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-bold">
          Plan mínimo
          <select
            className={field}
            disabled={!canEdit}
            {...register("minimumPlan")}
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="unlimited">Unlimited</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-bold">
          Duración total
          <input
            className={field}
            disabled={!canEdit}
            type="number"
            {...register("estimatedMinutes", { valueAsNumber: true })}
          />
        </label>
      </section>
      <section className="grid gap-4 rounded-[8px] border border-slate-200 bg-white p-5 lg:grid-cols-2">
        <div>
          <h3 className="font-black">Categorías</h3>
          <div className="mt-3 grid gap-2">
            {metadata.categories.map((entry) => (
              <label
                className="flex min-h-10 items-center gap-2 rounded-[8px] border border-slate-200 px-3 text-sm"
                key={entry.id}
              >
                <input
                  checked={categories.includes(entry.id)}
                  disabled={!canEdit}
                  onChange={() => toggleId("categoryIds", entry.id)}
                  type="checkbox"
                />
                {entry.name}
              </label>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-black">Habilidades</h3>
          <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto pr-1">
            {metadata.skills.map((entry) => (
              <label
                className="flex min-h-10 items-center gap-2 rounded-[8px] border border-slate-200 px-3 text-sm"
                key={entry.id}
              >
                <input
                  checked={skills.includes(entry.id)}
                  disabled={!canEdit}
                  onChange={() => toggleId("skillIds", entry.id)}
                  type="checkbox"
                />
                {entry.name}
              </label>
            ))}
          </div>
        </div>
      </section>
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">Módulos e ítems</h2>
            <p className="mt-1 text-sm text-slate-500">
              El orden define la progresión que verá el usuario.
            </p>
          </div>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-[8px] border border-violet-300 px-3 text-sm font-bold text-violet-700"
            disabled={!canEdit}
            onClick={() =>
              setValue(
                "modules",
                [
                  ...modules,
                  {
                    slug: `modulo-${modules.length + 1}`,
                    title: `Módulo ${modules.length + 1}`,
                    description: "",
                    sortOrder: modules.length + 1,
                    estimatedMinutes: 10,
                    minimumPlan: watch("minimumPlan"),
                    items: [],
                  },
                ],
                { shouldDirty: true },
              )
            }
            type="button"
          >
            <Plus size={17} />
            Añadir módulo
          </button>
        </div>
        <div className="mt-4 grid gap-4">
          {modules.map((module, index) => (
            <ModuleEditor
              index={index}
              key={module.id ?? `${module.slug}-${index}`}
              metadata={metadata}
              module={module}
              onChange={(next) => replaceModule(index, next)}
              onMove={(direction) => moveModule(index, direction)}
              onRemove={() =>
                setValue(
                  "modules",
                  modules
                    .filter((_, position) => position !== index)
                    .map((entry, position) => ({
                      ...entry,
                      sortOrder: position + 1,
                    })),
                  { shouldDirty: true },
                )
              }
            />
          ))}
        </div>
      </section>
      <label className="grid gap-1.5 text-sm font-bold">
        Motivo del cambio
        <textarea
          className={`${field} min-h-20 py-3`}
          disabled={!canEdit}
          {...register("changeReason")}
        />
      </label>
    </form>
  );
}
