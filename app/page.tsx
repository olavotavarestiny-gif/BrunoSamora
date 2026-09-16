'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowRight, ArrowLeft, Check, Sparkles, LockKeyhole, RotateCcw, Crown } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { questions, validPhone } from './quiz-data';
import { plans, recommendPlan, getPlan, type PlanId } from '../supabase/functions/_shared/fit90.ts';
import { submitLead } from '@/lib/leads-client';

type Screen = 'intro' | 'quiz' | 'analysis' | 'result' | 'contact' | 'success';
function Logo({ className = '' }: { className?: string }) {
 return <img className={className} src="/images/samorafit-studio-logo.webp" alt="SamoraFit Studio" width={2731} height={578}/>;
}
export default function Home() {
 const [screen, setScreen] = useState<Screen>('intro');
 const [step, setStep] = useState(0);
 const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(''));
 const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
 const [name, setName] = useState('');
 const [phone, setPhone] = useState('');
 const [email, setEmail] = useState('');
 const [consent, setConsent] = useState(false);
 const [error, setError] = useState('');
 const [submitting, setSubmitting] = useState(false);
 const [analysisStage, setAnalysisStage] = useState(0);
 const [dialog, setDialog] = useState(false);
 const heading = useRef<HTMLHeadingElement>(null);
 const requestId = useRef<string | null>(null);
 const submittingRef = useRef(false);
 const frozenSubmission = useRef<Parameters<typeof submitLead>[0] | null>(null);
 const question = questions[step];
 const recommended = recommendPlan(answers[5]);
 const chosen = getPlan(selectedPlan);
 const recommendation = getPlan(recommended);
 const state = useRef({ screen, step, answers });
 state.current = { screen, step, answers };

 useEffect(() => {
  if (screen !== 'intro') heading.current?.focus();
  window.scrollTo({ top: 0, behavior: 'instant' });
 }, [screen, step]);
 useEffect(() => {
  if (screen !== 'analysis') return;
  setAnalysisStage(0);
  const first = setTimeout(() => setAnalysisStage(1), 400);
  const last = setTimeout(() => setScreen('result'), 1000);
  return () => { clearTimeout(first); clearTimeout(last); };
 }, [screen]);
 useEffect(() => {
  const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
  if (!context) return;
  const lifecycle = new AbortController();
  try {
   Promise.resolve(context.registerTool({ name: 'start_body_plan_quiz', title: 'Iniciar diagnóstico', description: 'Abre a primeira pergunta do quiz sem enviar dados.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false }, execute: async (input: unknown) => {
    if (!input || typeof input !== 'object' || Object.keys(input).length) throw new Error('Não são aceites parâmetros.');
    if (submittingRef.current) throw new Error('Aguarda a confirmação do envio.');
    setStep(0); setScreen('quiz');
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return { screen: state.current.screen, question: questions[0].title };
   } }, { signal: lifecycle.signal })).catch(() => {});
  } catch { /* Optional browser capability. */ }
  return () => lifecycle.abort();
 }, []);
 function choose(value: unknown) {
  if (typeof value !== 'string' || !question.options.includes(value)) return;
  setAnswers(prev => prev.map((answer, index) => index === step ? value : answer));
 }
 function next() {
  if (!answers[step]) return;
  if (step === questions.length - 1) setScreen('analysis'); else setStep(step + 1);
 }
 function back() {
  setError('');
  if (screen === 'contact') setScreen('result');
  else if (step > 0) setStep(step - 1);
  else setScreen('intro');
 }
 function selectPlan(id: PlanId) {
  setSelectedPlan(id); setError(''); setScreen('contact');
 }
 async function submit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (submittingRef.current || !selectedPlan) return;
  if (!name.trim()) { setError('Escreve o teu nome.'); return; }
  if (!validPhone(phone)) { setError('Introduz um número de WhatsApp válido, com indicativo.'); return; }
  if (!consent) { setError('Precisamos da tua autorização para guardar os dados e contactar-te sobre o Fit 90.'); return; }
  // Retry the exact same payload after ambiguous network failures. Changes start a new request.
  const current = { name, phone, email, answers, consent, selected_plan: selectedPlan };
  if (frozenSubmission.current && JSON.stringify(current) !== JSON.stringify({ ...frozenSubmission.current, id: undefined })) requestId.current = null;
  requestId.current ??= crypto.randomUUID();
  const payload = { ...current, id: requestId.current };
  frozenSubmission.current = payload;
  submittingRef.current = true; setSubmitting(true); setError('');
  try { await submitLead(payload); setScreen('success'); setDialog(true); }
  catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível guardar os dados. Tenta novamente.'); }
  finally { submittingRef.current = false; setSubmitting(false); }
 }
 function restart() {
  setAnswers(Array(questions.length).fill('')); setStep(0); setScreen('intro'); setSelectedPlan(null);
  setName(''); setPhone(''); setEmail(''); setError(''); setConsent(false); setDialog(false);
  requestId.current = null; frozenSubmission.current = null;
 }
 return <div className={`site screen-${screen}`}>
  <header className="header">
   <a className="brand" href="/" aria-label="SamoraFit Studio, início"><Logo className="brand-logo"/></a>
   {screen === 'intro' ? <span className="header-mark" aria-hidden="true"><i/><i/><i/></span> : <span className="header-caption">FIT 90 · O TEU RITMO</span>}
  </header>
  {screen === 'intro' && <>
   <main className="hero enter">
    <section className="hero-copy"><span className="eyebrow">TRÊS PLANOS. UM NOVO COMEÇO.</span><h1>O teu próximo passo é o <em>Fit 90.</em></h1><p>Responde a 6 perguntas rápidas e descobre o plano que acompanha o teu ritmo.</p><button className="primary" onClick={() => setScreen('quiz')}>Encontrar o meu plano<ArrowRight size={21}/></button></section>
    <figure className="hero-photo"><div className="photo-red"/><img className="trainer-photo" src="/images/bruno-fit90-hero.jpg" alt="Bruno Samora com camisola vermelha SamoraFit e um haltere" width={5760} height={3840} fetchPriority="high"/><span className="photo-outline" aria-hidden="true"/><span className="photo-arrow" aria-hidden="true"><ArrowUpRight/></span><div className="photo-brand"><Logo/></div></figure>
   </main>
   <div className="hero-bottom" aria-hidden="true"><span className="mini-line"/><div className="step-dots"><b/><i/><i/><i/><i/><i/></div><span className="mini-line"/></div>
  </>}
  {screen === 'quiz' && <main className="flow">
   <div className="flow-top"><button className="back" onClick={back}><ArrowLeft size={17}/>Voltar</button><span>Pergunta {String(step + 1).padStart(2, '0')} de {String(questions.length).padStart(2, '0')}</span></div>
   <Progress value={(step + 1) / questions.length * 100} aria-label="Progresso do diagnóstico" className="quiz-progress"/>
   <section key={step} className="question enter">
    <figure className="question-photo"><img src={`/images/${question.image}`} alt={question.alt}/><span className="image-corner" aria-hidden="true"><ArrowUpRight/></span>{step < 5 && <figcaption>Imagem criada por IA</figcaption>}</figure>
    <div className="question-content"><span className="eyebrow">{step === 5 ? 'O TEU RITMO, O TEU PLANO' : 'O TEU PONTO DE PARTIDA'}</span><h1 ref={heading} tabIndex={-1} id="question-heading">{question.title}</h1><RadioGroup aria-labelledby="question-heading" value={answers[step]} onValueChange={choose} className={`answer-grid ${step === 0 ? 'two-options' : ''}`}>{question.options.map((option, index) => <label key={option} className={`answer-card ${answers[step] === option ? 'selected' : ''}`}><span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span><span>{option}</span><RadioGroupItem value={option} aria-label={option}/></label>)}</RadioGroup><button className="primary continue" disabled={!answers[step]} onClick={next}>{step === questions.length - 1 ? 'Ver os meus planos' : 'Continuar'}<ArrowRight size={20}/></button></div>
   </section>
  </main>}
  {screen === 'analysis' && <main className="analysis enter" aria-live="polite"><div className="analysis-symbol"><Sparkles size={35}/></div><h1 ref={heading} tabIndex={-1}>A encontrar o teu ritmo.</h1><p>A preparar os três planos Fit 90 para ti...</p><Progress value={analysisStage ? 85 : 30} aria-label="Preparação dos planos" className="analysis-progress"/></main>}
  {screen === 'result' && <main className="plans-result enter">
   <div className="flow-top"><button className="back" onClick={() => { setStep(questions.length - 1); setScreen('quiz'); }}><ArrowLeft size={17}/>Alterar frequência</button><span>ESCOLHE O TEU FIT 90</span></div>
   <div className="plans-heading"><span className="eyebrow">À MEDIDA DO TEU RITMO</span><h1 ref={heading} tabIndex={-1}>O teu objetivo.<br className="mobile-break"/> <em>O teu Fit 90.</em></h1><p>Três formas de começar. A escolha é tua.</p></div>
   <div className="recommendation-summary"><Sparkles size={20}/><p>Para o ritmo que escolheste, recomendamos <strong>{recommendation?.name}</strong>.</p></div>
   <div className="plans-grid" aria-label="Comparação dos três planos Fit 90">
    {plans.map(plan => {
     const isRecommended = plan.id === recommended;
     return <article key={plan.id} className={`offer-card offer-${plan.id} ${isRecommended ? 'is-recommended' : ''}`} aria-labelledby={`plan-${plan.id}`}>
      <div className="plan-badges">{plan.id === 'performance' && <span className="popular-badge">Mais Recomendado</span>}{isRecommended && <span className="personal-badge"><Check size={14}/>Recomendado para si</span>}</div>
      <div className="offer-tier">{plan.id === 'gold' && <Crown size={16}/>}<span>{plan.tier}</span></div>
      <h2 id={`plan-${plan.id}`}>{plan.name}</h2>
      <p className="offer-tagline">{plan.description}</p>
      <p className="offer-price">{plan.priceLabel}<span> Kz</span></p>
      <div className="offer-details"><p className="offer-frequency"><Check size={18}/>{plan.frequency}</p><p>{plan.detail}</p></div>
      <button className={`plan-cta ${isRecommended ? 'recommended-cta' : ''}`} onClick={() => selectPlan(plan.id)}>Escolher {plan.name.replace(' Fit 90', '')}<ArrowUpRight size={19}/></button>
     </article>;
    })}
   </div>
   <p className="choice-note">A recomendação acompanha a tua frequência. Podes escolher qualquer um dos três planos.</p>
   <button className="restart" onClick={restart}><RotateCcw size={15}/>Refazer diagnóstico</button>
  </main>}
  {screen === 'contact' && chosen && <main className="flow">
   <div className="flow-top"><button className="back" disabled={submitting} onClick={back}><ArrowLeft size={17}/>Voltar aos planos</button><span>Último passo</span></div>
   <section className="contact enter"><span className="small-icon"><Sparkles size={25}/></span><span className="eyebrow">A TUA ESCOLHA</span><h1 ref={heading} tabIndex={-1}>{chosen.name}</h1><p className="chosen-summary"><strong>{chosen.priceLabel} Kz</strong><span>{chosen.frequency}</span></p>
    <form onSubmit={submit} aria-busy={submitting}><fieldset disabled={submitting} className="contact-fields">
     <label>Nome<input name="name" autoComplete="name" placeholder="Como te chamas?" required maxLength={120} value={name} onChange={e => setName(e.target.value)}/></label>
     <label>WhatsApp<input name="tel" type="tel" inputMode="tel" autoComplete="tel" placeholder="+244 9XX XXX XXX" required maxLength={30} value={phone} onChange={e => setPhone(e.target.value)}/></label>
     <label>E-mail <span className="optional">opcional</span><input name="email" type="email" autoComplete="email" placeholder="O teu e-mail" maxLength={254} value={email} onChange={e => setEmail(e.target.value)}/></label>
     <label className="consent"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)}/><span>Autorizo a equipa Bruno Samora a guardar o meu nome, contactos, respostas e plano escolhido e a contactar-me sobre o Fit 90. Posso pedir a eliminação dos meus dados à equipa.</span></label>
     {error && <p className="error" role="alert">{error}</p>}
     <button className="primary" type="submit" disabled={submitting}>{submitting ? 'A guardar...' : 'Quero começar'}<ArrowRight size={20}/></button><p className="privacy"><LockKeyhole size={13}/>Os teus dados são partilhados apenas com a equipa responsável pelo Fit 90.</p>
    </fieldset></form>
   </section>
  </main>}
  {screen === 'success' && chosen && <main className="success-screen enter"><span className="small-icon"><Check size={25}/></span><span className="eyebrow">PEDIDO RECEBIDO</span><h1 ref={heading} tabIndex={-1}>O teu próximo passo:<br/><em>{chosen.name}.</em></h1><p>A equipa vai contactar-te sobre o plano de {chosen.priceLabel} Kz.</p><button className="restart" onClick={restart}><RotateCcw size={15}/>Novo diagnóstico</button></main>}
  <Dialog open={dialog} onOpenChange={setDialog}><DialogContent className="prototype-dialog" showCloseButton={false}><span className="small-icon"><Check size={25}/></span><DialogTitle>Escolha guardada: {chosen?.name}</DialogTitle><DialogDescription>Recebemos o teu contacto, as respostas e o plano escolhido. A equipa Bruno Samora vai contactar-te. Este pedido não constitui uma reserva ou pagamento.</DialogDescription><DialogClose className="primary">Concluir<Check size={18}/></DialogClose></DialogContent></Dialog>
 </div>;
}
