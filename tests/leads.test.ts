import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLead, answerOptions } from '../supabase/functions/fit90-leads/validation.ts';
import { handleLead } from '../supabase/functions/fit90-leads/handler.ts';
import { POST } from '../app/api/leads/route.ts';
import { plans, frequencyOptions, recommendPlan } from '../supabase/functions/_shared/fit90.ts';
import { questions } from '../app/quiz-data.ts';

const valid = () => ({ id: crypto.randomUUID(), name: ' Teste Fit 90 ', phone: '923 000 000', email: 'TEST@example.com', answers: answerOptions.map(o => o[0]), consent: true, selected_plan: 'light' });
const config = { url: 'https://example.supabase.co', serviceKey: 'server-only-test' };
const request = (data: unknown) => new Request('https://example.com/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

test('all location answers stay in Fit 90; frontend and API answer contracts agree', () => {
  assert.deepEqual(questions.map(q => q.options), answerOptions);
  for (const location of answerOptions[1]) {
    const input = valid(); input.answers[1] = location;
    assert.equal(validateLead(input).answers.location, location);
  }
});
test('normalizes contacts without changing international numbers', () => {
  const lead = validateLead(valid());
  assert.equal(lead.name, 'Teste Fit 90');
  assert.equal(lead.phone, '+244923000000');
  assert.equal(lead.email, 'test@example.com');
  assert.equal(validateLead({ ...valid(), phone: '+351 912 345 678', email: '' }).phone, '+351912345678');
  assert.equal(validateLead({ ...valid(), email: '' }).email, null);
});
test('rejects invalid contacts, missing consent, IDs and injected quiz values', () => {
  for (const patch of [{ name: '' }, { name: 'a'.repeat(121) }, { phone: 'invalid' }, { phone: '123' }, { email: 'bad' }, { consent: false }, { consent: 'true' }, { id: 'bad' }, { answers: [] }, { answers: ['injected', ...valid().answers.slice(1)] }]) {
    assert.throws(() => validateLead({ ...valid(), ...patch }));
  }
});
test('persists before confirming and never accepts client status/program', async () => {
  let saved;
  const input = { ...valid(), program: 'cademy', status: 'converted' };
  const response = await handleLead(request(input), config, async (_url, init) => {
    saved = JSON.parse(String(init?.body)).payload;
    return Response.json(saved.id);
  });
  assert.equal(response.status, 201);
  assert.equal(saved.program, undefined);
  assert.equal(saved.status, undefined);
  assert.deepEqual(await response.json(), { id: input.id, program: 'fit90' });
});
test('database failures and rate limits never report success or leak internals', async () => {
  for (const [code, status] of [['P0001', 429], ['XX000', 503]] as const) {
    const response = await handleLead(request(valid()), config, async () => Response.json({ code, message: 'sensitive database details' }, { status: 400 }));
    assert.equal(response.status, status);
    assert.doesNotMatch(await response.text(), /sensitive/);
  }
  assert.equal((await handleLead(request(valid()), config, async () => { throw new Error('secret'); })).status, 503);
});
test('bounds payload, rejects invalid JSON and disallows reads', async () => {
  assert.equal((await handleLead(request('x'.repeat(8193)), config)).status, 413);
  assert.equal((await handleLead(new Request('https://example.com', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' }), config)).status, 400);
  assert.equal((await handleLead(new Request('https://example.com'), config)).status, 405);
});
test('site fails closed when unconfigured and rejects cross-origin requests', async () => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_URL; delete process.env.SUPABASE_ANON_KEY;
  try {
    assert.equal((await POST(request(valid()))).status, 503);
    assert.equal((await POST(new Request('https://site.example/api/leads', { method: 'POST', headers: { origin: 'https://other.example' } }))).status, 403);
  } finally {
    if (previousUrl !== undefined) process.env.SUPABASE_URL = previousUrl;
    if (previousKey !== undefined) process.env.SUPABASE_ANON_KEY = previousKey;
  }
});


test('four frequencies recommend the right plan; every alternative remains selectable', () => {
  const expected = ['light', 'performance', 'gold', 'gold'];
  for (let i = 0; i < frequencyOptions.length; i++) {
    assert.equal(recommendPlan(frequencyOptions[i]), expected[i]);
    for (const plan of plans) {
      const input = valid();
      input.answers[5] = frequencyOptions[i];
      const lead = validateLead({ ...input, selected_plan: plan.id, recommended_plan: 'fake', selected_price_kz: 1 });
      assert.equal(lead.recommended_plan, expected[i]);
      assert.equal(lead.selected_plan, plan.id);
      assert.equal(lead.selected_price_kz, plan.price);
      assert.equal(lead.training_frequency, frequencyOptions[i]);
    }
  }
  assert.equal(recommendPlan('invalid'), null);
});
test('new submissions require a valid plan and frequency, legacy submissions remain accepted', () => {
  for (const selected_plan of [undefined, '', 'cademy', 'premium', 42]) assert.throws(() => validateLead({ ...valid(), selected_plan }));
  const invalid = valid(); invalid.answers[5] = '7';
  assert.throws(() => validateLead(invalid));
  const legacy = validateLead({ ...valid(), answers: valid().answers.slice(0, 5), selected_plan: undefined });
  assert.equal(legacy.training_frequency, null);
  assert.equal(legacy.selected_plan, null);
  assert.equal(legacy.selected_price_kz, null);
  assert.throws(() => validateLead({ ...valid(), answers: valid().answers.slice(0, 5) }));
});

function crmConfig() {
  const base = config as typeof config & { crmUrl?: string; crmApiKey?: string };
  return { ...base, crmUrl: 'https://crm.example.com', crmApiKey: 'secret-crm-key' };
}

test('after saving, pushes the lead to the CRM without client status and acks with crm_external_id', async () => {
  const calls: { url: string; headers?: HeadersInit; body?: string }[] = [];
  const crmLeadId = crypto.randomUUID();
  const input = valid();
  const response = await handleLead(request(input), crmConfig(), async (url, init) => {
    const u = typeof url === 'string' ? url : (url instanceof URL ? url.href : (url as Request).url);
    calls.push({ url: u, headers: init?.headers, body: typeof init?.body === 'string' ? init.body : undefined });
    if (u.includes('/rpc/submit_fit90_lead')) return Response.json(input.id);
    if (u.includes('/api/v1/leads')) return Response.json({ data: { id: crmLeadId } });
    return Response.json({}, { status: 204 });
  });
  assert.equal(response.status, 201);
  const push = calls.find(c => c.url.includes('/api/v1/leads'));
  const ack = calls.find(c => c.url.includes('/rest/v1/fit90_leads'));
  if (!push?.body || !push.headers || !ack) throw new Error('expected a CRM push, a Supabase ack and payloads');
  assert.equal((push.headers as Record<string, string>)['X-API-Key'], 'secret-crm-key');
  const body = JSON.parse(push.body) as Record<string, unknown>;
  assert.equal(body.externalId, input.id);
  assert.equal(body.name, 'Teste Fit 90');
  assert.equal(body.phone, '+244923000000');
  assert.equal(body.estimatedValue, 199000);
  assert.equal(body.status, undefined);
  assert.equal(body.program, undefined);
  assert.equal(body.source, 'bruno_samora_landing');
  assert.ok(ack.url.includes(`id=eq.${input.id}`));
  if (!ack.body) throw new Error('expected an ack payload');
  const ackBody = JSON.parse(ack.body) as Record<string, unknown>;
  assert.equal(ackBody.crm_external_id, crmLeadId);
  assert.equal(typeof ackBody.crm_synced_at, 'string');
});

test('a CRM outage never fails the saved lead nor leaks internal details', async () => {
  const input = valid();
  let patched = false;
  const response = await handleLead(request(input), crmConfig(), async (url) => {
    const u = typeof url === 'string' ? url : (url instanceof URL ? url.href : (url as Request).url);
    if (u.includes('/rpc/submit_fit90_lead')) return Response.json(input.id);
    if (u.includes('/api/v1/leads')) throw new Error('secret crm api key leaked');
    patched = true;
    return Response.json({}, { status: 204 });
  });
  assert.equal(response.status, 201);
  assert.equal(patched, false, 'CRM failure must not mark the row as synced');
  assert.doesNotMatch(await response.text(), /secret/);
});
