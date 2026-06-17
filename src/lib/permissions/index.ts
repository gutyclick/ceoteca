import { featureMatrix } from '@/config/plans';
import type { Feature, PlanId } from '@/types';
export function canAccessFeature(plan: PlanId, feature: Feature): boolean { return featureMatrix[plan]?.[feature] ?? false; }
export function canOpenBook(plan: PlanId, bookIndex: number): boolean { return plan === 'free' ? bookIndex < 3 : true; }
export function remainingChatQuestions(plan: PlanId, used: number): number | 'ilimitado' { if (plan === 'unlimited') return 'ilimitado'; if (plan === 'free') return 0; return Math.max(0, 50 - used); }
