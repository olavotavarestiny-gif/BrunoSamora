export const frequencyOptions = [
  '2 vezes por semana',
  '3 vezes por semana',
  '4 vezes ou mais',
  'Quero ter liberdade para treinar quando quiser',
];
export type PlanId = 'light' | 'performance' | 'gold';
export const plans = [
  { id: 'light', name: 'Light Fit 90', price: 199000, priceLabel: '199.000', tier: 'Entrada', frequency: '2 treinos por semana', description: 'O primeiro passo, ao teu ritmo.', detail: 'Para começar com uma frequência mais reduzida.' },
  { id: 'performance', name: 'Performance Fit 90', price: 249000, priceLabel: '249.000', tier: 'Equilíbrio', frequency: '3 treinos por semana', description: 'O equilíbrio entre ritmo e evolução.', detail: 'A escolha principal para manter a consistência.' },
  { id: 'gold', name: 'Gold Fit 90', price: 289000, priceLabel: '289.000', tier: 'Premium', frequency: 'Livre-trânsito', description: 'Mais liberdade. Mais possibilidades.', detail: 'Flexibilidade para treinar quando quiseres.' },
] as const;
export function recommendPlan(frequency: string): PlanId | null {
  if (frequency === frequencyOptions[0]) return 'light';
  if (frequency === frequencyOptions[1]) return 'performance';
  if (frequency === frequencyOptions[2] || frequency === frequencyOptions[3]) return 'gold';
  return null;
}
export function getPlan(id: unknown) { return plans.find(plan => plan.id === id); }
