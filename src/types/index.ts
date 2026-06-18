import type { PlanKey } from "@/config/plans";

export type AppUser = {
  id: string;
  email: string;
  fullName: string;
  plan: PlanKey;
  isDemo: boolean;
};
