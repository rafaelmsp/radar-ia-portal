import {useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,Check,CheckCircle2,ClipboardCheck,ClipboardCopy,
 FileCheck2,Lightbulb,LockKeyhole,Search,ShieldCheck,Sparkles,Clock3,RotateCcw} from 'lucide-react';
import {buildSafePrompt,guides,promptTasks,verificationChecks,type Guide,type PromptTask} from './practiceContent';

export type PracticeTab='guias'|'checklist'|'prompt';
function GuideGlyph({type}:{type:Guide['icon']}){
 return type==='shield'?<ShieldCheck/>:type==='search'?<Search/>:type==='file'?<FileCheck2/>:<Sparkles/>;
}
export default function Practice({active,setActive}:{active:PracticeTab;setActive:(tab:PracticeTab)=>void}){
 const [guideId,setGuideId]=useState<string|null>(null);
 const [checks,setChecks]=useState<number[]>([]);
 const [guideChecks,setGuideChecks]=useState<number[]>([]);
 const [task,setTask]=useState<PromptTask>('revisao');
 const [goal,setGoal]=useState('');
 const [copied,setCopied]=useState(false);
 const [copyError,setCopyError]=useState(false);
 const guide=guides.find(g=>g.id===guideId);
 const generated=buildSafePrompt(task,goal);
 async function copyPrompt(){
   let ok=false;
   try{
     if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(generated);ok=true}
   }catch{ /* Alguns navegadores bloqueiam o clipboard */ }
   if(!ok){
     const input=document.createElement('textarea');
     input.value=generated;input.style.position='fixed';input.style.left='-9999px';
     document.body.appendChild(input);input.focus();input.select();
     try{ok=document.execCommand('copy')}catch{ok=false}
     input.remove();
   }
   setCopied(ok);setCopyError(!ok);
 }
 return <div className="practice-page">
  <div className="page-intro"><div className="section-kicker"><span className="eyebrow-line"/> CENTRO DE FERRAMENTAS</div>
    <h1>IA na prática, <i>sem complicação.</i></h1>
    <p>Orientações rápidas e ferramentas simples para você usar inteligência artificial com mais segurança no trabalho jurídico. Sem precisar criar uma conta.</p>
  </div>
  <div className="practice-nav" role="tablist" aria-label="Ferramentas">
    <button role="tab" aria-selected={active==='guias'} className={active==='guias'?'active':''} onClick={()=>{setActive('guias');setGuideId(null)}}><BookOpen size={17}/> Guias rápidos</button>
    <button role="tab" aria-selected={active==='checklist'} className={active==='checklist'?'active':''} onClick={()=>setActive('checklist')}><ClipboardCheck size={17}/> Conferir resposta da IA</button>
    <button role="tab" aria-selected={active==='prompt'} className={active==='prompt'?'active':''} onClick={()=>setActive('prompt')}><Sparkles size={17}/> Montar um prompt</button>
  </div>
  {active==='guias'&&(!guide?<div className="guide-grid">
    {guides.map(g=><button className="guide-card" key={g.id} onClick={()=>{setGuideId(g.id);setGuideChecks([])}}>
      <div className="guide-top"><span className="guide-icon"><GuideGlyph type={g.icon}/></span><span className="guide-time"><Clock3 size={13}/> {g.minutes} min</span></div>
      <span className="guide-tag">{g.tag}</span><h3>{g.title}</h3><p>{g.description}</p>
      <span className="text-cta">Ver passo a passo <ArrowRight size={17}/></span>
    </button>)}
  </div>:<div className="guide-detail">
    <button className="back-link" onClick={()=>setGuideId(null)}><ArrowLeft size={17}/> Todos os guias</button>
    <div className="guide-tag">{guide.tag} · {guide.minutes} MIN</div>
    <h2>{guide.title}</h2><p>{guide.description}</p>
    <div className="step-list">{guide.steps.map((s,i)=><label className={'step '+(guideChecks.includes(i)?'done':'')} key={i}>
      <input type="checkbox" checked={guideChecks.includes(i)} onChange={e=>setGuideChecks(c=>e.target.checked?[...c,i]:c.filter(v=>v!==i))}/>
      <span className="step-count">{String(i+1).padStart(2,'0')}</span><span>{s}</span><CheckCircle2 size={21} className="step-tick"/>
    </label>)}</div>
    <div className="result-note"><CheckCircle2 size={21}/><span>{guide.outcome}</span></div>
    <div className="fineprint">Material educativo. Não substitui a análise jurídica do caso concreto.</div>
  </div>)}
  {active==='checklist'&&<div className="tool-layout">
    <div className="tool-panel">
      <div className="tool-number">01 / CONFERÊNCIA</div>
      <h2>Antes de usar o texto, <i>confira estes pontos.</i></h2>
      <p className="tool-lead">Uma lista rápida para revisar textos e respostas geradas por inteligência artificial. Marque cada item somente quando tiver feito a verificação.</p>
      <div className="tool-progress"><span>{checks.length} de {verificationChecks.length} verificações</span><strong>{Math.round(checks.length/verificationChecks.length*100)}%</strong></div>
      <div className="tool-progress-track"><span style={{width:(checks.length/verificationChecks.length*100)+'%'}}/></div>
      <div className="verification-list">{verificationChecks.map((s,i)=><label key={i} className={'verify-check '+(checks.includes(i)?'done':'')}>
        <input type="checkbox" checked={checks.includes(i)} onChange={e=>setChecks(c=>e.target.checked?[...c,i]:c.filter(x=>x!==i))}/>
        <span className="verify-square">{checks.includes(i)&&<Check size={14}/>}</span><span>{s}</span>
      </label>)}</div>
      <button className="quiet-button" onClick={()=>setChecks([])}><RotateCcw size={16}/> Reiniciar checklist</button>
    </div>
    <aside className="tool-aside"><ShieldCheck size={29}/><h3>Por que isso importa?</h3><p>A IA pode produzir textos convincentes e ainda assim apresentar referências inexistentes, informações desatualizadas ou interpretações incorretas.</p><div className="aside-divider"/><strong>{checks.length===verificationChecks.length?'Revisão declarada':'A responsabilidade continua humana'}</strong><p>{checks.length===verificationChecks.length?'Você marcou todos os itens. Isso não substitui uma conferência jurídica efetiva.':'Marcar a lista não valida automaticamente o documento. As verificações devem ser feitas nas fontes competentes.'}</p></aside>
  </div>}
  {active==='prompt'&&<div className="tool-layout">
    <div className="tool-panel">
      <div className="tool-number">02 / PRODUTIVIDADE RESPONSÁVEL</div>
      <h2>Um pedido melhor gera <i>um começo melhor.</i></h2>
      <p className="tool-lead">Monte instruções para tarefas jurídicas comuns. O texto é criado aqui no seu aparelho: não enviamos o objetivo digitado para um modelo de IA.</p>
      <div className="privacy-warning"><LockKeyhole size={19}/><span>Não informe nomes, CPF, números de processo, dados pessoais, segredos ou informações confidenciais.</span></div>
      <label className="field-label">O que você quer fazer?</label>
      <div className="task-picker">{promptTasks.map(t=><button key={t.id} className={task===t.id?'active':''} onClick={()=>{setTask(t.id);setCopied(false)}}><strong>{t.label}</strong><small>{t.help}</small></button>)}</div>
      <label className="field-label" htmlFor="goal">Objetivo genérico (opcional)</label>
      <textarea id="goal" className="goal-field" maxLength={350} value={goal} onChange={e=>{setGoal(e.target.value);setCopied(false)}} placeholder="Ex.: organizar um roteiro de conferência para um contrato fictício, sem dados de clientes..."/>
      <div className="prompt-preview"><div className="prompt-preview-head"><span>SEU PROMPT · GERADO NO DISPOSITIVO</span><span>{generated.length} caracteres</span></div><pre>{generated}</pre></div>
      <button className="button-primary" onClick={()=>void copyPrompt()}>{copied?<><Check size={17}/> Copiado</>:<><ClipboardCopy size={17}/> Copiar prompt</>}</button>
      {copyError&&<p className="copy-error" role="status">A cópia automática não está disponível neste navegador. Você pode selecionar e copiar o texto na caixa acima.</p>}
    </div>
    <aside className="tool-aside"><Lightbulb size={29}/><h3>Como usar</h3><p>Copie o texto e cole na ferramenta de IA de sua preferência. Se necessário, acrescente apenas informações que você tenha autorização para tratar.</p><div className="aside-divider"/><strong>O que o Radar não faz</strong><p>Não envia dados para outras ferramentas, não valida o resultado e não substitui sua revisão profissional.</p></aside>
  </div>}
 </div>;
}
