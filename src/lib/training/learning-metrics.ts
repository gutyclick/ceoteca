import type { ExerciseQualityStatus } from "@/lib/training/analytics-schemas";

export type MetricAttempt = {
  userId: string;
  attemptNumber: number;
  score: number;
  isCorrect: boolean;
  hintsUsed: number;
  responseTimeMs: number | null;
  masteryBefore: "unknown" | "low" | "medium" | "high";
  occurredAt: string;
  cognitiveLevel?:
    | "recognition"
    | "understanding"
    | "application"
    | "analysis"
    | "transfer"
    | "synthesis";
};

export type ExerciseAnalytics = {
  attempts: number;
  uniqueUsers: number;
  completionRate: number;
  firstAttemptAccuracy: number;
  eventualAccuracy: number;
  retrySuccessRate: number;
  hintUsageRate: number;
  solutionViewRate: number;
  abandonmentRate: number;
  medianResponseTimeMs: number;
  p90ResponseTimeMs: number;
  averageScore: number;
  transferScore: number | null;
  discriminationIndex: number | null;
  ambiguityRiskScore: number;
  observedDifficultyScore: number;
  observedDifficultyStatus:
    | "too_easy"
    | "appropriate"
    | "challenging"
    | "too_difficult"
    | "insufficient_data";
  qualityScore: number | null;
  qualityStatus: ExerciseQualityStatus;
  qualityBreakdown: Record<string, number>;
  dataStatus: "sufficient" | "insufficient_data";
};

type ContextSignals = {
  viewedCount?: number;
  abandonedCount?: number;
  solutionViews?: number;
  helpfulFeedback?: number;
  unhelpfulFeedback?: number;
  reviewAccuracy?: number | null;
};

const ratio = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : 0;

const percentile = (values: number[], point: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return Math.round(
    sorted[Math.min(sorted.length - 1, Math.floor(point * sorted.length))],
  );
};

const round = (value: number, digits = 4) => Number(value.toFixed(digits));

export function calculateExerciseAnalytics(
  attempts: MetricAttempt[],
  signals: ContextSignals,
  minimumAttempts = 20,
  minimumUsers = 10,
): ExerciseAnalytics {
  const uniqueUsers = new Set(attempts.map((attempt) => attempt.userId)).size;
  const first = attempts.filter((attempt) => attempt.attemptNumber === 1);
  const retries = attempts.filter((attempt) => attempt.attemptNumber > 1);
  const successfulRetryUsers = new Set(
    retries
      .filter((attempt) => attempt.isCorrect)
      .map((attempt) => attempt.userId),
  ).size;
  const usersWithRetries = new Set(retries.map((attempt) => attempt.userId))
    .size;
  const eventualByUser = new Map<string, boolean>();
  attempts.forEach((attempt) =>
    eventualByUser.set(
      attempt.userId,
      (eventualByUser.get(attempt.userId) ?? false) || attempt.isCorrect,
    ),
  );
  const firstAccuracy = ratio(
    first.filter((attempt) => attempt.isCorrect).length,
    first.length,
  );
  const eventualAccuracy = ratio(
    [...eventualByUser.values()].filter(Boolean).length,
    eventualByUser.size,
  );
  const hintUsage = ratio(
    attempts.filter((attempt) => attempt.hintsUsed > 0).length,
    attempts.length,
  );
  const viewed = signals.viewedCount ?? first.length;
  const abandonment = ratio(signals.abandonedCount ?? 0, viewed);
  const responseTimes = attempts.flatMap((attempt) =>
    attempt.responseTimeMs === null ? [] : [attempt.responseTimeMs],
  );
  const high = first.filter((attempt) => attempt.masteryBefore === "high");
  const low = first.filter((attempt) => attempt.masteryBefore === "low");
  const discrimination =
    high.length >= 5 && low.length >= 5
      ? ratio(high.filter((attempt) => attempt.isCorrect).length, high.length) -
        ratio(low.filter((attempt) => attempt.isCorrect).length, low.length)
      : null;
  const transfer = first.filter(
    (attempt) =>
      attempt.cognitiveLevel === "transfer" ||
      attempt.cognitiveLevel === "synthesis",
  );
  const transferScore =
    transfer.length >= 5
      ? ratio(
          transfer.filter((attempt) => attempt.isCorrect).length,
          transfer.length,
        )
      : null;
  const sufficient =
    attempts.length >= minimumAttempts && uniqueUsers >= minimumUsers;
  const masteryAdjustment =
    ratio(
      first.filter((attempt) => attempt.masteryBefore === "low").length,
      first.length,
    ) * 8;
  const responseComponent = Math.min(
    15,
    (percentile(responseTimes, 0.5) / 20_000) * 15,
  );
  const retryRate = ratio(usersWithRetries, uniqueUsers);
  const difficultyScore = Math.max(
    0,
    Math.min(
      100,
      (1 - firstAccuracy) * 60 +
        hintUsage * 15 +
        retryRate * 10 +
        responseComponent -
        masteryAdjustment,
    ),
  );
  const observedDifficultyStatus = !sufficient
    ? "insufficient_data"
    : difficultyScore < 18
      ? "too_easy"
      : difficultyScore < 50
        ? "appropriate"
        : difficultyScore < 72
          ? "challenging"
          : "too_difficult";
  const ambiguitySignals = [
    discrimination !== null && discrimination < 0,
    firstAccuracy < 0.35,
    hintUsage > 0.5,
    abandonment > 0.3,
    percentile(responseTimes, 0.9) > 120_000,
    high.length >= 5 &&
      ratio(high.filter((attempt) => attempt.isCorrect).length, high.length) <
        0.55,
  ].filter(Boolean).length;
  const ambiguityRisk = Math.min(100, ambiguitySignals * 18);
  const feedbackTotal =
    (signals.helpfulFeedback ?? 0) + (signals.unhelpfulFeedback ?? 0);
  const feedbackEffectiveness =
    feedbackTotal >= 5
      ? ratio(signals.helpfulFeedback ?? 0, feedbackTotal)
      : 0.5;
  const difficultyFit =
    observedDifficultyStatus === "appropriate" ||
    observedDifficultyStatus === "challenging"
      ? 1
      : 0.5;
  const discriminationQuality =
    discrimination === null
      ? 0.5
      : Math.max(0, Math.min(1, (discrimination + 0.2) / 0.6));
  const retentionContribution = signals.reviewAccuracy ?? 0.5;
  const completionHealth = 1 - abandonment;
  const breakdown = {
    structuralValidity: 15,
    appropriateDifficulty: difficultyFit * 20,
    discriminationQuality: discriminationQuality * 20,
    feedbackEffectiveness: feedbackEffectiveness * 15,
    retentionContribution: retentionContribution * 15,
    completionHealth: completionHealth * 15,
    ambiguityPenalty: ambiguityRisk * 0.18,
    abandonmentPenalty: abandonment * 10,
  };
  const qualityScore = sufficient
    ? Math.max(
        0,
        Math.min(
          100,
          breakdown.structuralValidity +
            breakdown.appropriateDifficulty +
            breakdown.discriminationQuality +
            breakdown.feedbackEffectiveness +
            breakdown.retentionContribution +
            breakdown.completionHealth -
            breakdown.ambiguityPenalty -
            breakdown.abandonmentPenalty,
        ),
      )
    : null;
  const qualityStatus: ExerciseQualityStatus =
    qualityScore === null
      ? "insufficient_data"
      : qualityScore >= 85
        ? "healthy"
        : qualityScore >= 70
          ? "monitor"
          : qualityScore >= 50
            ? "needs_review"
            : "high_risk";

  return {
    attempts: attempts.length,
    uniqueUsers,
    completionRate: round(ratio(first.length, viewed)),
    firstAttemptAccuracy: round(firstAccuracy),
    eventualAccuracy: round(eventualAccuracy),
    retrySuccessRate: round(ratio(successfulRetryUsers, usersWithRetries)),
    hintUsageRate: round(hintUsage),
    solutionViewRate: round(ratio(signals.solutionViews ?? 0, viewed)),
    abandonmentRate: round(abandonment),
    medianResponseTimeMs: percentile(responseTimes, 0.5),
    p90ResponseTimeMs: percentile(responseTimes, 0.9),
    averageScore: round(
      ratio(
        attempts.reduce((sum, attempt) => sum + attempt.score, 0),
        attempts.length,
      ),
      2,
    ),
    transferScore: transferScore === null ? null : round(transferScore),
    discriminationIndex: discrimination === null ? null : round(discrimination),
    ambiguityRiskScore: ambiguityRisk,
    observedDifficultyScore: round(difficultyScore, 2),
    observedDifficultyStatus,
    qualityScore: qualityScore === null ? null : round(qualityScore, 2),
    qualityStatus,
    qualityBreakdown: Object.fromEntries(
      Object.entries(breakdown).map(([key, value]) => [key, round(value, 2)]),
    ),
    dataStatus: sufficient ? "sufficient" : "insufficient_data",
  };
}

export function classifyDistractor(input: {
  selectionRate: number;
  highMasteryRate: number;
  lowMasteryRate: number;
  sampleSize: number;
  minimumSample: number;
}) {
  if (input.sampleSize < input.minimumSample)
    return "insufficient_data" as const;
  if (input.selectionRate < 0.03) return "unused" as const;
  if (
    input.highMasteryRate > 0.3 &&
    Math.abs(input.highMasteryRate - input.lowMasteryRate) < 0.08
  )
    return "ambiguous" as const;
  if (input.highMasteryRate > 0.25) return "too_attractive" as const;
  if (input.selectionRate < 0.08) return "too_obvious" as const;
  return "effective" as const;
}

export function calculateRetention(
  immediate: number[],
  delayed: number[],
  minimumSample = 10,
) {
  if (immediate.length < minimumSample || delayed.length < minimumSample)
    return {
      dataStatus: "insufficient_data" as const,
      immediateAccuracy: null,
      delayedAccuracy: null,
      retentionRate: null,
      retentionDecay: null,
    };
  const immediateAccuracy = ratio(
    immediate.filter((score) => score >= 0.7).length,
    immediate.length,
  );
  const delayedAccuracy = ratio(
    delayed.filter((score) => score >= 0.7).length,
    delayed.length,
  );
  return {
    dataStatus: "sufficient" as const,
    immediateAccuracy: round(immediateAccuracy),
    delayedAccuracy: round(delayedAccuracy),
    retentionRate: round(ratio(delayedAccuracy, immediateAccuracy || 1)),
    retentionDecay: round(Math.max(0, immediateAccuracy - delayedAccuracy)),
  };
}
