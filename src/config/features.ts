export const featureKeys = [
  "allBooks",
  "audio",
  "chat",
  "chatAttachments",
  "chatVision",
  "unlimitedChat",
  "earlyAccess",
  "advancedActivities",
] as const;

export type FeatureKey = (typeof featureKeys)[number];
