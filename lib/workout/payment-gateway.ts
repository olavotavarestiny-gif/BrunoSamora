import type { PaymentGateway } from './checkout.ts';

/**
 * Ponto único de integração do gateway de pagamento.
 *
 * A equipa de pagamentos deve substituir apenas `createSession`, mantendo o
 * contrato abaixo. Credenciais, criação da encomenda e chamadas ao fornecedor
 * ficam exclusivamente no servidor. O `requestId` deve ser usado como chave de
 * idempotência para evitar cobranças duplicadas.
 */
export const paymentGateway: PaymentGateway = {
 async createSession(_input) {
  return { status: 'unavailable' };
 },
};
