'use client';
import { useRef, useState, type SyntheticEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, LockKeyhole } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { WorkoutPlan } from '../catalog';
import { validateCheckout, type Customer } from '../../../lib/workout/checkout';
import styles from './checkout.module.css';

export default function Checkout({ plan }: { plan: WorkoutPlan }) {
 const [customer, setCustomer] = useState<Customer>({ name: '', email: '', phone: '+244 ' });
 const [step, setStep] = useState<'details' | 'review'>('details');
 const [busy, setBusy] = useState(false);
 const [notice, setNotice] = useState('');
 const [unavailable, setUnavailable] = useState(false);
 const requestId = useRef('');
 const heading = useRef<HTMLHeadingElement>(null);
 function payload() {
  if (!requestId.current) requestId.current = crypto.randomUUID();
  return { planId: plan.id, customer, requestId: requestId.current };
 }
 function review(event: SyntheticEvent<HTMLFormElement>) {
  event.preventDefault();
  const result = validateCheckout(payload());
  if ('error' in result) { setNotice(result.error); return; }
  setCustomer(result.input.customer); setNotice(''); setStep('review');
  setTimeout(() => heading.current?.focus(), 0);
 }
 async function pay() {
  if (busy) return;
  setBusy(true); setNotice(''); setUnavailable(false);
  try {
   const response = await fetch('/api/workout/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()), signal: AbortSignal.timeout(20000) });
   const raw: unknown = await response.json();
   if (!raw || typeof raw !== 'object') throw new Error('Invalid response');
   const data = raw as Record<string, unknown>;
   if (response.ok && data.status === 'redirect' && typeof data.checkoutUrl === 'string') {
    const url = new URL(data.checkoutUrl);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid URL');
    window.location.assign(url.href); return;
   }
   setUnavailable(data.code === 'GATEWAY_NOT_CONFIGURED');
   setNotice(typeof data.error === 'string' ? data.error : 'Não foi possível iniciar o pagamento. Tenta novamente.');
  } catch { setNotice('Não foi possível ligar ao checkout. Verifica a ligação e tenta novamente.'); }
  finally { setBusy(false); }
 }
 return <div className={styles.page}>
  <div className={styles.preview}><LockKeyhole size={15}/>Checkout seguro · O pagamento será processado pelo parceiro</div>
  <header className={styles.header}><Link href="/workout" aria-label="Voltar ao Workout"><Image src="/images/samorafit-workout-logo.webp" width={2858} height={647} sizes="220px" alt="SamoraFit Workout" preload/></Link><span>CHECKOUT</span></header>
  <Link className={styles.back} href="/workout#workout-plans"><ArrowLeft size={16}/>Alterar plano</Link>
  <main className={styles.layout}>
   <section className={styles.formPanel}>
    <ol className={styles.steps} aria-label="Etapas do checkout"><li aria-current={step === 'details' ? 'step' : undefined}><span>{step === 'review' ? <Check size={15}/> : '1'}</span>Os teus dados</li><li aria-current={step === 'review' ? 'step' : undefined}><span>2</span>Rever e pagar</li></ol>
    <h1 tabIndex={-1} ref={heading}>{step === 'details' ? 'Está quase. Vamos começar?' : 'Confirma a tua escolha.'}</h1>
    <p className={styles.intro}>{step === 'details' ? 'Preenche os dados para preparar o teu acesso ao Workout Online.' : 'Revê os dados antes de continuar para o pagamento.'}</p>
    {step === 'details' ? <form onSubmit={review}>
     <label htmlFor="customer-name">Nome completo</label><input id="customer-name" name="name" autoComplete="name" required minLength={2} maxLength={120} value={customer.name} onChange={e => { setCustomer({ ...customer, name: e.target.value }); requestId.current = ''; }}/>
     <label htmlFor="customer-email">Email</label><input id="customer-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="nome@exemplo.com" value={customer.email} onChange={e => { setCustomer({ ...customer, email: e.target.value }); requestId.current = ''; }}/>
     <label htmlFor="customer-phone">Telefone</label><input id="customer-phone" name="phone" type="tel" autoComplete="tel" required maxLength={24} aria-describedby="phone-help" value={customer.phone} onChange={e => { setCustomer({ ...customer, phone: e.target.value }); requestId.current = ''; }}/><p id="phone-help" className={styles.hint}>Inclui o indicativo do país. Ex.: +244 923 456 789.</p>
     <p className={styles.privacy}>Os teus dados serão enviados apenas quando confirmares o pedido. Os dados de pagamento serão tratados no ambiente seguro do parceiro.</p>
     {notice && <p className={styles.error} role="alert">{notice}</p>}
     <button className={styles.primary} type="submit">Rever o meu pedido<ArrowRight size={18}/></button>
    </form> : <div>
     <dl className={styles.details}><dt>Nome</dt><dd>{customer.name}</dd><dt>Email</dt><dd>{customer.email}</dd><dt>Telefone</dt><dd>{customer.phone}</dd></dl>
     <button className={styles.edit} disabled={busy} onClick={() => { setStep('details'); setNotice(''); setUnavailable(false); setTimeout(() => heading.current?.focus(), 0); }}>Editar dados</button>
     <div className={styles.payment}><LockKeyhole size={21}/><div><strong>Pagamento seguro</strong><p>Continuarás para o ambiente do parceiro de pagamento. Não pedimos dados de cartão nesta página.</p></div></div>
     {notice && <p className={unavailable ? styles.notice : styles.error} role={unavailable ? 'status' : 'alert'}>{notice}</p>}
     <button className={styles.primary} onClick={pay} disabled={busy} aria-busy={busy}>{busy ? 'A preparar pagamento…' : 'Continuar para pagamento'}<ArrowRight size={18}/></button>
     {unavailable && <p className={styles.hint}>A ligação ao parceiro de pagamento ainda está a ser finalizada.</p>}
    </div>}
   </section>
   <aside className={styles.summary} aria-label="Resumo do pedido"><span className={styles.eyebrow}>O TEU PROGRAMA</span><h2>Workout Online</h2><p className={styles.duration}>{plan.title} de acesso total</p><div className={styles.feature}><Check size={18}/>Acesso total ao programa</div><div className={styles.feature}><Check size={18}/>Duração: {plan.title}</div><div className={styles.amount}><span>Total do período</span><strong>{plan.price}<small> Kz</small></strong></div><p className={styles.hint}>Valor para o período completo. Sem renovação automática configurada.</p><div className={styles.summaryNote}><LockKeyhole size={17}/><span>O acesso só será ativado após confirmação do pagamento.</span></div></aside>
  </main>
  <footer className={styles.footer}>SamoraFit Workout · O teu próximo passo começa contigo.</footer>
 </div>;
}
