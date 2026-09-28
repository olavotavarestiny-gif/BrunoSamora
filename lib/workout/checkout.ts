import { workoutPlans } from '../../app/workout/catalog.ts';

export type Customer = { name: string; email: string; phone: string };
export type CheckoutInput = { planId: string; customer: Customer; requestId: string };
export type GatewayRequest = CheckoutInput & { currency: 'AOA'; amountKz: number; accessMonths: number };
export type GatewayResult = { status: 'unavailable' } | { status: 'redirect'; checkoutUrl: string };
// Server-only adapter: persist an order and reuse requestId before creating a gateway session.
export type PaymentGateway = { createSession(input: GatewayRequest): Promise<GatewayResult> };
export const unconfiguredGateway: PaymentGateway = {
 async createSession() { return { status: 'unavailable' }; },
};

export function validateCheckout(value: unknown): { input: CheckoutInput } | { error: string } {
 if (!value || typeof value !== 'object') return { error: 'Dados inválidos.' };
 const v = value as Record<string, unknown>;
 if (!workoutPlans.some(p => p.id === v.planId)) return { error: 'Escolhe um plano válido.' };
 if (typeof v.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.requestId)) return { error: 'Atualiza a página e tenta novamente.' };
 if (!v.customer || typeof v.customer !== 'object') return { error: 'Preenche os dados do cliente.' };
 const c = v.customer as Record<string, unknown>;
 const name = typeof c.name === 'string' ? c.name.trim().replace(/\s+/g, ' ') : '';
 const email = typeof c.email === 'string' ? c.email.trim().toLowerCase() : '';
 const phone = typeof c.phone === 'string' ? c.phone.replace(/[\s()-]/g, '') : '';
 let hasUnsafeNameCharacter = false;
 for (let index = 0; index < name.length; index += 1) {
  const character = name[index];
  if (name.charCodeAt(index) < 32 || character === '<' || character === '>') {
   hasUnsafeNameCharacter = true;
   break;
  }
 }
 if (name.length < 2 || name.length > 120 || hasUnsafeNameCharacter) return { error: 'Introduz um nome válido (2 a 120 caracteres).' };
 if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) return { error: 'Introduz um email válido.' };
 if (!/^\+[1-9]\d{7,14}$/.test(phone)) return { error: 'Introduz o telefone com indicativo do país, por exemplo +244 923 456 789.' };
 return { input: { planId: v.planId as string, requestId: v.requestId, customer: { name, email, phone } } };
}

export async function createCheckout(input: CheckoutInput, gateway: PaymentGateway): Promise<GatewayResult> {
 const plan = workoutPlans.find(p => p.id === input.planId);
 if (!plan) throw new Error('Invalid plan');
 // Never forward client-supplied amounts, currency, status or duration.
 const result = await gateway.createSession({ planId: plan.id, customer: input.customer, requestId: input.requestId, currency: 'AOA', amountKz: plan.amountKz, accessMonths: plan.months });
 if (result.status === 'redirect') {
  const url = new URL(result.checkoutUrl);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid gateway URL');
 }
 return result;
}
