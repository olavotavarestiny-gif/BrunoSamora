// Prices are totals for each access period, in kwanza. No recurring billing is configured.
export const workoutPlans = [
  { id: 'workout_1_month', months: 1, title: '1 mês', amountKz: 4999, price: '4.999' },
  { id: 'workout_3_months', months: 3, title: '3 meses', amountKz: 12999, price: '12.999' },
  { id: 'workout_6_months', months: 6, title: '6 meses', amountKz: 24999, price: '24.999' },
  { id: 'workout_12_months', months: 12, title: '12 meses', amountKz: 47999, price: '47.999' },
] as const;
export type WorkoutPlan = typeof workoutPlans[number];
