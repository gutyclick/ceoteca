"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMachine } from "@xstate/react";
import { Loader2 } from "lucide-react";

import {
  evaluateAnswer,
  isAnswerComplete,
  scoreAnswer,
} from "@/lib/training/evaluation";
import { trainingRepository } from "@/lib/training/repository";
import { clientEnv } from "@/lib/env";
import {
  completeRemoteTraining,
  evaluateRemoteOpenAnswer,
  getRemoteTraining,
  submitRemoteAnswer,
} from "@/lib/training/api-client";
import { calculateTrainingResult } from "@/lib/training/results";
import { createTrainingSessionMachine } from "@/lib/training/session-machine";
import { ExerciseRenderer } from "@/components/training/session/ExerciseRenderer";
import { ExitDialog } from "@/components/training/session/ExitDialog";
import { FeedbackPanel } from "@/components/training/session/FeedbackPanel";
import { MidpointView } from "@/components/training/session/MidpointView";
import { SessionHeader } from "@/components/training/session/SessionHeader";
import { SessionIntro } from "@/components/training/session/SessionIntro";
import type {
  AnswerRecord,
  ExerciseAnswer,
  FeedbackState,
  TrainingSession,
  TrainingSessionProgress,
} from "@/types/training-engine";
import type { OpenEvaluation } from "@/lib/training/ai-schemas";

export function TrainingSessionFlow({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [restored, setRestored] = useState(false);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [answer, setAnswer] = useState<ExerciseAnswer | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [openEvaluation, setOpenEvaluation] = useState<OpenEvaluation | null>(
    null,
  );
  const [hint, setHint] = useState("");
  const [exitOpen, setExitOpen] = useState(false);
  const [loadError, setLoadError] = useState("");
  const machine = useMemo(() => createTrainingSessionMachine(8, true), []);
  const [state, send] = useMachine(machine);
  const index = state.context.exerciseIndex;
  const exercise = session?.exercises[index];

  useEffect(() => {
    if (
      exercise?.type === "ordering" &&
      answer === null &&
      state.matches("answering")
    ) {
      const initialAnswer: ExerciseAnswer = {
        type: "ordering",
        itemIds: exercise.items.map((item) => item.id),
      };
      setAnswer(initialAnswer);
      send({ type: "ANSWER_CHANGED", hasAnswer: true });
    }
  }, [answer, exercise, send, state]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const remote =
          clientEnv.NEXT_PUBLIC_TRAINING_DATA_SOURCE === "supabase";
        const remotePayload = remote
          ? await getRemoteTraining(sessionId)
          : null;
        const loaded = remotePayload
          ? remotePayload.session
          : await trainingRepository.getSession(sessionId);
        const progress = await trainingRepository.getProgress(sessionId);
        if (!active) return;
        setSession(loaded);
        if (progress) {
          setRecords(progress.answers);
          setRestored(true);
        }
        send({
          type: "SESSION_LOADED",
          restoredIndex:
            progress?.currentExerciseIndex ??
            remotePayload?.currentExerciseIndex ??
            0,
        });
      } catch (error) {
        const message =
          error instanceof Error && error.message === "SESSION_NOT_FOUND"
            ? "No encontramos este entrenamiento."
            : "No pudimos cargar el entrenamiento.";
        setLoadError(message);
        send({ type: "FAIL", message });
      }
    })();
    return () => {
      active = false;
    };
  }, [send, sessionId]);

  const makeProgress = useCallback(
    (
      nextRecords = records,
      nextIndex = index,
      status: TrainingSessionProgress["status"] = "in_progress",
    ): TrainingSessionProgress => {
      const now = new Date().toISOString();
      return {
        sessionId,
        currentExerciseIndex: nextIndex,
        answers: nextRecords,
        attempts: Object.fromEntries(
          nextRecords.map((record) => [record.exerciseId, record.attempts]),
        ),
        hintsUsed: nextRecords
          .filter((record) => record.hintUsed)
          .map((record) => record.exerciseId),
        startedAt:
          window.localStorage.getItem(
            `ceoteca:training:started:${sessionId}`,
          ) ?? now,
        updatedAt: now,
        status,
        midpointSeen: state.context.midpointSeen,
      };
    },
    [index, records, sessionId, state.context.midpointSeen],
  );
  const save = useCallback(
    async (nextRecords = records, nextIndex = index) => {
      try {
        await trainingRepository.saveProgress(
          makeProgress(nextRecords, nextIndex),
        );
      } catch (error) {
        if (process.env.NODE_ENV === "development")
          console.error("Training save failed", error);
        setLoadError(
          "No pudimos guardar localmente. Mantén esta pestaña abierta e inténtalo de nuevo.",
        );
      }
    },
    [index, makeProgress, records],
  );

  function start() {
    if (!window.localStorage.getItem(`ceoteca:training:started:${sessionId}`))
      window.localStorage.setItem(
        `ceoteca:training:started:${sessionId}`,
        new Date().toISOString(),
      );
    send({ type: "START_SESSION" });
  }
  function changeAnswer(next: ExerciseAnswer) {
    setAnswer(next);
    send({ type: "ANSWER_CHANGED", hasAnswer: isAnswerComplete(next) });
  }
  async function submit() {
    if (!exercise || !answer || !state.matches("answering")) return;
    send({ type: "SUBMIT_ANSWER" });
    const attempts =
      (records.find((item) => item.exerciseId === exercise.id)?.attempts ?? 0) +
      1;
    const remote = clientEnv.NEXT_PUBLIC_TRAINING_DATA_SOURCE === "supabase";
    const open = new Set([
      "open_response",
      "guided_builder",
      "decision_justification",
      "reflection",
      "visual_annotation",
      "message_response",
      "message_comparison",
      "tone_adjustment",
      "objection_response",
      "email_rewrite",
      "conversation_diagnosis",
    ]).has(exercise.type);
    let official = null;
    if (remote && open) {
      try {
        const evaluated = await evaluateRemoteOpenAnswer(
          sessionId,
          exercise.id,
          answer,
        );
        setOpenEvaluation(evaluated.feedback);
        official = {
          isCorrect: evaluated.feedback.overallScore >= 60,
          score: evaluated.feedback.overallScore,
          explanation: evaluated.feedback.summaryFeedback,
        };
      } catch {
        official = {
          isCorrect: true,
          score: 50,
          explanation:
            "Conservamos tu respuesta. Revísala con la rúbrica y continúa cuando estés listo.",
        };
      }
    } else if (remote) {
      try {
        official = await submitRemoteAnswer(
          sessionId,
          exercise.id,
          answer,
          hint ? 1 : 0,
        );
      } catch {
        setLoadError(
          "No pudimos enviar la respuesta. Tu avance local permanece en este dispositivo; vuelve a intentarlo cuando recuperes conexión.",
        );
      }
    }
    const correct = official?.isCorrect ?? evaluateAnswer(exercise, answer);
    const record: AnswerRecord = {
      exerciseId: exercise.id,
      answer,
      correct,
      attempts,
      hintUsed: Boolean(hint),
      score:
        official?.score ??
        scoreAnswer(answer, correct, attempts, Boolean(hint)),
    };
    const next = [
      ...records.filter((item) => item.exerciseId !== exercise.id),
      record,
    ];
    setRecords(next);
    setFeedback({
      kind: exercise.type === "flashcard" || correct ? "correct" : "incorrect",
      explanation: official?.explanation ?? exercise.explanation,
      principle:
        exercise.type === "scenario"
          ? exercise.principle
          : "Una idea útil conecta contexto, decisión y resultado.",
    });
    await save(next, index);
    send({ type: correct ? "ANSWER_CORRECT" : "ANSWER_INCORRECT" });
  }
  function retry() {
    setAnswer(null);
    setFeedback(null);
    setOpenEvaluation(null);
    setHint("");
    send({ type: "RETRY" });
  }
  async function continueFlow() {
    if (!session) return;
    const last = index >= session.exercises.length - 1;
    send({ type: "CONTINUE" });
    if (last) {
      if (clientEnv.NEXT_PUBLIC_TRAINING_DATA_SOURCE === "supabase")
        await completeRemoteTraining(session.id);
      const progress = makeProgress(records, index, "completed");
      const result = calculateTrainingResult(
        session,
        records,
        progress.startedAt,
      );
      await trainingRepository.saveProgress({
        ...progress,
        completedAt: result.completedAt,
      });
      await trainingRepository.completeSession(result);
      router.push(`/ejercicios/${session.id}/resultados`);
      return;
    }
    setAnswer(null);
    setFeedback(null);
    setOpenEvaluation(null);
    setHint("");
    await save(records, index + 1);
  }
  function requestExit() {
    if (records.length === 0) router.push("/ejercicios");
    else setExitOpen(true);
  }

  if (state.matches("loading"))
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbfaf8]">
        <Loader2
          aria-label="Cargando entrenamiento"
          className="animate-spin text-violet-700 motion-reduce:animate-none"
          size={32}
        />
      </main>
    );
  if (state.matches("error") || !session)
    return (
      <main className="grid min-h-screen place-items-center bg-[#fbfaf8] p-4">
        <section className="max-w-md rounded-[8px] border border-rose-200 bg-white p-7 text-center">
          <h1 className="text-2xl font-black">Entrenamiento no disponible</h1>
          <p className="mt-2 text-slate-600">
            {loadError || state.context.error}
          </p>
          <button
            className="mt-6 min-h-12 rounded-[8px] bg-violet-700 px-6 font-bold text-white"
            onClick={() => router.push("/ejercicios")}
            type="button"
          >
            Volver a Training
          </button>
        </section>
      </main>
    );
  if (state.matches("intro"))
    return (
      <>
        <SessionHeader
          current={index}
          onExit={() => router.push("/ejercicios")}
          total={session.exercises.length}
        />
        <SessionIntro
          onBack={() => router.push("/ejercicios")}
          onStart={start}
          restored={restored}
          session={session}
        />
      </>
    );
  if (state.matches("midpoint"))
    return (
      <>
        <SessionHeader
          current={index + 1}
          onExit={requestExit}
          total={session.exercises.length}
        />
        <MidpointView
          correct={records.filter((record) => record.correct).length}
          onContinue={() => send({ type: "CONTINUE_MIDPOINT" })}
          total={index + 1}
        />
      </>
    );
  if (state.matches("results"))
    return (
      <main className="grid min-h-screen place-items-center">
        <Loader2 className="animate-spin text-violet-700" />
      </main>
    );
  if (!exercise) return null;
  const locked =
    state.matches("validating") ||
    state.matches("correctFeedback") ||
    state.matches("incorrectFeedback");
  return (
    <main className="min-h-screen bg-[#fbfaf8] text-slate-950">
      <SessionHeader
        current={index + 1}
        onExit={requestExit}
        total={session.exercises.length}
      />
      <div className="mx-auto w-full max-w-[840px] px-4 py-8 pb-28 sm:px-6 sm:py-12">
        <div className="mb-7 flex items-center justify-between text-sm font-semibold text-slate-500">
          <span>
            Ejercicio {index + 1} de {session.exercises.length}
          </span>
          <span>{session.category}</span>
        </div>
        <ExerciseRenderer
          currentAnswer={answer}
          disabled={locked}
          exercise={exercise}
          feedbackState={feedback}
          onAnswerChange={changeAnswer}
          onRequestHint={() => setHint(exercise.hint ?? "")}
        />
        {hint && !feedback ? (
          <p
            aria-live="polite"
            className="mt-3 rounded-[8px] bg-amber-50 p-4 text-sm leading-6 text-amber-950"
          >
            {hint}
          </p>
        ) : null}
        {feedback ? (
          <>
            {openEvaluation ? (
              <section
                aria-live="polite"
                className="mt-6 rounded-[8px] border border-violet-200 bg-violet-50 p-5"
              >
                <h2 className="text-lg font-black">
                  {openEvaluation.verdict === "strong"
                    ? "Respuesta sólida"
                    : openEvaluation.verdict === "good_foundation"
                      ? "Buena base"
                      : "Puedes hacerla más clara"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {openEvaluation.summaryFeedback}
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-black">Lo que hiciste bien</h3>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {openEvaluation.strengths.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-black">Qué puedes mejorar</h3>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {openEvaluation.improvements.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  Evaluación generada por IA según la rúbrica de este ejercicio.
                </p>
              </section>
            ) : null}
            <FeedbackPanel
              canRetry={
                records.find((item) => item.exerciseId === exercise.id)
                  ?.attempts === 1 && exercise.type !== "flashcard"
              }
              exercise={exercise}
              feedback={feedback}
              onContinue={() => void continueFlow()}
              onRetry={retry}
            />
          </>
        ) : (
          <div className="mt-7">
            <button
              className="min-h-12 w-full rounded-[8px] bg-violet-700 px-6 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              disabled={
                !isAnswerComplete(answer) || !state.matches("answering")
              }
              onClick={() => void submit()}
              type="button"
            >
              {state.matches("validating")
                ? "Comprobando..."
                : "Comprobar respuesta"}
            </button>
          </div>
        )}
        {loadError ? (
          <p role="alert" className="mt-4 text-sm text-rose-700">
            {loadError}
          </p>
        ) : null}
      </div>
      {exitOpen ? (
        <ExitDialog
          onCancel={() => setExitOpen(false)}
          onConfirm={() => {
            void save();
            router.push("/ejercicios");
          }}
        />
      ) : null}
    </main>
  );
}
