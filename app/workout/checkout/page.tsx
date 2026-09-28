import type { Metadata } from 'next';
import { workoutPlans } from '../catalog';
import Checkout from './checkout';

export const metadata: Metadata = {
 title: 'Checkout — SamoraFit Workout',
 description: 'Escolhe o teu acesso ao SamoraFit Workout e confirma os teus dados.',
};

export default async function CheckoutPage({
 searchParams,
}: {
 searchParams: Promise<{ plan?: string | string[] }>;
}) {
 const requestedPlan = (await searchParams).plan;
 const planId = Array.isArray(requestedPlan) ? requestedPlan[0] : requestedPlan;
 const plan = workoutPlans.find(item => item.id === planId) ?? workoutPlans[0];

 return <Checkout plan={plan}/>;
}
