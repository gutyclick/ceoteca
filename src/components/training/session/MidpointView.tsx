import { ArrowRight, TrendingUp } from "lucide-react";
export function MidpointView({
  correct,
  total,
  onContinue,
}: {
  correct: number;
  total: number;
  onContinue: () => void;
}) {
  return (
    <main className="grid min-h-[calc(100vh-80px)] w-full place-items-center bg-[#fbfaf8] px-4 py-10 text-slate-950">
      <section className="w-full max-w-2xl rounded-[8px] border border-slate-200 bg-white p-7 text-center sm:p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
          <TrendingUp size={30} />
        </span>
        <h1 className="mt-6 text-3xl font-black">Vas por la mitad</h1>
        <p className="mt-3 text-slate-600">
          Has resuelto correctamente {correct} de {total} ejercicios.
        </p>
        <div className="mt-7 grid gap-3 text-left sm:grid-cols-2">
          <div className="rounded-[8px] bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase text-emerald-700">
              Fortaleza
            </p>
            <p className="mt-1 font-bold">Claridad del beneficio</p>
          </div>
          <div className="rounded-[8px] bg-amber-50 p-4">
            <p className="text-xs font-black uppercase text-amber-700">
              Por reforzar
            </p>
            <p className="mt-1 font-bold">Diferenciación</p>
          </div>
        </div>
        <button
          className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-violet-700 px-6 font-bold text-white"
          onClick={onContinue}
          type="button"
        >
          Continuar entrenamiento
          <ArrowRight size={17} />
        </button>
      </section>
    </main>
  );
}
