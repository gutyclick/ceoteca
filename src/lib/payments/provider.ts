import type { PlanId } from '@/types';
export interface CheckoutRequest { userId: string; plan: PlanId; successUrl: string; cancelUrl: string; }
export interface PaymentsProvider { createCheckout(input: CheckoutRequest): Promise<{ url: string }>; }
export class DisabledPaymentsProvider implements PaymentsProvider { async createCheckout(): Promise<{ url: string }>{ throw new Error('Integración de pagos pendiente.'); } }
export function getPaymentsProvider(): PaymentsProvider { return new DisabledPaymentsProvider(); }
