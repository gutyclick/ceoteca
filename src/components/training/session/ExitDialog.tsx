import { useEffect } from "react";
export function ExitDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [onCancel]);
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4"
      role="dialog"
    >
      <section className="w-full max-w-md rounded-[8px] bg-white p-6">
        <h2 className="text-xl font-black">
          ¿Quieres salir del entrenamiento?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Tu progreso quedará guardado y podrás continuar después.
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button
            className="min-h-12 rounded-[8px] border border-slate-300 font-bold"
            onClick={onCancel}
            type="button"
          >
            Seguir entrenando
          </button>
          <button
            className="min-h-12 rounded-[8px] bg-violet-700 font-bold text-white"
            onClick={onConfirm}
            type="button"
          >
            Guardar y salir
          </button>
        </div>
      </section>
    </div>
  );
}
