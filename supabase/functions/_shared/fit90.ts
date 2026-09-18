export const frequencyOptions = [
  '2 vezes por semana',
  '3 vezes por semana',
  '4 vezes ou mais',
  'Quero ter liberdade para treinar quando quiser',
];
export type PlanId = 'light' | 'performance' | 'gold';
export const plans = [
  { id: 'light', name: 'Light Fit 90', price: 199000, priceLabel: '199.000', tier: 'Base', frequency: '2 treinos por semana', description: 'Ideal para quem quer começar.', detail: 'Uma boa base para criar ritmo durante os 90 dias.', evolutionLevel: 2, evolutionLabel: 'Boa base para começar', cta: 'Começar Fit 90' },
  { id: 'performance', name: 'Performance Fit 90', price: 249000, priceLabel: '249.000', tier: 'Consistência', frequency: '3 treinos por semana', description: 'Mais frequência para acelerar a evolução.', detail: 'Mais oportunidades para criar consistência durante os 90 dias.', evolutionLevel: 4, evolutionLabel: 'Maior consistência', cta: 'Quero evoluir' },
  { id: 'gold', name: 'Gold Fit 90', price: 279000, priceLabel: '279.000', tier: 'Experiência completa', frequency: 'Livre Trânsito', description: 'Máxima liberdade para aproveitar os 90 dias.', detail: 'Flexibilidade, frequência e maior potencial de evolução.', evolutionLevel: 5, evolutionLabel: 'Máximo potencial de evolução', cta: 'Quero a experiência completa' },
] as const;
export function recommendPlan(frequency: string): PlanId | null {
  if (frequency === frequencyOptions[0]) return 'light';
  if (frequency === frequencyOptions[1]) return 'performance';
  if (frequency === frequencyOptions[2] || frequency === frequencyOptions[3]) return 'gold';
  return null;
}
export function getPlan(id: unknown) { return plans.find(plan => plan.id === id); }
