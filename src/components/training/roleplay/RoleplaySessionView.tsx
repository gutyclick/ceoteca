"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMachine } from "@xstate/react";
import { Lightbulb, Loader2, Pause, Play, Send, Target, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import {
  finishRoleplay,
  getRoleplayHint,
  getRoleplaySession,
  pauseRoleplay,
  resumeRoleplay,
  sendRoleplayMessage,
} from "@/lib/training/api-client";
import { roleplayMachine } from "@/lib/training/roleplay-machine";

type Message = {
  id: string;
  role: "user" | "character";
  content: string;
  turn_number: number;
  created_at: string;
};
export function RoleplaySessionView({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [state, send] = useMachine(roleplayMachine);
  const [messages, setMessages] = useState<Message[]>([]);
  const [session, setSession] = useState<
    Awaited<ReturnType<typeof getRoleplaySession>>["session"] | null
  >(null);
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState("");
  const [showExit, setShowExit] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    void getRoleplaySession(sessionId)
      .then((data) => {
        if (!active) return;
        setSession(data.session);
        setMessages(data.messages);
        send({ type: "LOADED" });
      })
      .catch((cause: unknown) =>
        send({
          type: "FAIL",
          error:
            cause instanceof Error
              ? cause.message
              : "No pudimos cargar la simulación.",
        }),
      );
    return () => {
      active = false;
    };
  }, [send, sessionId]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, state.value]);
  async function submit() {
    const message = draft.trim();
    if (message.length < 2 || !state.matches("ready")) return;
    const optimistic: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      turn_number: (session?.turn_count ?? 0) + 1,
      created_at: new Date().toISOString(),
    };
    setDraft("");
    setMessages((current) => [...current, optimistic]);
    send({ type: "SEND" });
    try {
      const result = await sendRoleplayMessage(
        sessionId,
        message,
        optimistic.id,
      );
      setMessages((current) => [...current, result.message]);
      setSession((current) =>
        current
          ? {
              ...current,
              turn_count: result.turn,
              quota_consumed_at:
                current.quota_consumed_at ?? new Date().toISOString(),
            }
          : current,
      );
      send({ type: "REPLIED" });
    } catch (cause) {
      send({
        type: "FAIL",
        error:
          cause instanceof Error
            ? cause.message
            : "No pudimos responder. Tu mensaje quedó guardado.",
      });
    }
  }
  async function pause() {
    send({ type: "PAUSE" });
    try {
      await pauseRoleplay(sessionId);
      send({ type: "PAUSED" });
      setSession((current) =>
        current ? { ...current, status: "paused" } : current,
      );
    } catch (cause) {
      send({
        type: "FAIL",
        error: cause instanceof Error ? cause.message : "No pudimos pausar.",
      });
    }
  }
  async function resume() {
    send({ type: "RESUME" });
    try {
      const data = await resumeRoleplay(sessionId);
      setSession(data.session);
      setMessages(data.messages);
      send({ type: "RESUMED" });
    } catch (cause) {
      send({
        type: "FAIL",
        error: cause instanceof Error ? cause.message : "No pudimos reanudar.",
      });
    }
  }
  async function finish() {
    setShowExit(false);
    send({ type: "FINISH" });
    try {
      await finishRoleplay(sessionId);
      send({ type: "EVALUATING" });
      router.push(`/ejercicios/simulaciones/sesiones/${sessionId}/resultados`);
    } catch (cause) {
      send({
        type: "FAIL",
        error: cause instanceof Error ? cause.message : "No pudimos finalizar.",
      });
    }
  }
  async function requestHint() {
    try {
      const result = await getRoleplayHint(sessionId);
      setHint(result.hint);
    } catch (cause) {
      setHint(
        cause instanceof Error
          ? cause.message
          : "No hay más pistas disponibles.",
      );
    }
  }
  const snapshot = session?.scenario_snapshot ?? {};
  const title = String(snapshot.title ?? "Simulación");
  const character = String(snapshot.characterName ?? "Personaje");
  return (
    <main className="flex h-[100svh] min-h-[640px] flex-col overflow-hidden bg-[#fbfaf8] text-slate-950">
      <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
        <Logo />
        <div className="min-w-0 text-center">
          <h1 className="truncate text-sm font-black sm:text-base">{title}</h1>
          <p className="text-xs text-slate-500">Conversación con {character}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label={state.matches("paused") ? "Reanudar" : "Pausar"}
            className="grid h-10 w-10 place-items-center rounded-[8px] border border-slate-200 hover:border-violet-300"
            onClick={state.matches("paused") ? resume : pause}
            type="button"
          >
            {state.matches("paused") ? <Play size={18} /> : <Pause size={18} />}
          </button>
          <button
            aria-label="Finalizar simulación"
            className="grid h-10 w-10 place-items-center rounded-[8px] border border-slate-200 hover:border-red-300 hover:text-red-600"
            onClick={() => setShowExit(true)}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
      </header>
      <div className="mx-auto grid min-h-0 w-full max-w-[1320px] flex-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200 bg-white p-5 lg:block">
          <div className="rounded-[8px] bg-violet-50 p-4">
            <Target className="text-violet-600" />
            <strong className="mt-3 block">Tu objetivo</strong>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {String(
                snapshot.learnerGoal ??
                  "Conduce la conversación hacia un próximo paso claro.",
              )}
            </p>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Turnos</span>
              <strong>
                {session?.turn_count ?? 0} / {session?.max_turns ?? 0}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Dificultad</span>
              <strong className="capitalize">{session?.difficulty}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Estado</span>
              <strong>
                {state.matches("paused") ? "Pausada" : "En curso"}
              </strong>
            </div>
          </div>
          <p className="mt-6 rounded-[8px] border border-slate-200 p-3 text-xs leading-5 text-slate-500">
            Practica con naturalidad. CEO evaluará decisiones y evidencias, no
            una frase perfecta.
          </p>
        </aside>
        <section className="flex min-h-0 flex-col">
          <div
            aria-live="polite"
            className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8"
          >
            <div className="mx-auto max-w-3xl space-y-5">
              {messages.map((message) => (
                <div
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  key={message.id}
                >
                  <div
                    className={`max-w-[88%] rounded-[8px] px-4 py-3 text-sm leading-6 sm:max-w-[75%] ${message.role === "user" ? "bg-violet-600 text-white" : "border border-slate-200 bg-white text-slate-700"}`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {hint ? (
                <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                  <div className="flex items-center gap-2 font-black">
                    <Lightbulb size={17} /> Pista
                  </div>
                  <p className="mt-1">{hint}</p>
                </div>
              ) : null}
              {state.matches("characterThinking") ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="animate-spin" size={16} />
                  {character} está pensando…
                </div>
              ) : null}
              {state.matches("providerFailed") ? (
                <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <strong>No pudimos continuar este turno.</strong>
                  <p className="mt-1">{state.context.error}</p>
                  <button
                    className="mt-3 font-bold text-violet-700"
                    onClick={() => send({ type: "RETRY" })}
                    type="button"
                  >
                    Volver a intentar
                  </button>
                </div>
              ) : null}
              <div ref={endRef} />
            </div>
          </div>
          <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-end gap-2 rounded-[8px] border border-slate-300 bg-white p-2 focus-within:border-violet-500">
                <button
                  aria-label="Pedir una pista"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-[8px] border border-slate-200 text-amber-600 hover:border-amber-300"
                  onClick={requestHint}
                  type="button"
                >
                  <Lightbulb size={18} />
                </button>
                <textarea
                  aria-label="Tu respuesta"
                  className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-2 py-3 text-sm outline-none"
                  disabled={!state.matches("ready")}
                  maxLength={1500}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void submit();
                    }
                  }}
                  placeholder={
                    state.matches("paused")
                      ? "Reanuda la simulación para continuar"
                      : "Escribe cómo responderías…"
                  }
                  rows={1}
                  value={draft}
                />
                <button
                  aria-label="Enviar respuesta"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-[8px] bg-violet-600 text-white disabled:bg-slate-200"
                  disabled={draft.trim().length < 2 || !state.matches("ready")}
                  onClick={submit}
                  type="button"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>La IA puede cometer errores. Practica con criterio.</span>
                <span>{draft.length}/1500</span>
              </div>
            </div>
          </div>
        </section>
      </div>
      {showExit ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-[8px] border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-black">
              ¿Quieres finalizar la simulación?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Al finalizar, CEO evaluará la conversación completa.
            </p>
            <div className="mt-6 grid gap-2">
              <button
                className="min-h-11 rounded-[8px] bg-violet-600 font-bold text-white"
                onClick={finish}
                type="button"
              >
                Finalizar y evaluar
              </button>
              <button
                className="min-h-11 rounded-[8px] border border-slate-200 font-bold"
                onClick={() => {
                  setShowExit(false);
                  void pause();
                }}
                type="button"
              >
                Guardar para continuar
              </button>
              <button
                className="min-h-11 font-bold text-slate-500"
                onClick={() => setShowExit(false)}
                type="button"
              >
                Seguir practicando
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
