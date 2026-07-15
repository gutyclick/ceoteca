"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function TrainingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-[70vh] place-items-center bg-[#fbfaf8] p-6 text-slate-950">
      <section className="w-full max-w-lg rounded-[8px] border border-slate-200 bg-white p-6 text-center">
        <AlertCircle
          aria-hidden="true"
          className="mx-auto text-amber-600"
          size={32}
        />
        <h1 className="mt-4 text-xl font-black">
          Training no está disponible ahora
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          No pudimos cargar esta sección. Puedes intentarlo otra vez o volver al
          inicio.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            className="min-h-11 rounded-[8px] bg-violet-700 px-4 text-sm font-bold text-white"
            onClick={reset}
            type="button"
          >
            Intentar de nuevo
          </button>
          <Link
            className="inline-flex min-h-11 items-center rounded-[8px] border border-slate-200 px-4 text-sm font-bold text-slate-700"
            href="/home"
          >
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
