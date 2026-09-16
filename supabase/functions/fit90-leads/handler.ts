import { validateLead } from './validation.ts';

type Config = { url: string; serviceKey: string; crmUrl?: string; crmApiKey?: string };

function crmLeadPayload(lead: ReturnType<typeof validateLead>, id: string): Record<string, unknown> {
  const notes = [
    lead.selected_plan ? `Plano: ${lead.selected_plan}` : null,
    lead.training_frequency ? `Frequência: ${lead.training_frequency}` : null,
  ].filter(Boolean).join(', ');
  return {
    externalId: String(id),
    name: lead.name,
    phone: lead.phone,
    email: lead.email ?? undefined,
    company: 'Bruno Samora',
    source: 'bruno_samora_landing',
    estimatedValue: lead.selected_price_kz ?? undefined,
    notes: notes || undefined,
  };
}

async function pushLeadToCrm(config: Config, fetcher: typeof fetch, body: Record<string, unknown>): Promise<string | null> {
  if (!config.crmUrl || !config.crmApiKey) return null;
  try {
    const res = await fetcher(`${config.crmUrl.replace(/\/+$/, '')}/api/v1/leads`, {
      method: 'POST',
      headers: { 'X-API-Key': config.crmApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4_000),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null) as { data?: { id?: unknown } } | null;
    return typeof data?.data?.id === 'string' ? data.data.id : null;
  } catch {
    // CRM indisponível: o lead fica por sincronizar (crm_synced_at IS NULL) → reenvio idempotente.
    return null;
  }
}
export async function handleLead(request: Request, config: Config, fetcher: typeof fetch = fetch): Promise<Response> {
  const headers = { 'Cache-Control': 'no-store' };
  const json = (body: unknown, status: number) => Response.json(body, { status, headers });
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: 'Envia os dados em JSON.' }, 415);
  if (!config.url || !config.serviceKey) return json({ error: 'Serviço temporariamente indisponível.' }, 503);
  const reader = request.body?.getReader();
  if (!reader) return json({ error: 'Dados em falta.' }, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) { await reader.cancel(); return json({ error: 'Pedido demasiado grande.' }, 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let lead;
  try { lead = validateLead(JSON.parse(new TextDecoder().decode(bytes))); }
  catch (error) { return json({ error: error instanceof SyntaxError ? 'JSON inválido.' : (error as Error).message }, 400); }
  try {
    const response = await fetcher(`${config.url}/rest/v1/rpc/submit_fit90_lead`, {
      method: 'POST',
      headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: lead }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await response.json();
    if (!response.ok) {
      if (data.code === 'P0001') return json({ error: 'Já recebemos vários pedidos deste número. Tenta novamente dentro de uma hora.' }, 429);
      return json({ error: 'Não foi possível guardar os dados. Tenta novamente.' }, 503);
    }
    // Push isolado para o CRM: falha não bloqueia a resposta; o ack marca crm_synced_at.
    const crmLeadId = await pushLeadToCrm(config, fetcher, crmLeadPayload(lead, String(data)));
    if (crmLeadId) {
      await fetcher(`${config.url.trim().replace(/\/+$/, '')}/rest/v1/fit90_leads?id=eq.${encodeURIComponent(String(data))}`, {
        method: 'PATCH',
        headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ crm_external_id: crmLeadId, crm_synced_at: new Date().toISOString() }),
        signal: AbortSignal.timeout(4_000),
      }).catch(() => {});
    }
    return json({ id: data, program: 'fit90' }, 201);
  } catch { return json({ error: 'Não foi possível guardar os dados. Tenta novamente.' }, 503); }
}
