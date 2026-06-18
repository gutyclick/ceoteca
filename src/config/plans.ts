import type { FeatureKey } from "@/config/features";

export const planKeys = ["free", "pro", "unlimited", "founder"] as const;

export type PlanKey = (typeof planKeys)[number];

export type PlanConfig = {
  key: PlanKey;
  name: string;
  monthlyPriceUsd: number;
  annualPriceUsd?: number;
  chatMonthlyLimit: number | null;
  bookLimit: number | null;
  features: FeatureKey[];
  isFounderOffer?: boolean;
};

export const plans: Record<PlanKey, PlanConfig> = {
  free: {
    key: "free",
    name: "Gratis",
    monthlyPriceUsd: 0,
    chatMonthlyLimit: 0,
    bookLimit: 3,
    features: [],
  },
  pro: {
    key: "pro",
    name: "Pro",
    monthlyPriceUsd: 7.99,
    chatMonthlyLimit: 50,
    bookLimit: null,
    features: ["allBooks", "audio", "chat", "advancedActivities"],
  },
  unlimited: {
    key: "unlimited",
    name: "Ilimitado",
    monthlyPriceUsd: 14.99,
    chatMonthlyLimit: null,
    bookLimit: null,
    features: [
      "allBooks",
      "audio",
      "chat",
      "unlimitedChat",
      "earlyAccess",
      "advancedActivities",
    ],
  },
  founder: {
    key: "founder",
    name: "Fundador",
    monthlyPriceUsd: 4.99,
    chatMonthlyLimit: 50,
    bookLimit: null,
    features: ["allBooks", "audio", "chat", "advancedActivities"],
    isFounderOffer: true,
  },
};
