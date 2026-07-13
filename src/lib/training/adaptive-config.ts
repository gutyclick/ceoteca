export const adaptiveWeights = {
  dueReview: 40,
  recentError: 25,
  goalAlignment: 20,
  lowMastery: 20,
  mediumMastery: 12,
  inactivity: 10,
  newContent: 6,
  practicedToday: -12,
  overexposure: -15,
} as const;
export const durationTargets = { 3: 3, 5: 5, 7: 8, 10: 10, 15: 14 } as const;
export const allowedDurations = [3, 5, 7, 10, 15] as const;
