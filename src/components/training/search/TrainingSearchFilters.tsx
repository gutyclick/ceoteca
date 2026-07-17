"use client";

import type { TrainingSearchQuery } from "@/lib/training/search-schemas";
import { trainingFormats } from "@/lib/training/taxonomy";

type Props = {
  value: TrainingSearchQuery;
  onChange: (patch: Partial<TrainingSearchQuery>) => void;
};
const control =
  "min-h-11 min-w-0 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-500";

export function TrainingSearchFilters({ value, onChange }: Props) {
  return (
    <div
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      aria-label="Filtros de búsqueda"
    >
      <select
        aria-label="Tipo"
        className={control}
        onChange={(event) =>
          onChange({
            type:
              (event.target.value as TrainingSearchQuery["type"]) || undefined,
            page: 1,
          })
        }
        value={value.type ?? ""}
      >
        <option value="">Todos los tipos</option>
        <option value="category">Categorías</option>
        <option value="subcategory">Subcategorías</option>
        <option value="skill">Habilidades</option>
        <option value="concept">Conceptos</option>
        <option value="path">Rutas</option>
        <option value="exercise">Ejercicios</option>
        <option value="book">Libros</option>
        <option value="simulation">Simulaciones</option>
      </select>
      <input
        aria-label="Categoría"
        className={control}
        onChange={(event) =>
          onChange({ category: event.target.value || undefined, page: 1 })
        }
        placeholder="Slug de categoría"
        value={value.category ?? ""}
      />
      <select
        aria-label="Modo"
        className={control}
        onChange={(event) =>
          onChange({ mode: event.target.value || undefined, page: 1 })
        }
        value={value.mode ?? ""}
      >
        <option value="">Todos los modos</option>
        <option value="analiza">Analiza</option>
        <option value="construye">Construye</option>
        <option value="practica">Practica</option>
      </select>
      <select
        aria-label="Formato"
        className={control}
        onChange={(event) =>
          onChange({ format: event.target.value || undefined, page: 1 })
        }
        value={value.format ?? ""}
      >
        <option value="">Todos los formatos</option>
        {trainingFormats.map((format) => (
          <option key={format.slug} value={format.slug}>
            {format.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Dificultad"
        className={control}
        onChange={(event) =>
          onChange({
            difficulty:
              (event.target.value as TrainingSearchQuery["difficulty"]) ||
              undefined,
            page: 1,
          })
        }
        value={value.difficulty ?? ""}
      >
        <option value="">Toda dificultad</option>
        <option value="fundamentals">Fundamentos</option>
        <option value="application">Aplicación</option>
        <option value="advanced">Avanzado</option>
        <option value="expert">Experto</option>
      </select>
      <select
        aria-label="Plan"
        className={control}
        onChange={(event) =>
          onChange({
            plan:
              (event.target.value as TrainingSearchQuery["plan"]) || undefined,
            page: 1,
          })
        }
        value={value.plan ?? ""}
      >
        <option value="">Todos los planes</option>
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="unlimited">Unlimited</option>
      </select>
    </div>
  );
}
