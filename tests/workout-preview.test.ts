import test from 'node:test';
import assert from 'node:assert/strict';
import { workoutPlans } from '../app/workout/catalog.ts';

test('workout plans contain only the four approved durations and total prices', () => {
 assert.deepEqual(workoutPlans.map(p => [p.months, p.amountKz]), [[1, 4999], [3, 12999], [6, 24999], [12, 47999]]);
 assert.equal(new Set(workoutPlans.map(p => p.id)).size, 4);
});
