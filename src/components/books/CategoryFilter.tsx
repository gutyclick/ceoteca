'use client';

export const categoryOptions = [
  'Todos',
  'Finanzas',
  'Hábitos',
  'Productividad',
  'Emprendimiento',
  'Psicología',
  'Liderazgo',
] as const;

export type CategoryOption = (typeof categoryOptions)[number];

export function CategoryFilter({
  value,
  onChange,
}: {
  value: CategoryOption;
  onChange: (value: CategoryOption) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Filtrar por categoría">
      {categoryOptions.map((category) => (
        <button
          key={category}
          type="button"
          className={`focus-ring rounded-full px-4 py-2 text-sm transition ${
            value === category ? 'bg-white text-black' : 'bg-white/10 text-zinc-200 hover:bg-white/15'
          }`}
          aria-pressed={value === category}
          onClick={() => onChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
