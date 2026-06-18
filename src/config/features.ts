export const featureKeys = [
  "allBooks",
  "audio",
  "chat",
  "unlimitedChat",
  "earlyAccess",
  "advancedActivities",
] as const;

export type FeatureKey = (typeof featureKeys)[number];
