"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { ModuleItemEditor } from "@/components/training/admin/ModuleItemEditor";
import type { EditorialMetadata } from "@/lib/training/admin-editorial-client";
import type { EditorialPathDraft } from "@/lib/training/editorial-content-schemas";

type Module = EditorialPathDraft["modules"][number];
const field =
  "min-h-10 w-full rounded-[8px] border border-slate-300 bg-white px-3 text-sm";

export function ModuleEditor({
  module,
  metadata,
  index,
  onChange,
  onRemove,
  onMove,
}: {
  module: Module;
  metadata: EditorialMetadata;
  index: number;
  onChange: (module: Module) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const updateItem = (itemIndex: number, item: Module["items"][number]) =>
    onChange({
      ...module,
      items: module.items.map((current, indexValue) =>
        indexValue === itemIndex ? item : current,
      ),
    });
  const addItem = () =>
    onChange({
      ...module,
      items: [
        ...module.items,
        {
          itemType: "exercise",
          referenceId: "",
          sortOrder: module.items.length + 1,
          isRequired: true,
          minimumMastery: 0,
          minimumPlan: module.minimumPlan,
          previewAllowed: false,
        },
      ],
    });
  return (
    <article className="rounded-[8px] border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-black">Módulo {index + 1}</h3>
        <div className="flex gap-1">
          <button
            aria-label="Mover módulo arriba"
            className="grid h-10 w-10 place-items-center rounded-[8px] hover:bg-slate-100"
            onClick={() => onMove(-1)}
            type="button"
          >
            <ArrowUp size={17} />
          </button>
          <button
            aria-label="Mover módulo abajo"
            className="grid h-10 w-10 place-items-center rounded-[8px] hover:bg-slate-100"
            onClick={() => onMove(1)}
            type="button"
          >
            <ArrowDown size={17} />
          </button>
          <button
            aria-label="Eliminar módulo"
            className="grid h-10 w-10 place-items-center rounded-[8px] text-rose-600 hover:bg-rose-50"
            onClick={onRemove}
            type="button"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          aria-label="Título del módulo"
          className={field}
          placeholder="Título"
          value={module.title}
          onChange={(event) =>
            onChange({ ...module, title: event.target.value })
          }
        />
        <input
          aria-label="Slug del módulo"
          className={field}
          placeholder="slug-del-modulo"
          value={module.slug}
          onChange={(event) =>
            onChange({ ...module, slug: event.target.value })
          }
        />
        <input
          aria-label="Duración estimada"
          className={field}
          min={1}
          type="number"
          value={module.estimatedMinutes}
          onChange={(event) =>
            onChange({
              ...module,
              estimatedMinutes: Number(event.target.value),
            })
          }
        />
        <select
          aria-label="Plan del módulo"
          className={field}
          value={module.minimumPlan}
          onChange={(event) =>
            onChange({
              ...module,
              minimumPlan: event.target.value as Module["minimumPlan"],
            })
          }
        >
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="unlimited">Unlimited</option>
        </select>
      </div>
      <textarea
        aria-label="Descripción del módulo"
        className={`${field} mt-3 min-h-20 py-2`}
        placeholder="Qué aprenderá el usuario en este módulo"
        value={module.description}
        onChange={(event) =>
          onChange({ ...module, description: event.target.value })
        }
      />
      <div className="mt-4 grid gap-2">
        {module.items.map((item, itemIndex) => (
          <ModuleItemEditor
            item={item}
            key={item.id ?? `${item.itemType}-${itemIndex}`}
            metadata={metadata}
            onChange={(next) => updateItem(itemIndex, next)}
            onRemove={() =>
              onChange({
                ...module,
                items: module.items
                  .filter((_, indexValue) => indexValue !== itemIndex)
                  .map((entry, order) => ({ ...entry, sortOrder: order + 1 })),
              })
            }
          />
        ))}
      </div>
      <button
        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-[8px] border border-violet-300 px-3 text-sm font-bold text-violet-700"
        onClick={addItem}
        type="button"
      >
        <Plus size={17} />
        Añadir actividad
      </button>
    </article>
  );
}
