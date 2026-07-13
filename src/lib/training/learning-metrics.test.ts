import { describe, expect, it } from "vitest";
import { calculateExerciseAnalytics, calculateRetention, classifyDistractor, type MetricAttempt } from "@/lib/training/learning-metrics";

const attempts = (count: number): MetricAttempt[] => Array.from({ length: count }, (_, index) => ({ userId:`user-${index}`, attemptNumber:1, score:index < count / 2 ? 1 : 0, isCorrect:index < count / 2, hintsUsed:0, responseTimeMs:30_000, masteryBefore:index < count / 2 ? "high" : "low", occurredAt:"2026-07-01T12:00:00.000Z", cognitiveLevel:"application" }));

describe("learning metrics", () => {
  it("no califica calidad con una muestra insuficiente", () => {
    const result=calculateExerciseAnalytics(attempts(5),{},20,10);
    expect(result.dataStatus).toBe("insufficient_data");
    expect(result.qualityScore).toBeNull();
  });
  it("calcula métricas explicables cuando existe evidencia", () => {
    const result=calculateExerciseAnalytics(attempts(20),{viewedCount:22,abandonedCount:2},20,10);
    expect(result.dataStatus).toBe("sufficient");
    expect(result.firstAttemptAccuracy).toBe(0.5);
    expect(result.discriminationIndex).toBe(1);
    expect(result.qualityBreakdown).toHaveProperty("appropriateDifficulty");
  });
  it("clasifica distractores sin sobrerreaccionar a muestras pequeñas", () => {
    expect(classifyDistractor({selectionRate:0,highMasteryRate:0,lowMasteryRate:0,sampleSize:4,minimumSample:20})).toBe("insufficient_data");
    expect(classifyDistractor({selectionRate:0.01,highMasteryRate:0,lowMasteryRate:0.2,sampleSize:30,minimumSample:20})).toBe("unused");
  });
  it("mide retención solo cuando ambas ventanas tienen muestra suficiente", () => {
    expect(calculateRetention([1],[1],10).dataStatus).toBe("insufficient_data");
    const result=calculateRetention(Array(10).fill(1),[...Array(8).fill(1),0,0],10);
    expect(result.retentionRate).toBe(0.8);
    expect(result.retentionDecay).toBe(0.2);
  });
});
