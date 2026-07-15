"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  Loader2,
  LockKeyhole,
  MessagesSquare,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getRoleplayScenario,
  startRoleplay,
  type RoleplayScenarioDto,
} from "@/lib/training/api-client";

type Detail = RoleplayScenarioDto & {
  learner_goal: string;
  publicConfig: Record<string, unknown>;
  access: { plan: string; remaining: number | null; unlimited: boolean };
};
export function RoleplayPreparationView({ slug, pathItemId }: { slug: string; pathItemId?: string }) {
  const router = useRouter();
  const [scenario, setScenario] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  useEffect(() => {
    void getRoleplayScenario(slug)
      .then(setScenario)
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "No pudimos cargar el escenario.",
        ),
      );
  }, [slug]);
  async function start() {
    if (!scenario?.canStart) return;
    setStarting(true);
    setError("");
    try {
      const result = await startRoleplay(scenario.id, scenario.level, pathItemId);
      router.push(`/ejercicios/simulaciones/sesiones/${result.sessionId}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos iniciar la simulación.",
      );
      setStarting(false);
    }
  }
  if (!scenario && !error)
    return (
      <div className="grid min-h-screen place-items-center bg-[#fbfaf8]">
        <Loader2 className="animate-spin text-violet-600" />
        <span className="sr-only">Cargando escenario</span>
      </div>
    );
  return (
    <main className="min-h-screen bg-[#fbfaf8] px-4 py-6 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-600 hover:text-violet-700"
          href="/ejercicios/simulaciones"
        >
          <ArrowLeft size={17} /> Volver a simulaciones
        </Link>
        {scenario ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="rounded-[8px] border border-slate-200 bg-white p-6 sm:p-8">
              <span className="text-sm font-bold text-violet-700">
                {scenario.category?.name}
              </span>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl">
                {scenario.public_title}
              </h1>
              <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                {scenario.short_description}
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[8px] bg-slate-50 p-4">
                  <Target className="text-violet-600" />
                  <strong className="mt-3 block">Objetivo</strong>
                  <p className="mt-1 text-sm text-slate-600">
                    {scenario.learner_goal}
                  </p>
                </div>
                <div className="rounded-[8px] bg-slate-50 p-4">
                  <MessagesSquare className="text-violet-600" />
                  <strong className="mt-3 block">Personaje</strong>
                  <p className="mt-1 text-sm text-slate-600">
                    Conversarás con {scenario.character_name}.
                  </p>
                </div>
                <div className="rounded-[8px] bg-slate-50 p-4">
                  <Clock3 className="text-violet-600" />
                  <strong className="mt-3 block">Duración</strong>
                  <p className="mt-1 text-sm text-slate-600">
                    Aproximadamente {scenario.estimated_minutes} minutos.
                  </p>
                </div>
              </div>
              <div className="mt-8 border-t border-slate-200 pt-6">
                <h2 className="font-black">Antes de comenzar</h2>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>• Responde como lo harías en una conversación real.</li>
                  <li>
                    • No existe una única frase correcta: importa tu criterio.
                  </li>
                  <li>
                    • Al finalizar recibirás evidencia, fortalezas y próximos
                    pasos.
                  </li>
                </ul>
              </div>
            </section>
            <aside className="h-fit rounded-[8px] border border-slate-200 bg-white p-6">
              <ShieldCheck className="text-emerald-600" size={26} />
              <h2 className="mt-4 text-xl font-black">Tu acceso</h2>
              <p className="mt-2 text-sm text-slate-600">
                Plan {scenario.access.plan}.{" "}
                {scenario.access.unlimited
                  ? "Acceso completo sujeto a límites técnicos."
                  : `${scenario.access.remaining ?? 0} simulaciones disponibles este mes.`}
              </p>
              {scenario.canStart ? (
                <>
                  <p className="mt-6 rounded-[8px] bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                    La simulación se descuenta cuando envías tu primera
                    respuesta válida y el personaje responde.
                  </p>
                  <button
                    className="mt-4 flex min-h-12 w-full items-center justify-center rounded-[8px] bg-violet-600 px-4 font-bold text-white hover:bg-violet-700 disabled:opacity-60"
                    disabled={starting}
                    onClick={start}
                    type="button"
                  >
                    {starting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Comenzar simulación"
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="mt-6 flex items-start gap-3 rounded-[8px] bg-violet-50 p-4 text-sm text-violet-900">
                    <LockKeyhole className="shrink-0" size={19} />
                    <span>
                      {scenario.lockedReason === "quota"
                        ? "Utilizaste las simulaciones incluidas este mes."
                        : "Este escenario no está incluido en tu plan actual."}
                    </span>
                  </div>
                  <Link
                    className="mt-4 flex min-h-12 items-center justify-center rounded-[8px] bg-violet-600 font-bold text-white"
                    href="/planes"
                  >
                    Ver planes
                  </Link>
                  <Link
                    className="mt-3 flex min-h-11 items-center justify-center rounded-[8px] border border-slate-200 text-sm font-bold"
                    href="/ejercicios"
                  >
                    Practicar con ejercicios
                  </Link>
                </>
              )}
            </aside>
          </div>
        ) : null}
        {error ? (
          <div className="mt-5 rounded-[8px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </div>
    </main>
  );
}
