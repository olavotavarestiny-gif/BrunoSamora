export const answerOptions = [
  ['Homem', 'Mulher'],
  ['Sim, vivo em Talatona', 'Sim, trabalho em Talatona', 'Não, estou longe de Talatona'],
  ['Quero reduzir peso', 'Sou magro/a e quero ganhar corpo', 'Quero melhorar a minha forma', 'Estou a recomeçar'],
  ['Perder gordura', 'Ganhar massa muscular', 'Ter mais energia e saúde', 'Sentir-me melhor no meu corpo'],
  ['Falta de tempo', 'Não sei por onde começar', 'Tenho vergonha de começar', 'Já tentei e não consegui'],
];
export function validateLead(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Dados inválidos.');
  const data = input as Record<string, unknown>;
  if (typeof data.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.id)) throw new Error('Identificador inválido.');
  if (typeof data.name !== 'string' || !data.name.trim() || data.name.trim().length > 120) throw new Error('Escreve um nome válido (até 120 caracteres).');
  if (typeof data.phone !== 'string' || data.phone.length > 30 || !/^\+?[\d\s()-]+$/.test(data.phone)) throw new Error('Introduz um número de WhatsApp válido.');
  let phone = data.phone.replace(/\D/g, '');
  if (phone.length === 9) phone = '244' + phone;
  if (phone.length < 9 || phone.length > 15) throw new Error('Introduz um número de WhatsApp válido.');
  if (data.email !== undefined && typeof data.email !== 'string') throw new Error('E-mail inválido.');
  const email = (data.email as string | undefined)?.trim().toLowerCase() || null;
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error('E-mail inválido.');
  if (!Array.isArray(data.answers) || data.answers.length !== 5 || !data.answers.every((v, i) => typeof v === 'string' && answerOptions[i].includes(v))) throw new Error('Responde às cinco perguntas.');
  if (data.consent !== true) throw new Error('É necessária autorização para guardar os dados e contactar-te.');
  return {
    id: data.id, name: data.name.trim(), phone: '+' + phone, email,
    answers: { gender: data.answers[0], location: data.answers[1], current_shape: data.answers[2], goal: data.answers[3], barrier: data.answers[4] },
  };
}
