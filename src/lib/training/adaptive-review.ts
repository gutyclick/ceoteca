export type ReviewInput = {
  score: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  attempts: number;
  hintsUsed: number;
  exposures: number;
  previousIntervalDays?: number;
  seed: number;
};
export function calculateNextReviewDate(input: ReviewInput, now = new Date()) {
  const base =
    input.score < 50 ? 1 : input.score < 75 ? 3 : input.score < 90 ? 7 : 14;
  const difficultyFactor =
    input.difficulty === "advanced"
      ? 0.8
      : input.difficulty === "beginner"
        ? 1.15
        : 1;
  const assistanceFactor = input.attempts > 1 || input.hintsUsed > 0 ? 0.65 : 1;
  const exposureFactor = Math.min(1.8, 1 + input.exposures * 0.12);
  const previous = input.previousIntervalDays ?? base;
  const intervalDays = Math.max(
    1,
    Math.round(
      Math.max(base, previous) *
        difficultyFactor *
        assistanceFactor *
        exposureFactor,
    ),
  );
  const dispersionHours = (input.seed % 13) - 6;
  return {
    intervalDays,
    scheduledFor: new Date(
      now.getTime() + intervalDays * 86_400_000 + dispersionHours * 3_600_000,
    ).toISOString(),
  };
}
