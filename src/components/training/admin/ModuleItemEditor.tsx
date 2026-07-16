"use client";

import { GripVertical, Trash2 } from "lucide-react";

import type { EditorialMetadata } from "@/lib/training/admin-editorial-client";
import type { EditorialPathDraft } from "@/lib/training/editorial-content-schemas";

type Item = EditorialPathDraft["modules"][number]["items"][number];
const field =
  "min-h-10 rounded-[8px] border border-slate-300 bg-white px-3 text-sm";

export function ModuleItemEditor({
  item,
  metadata,
  onChange,
  onRemove,
}: {
  item: Item;
  metadata: EditorialMetadata;
  onChange: (item: Item) => void;
  onRemove: () => void;
}) {
  const options =
    item.itemType === "exercise" || item.itemType === "review"
      ? metadata.exercises.map((entry) => ({
          id: entry.id,
          label: entry.title,
        }))
      : item.itemType === "skill_session"
        ? metadata.skills.map((entry) => ({ id: entry.id, label: entry.name }))
        : item.itemType === "concept_session"
          ? metadata.concepts.map((entry) => ({
              id: entry.id,
              label: entry.name,
            }))
          : item.itemType === "template"
            ? metadata.templates.map((entry) => ({
                id: entry.id,
                label: entry.name,
              }))
            : metadata.scenarios.map((entry) => ({
                id: entry.id,
                label: entry.public_title,
              }));
  return (
    <div className="grid gap-3 rounded-[8px] border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[28px_150px_minmax(180px,1fr)_110px_100px_44px] lg:items-center">
      <GripVertical className="hidden text-slate-400 lg:block" size={18} />
      <select
        aria-label="Tipo de actividad"
        className={field}
        value={item.itemType}
        onChange={(event) =>
          onChange({
            ...item,
            itemType: event.target.value as Item["itemType"],
            referenceId: "",
          })
        }
      >
        <option value="exercise">Ejercicio</option>
        <option value="review">Repaso</option>
        <option value="skill_session">Sesión de habilidad</option>
        <option value="concept_session">Sesión de concepto</option>
        <option value="template">Plantilla</option>
        <option value="roleplay">Role-play</option>
      </select>
      <select
        aria-label="Contenido relacionado"
        className={field}
        value={item.referenceId}
        onChange={(event) =>
          onChange({ ...item, referenceId: event.target.value })
        }
      >
        <option value="">Selecciona contenido publicado</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Plan mínimo"
        className={field}
        value={item.minimumPlan}
        onChange={(event) =>
          onChange({
            ...item,
            minimumPlan: event.target.value as Item["minimumPlan"],
          })
        }
      >
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="unlimited">Unlimited</option>
      </select>
      <label className="flex items-center gap-2 text-xs font-bold">
        <input
          checked={item.isRequired}
          onChange={(event) =>
            onChange({ ...item, isRequired: event.target.checked })
          }
          type="checkbox"
        />
        Requerido
      </label>
      <button
        aria-label="Eliminar actividad"
        className="grid h-10 w-10 place-items-center rounded-[8px] text-rose-600 hover:bg-rose-100"
        onClick={onRemove}
        type="button"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}
