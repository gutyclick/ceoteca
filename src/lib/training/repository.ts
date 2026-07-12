import { getTrainingSession } from "@/data/training-sessions";
import { progressSchema, resultSchema, trainingSessionSchema } from "@/lib/training/schemas";
import type { TrainingSessionProgress, TrainingSessionRepository, TrainingSessionResult } from "@/types/training-engine";

const key = (kind: "progress" | "result", id: string) => `ceoteca:training:${kind}:${id}`;
export class MockTrainingSessionRepository implements TrainingSessionRepository {
  async getSession(sessionId: string) { const session = getTrainingSession(sessionId); if (!session) throw new Error("SESSION_NOT_FOUND"); return trainingSessionSchema.parse(session); }
  async getProgress(sessionId: string) { if (typeof window === "undefined") return null; const raw = window.localStorage.getItem(key("progress", sessionId)); if (!raw) return null; return progressSchema.parse(JSON.parse(raw)) as TrainingSessionProgress; }
  async getResult(sessionId: string) { if (typeof window === "undefined") return null; const raw = window.localStorage.getItem(key("result", sessionId)); return raw ? resultSchema.parse(JSON.parse(raw)) as TrainingSessionResult : null; }
  async saveProgress(progress: TrainingSessionProgress) { if (typeof window === "undefined") return; window.localStorage.setItem(key("progress", progress.sessionId), JSON.stringify(progressSchema.parse(progress))); }
  async completeSession(result: TrainingSessionResult) { if (typeof window === "undefined") return; const validated = resultSchema.parse(result); window.localStorage.setItem(key("result", result.sessionId), JSON.stringify(validated)); }
  async clearSession(sessionId: string) { if (typeof window === "undefined") return; window.localStorage.removeItem(key("progress", sessionId)); window.localStorage.removeItem(key("result", sessionId)); }
}
export const trainingRepository = new MockTrainingSessionRepository();
