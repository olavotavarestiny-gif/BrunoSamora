'use client';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { workoutPlans } from './catalog';
import styles from './workout.module.css';

export default function WorkoutPreview() {
 return <div className={styles.page}>
  <header className={styles.header}><Image src="/images/samorafit-workout-logo.webp" width={2858} height={647} sizes="230px" alt="SamoraFit Workout"/><span>WORKOUT ONLINE</span></header>
  <main>
   <section className={styles.hero} aria-labelledby="workout-heading">
    <div className={styles.heroCopy}><span className={styles.eyebrow}>TREINA AO TEU RITMO</span><h1 id="workout-heading">O teu treino.<br/>Onde <em>quiseres.</em></h1><p>O Workout Online da SamoraFit acompanha-te. Escolhe o teu período e tem acesso total ao programa.</p><a href="#workout-plans" className={styles.heroCta}>Escolher o meu acesso<ArrowRight size={20}/></a><span className={styles.startingPrice}>A partir de <strong>4.999 Kz</strong> por 1 mês de acesso total.</span></div>
    <figure className={styles.heroPhoto}><Image src="/images/workout-bruno.jpg" width={5760} height={3840} sizes="(max-width: 650px) calc(100vw - 44px), 46vw" alt="Bruno Samora com equipamento SamoraFit Workout" preload/><figcaption><Image src="/images/samorafit-workout-logo.webp" width={2858} height={647} sizes="270px" alt="SamoraFit Workout"/></figcaption></figure>
   </section>
   <section id="workout-plans" className={styles.plansSection} aria-labelledby="workout-plans-heading">
    <div className={styles.plansHeading}><span className={styles.eyebrow}>O MESMO ACESSO. O TEU TEMPO.</span><h2 id="workout-plans-heading">Quanto tempo queres <em>dedicar a ti?</em></h2><p>Todos os planos incluem acesso total. Escolhe a duração.</p></div>
    <div className={styles.grid}>{workoutPlans.map(plan => <article key={plan.id} className={styles.card}>
     <span className={styles.accessLabel}>ACESSO TOTAL</span><h3>{plan.title}</h3><p className={styles.price}>{plan.price}<span> Kz</span></p><p className={styles.total}>Valor total para {plan.title}</p><div className={styles.benefit}><Check size={18}/><span>Acesso total durante {plan.title}</span></div><Link href={`/workout/checkout?plan=${encodeURIComponent(plan.id)}`} className={styles.planCta}>Escolher este acesso<ArrowUpRight size={18}/></Link>
    </article>)}</div>
   </section>
  </main>
  <footer className={styles.footer}><Image src="/images/samorafit-workout-logo.webp" width={2858} height={647} sizes="155px" alt="SamoraFit Workout"/><span>O teu próximo passo começa contigo.</span></footer>

 </div>;
}
