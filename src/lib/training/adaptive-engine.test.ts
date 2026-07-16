import { describe, expect, it } from "vitest";
import {
  RuleBasedAdaptiveTrainingEngine,
  scoreAdaptiveCandidate,
  selectDifficulty,
} from "@/lib/training/adaptive-engine";
import { calculateNextReviewDate } from "@/lib/training/adaptive-review";
import { getMonthlyAIQuotaSnapshot } from "@/lib/training/quota";
import type { AdaptiveCandidate } from "@/lib/training/adaptive-types";

const base: AdaptiveCandidate = {
  id: "a",
  skillId: "skill",
  conceptId: "concept",
  type: "single_choice",
  difficulty: "intermediate",
  estimatedSeconds: 50,
  mastery: 50,
  dueReview: false,
  recentErrors: 0,
  alignedWithGoal: false,
  isNew: false,
  prerequisiteEligible: true,
};
describe("motor adaptativo", () => {
  it("prioriza sesión activa, módulo y repaso en ese orden", () => {
    const now = "2026-07-12T12:00:00Z";
    const active = scoreAdaptiveCandidate(
      { ...base, activeSession: true },
      now,
    );
    const path = scoreAdaptiveCandidate(
      { ...base, activePathModule: true },
      now,
    );
    const review = scoreAdaptiveCandidate({ ...base, dueReview: true }, now);
    expect(active).toBeGreaterThan(path);
    expect(path).toBeGreaterThan(review);
  });

  it("excluye contenido bloqueado, sin renderer y role-play para Free", async () => {
    const candidates: AdaptiveCandidate[] = [
      { ...base, id: "locked", minimumPlan: "pro" },
      { ...base, id: "missing-renderer", rendererAvailable: false },
      { ...base, id: "roleplay", format: "conversational-roleplay" },
      {
        ...base,
        id: "eligible",
        format: "deterministic-practice",
        rendererAvailable: true,
      },
    ];
    const result =
      await new RuleBasedAdaptiveTrainingEngine().buildRecommendation({
        userId: "u",
        plan: "free",
        requestedDurationMinutes: 3,
        now: "2026-07-12T12:00:00Z",
        aiQuotaRemaining: 0,
        candidates,
      });
    expect(result.exerciseIds).toEqual(["eligible"]);
  });
  it("admite análisis visual cuando sus recursos están aprobados", async () => {
    const result =
      await new RuleBasedAdaptiveTrainingEngine().buildRecommendation({
        userId: "u",
        plan: "pro",
        requestedDurationMinutes: 3,
        now: "2026-07-12T12:00:00Z",
        aiQuotaRemaining: 1,
        candidates: [
          {
            ...base,
            id: "visual",
            type: "visual_diagnosis",
            format: "visual-analysis",
            minimumPlan: "pro",
            rendererAvailable: true,
            hasApprovedVisualAssets: true,
          },
        ],
      });

    expect(result.exerciseIds).toEqual(["visual"]);
  });
  it("prioriza repasos y errores recientes", () => {
    const now = "2026-07-12T12:00:00Z";
    expect(
      scoreAdaptiveCandidate({ ...base, dueReview: true }, now),
    ).toBeGreaterThan(scoreAdaptiveCandidate(base, now));
    expect(
      scoreAdaptiveCandidate({ ...base, recentErrors: 1 }, now),
    ).toBeGreaterThan(scoreAdaptiveCandidate(base, now));
  });
  it("adapta dificultad sin cambios agresivos", () => {
    expect(selectDifficulty(20)).toBe("beginner");
    expect(selectDifficulty(55)).toBe("intermediate");
    expect(selectDifficulty(90)).toBe("advanced");
    expect(selectDifficulty(90, 2)).toBe("beginner");
  });
  it("respeta variedad, prerequisitos y duración", async () => {
    const types = [
      "single_choice",
      "single_choice",
      "single_choice",
      "scenario",
      "ordering",
      "guided_builder",
      "true_false",
      "flashcard",
    ] as const;
    const candidates = types.map((type, index) => ({
      ...base,
      id: String(index),
      conceptId: `c${index % 3}`,
      type,
      estimatedSeconds: 50,
      dueReview: index === 0,
      prerequisiteEligible: index !== 7,
    }));
    const result =
      await new RuleBasedAdaptiveTrainingEngine().buildRecommendation({
        userId: "u",
        plan: "free",
        requestedDurationMinutes: 7,
        now: "2026-07-12T12:00:00Z",
        aiQuotaRemaining: 1,
        candidates,
      });
    expect(result.exerciseIds.length).toBeGreaterThanOrEqual(5);
    expect(result.exerciseIds).not.toContain("7");
    expect(result.explanation.includesReview).toBe(true);
  });
  it("dispersa repasos de forma determinista", () => {
    const value = calculateNextReviewDate(
      {
        score: 80,
        difficulty: "intermediate",
        attempts: 1,
        hintsUsed: 0,
        exposures: 2,
        seed: 4,
      },
      new Date("2026-07-12T12:00:00Z"),
    );
    expect(value.intervalDays).toBeGreaterThan(1);
    expect(value.scheduledFor).toBe(
      calculateNextReviewDate(
        {
          score: 80,
          difficulty: "intermediate",
          attempts: 1,
          hintsUsed: 0,
          exposures: 2,
          seed: 4,
        },
        new Date("2026-07-12T12:00:00Z"),
      ).scheduledFor,
    );
  });
  it("aplica una evaluación gratuita y reinicio mensual sin acumulación", () => {
    const available = getMonthlyAIQuotaSnapshot({
      plan: "free",
      completedUsage: 0,
      now: new Date("2026-07-31T20:00:00Z"),
      freeLimit: 1,
      paidLimit: 30,
    });
    const consumed = getMonthlyAIQuotaSnapshot({
      plan: "free",
      completedUsage: 1,
      now: new Date("2026-07-31T20:00:00Z"),
      freeLimit: 1,
      paidLimit: 30,
    });
    expect(available.remaining).toBe(1);
    expect(consumed.remaining).toBe(0);
    expect(consumed.resetsAt).toBe("2026-08-01T00:00:00.000Z");
  });
});
