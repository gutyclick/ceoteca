"use client";

import { Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";

import type {
  EditorialDetail,
  EditorialMetadata,
} from "@/lib/training/admin-editorial-client";
import {
  createEditorial,
  saveEditorial,
} from "@/lib/training/admin-editorial-client";
import {
  taxonomyDraftSchema,
  type EditorialResourceType,
  type TaxonomyDraft,
} from "@/lib/training/editorial-content-schemas";

const emptyDraft: TaxonomyDraft = taxonomyDraftSchema.parse({
  name: "Nuevo contenido",
  slug: `nuevo-${Date.now()}`,
});

const fieldClass =
  "min-h-11 w-full rounded-[8px] border border-slate-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100";
const taxonomyResolver: Resolver<TaxonomyDraft> = async (values) => {
  const parsed = taxonomyDraftSchema.safeParse(values);
  if (parsed.success) return { values: parsed.data, errors: {} };
  return {
    values: {},
    errors: Object.fromEntries(
      parsed.error.issues.map((entry) => [
        String(entry.path[0]),
        { type: entry.code, message: entry.message },
      ]),
    ),
  };
};

export function TaxonomyForm({
  resource,
  detail,
  metadata,
  canEdit,
  onCreated,
  onSaved,
}: {
  resource: Exclude<EditorialResourceType, "paths">;
  detail: EditorialDetail | null;
  metadata: EditorialMetadata;
  canEdit: boolean;
  onCreated: (id: string) => void;
  onSaved: () => void;
}) {
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const autosaveTimer = useRef<number | null>(null);
  const defaults = useMemo(
    () => taxonomyDraftSchema.parse(detail?.draft ?? emptyDraft),
    [detail],
  );
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TaxonomyDraft>({
    defaultValues: defaults,
    resolver: taxonomyResolver,
  });
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
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(async () => {
      const parsed = taxonomyDraftSchema.safeParse(watchedValues);
      if (!parsed.success) return;
      setSaveState("saving");
      try {
        await saveEditorial(resource, detail.id, parsed.data);
        setSaveState("saved");
        reset(parsed.data);
        onSaved();
      } catch {
        setSaveState("error");
      }
    }, 900);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [canEdit, detail, isDirty, onSaved, reset, resource, watchedValues]);

  const submit = handleSubmit(async (values) => {
    setSaveState("saving");
    try {
      if (detail) await saveEditorial(resource, detail.id, values);
      else {
        const created = await createEditorial(resource, values);
        onCreated(created.id);
      }
      reset(values);
      setSaveState("saved");
      onSaved();
    } catch {
      setSaveState("error");
    }
  });

  const relation =
    resource === "subcategories" || resource === "skills"
      ? "categoryId"
      : resource === "concepts"
        ? "skillId"
        : null;
  const relationOptions =
    relation === "categoryId"
      ? metadata.categories
      : relation === "skillId"
        ? metadata.skills
        : [];

  return (
    <form className="grid gap-5" onSubmit={submit}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-black">
            {detail ? "Editar contenido" : "Crear contenido"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Los cambios válidos se guardan automáticamente.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            aria-live="polite"
            className={`text-xs font-bold ${saveState === "error" ? "text-rose-600" : "text-slate-500"}`}
          >
            {saveState === "saving"
              ? "Guardando..."
              : saveState === "saved"
                ? "Guardado"
                : saveState === "error"
                  ? "Error al guardar"
                  : isDirty
                    ? "Cambios pendientes"
                    : "Sin cambios"}
          </span>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-violet-700 px-4 text-sm font-bold text-white disabled:opacity-40"
            disabled={!canEdit || saveState === "saving"}
            type="submit"
          >
            <Save size={17} />
            Guardar
          </button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-bold">
          Nombre
          <input
            className={fieldClass}
            disabled={!canEdit}
            {...register("name")}
          />
          {errors.name ? (
            <span className="text-xs text-rose-600">{errors.name.message}</span>
          ) : null}
        </label>
        <label className="grid gap-1.5 text-sm font-bold">
          Slug
          <input
            className={fieldClass}
            disabled={!canEdit}
            {...register("slug")}
          />
          {errors.slug ? (
            <span className="text-xs text-rose-600">{errors.slug.message}</span>
          ) : null}
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-bold">
        Descripción
        <textarea
          className={`${fieldClass} min-h-28 py-3`}
          disabled={!canEdit}
          {...register("description")}
        />
      </label>
      {resource !== "formats" ? (
        <label className="grid gap-1.5 text-sm font-bold">
          Descripción breve
          <input
            className={fieldClass}
            disabled={!canEdit}
            {...register("shortDescription")}
          />
        </label>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-bold">
          Plan mínimo
          <select
            className={fieldClass}
            disabled={!canEdit}
            {...register("minimumPlan")}
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="unlimited">Unlimited</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-bold">
          Orden
          <input
            className={fieldClass}
            disabled={!canEdit}
            type="number"
            {...register("sortOrder", { valueAsNumber: true })}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-bold">
          Icono Lucide
          <input
            className={fieldClass}
            disabled={!canEdit}
            {...register("icon")}
          />
        </label>
      </div>
      {relation ? (
        <label className="grid gap-1.5 text-sm font-bold">
          {relation === "skillId" ? "Habilidad" : "Categoría"}
          <select
            className={fieldClass}
            disabled={!canEdit}
            {...register(relation)}
          >
            <option value="">Selecciona una opción</option>
            {relationOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {resource === "skills" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-bold">
            Nivel inicial
            <select
              className={fieldClass}
              disabled={!canEdit}
              {...register("difficultyStart")}
            >
              <option value="fundamentals">Fundamentals</option>
              <option value="application">Application</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            Nivel máximo
            <select
              className={fieldClass}
              disabled={!canEdit}
              {...register("difficultyMax")}
            >
              <option value="fundamentals">Fundamentals</option>
              <option value="application">Application</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </label>
        </div>
      ) : null}
      {resource === "concepts" ? (
        <label className="grid gap-1.5 text-sm font-bold">
          Nivel cognitivo recomendado
          <select
            className={fieldClass}
            disabled={!canEdit}
            {...register("recommendedCognitiveLevel")}
          >
            <option value="recognition">Reconocimiento</option>
            <option value="understanding">Comprensión</option>
            <option value="application">Aplicación</option>
            <option value="analysis">Análisis</option>
            <option value="transfer">Transferencia</option>
            <option value="synthesis">Síntesis</option>
          </select>
        </label>
      ) : null}
      {resource === "categories" ||
      resource === "skills" ||
      resource === "concepts" ? (
        <section className="grid gap-4 rounded-[8px] border border-slate-200 p-4 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-black">Libros relacionados</h3>
            <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto">
              {metadata.books.map((book) => (
                <label className="flex items-start gap-2 text-sm" key={book.id}>
                  <input
                    disabled={!canEdit}
                    type="checkbox"
                    value={book.id}
                    {...register("bookIds")}
                  />
                  <span>
                    {book.title}
                    <small className="block text-slate-500">
                      {book.author}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </div>
          {resource === "skills" || resource === "concepts" ? (
            <div>
              <h3 className="text-sm font-black">Prerrequisitos</h3>
              <p className="mt-1 text-xs text-slate-500">
                Los ciclos se rechazan en servidor.
              </p>
              <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto">
                {(resource === "skills" ? metadata.skills : metadata.concepts)
                  .filter((entry) => entry.id !== detail?.id)
                  .map((entry) => (
                    <label
                      className="flex items-center gap-2 text-sm"
                      key={entry.id}
                    >
                      <input
                        disabled={!canEdit}
                        type="checkbox"
                        value={entry.id}
                        {...register("prerequisiteIds")}
                      />
                      {entry.name}
                    </label>
                  ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
      <label className="grid gap-1.5 text-sm font-bold">
        Motivo del cambio
        <textarea
          className={`${fieldClass} min-h-20 py-3`}
          disabled={!canEdit}
          placeholder="Describe brevemente el propósito de esta versión."
          {...register("changeReason")}
        />
      </label>
    </form>
  );
}
