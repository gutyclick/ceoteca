"use client";
import { useEffect, useState } from "react";
import { Loader2, MessagesSquare, Plus } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
type Data = {
  scenarios: Array<{
    id: string;
    slug: string;
    public_title: string;
    short_description: string;
    status: string;
    level: string;
    minimum_plan: string;
    training_roleplay_categories: { name: string } | null;
  }>;
  categories: Array<{ id: string; name: string; slug: string }>;
};
async function api<T>(url: string, init?: RequestInit) {
  const supabase = createBrowserSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${data.session?.access_token}`,
      ...init?.headers,
    },
  });
  const payload = (await response.json()) as {
    data?: T;
    error?: { message: string };
  };
  if (!response.ok || !payload.data)
    throw new Error(payload.error?.message ?? "Error editorial");
  return payload.data;
}
export function AdminRoleplayScenarios() {
  const [data, setData] = useState<Data | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function load() {
    setData(await api<Data>("/api/admin/training/roleplay/scenarios"));
  }
  useEffect(() => {
    void load().catch((cause: unknown) =>
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos cargar los escenarios.",
      ),
    );
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/admin/training/roleplay/scenarios", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          slug: form.get("slug"),
          description: form.get("description"),
          categoryId: form.get("categoryId"),
          difficulty: form.get("difficulty"),
          characterName: form.get("characterName"),
          characterBrief: form.get("characterBrief"),
          learnerGoal: form.get("learnerGoal"),
          openingMessage: form.get("openingMessage"),
          estimatedMinutes: Number(form.get("estimatedMinutes")),
          maxTurns: Number(form.get("maxTurns")),
          minimumPlan: form.get("minimumPlan"),
        }),
      });
      setOpen(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-violet-700">
            Catálogo editorial
          </p>
          <h1 className="mt-1 text-3xl font-black">
            Simulaciones conversacionales
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Crea, valida y publica escenarios mediante versiones inmutables.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-[8px] bg-violet-600 px-4 text-sm font-bold text-white"
          onClick={() => setOpen(true)}
          type="button"
        >
          <Plus size={17} /> Nuevo escenario
        </button>
      </header>
      {error ? (
        <div className="mt-5 rounded-[8px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {!data ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Loader2 className="animate-spin text-violet-600" />
        </div>
      ) : (
        <div className="mt-7 overflow-hidden rounded-[8px] border border-slate-200 bg-white">
          <div className="grid grid-cols-[1fr_150px_120px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
            <span>Escenario</span>
            <span>Dificultad</span>
            <span>Estado</span>
          </div>
          {data.scenarios.map((item) => (
            <div
              className="grid grid-cols-[1fr_150px_120px] items-center border-b border-slate-100 px-4 py-4 text-sm last:border-0"
              key={item.id}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-[8px] bg-violet-50 text-violet-700">
                  <MessagesSquare size={18} />
                </span>
                <div>
                  <strong>{item.public_title}</strong>
                  <p className="text-xs text-slate-500">
                    {item.training_roleplay_categories?.name} · {item.slug}
                  </p>
                </div>
              </div>
              <span className="capitalize">{item.level}</span>
              <span className="capitalize">{item.status}</span>
            </div>
          ))}
        </div>
      )}
      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/30 p-4">
          <form
            className="mx-auto my-8 grid w-full max-w-3xl gap-4 rounded-[8px] bg-white p-6"
            onSubmit={submit}
          >
            <div className="flex justify-between">
              <h2 className="text-xl font-black">Nuevo escenario</h2>
              <button onClick={() => setOpen(false)} type="button">
                Cerrar
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold">
                Título
                <input
                  className="mt-1 min-h-11 w-full rounded-[8px] border border-slate-200 px-3 font-normal"
                  name="title"
                  required
                />
              </label>
              <label className="text-sm font-bold">
                Slug
                <input
                  className="mt-1 min-h-11 w-full rounded-[8px] border border-slate-200 px-3 font-normal"
                  name="slug"
                  required
                />
              </label>
              <label className="text-sm font-bold sm:col-span-2">
                Descripción
                <textarea
                  className="mt-1 min-h-20 w-full rounded-[8px] border border-slate-200 p-3 font-normal"
                  name="description"
                  required
                />
              </label>
              <label className="text-sm font-bold">
                Categoría
                <select
                  className="mt-1 min-h-11 w-full rounded-[8px] border border-slate-200 px-3 font-normal"
                  name="categoryId"
                >
                  {data?.categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-bold">
                Dificultad
                <select
                  className="mt-1 min-h-11 w-full rounded-[8px] border border-slate-200 px-3 font-normal"
                  name="difficulty"
                >
                  <option value="fundamentals">Fundamentos</option>
                  <option value="application">Aplicación</option>
                  <option value="advanced">Avanzado</option>
                  <option value="expert">Experto</option>
                </select>
              </label>
              <label className="text-sm font-bold">
                Personaje
                <input
                  className="mt-1 min-h-11 w-full rounded-[8px] border border-slate-200 px-3 font-normal"
                  name="characterName"
                  required
                />
              </label>
              <label className="text-sm font-bold">
                Plan mínimo
                <select
                  className="mt-1 min-h-11 w-full rounded-[8px] border border-slate-200 px-3 font-normal"
                  name="minimumPlan"
                >
                  <option value="pro">Pro</option>
                  <option value="unlimited">Unlimited</option>
                </select>
              </label>
              <label className="text-sm font-bold sm:col-span-2">
                Contexto privado
                <textarea
                  className="mt-1 min-h-20 w-full rounded-[8px] border border-slate-200 p-3 font-normal"
                  name="characterBrief"
                  required
                />
              </label>
              <label className="text-sm font-bold sm:col-span-2">
                Objetivo del participante
                <textarea
                  className="mt-1 min-h-20 w-full rounded-[8px] border border-slate-200 p-3 font-normal"
                  name="learnerGoal"
                  required
                />
              </label>
              <label className="text-sm font-bold sm:col-span-2">
                Mensaje inicial
                <textarea
                  className="mt-1 min-h-20 w-full rounded-[8px] border border-slate-200 p-3 font-normal"
                  name="openingMessage"
                  required
                />
              </label>
              <label className="text-sm font-bold">
                Duración estimada
                <input
                  className="mt-1 min-h-11 w-full rounded-[8px] border border-slate-200 px-3 font-normal"
                  defaultValue="10"
                  min="3"
                  max="30"
                  name="estimatedMinutes"
                  type="number"
                />
              </label>
              <label className="text-sm font-bold">
                Turnos máximos
                <input
                  className="mt-1 min-h-11 w-full rounded-[8px] border border-slate-200 px-3 font-normal"
                  defaultValue="16"
                  min="4"
                  max="40"
                  name="maxTurns"
                  type="number"
                />
              </label>
            </div>
            <button
              className="min-h-11 rounded-[8px] bg-violet-600 font-bold text-white disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? "Guardando…" : "Guardar borrador"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
