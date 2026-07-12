import { createActor } from "xstate";
import { beforeEach, describe, expect, it } from "vitest";
import { trainingSessions } from "@/data/training-sessions";
import { evaluateAnswer, scoreAnswer } from "@/lib/training/evaluation";
import { MockTrainingSessionRepository } from "@/lib/training/repository";
import { calculateTrainingResult } from "@/lib/training/results";
import { createTrainingSessionMachine } from "@/lib/training/session-machine";
import type { AnswerRecord, TrainingSessionProgress } from "@/types/training-engine";

describe("training session machine", () => {
  it("carga, inicia y no avanza sin respuesta", () => { const actor = createActor(createTrainingSessionMachine(8)).start(); actor.send({ type: "SESSION_LOADED" }); expect(actor.getSnapshot().value).toBe("intro"); actor.send({ type: "START_SESSION" }); actor.send({ type: "SUBMIT_ANSWER" }); expect(actor.getSnapshot().value).toBe("answering"); });
  it("evita doble envío y muestra feedback", () => { const actor = createActor(createTrainingSessionMachine(8)).start(); actor.send({ type: "SESSION_LOADED" }); actor.send({ type: "START_SESSION" }); actor.send({ type: "ANSWER_CHANGED", hasAnswer: true }); actor.send({ type: "SUBMIT_ANSWER" }); actor.send({ type: "SUBMIT_ANSWER" }); expect(actor.getSnapshot().value).toBe("validating"); actor.send({ type: "ANSWER_CORRECT" }); expect(actor.getSnapshot().value).toBe("correctFeedback"); });
  it("permite reintento, pausa intermedia y finalización", () => { const actor = createActor(createTrainingSessionMachine(8)).start(); actor.send({ type: "SESSION_LOADED", restoredIndex: 3 }); actor.send({ type: "START_SESSION" }); actor.send({ type: "ANSWER_CHANGED", hasAnswer: true }); actor.send({ type: "SUBMIT_ANSWER" }); actor.send({ type: "ANSWER_INCORRECT" }); actor.send({ type: "RETRY" }); expect(actor.getSnapshot().value).toBe("answering"); actor.send({ type: "ANSWER_CHANGED", hasAnswer: true }); actor.send({ type: "SUBMIT_ANSWER" }); actor.send({ type: "ANSWER_CORRECT" }); actor.send({ type: "CONTINUE" }); expect(actor.getSnapshot().value).toBe("midpoint"); });
  it("maneja errores", () => { const actor = createActor(createTrainingSessionMachine(8)).start(); actor.send({ type: "FAIL", message: "fallo" }); expect(actor.getSnapshot().value).toBe("error"); expect(actor.getSnapshot().context.error).toBe("fallo"); });
});

describe("evaluation and results", () => {
  const session = trainingSessions[0];
  it("evalúa primer intento, reintento, pista y flashcard", () => { expect(evaluateAnswer(session.exercises[0], { type: "single_choice", optionId: "c" })).toBe(true); expect(scoreAnswer({ type: "single_choice", optionId: "c" }, true, 1, false)).toBe(100); expect(scoreAnswer({ type: "single_choice", optionId: "c" }, true, 2, false)).toBe(70); expect(scoreAnswer({ type: "single_choice", optionId: "c" }, true, 1, true)).toBe(80); expect(scoreAnswer({ type: "flashcard", rating: "almost" }, true, 1, false)).toBe(60); });
  it("produce fortalezas y áreas de revisión", () => { const answers: AnswerRecord[] = [{ exerciseId: session.exercises[0].id, answer: { type: "single_choice", optionId: "c" }, correct: true, attempts: 1, hintUsed: false, score: 100 }, { exerciseId: session.exercises[1].id, answer: { type: "multiple_choice", optionIds: ["client"] }, correct: false, attempts: 1, hintUsed: true, score: 0 }]; const result = calculateTrainingResult(session, answers, new Date(Date.now() - 120000).toISOString()); expect(result.correctAnswers).toBe(1); expect(result.hintsUsed).toBe(1); expect(result.strengths.length).toBeGreaterThan(0); expect(result.areasToReview.length).toBeGreaterThan(0); });
});

describe("MockTrainingSessionRepository", () => {
  beforeEach(() => window.localStorage.clear());
  it("guarda, restaura, completa y limpia", async () => { const repository = new MockTrainingSessionRepository(); const progress: TrainingSessionProgress = { sessionId: "value-proposition", currentExerciseIndex: 2, answers: [], attempts: {}, hintsUsed: [], startedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: "in_progress", midpointSeen: false }; await repository.saveProgress(progress); expect((await repository.getProgress(progress.sessionId))?.currentExerciseIndex).toBe(2); const result = calculateTrainingResult(trainingSessions[0], [], progress.startedAt); await repository.completeSession(result); expect((await repository.getResult(progress.sessionId))?.sessionId).toBe(progress.sessionId); await repository.clearSession(progress.sessionId); expect(await repository.getProgress(progress.sessionId)).toBeNull(); });
});
