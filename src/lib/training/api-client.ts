import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type {
  Exercise,
  ExerciseAnswer,
  TrainingSession,
} from "@/types/training-engine";
import type {
  TrainingCategoryCardViewModel,
  TrainingCategoryPageViewModel,
  TrainingHomeViewModel,
  TrainingSkillPageViewModel,
} from "@/lib/training/navigation-model";
import type {
  TrainingPathPageViewModel,
  TrainingPathsPageViewModel,
} from "@/lib/training/path-model";
import type {
  TrainingSearchQuery,
  TrainingSearchResultViewModel,
} from "@/lib/training/search-schemas";

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

export function getTrainingNavigationHome() {
  return request<TrainingHomeViewModel>("/api/training/navigation?view=home");
}
export function getTrainingNavigationCategories() {
  return request<TrainingCategoryCardViewModel[]>(
    "/api/training/navigation?view=categories",
  );
}
export function getTrainingNavigationCategory(slug: string) {
  return request<TrainingCategoryPageViewModel>(
    `/api/training/navigation?view=category&slug=${encodeURIComponent(slug)}`,
  );
}
export function getTrainingNavigationSkill(slug: string) {
  return request<TrainingSkillPageViewModel>(
    `/api/training/navigation?view=skill&slug=${encodeURIComponent(slug)}`,
  );
}

export function startLearningPath(pathSlug: string) {
  return request<{ path: TrainingPathPageViewModel; nextHref: string }>(
    `/api/training/paths/${pathSlug}/start`,
    { method: "POST" },
  );
}

export function getTrainingPaths(query = "") {
  return request<TrainingPathsPageViewModel>(`/api/training/paths${query}`);
}

export function getTrainingPath(pathSlug: string) {
  return request<TrainingPathPageViewModel>(
    `/api/training/paths/${encodeURIComponent(pathSlug)}`,
  );
}

export function searchTraining(input: TrainingSearchQuery) {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return request<{
    results: TrainingSearchResultViewModel[];
    total: number;
    page: number;
    pageSize: number;
    pages: number;
  }>(`/api/training/search?${params}`);
}

export function continueLearningPath(pathSlug: string) {
  return request<TrainingPathPageViewModel>(
    `/api/training/paths/${encodeURIComponent(pathSlug)}/continue`,
    { method: "POST", body: "{}" },
  );
}

export function startTrainingPathItem(itemId: string) {
  return request<{ sessionId: string | null; href: string }>(
    `/api/training/path-items/${encodeURIComponent(itemId)}/start`,
    { method: "POST", body: "{}" },
  );
}

export type RoleplayDifficulty =
  "fundamentals" | "application" | "advanced" | "expert";
export type RoleplayCategoryDto = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  skill_slugs: string[];
  scenarioCount: number;
};
export type RoleplayScenarioDto = {
  id: string;
  slug: string;
  public_title: string;
  short_description: string;
  category_id: string;
  level: RoleplayDifficulty;
  minimum_plan: string;
  estimated_minutes: number;
  max_turns: number;
  skill_slugs: string[];
  character_name: string;
  canStart: boolean;
  lockedReason: "plan" | "difficulty" | "quota" | null;
  category: RoleplayCategoryDto;
};
export type RoleplayCatalogDto = {
  enabled: boolean;
  access: {
    plan: string;
    canStart: boolean;
    remaining: number | null;
    monthlyLimit: number | null;
    unlimited: boolean;
    levels: RoleplayDifficulty[];
  };
  categories: RoleplayCategoryDto[];
  scenarios: RoleplayScenarioDto[];
  alternatives: {
    deterministicExercisesHref: string;
    unlimitedPlanHref: string;
  };
};

export function getRoleplayCatalog(query = "") {
  return request<RoleplayCatalogDto>(`/api/training/roleplay${query}`);
}
export function getRoleplayScenario(idOrSlug: string) {
  return request<
    RoleplayScenarioDto & {
      learner_goal: string;
      publicConfig: Record<string, unknown>;
      access: RoleplayCatalogDto["access"];
    }
  >(`/api/training/roleplay/scenarios/${idOrSlug}`);
}
export function startRoleplay(
  scenarioId: string,
  difficulty: RoleplayDifficulty,
  pathItemId?: string,
) {
  return request<{ sessionId: string; openingMessage?: string }>(
    "/api/training/roleplay/sessions",
    {
      method: "POST",
      body: JSON.stringify({
        scenarioId,
        difficulty,
        clientSessionId: crypto.randomUUID(),
        pathItemId,
      }),
    },
  );
}
export function getRoleplaySession(sessionId: string) {
  return request<{
    session: {
      id: string;
      status: string;
      scenario_snapshot: Record<string, unknown>;
      plan_snapshot: string;
      difficulty: RoleplayDifficulty;
      turn_count: number;
      max_turns: number;
      started_at: string;
      resume_expires_at: string;
      quota_consumed_at: string | null;
      evaluation_status: string;
    };
    messages: Array<{
      id: string;
      role: "user" | "character";
      content: string;
      turn_number: number;
      created_at: string;
    }>;
  }>(`/api/training/roleplay/sessions/${sessionId}`);
}
export function sendRoleplayMessage(
  sessionId: string,
  message: string,
  clientMessageId: string,
) {
  return request<{
    message: {
      id: string;
      role: "character";
      content: string;
      turn_number: number;
      created_at: string;
    };
    turn: number;
    idempotent: boolean;
  }>(`/api/training/roleplay/sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ clientMessageId, message }),
  });
}
export function getRoleplayHint(sessionId: string) {
  return request<{ hint: string; used: number; limit: number }>(
    `/api/training/roleplay/sessions/${sessionId}/hint`,
    { method: "POST", body: "{}" },
  );
}
export function pauseRoleplay(sessionId: string) {
  return request<{ id: string; resume_expires_at: string }>(
    `/api/training/roleplay/sessions/${sessionId}/pause`,
    { method: "POST", body: "{}" },
  );
}
export function resumeRoleplay(sessionId: string) {
  return request<Awaited<ReturnType<typeof getRoleplaySession>>>(
    `/api/training/roleplay/sessions/${sessionId}/resume`,
    { method: "POST", body: "{}" },
  );
}
export function finishRoleplay(sessionId: string) {
  return request<{ status: string; evaluationId?: string }>(
    `/api/training/roleplay/sessions/${sessionId}/finish`,
    { method: "POST", body: JSON.stringify({ reason: "user_ended" }) },
  );
}
export function getRoleplayEvaluation(sessionId: string) {
  return request<{
    id: string;
    status: string;
    overall_score: number | null;
    confidence: number | null;
    outcome: string | null;
    result:
      import("@/lib/training/roleplay-schemas").RoleplayEvaluationOutput | null;
    completed_at: string | null;
  }>(`/api/training/roleplay/sessions/${sessionId}/evaluation`);
}
export function getRoleplayHistory() {
  return request<{
    items: Array<{
      id: string;
      status: string;
      scenario_snapshot: Record<string, unknown>;
      difficulty: RoleplayDifficulty;
      turn_count: number;
      started_at: string;
      finished_at: string | null;
      evaluation_status: string;
      training_roleplay_evaluations: Array<{
        overall_score: number | null;
        outcome: string | null;
      }>;
    }>;
  }>("/api/training/roleplay/history");
}
export async function createRemoteTraining(templateSlug: string) {
  return request<{ sessionId: string }>("/api/training/sessions", {
    method: "POST",
    body: JSON.stringify({ templateSlug }),
  });
}
export async function getAdaptiveRecommendation(
  durationMinutes: 3 | 5 | 7 | 10 | 15,
  skillSlug?: string,
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
    body: JSON.stringify({ durationMinutes, skillSlug }),
  });
}
export async function acceptAdaptiveRecommendation(recommendationId: string) {
  return request<{ sessionId: string }>(
    `/api/training/recommendations/${recommendationId}/accept`,
    { method: "POST", body: "{}" },
  );
}

export async function trackTrainingNavigationEvent(
  eventName: import("@/lib/training/analytics-schemas").LearningEventName,
  properties: Record<string, unknown> = {},
) {
  return request<{ accepted: boolean }>("/api/training/analytics/events", {
    method: "POST",
    body: JSON.stringify({
      clientEventId: crypto.randomUUID(),
      eventName,
      occurredAt: new Date().toISOString(),
      properties,
    }),
  });
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
