import type { Metadata } from 'next';
import WorkoutPreview from './workout-preview';

export const metadata: Metadata = {
 title: 'SamoraFit Workout — Treina ao teu ritmo',
 description: 'Treina onde quiseres com o Workout Online da SamoraFit. Conhece os planos e acede ao teu programa.',
};

export default function WorkoutPage() {
 return <WorkoutPreview/>;
}
