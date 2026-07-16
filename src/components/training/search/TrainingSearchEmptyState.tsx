import { SearchX } from "lucide-react";

export function TrainingSearchEmptyState() {
  return (
    <div className="rounded-[8px] border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
      <SearchX className="mx-auto text-violet-600" size={34} />
      <h2 className="mt-4 text-xl font-black">No encontramos coincidencias</h2>
      <p className="mt-2 text-sm text-slate-500">
        Prueba un término más general o elimina algunos filtros.
      </p>
    </div>
  );
}
