import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCheckout, createCheckout, unconfiguredGateway } from '../lib/workout/checkout.ts';
import { POST } from '../app/api/workout/checkout/route.ts';
const sample = { planId: 'workout_3_months', requestId: '2533b071-1d6c-483e-8f8c-39cc63295352', customer: { name: '  Cliente Teste  ', email: ' TESTE@example.com ', phone: '+244 923 456 789' } };

test('checkout validates and normalizes contacts, rejecting malformed plans and customer data', () => {
 const result = validateCheckout(sample);
 assert.ok('input' in result);
 assert.deepEqual(result.input.customer, { name: 'Cliente Teste', email: 'teste@example.com', phone: '+244923456789' });
 for (const value of [null, {}, { ...sample, planId: 'gold' }, { ...sample, requestId: 'bad' }, ...[{ name: '' }, { email: 'invalid' }, { phone: '923456789' }].map(c => ({ ...sample, customer: { ...sample.customer, ...c } }))]) assert.ok('error' in validateCheckout(value));
});
test('gateway receives server prices for all plans and never untrusted price or status fields', async () => {
 for (const [planId, amount, months] of [['workout_1_month',4999,1],['workout_3_months',12999,3],['workout_6_months',24999,6],['workout_12_months',47999,12]] as const) {
  const result = validateCheckout({ ...sample, planId, amountKz: 1, currency: 'USD', status: 'paid' });
  assert.ok('input' in result);
  await createCheckout(result.input, { async createSession(input) {
   assert.equal(input.amountKz, amount); assert.equal(input.accessMonths, months); assert.equal(input.currency, 'AOA'); assert.equal('status' in input, false); assert.equal(input.requestId, sample.requestId);
   return { status: 'unavailable' };
  } });
 }
});
test('unconfigured gateway cannot claim payment success; unsafe redirects are rejected', async () => {
 const result = validateCheckout(sample); assert.ok('input' in result);
 assert.deepEqual(await createCheckout(result.input, unconfiguredGateway), { status: 'unavailable' });
 for (const checkoutUrl of ['http://example.com', 'javascript:alert(1)', 'https://user:pass@example.com']) await assert.rejects(createCheckout(result.input, { async createSession() { return { status: 'redirect', checkoutUrl }; } }));
});
test('checkout API is available in production, rejects invalid requests and reports an unconfigured gateway safely', async () => {
 const req = (body: string, origin = 'http://localhost:3001') => new Request('http://localhost:3001/api/workout/checkout', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body });
 assert.equal((await POST(req('{}', 'https://attacker.example'))).status, 403);
 assert.equal((await POST(req('invalid'))).status, 400);
 assert.equal((await POST(req(' '.repeat(4097)))).status, 413);
 assert.equal((await POST(req('{}'))).status, 400);
 const response = await POST(req(JSON.stringify(sample)));
 assert.equal(response.status, 503); assert.equal(response.headers.get('cache-control'), 'no-store');
 const data = await response.json(); assert.equal(data.code, 'GATEWAY_NOT_CONFIGURED'); assert.equal(data.id, undefined); assert.equal(data.checkoutUrl, undefined);
});
