import { createCheckout, validateCheckout } from '../../../../lib/workout/checkout.ts';
import { paymentGateway } from '../../../../lib/workout/payment-gateway.ts';

export async function POST(request: Request) {
 const headers = { 'Cache-Control': 'no-store' };
 const reply = (body: object, status: number) => Response.json(body, { status, headers });
 if (request.headers.get('origin') !== new URL(request.url).origin) return reply({ error: 'Origem não permitida.' }, 403);
 if (!request.headers.get('content-type')?.includes('application/json')) return reply({ error: 'Envia os dados em JSON.' }, 415);
 const reader = request.body?.getReader();
 if (!reader) return reply({ error: 'Dados em falta.' }, 400);
 let text = '';
 let bytes = 0;
 const decoder = new TextDecoder();
 try {
  while (true) {
   const { done, value } = await reader.read();
   if (done) break;
   bytes += value.byteLength;
   if (bytes > 4096) { await reader.cancel(); return reply({ error: 'Pedido demasiado grande.' }, 413); }
   text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
 } catch { return reply({ error: 'Não foi possível ler os dados.' }, 400); }
 let data: unknown;
 try { data = JSON.parse(text); } catch { return reply({ error: 'Dados inválidos.' }, 400); }
 const validated = validateCheckout(data);
 if ('error' in validated) return reply({ error: validated.error }, 400);
 try {
  const session = await createCheckout(validated.input, paymentGateway);
  if (session.status === 'unavailable') return reply({ code: 'GATEWAY_NOT_CONFIGURED', error: 'Checkout validado. O gateway ainda não está ligado. Não foi criada nenhuma encomenda, efetuada cobrança ou ativado acesso.' }, 503);
  return reply(session, 200);
 } catch { return reply({ error: 'Não foi possível iniciar o pagamento. Tenta novamente.' }, 502); }
}
