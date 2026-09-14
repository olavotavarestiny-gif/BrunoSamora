import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLead, answerOptions } from '../supabase/functions/fit90-leads/validation.ts';
import { handleLead } from '../supabase/functions/fit90-leads/handler.ts';
import { POST } from '../app/api/leads/route.ts';
import { questions } from '../app/quiz-data.ts';

const valid = () => ({ id: crypto.randomUUID(), name: ' Teste Fit 90 ', phone: '923 000 000', email: 'TEST@example.com', answers: answerOptions.map(o => o[0]), consent: true });
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
