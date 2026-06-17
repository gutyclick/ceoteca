import type { PlanId } from '@/types';
export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';
export const demoUser = { id:'demo-user', fullName:'Alex Demo', email:'alex@ceoteca.demo', plan:'pro' as PlanId, createdAt:'2026-01-15' };
