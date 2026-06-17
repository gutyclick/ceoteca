import { AlertTriangle } from 'lucide-react';

export function ErrorState({
  title = 'Algo salió mal',
  description = 'No pudimos cargar esta sección. Inténtalo de nuevo.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-6">
      <AlertTriangle className="h-6 w-6 text-amber-300" aria-hidden="true" />
      <h2 className="mt-3 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-zinc-300">{description}</p>
    </div>
  );
}
