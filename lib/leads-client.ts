export type LeadSubmission = {
  id: string;
  name: string;
  phone: string;
  email: string;
  answers: string[];
  consent: boolean;
};

export async function submitLead(lead: LeadSubmission): Promise<void> {
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
    signal: AbortSignal.timeout(20_000),
  }).catch(() => {
    throw new Error('Não foi possível confirmar o envio. Verifica a ligação e tenta novamente.');
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: unknown };
    throw new Error(typeof data?.error === 'string' ? data.error : 'Não foi possível guardar os dados. Tenta novamente.');
  }
}
