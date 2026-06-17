import { SearchX } from 'lucide-react';

export function EmptyState({
  title = 'No hay resultados',
  description = 'Intenta ajustar la búsqueda o cambiar de categoría.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="glass rounded-3xl p-8 text-center">
      <SearchX className="mx-auto h-10 w-10 text-violet-300" aria-hidden="true" />
      <h2 className="mt-4 text-2xl font-black">{title}</h2>
      <p className="mt-2 text-zinc-300">{description}</p>
    </div>
  );
}
