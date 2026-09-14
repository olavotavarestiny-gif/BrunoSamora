// Only the legacy anon key is needed here. The privileged key stays in Supabase.
export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const headers = { 'Cache-Control': 'no-store' };
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: 'Origem não permitida.' }, { status: 403, headers });
  }
  if (!url || !anonKey) {
    return Response.json({ error: 'O formulário está temporariamente indisponível. Tenta mais tarde.' }, { status: 503, headers });
  }
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return Response.json({ error: 'Envia os dados em JSON.' }, { status: 415, headers });
  }
  // Bound bytes while reading, including requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: 'Dados em falta.' }, { status: 400, headers });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8192) {
      await reader.cancel();
      return Response.json({ error: 'Pedido demasiado grande.' }, { status: 413, headers });
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/functions/v1/fit90-leads`, {
      method: 'POST',
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    const data = await response.json() as { id?: unknown; error?: unknown };
    if (!data || typeof data !== 'object') throw new Error('Invalid response');
    if (response.ok && typeof data.id === 'string') return Response.json({ id: data.id, program: 'fit90' }, { status: 201, headers });
    if ([400, 413, 415, 429].includes(response.status) && typeof data.error === 'string') {
      return Response.json({ error: data.error }, { status: response.status, headers });
    }
  } catch { /* Never include provider errors, keys or personal data in responses. */ }
  return Response.json({ error: 'Não foi possível guardar os dados. Tenta novamente.' }, { status: 503, headers });
}
