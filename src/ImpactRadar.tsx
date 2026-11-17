import {useEffect,useMemo,useState} from 'react';
import {ArrowRight,ArrowUpRight,Bookmark,Check,ClipboardCopy,Eye,FileCheck2,
Filter,Info,Printer,Scale,ShieldCheck,SlidersHorizontal} from 'lucide-react';

export type Brief={
 slug:string;title:string;topic:string;kind:string;stage:string;summary:string;
 why_it_matters:string;next_step:string;source_name:string;source_url:string;
 source_date:string;checked_on:string;is_published:boolean;updated_at:string;
};
export type LegislativeStatus={
 id:string;title:string;stage:string;last_action:string;action_at_local:string|null;
 last_checked_at:string;source_url:string;
};
export type LegislativeEvent={id:string;monitor_id:string;action:string;stage:string;detected_at:string;action_at_local:string|null};
export const topicOptions=[
 {id:'peticoes',label:'Petições e responsabilidade',short:'Petições'},
 {id:'tribunais',label:'IA nos tribunais',short:'Tribunais'},
 {id:'dados',label:'Dados dos clientes',short:'Dados'},
 {id:'regulacao',label:'Regulação da IA',short:'Regulação'}
];
const storageKey='radar-ia-acompanhamentos-v1';
export type WatchState={topics:string[];saved:string[];seen:string[];lastVisit:string|null};
const empty:WatchState={topics:[],saved:[],seen:[],lastVisit:null};
function safeState():WatchState{
 try{const raw=localStorage.getItem(storageKey);if(!raw)return empty;
   const s=JSON.parse(raw);return {topics:Array.isArray(s.topics)?s.topics.filter((x:unknown)=>topicOptions.some(t=>t.id===x)):[],
     saved:Array.isArray(s.saved)?s.saved.filter((x:unknown)=>typeof x==='string'):[],
     seen:Array.isArray(s.seen)?s.seen.filter((x:unknown)=>typeof x==='string'):[],
     lastVisit:typeof s.lastVisit==='string'?s.lastVisit:null};
 }catch{return empty}
}
export function topicLabel(id:string){return topicOptions.find(x=>x.id===id)?.label||'Assunto'}
export function matchedBriefs(items:Brief[],topics:string[]){return topics.length?items.filter(x=>topics.includes(x.topic)):items}
function dated(date:string){const d=new Date(date+'T12:00:00');return Number.isNaN(d.getTime())?'Data não informada':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}
function safeLink(link:string){try{const u=new URL(link);return u.protocol==='https:'?u.href:''}catch{return ''}}

export default function ImpactRadar({briefs,loading,onNotice,legislative,events}:{briefs:Brief[];loading:boolean;onNotice:(value:string)=>void;legislative:LegislativeStatus|null;events:LegislativeEvent[]}){
 const [watch,setWatch]=useState<WatchState>(()=>safeState());
 const [onlySaved,setOnlySaved]=useState(false);
 const [opened,setOpened]=useState<string|null>(null);
 const [bulletin,setBulletin]=useState(false);
 const [showPreferences,setShowPreferences]=useState(true);
 useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(watch))}catch{/* Bloqueio do armazenamento não impede a leitura. */}},[watch]);
 function update(fn:(old:WatchState)=>WatchState){setWatch(fn)}
 const matching=useMemo(()=>matchedBriefs(briefs,watch.topics),[briefs,watch.topics]);
 const visible=onlySaved?matching.filter(b=>watch.saved.includes(b.slug)):matching;
 const unseen=matching.filter(b=>!watch.seen.includes(b.slug+'@'+b.updated_at));
 const lastVisitDate=watch.lastVisit?new Date(watch.lastVisit):null;
 const newEvents=events.filter(e=>!lastVisitDate||new Date(e.detected_at)>lastVisitDate);
 function toggleTopic(id:string){update(s=>({...s,topics:s.topics.includes(id)?s.topics.filter(x=>x!==id):[...s.topics,id]}))}
 function toggleSaved(slug:string){update(s=>({...s,saved:s.saved.includes(slug)?s.saved.filter(x=>x!==slug):[...s.saved,slug]}))}
 function markRead(slug:string,version:string){const stamp=slug+'@'+version;update(s=>({...s,seen:s.seen.includes(stamp)?s.seen:[...s.seen,stamp],lastVisit:new Date().toISOString()}))}
 function openCard(slug:string,version:string){setOpened(v=>v===slug?null:slug);markRead(slug,version)}
 async function copyBulletin(){
   const text=['RADAR IA & DIREITO — meu resumo de acompanhamento',
     'Seleção pessoal: '+(watch.topics.length?watch.topics.map(topicLabel).join(', '):'Todos os assuntos'),
     'Referências técnicas verificadas no portal. Confirmar situação atual na fonte antes de utilizar.',
     ...matching.map(b=>['',b.title,(b.slug==='pl-2338-2023-camara'&&legislative?legislative.stage+' (API da Câmara)':b.stage),'Por que importa: '+b.why_it_matters,'Confira: '+b.next_step,'Fonte: '+b.source_url,'Verificado em: '+dated(b.checked_on)].join('\n'))
   ].join('\n');
   try{await navigator.clipboard.writeText(text);onNotice('Resumo copiado. Você pode enviar ou salvar onde preferir.')}
   catch{onNotice('Seu navegador bloqueou a cópia. Use a opção Imprimir / Salvar como PDF.')}
 }
 return <div className="impact-radar">
  <header className="impact-header">
    <div><div className="section-kicker"><span className="eyebrow-line"/> ACOMPANHAMENTO JURÍDICO PERSONALIZADO</div>
      <h1>O que pode afetar <i>sua atuação?</i></h1>
      <p>Escolha assuntos, veja o contexto e saiba exatamente o que conferir. Sem cadastro e sem misturar projeto de lei com regra vigente.</p>
    </div>
    <div className="impact-header-symbol"><Scale size={34}/></div>
  </header>
  <section className={"watch-box "+(!showPreferences?"collapsed":"")}>
    <div className="watch-heading"><div><span className="watch-step">01 / SELECIONE</span><h2>Quais assuntos interessam ao seu trabalho?</h2><p>Seu acompanhamento fica salvo neste navegador. Não enviaremos e-mails nem notificações sem inscrição específica.</p></div><SlidersHorizontal size={25}/></div>
    {!showPreferences&&<button className="watch-reopen" onClick={()=>setShowPreferences(true)}>Alterar os assuntos acompanhados <SlidersHorizontal size={15}/></button>}<div className="watch-choices">{topicOptions.map(t=><button key={t.id} type="button" aria-pressed={watch.topics.includes(t.id)} className={watch.topics.includes(t.id)?'active':''} onClick={()=>toggleTopic(t.id)}><span className="watch-tick">{watch.topics.includes(t.id)?<Check size={15}/>:<Filter size={13}/>}</span>{t.label}</button>)}</div>
    <div className="watch-bottom"><span>{watch.topics.length===0?'Mostrando todos os assuntos disponíveis':watch.topics.length+' assunto(s) escolhido(s)'}</span><button onClick={()=>{setShowPreferences(false);document.querySelector('#fichas-praticas')?.scrollIntoView({behavior:'smooth'})}}>Ver meu acompanhamento <ArrowRight size={17}/></button></div>
  </section>
  <div className="watch-summary"><div className="watch-summary-icon"><Eye size={24}/></div><div><strong>{matching.length} ficha{matching.length===1?'':'s'} para acompanhar · {unseen.length} ainda não aberta{unseen.length===1?'':'s'}</strong><p>{watch.topics.length?'Exibindo apenas seus temas.':'Selecione assuntos para deixar o radar mais relevante.'} {lastVisitDate?'Último uso registrado neste aparelho: '+lastVisitDate.toLocaleDateString('pt-BR')+'.':'Primeira visita neste aparelho.'}</p></div><button className="button-secondary" onClick={()=>setBulletin(v=>!v)}>{bulletin?'Fechar resumo':'Meu resumo'} <ArrowRight size={16}/></button></div>
  {(watch.topics.length===0||watch.topics.includes('regulacao'))&&<section className="legislative-monitor">
     <div className="legislative-monitor-heading"><div><span className="live-monitor-badge"><span/> MONITORAMENTO AUTOMÁTICO · CÂMARA DOS DEPUTADOS</span><h2>PL 2338/2023 — andamento legislativo</h2></div><Scale size={26}/></div>
     {legislative?<><div className="legislative-monitor-grid"><div><span>Situação cadastrada</span><strong>{legislative.stage}</strong></div><div><span>Última conferência automática</span><strong>{new Date(legislative.last_checked_at).toLocaleString('pt-BR')}</strong></div><div><span>Movimentações novas detectadas</span><strong>{events.length}</strong></div></div>
       <p><strong>Última movimentação informada pela API:</strong> {legislative.last_action}</p>
       <div className="legislative-monitor-bottom"><span>Data cadastrada: {legislative.action_at_local?.replace('T',' ')||'não informada'} · Não representa lei em vigor.</span><a href={legislative.source_url} target="_blank" rel="noopener noreferrer">Ver situação na Câmara <ArrowUpRight size={15}/></a></div>
       {newEvents.length>0&&<div className="monitor-change"><Info size={17}/> {newEvents.length} alteração(ões) no registro desde {lastVisitDate?'o último acompanhamento':'a ativação do monitor'}. Consulte a movimentação original; a mudança no cadastro não significa aprovação de lei.</div>}
     </>:<p className="legislative-loading">Aguardando a primeira verificação automática da API. Consulte a tramitação diretamente na Câmara enquanto isso.</p>}
   </section>}
  {bulletin&&<section className="bulletin-box"><div className="section-kicker">MEU RESUMO DE ACOMPANHAMENTO</div><h2>Um panorama para conferir, não um parecer jurídico.</h2><p>{matching.length} referência(s) identificadas nos assuntos selecionados. Consulte as datas e os links: nem todas são novidades recentes.</p>
    <ol>{matching.map(b=><li key={b.slug}><strong>{b.title}</strong><span>{b.slug==='pl-2338-2023-camara'&&legislative?legislative.stage+' (API da Câmara)':b.stage} · Referência conferida em {dated(b.checked_on)}</span></li>)}</ol>
    <div className="bulletin-actions"><button className="button-primary" onClick={()=>void copyBulletin()}><ClipboardCopy size={17}/> Copiar resumo com fontes</button><button className="button-secondary" onClick={()=>window.print()}><Printer size={16}/> Imprimir / Salvar PDF</button></div>
  </section>}
  <section id="fichas-praticas" className="impact-list-section">
    <div className="section-heading-row"><div><div className="section-kicker"><span className="eyebrow-line"/> REFERÊNCIAS QUE MERECEM ATENÇÃO</div><h2>Não apenas a notícia. <i>O próximo passo.</i></h2><p>Fichas com situação, relevância e ações de conferência. Não são recomendações para um processo específico.</p></div></div>
    <div className="impact-toolbar"><button onClick={()=>setOnlySaved(false)} className={!onlySaved?'active':''}>Todos os assuntos selecionados</button><button onClick={()=>setOnlySaved(true)} className={onlySaved?'active':''}><Bookmark size={16}/> Salvos ({watch.saved.length})</button><button className="impact-adjust" onClick={()=>{setShowPreferences(true);document.querySelector('.watch-box')?.scrollIntoView({behavior:'smooth'})}}><SlidersHorizontal size={15}/> Ajustar</button></div>
    {loading?<div className="calm-empty">Carregando referências da fonte de dados...</div>:visible.length?
    <div className="impact-list">{visible.map((b,i)=><article key={b.slug} className="impact-card">
      <div className="impact-index">{String(i+1).padStart(2,'0')}</div>
      <div className="impact-body">
        <div className="impact-topline">{!watch.seen.includes(b.slug+'@'+b.updated_at)&&<span className="impact-unread">{watch.seen.some(s=>s.startsWith(b.slug+'@'))?'Atualizado desde sua leitura':'Não consultado'}</span>}<span className={'impact-kind kind-'+b.kind}>{b.kind==='decisao'?'DECISÃO':b.kind==='projeto'?'PROJETO DE LEI':b.kind==='norma'?'NORMA':'ORIENTAÇÃO'}</span><span>{topicLabel(b.topic)}</span></div>
        <h3>{b.title}</h3><div className="impact-stage"><Info size={16}/><strong>Situação:</strong> {b.slug==='pl-2338-2023-camara'&&legislative?legislative.stage+' (API da Câmara)':b.stage}</div>
        <div className="impact-content"><div><span className="impact-label">O que aconteceu</span><p>{b.summary}</p></div><div><span className="impact-label">Por que importa</span><p>{b.why_it_matters}</p></div></div>
        {opened===b.slug&&<div className="impact-next"><FileCheck2 size={22}/><div><strong>O que conferir agora</strong><p>{b.next_step}</p><small>Fonte consultada: {dated(b.checked_on)}. Reconfirme informações atuais no órgão competente.</small></div></div>}
        <div className="impact-footer"><button className="impact-expand" aria-expanded={opened===b.slug} onClick={()=>openCard(b.slug,b.updated_at)}>{opened===b.slug?'Fechar orientação':'Ver o que conferir'} <ArrowRight size={17}/></button><a target="_blank" rel="noopener noreferrer" href={safeLink(b.source_url)}>{b.source_name} <ArrowUpRight size={15}/></a><button className={'impact-save '+(watch.saved.includes(b.slug)?'active':'')} onClick={()=>toggleSaved(b.slug)} aria-pressed={watch.saved.includes(b.slug)}><Bookmark size={17} fill={watch.saved.includes(b.slug)?'currentColor':'none'}/>{watch.saved.includes(b.slug)?'Salvo':'Guardar'}</button></div>
        <div className="impact-verified"><ShieldCheck size={13}/> Documento de origem: {dated(b.source_date)} · Fonte verificada: {dated(b.checked_on)} · {b.kind==='projeto'?'Não é lei vigente':'Confira alterações posteriores'}</div>
      </div>
    </article>)}</div>:<div className="calm-empty"><Info size={27}/><strong>Sem fichas para essa seleção</strong><p>Outros temas já possuem referências verificadas. Escolha mais um assunto ou consulte todas as áreas. Não inventamos atualizações para preencher o painel.</p><button className="button-secondary" onClick={()=>{setOnlySaved(false);setWatch(s=>({...s,topics:[]}))}}>Mostrar todos os temas</button></div>}
  </section>
  <aside className="impact-footer-note"><ShieldCheck size={21}/><p><strong>Como funciona:</strong> este painel reúne referências documentadas e tópicos escolhidos por você. As fichas têm revisão editorial manual; novos documentos não são automaticamente avaliados quanto ao impacto. As escolhas ficam neste navegador; não há acompanhamento de processos judiciais nem aviso de prazo.</p></aside>
 </div>;
}
