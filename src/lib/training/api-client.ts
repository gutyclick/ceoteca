import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type {
  Exercise,
  ExerciseAnswer,
  TrainingSession,
} from "@/types/training-engine";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const supabase = createBrowserSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("UNAUTHORIZED");
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  const payload = (await response.json()) as {
    data?: T;
    error?: { message: string };
  };
  if (!response.ok || !payload.data)
    throw new Error(payload.error?.message ?? "TRAINING_API_ERROR");
  return payload.data;
}
export async function createRemoteTraining(templateSlug: string) {
  return request<{ sessionId: string }>("/api/training/sessions", {
    method: "POST",
    body: JSON.stringify({ templateSlug }),
  });
}
export async function getAdaptiveRecommendation(
  durationMinutes: 3 | 5 | 7 | 10 | 15,
) {
  return request<{
    id: string;
    primarySkillId: string;
    exerciseIds: string[];
    difficulty: "beginner" | "intermediate" | "advanced";
    requestedDurationMinutes: number;
    calculatedDurationMinutes: number;
    includesDeepAIEvaluation: boolean;
    explanation: {
      primaryReason: string;
      supportingReasons: string[];
      includesReview: boolean;
      includesNewContent: boolean;
    };
  }>("/api/training/recommendations", {
    method: "POST",
    body: JSON.stringify({ durationMinutes }),
  });
}
export async function acceptAdaptiveRecommendation(recommendationId: string) {
  return request<{ sessionId: string }>(
    `/api/training/recommendations/${recommendationId}/accept`,
    { method: "POST", body: "{}" },
  );
}

type Snapshot = {
  id: string;
  type: Exercise["type"];
  title?: string;
  prompt: string;
  instruction: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedSeconds?: number;
  hint?: string;
  explanation: string;
  content: Record<string, unknown>;
  minimumLength?: number;
  maximumLength?: number;
  allowRevision?: boolean;
  maxRevisions?: number;
};
export async function getRemoteTraining(
  sessionId: string,
): Promise<{ session: TrainingSession; currentExerciseIndex: number }> {
  const payload = await request<{
    session: {
      id: string;
      title: string;
      status: TrainingSession["status"];
      estimated_minutes: number;
      current_exercise_index: number;
    };
    exercises: Array<{ id: string; exercise_snapshot: Snapshot }>;
  }>(`/api/training/sessions/${sessionId}`);
  const exercises = payload.exercises.map(
    ({ id, exercise_snapshot: snapshot }) =>
      ({
        skill: "Aplicación práctica",
        concept: "Entrenamiento",
        ...snapshot,
        ...snapshot.content,
        id,
        correctOptionId: "__server__",
        correctOptionIds: [],
        correctValue: false,
        correctOrder: [],
        minimumLength: snapshot.minimumLength ?? 40,
        maximumLength: snapshot.maximumLength ?? 2500,
        allowRevision: snapshot.allowRevision ?? false,
        maxRevisions: snapshot.maxRevisions ?? 0,
      }) as Exercise,
  );
  return {
    currentExerciseIndex: payload.session.current_exercise_index,
    session: {
      id: payload.session.id,
      title: payload.session.title,
      description: "Entrenamiento personalizado con progreso seguro.",
      category: "CEOTECA Training",
      difficulty: "intermediate",
      estimatedMinutes: payload.session.estimated_minutes,
      skills: ["Aplicación práctica"],
      sourceBooks: [],
      exercises,
      status: payload.session.status,
      midpointEnabled: true,
      masteryBefore: 0,
    },
  };
}
export async function submitRemoteAnswer(
  sessionId: string,
  sessionExerciseId: string,
  answer: ExerciseAnswer,
  hintsUsed: number,
) {
  return request<{
    isCorrect: boolean;
    score: number;
    retryAllowed: boolean;
    feedback: string;
    explanation: string;
  }>(`/api/training/sessions/${sessionId}/answers`, {
    method: "POST",
    body: JSON.stringify({
      sessionExerciseId,
      answer,
      clientAttemptId: crypto.randomUUID(),
      hintsUsed,
    }),
  });
}
export async function completeRemoteTraining(sessionId: string) {
  return request<Record<string, unknown>>(
    `/api/training/sessions/${sessionId}/complete`,
    { method: "POST", body: "{}" },
  );
}

export async function evaluateRemoteOpenAnswer(
  sessionId: string,
  sessionExerciseId: string,
  answer: ExerciseAnswer,
) {
  return request<{
    evaluationId: string;
    answerId?: string;
    status: string;
    feedback: import("@/lib/training/ai-schemas").OpenEvaluation;
    cacheHit: boolean;
  }>(`/api/training/sessions/${sessionId}/open-answers`, {
    method: "POST",
    body: JSON.stringify({
      sessionExerciseId,
      answer,
      clientEvaluationId: crypto.randomUUID(),
    }),
  });
}

export async function evaluateRemoteRevision(
  answerId: string,
  answer: ExerciseAnswer,
) {
  return request<{
    evaluationId: string;
    answerId?: string;
    status: string;
    feedback: import("@/lib/training/ai-schemas").OpenEvaluation;
    revisionNumber: number;
  }>(`/api/training/answers/${answerId}/revisions`, {
    method: "POST",
    body: JSON.stringify({ answer, clientEvaluationId: crypto.randomUUID() }),
  });
}
