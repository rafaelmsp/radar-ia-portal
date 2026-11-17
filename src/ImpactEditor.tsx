import {useEffect,useState,type FormEvent} from 'react';
import {ArrowUpRight,Check,FilePlus2,FileText,RefreshCw,Trash2} from 'lucide-react';
import {db} from './lib';
import {topicOptions,type Brief} from './ImpactRadar';

const today=()=>new Date().toISOString().slice(0,10);
type FormFields={
 slug:string;title:string;topic:string;kind:string;stage:string;summary:string;
 why_it_matters:string;next_step:string;source_name:string;source_url:string;
 source_date:string;
};
const blank:FormFields={
 slug:'',title:'',topic:'peticoes',kind:'decisao',stage:'',summary:'',
 why_it_matters:'',next_step:'',source_name:'',source_url:'',source_date:today()
};
const slugify=(title:string)=>title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,70);
export default function ImpactEditor({onNotice,onUpdated}:{onNotice:(s:string)=>void;onUpdated:()=>Promise<void>}){
 const [list,setList]=useState<Brief[]>([]);
 const [editing,setEditing]=useState<string|null>(null);
 const [form,setForm]=useState<FormFields>(blank);
 const [verified,setVerified]=useState(false);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 async function load(){
   if(!db)return;
   const {data,error}=await db.from('impact_briefs').select('*').order('updated_at',{ascending:false}).limit(100);
   if(error)onNotice('Erro ao abrir fichas: '+error.message);
   else setList((data||[]) as Brief[]);
   setLoading(false);
 }
 useEffect(()=>{void load()},[]);
 function edit(item:Brief){
   setForm({slug:item.slug,title:item.title,topic:item.topic,kind:item.kind,stage:item.stage,
     summary:item.summary,why_it_matters:item.why_it_matters,next_step:item.next_step,
     source_name:item.source_name,source_url:item.source_url,source_date:item.source_date});
   setEditing(item.slug);setVerified(false);
   document.querySelector('#impact-form')?.scrollIntoView({behavior:'smooth'});
 }
 function reset(){setForm(blank);setEditing(null);setVerified(false)}
 async function save(e:FormEvent, publish:boolean){
   e.preventDefault();if(!db||busy)return;
   if(publish&&!verified){onNotice('Confirme que conferiu a fonte oficial e a situação antes de publicar.');return}
   const slug=editing||slugify(form.title);
   if(slug.length<5){onNotice('Informe um título que identifique a ficha.');return}
   let parsed:URL;
   try{parsed=new URL(form.source_url)}catch{onNotice('Informe uma URL oficial completa.');return}
   if(parsed.protocol!=='https:'){onNotice('O link da fonte deve utilizar HTTPS.');return}
   setBusy(true);
   const payload={...form,slug,source_url:parsed.href,
     checked_on:today(),updated_at:new Date().toISOString(),is_published:publish};
   let error;
   if(editing){
     const result=await db.from('impact_briefs').update(payload).eq('slug',editing).select('slug').single();
     error=result.error;
   }else{
     const result=await db.from('impact_briefs').insert(payload).select('slug').single();
     error=result.error;
   }
   setBusy(false);
   if(error){onNotice('Falha ao salvar ficha: '+error.message);return}
   onNotice(publish?'Ficha de impacto publicada com fonte verificada.':'Rascunho salvo para revisão.');
   reset();await Promise.all([load(),onUpdated()]);
 }
 async function unpublish(slug:string){
   if(!db||busy)return;
   setBusy(true);
   const {error}=await db.from('impact_briefs').update({is_published:false,updated_at:new Date().toISOString()}).eq('slug',slug);
   setBusy(false);
   if(error)onNotice(error.message);else {onNotice('Ficha retirada da consulta pública.');await Promise.all([load(),onUpdated()])}
 }
 const input=(field:keyof FormFields,value:string)=>setForm(s=>({...s,[field]:value}));
 return <div className="impact-editor">
   <div className="admin-card">
     <div className="admin-card-title"><div><div className="section-kicker">CURADORIA DE REFERÊNCIAS</div><h2>Fichas de impacto para a advocacia</h2></div><button className="quiet-button" onClick={()=>void load()}><RefreshCw size={16}/> Atualizar</button></div>
     <p className="muted-text">Cada ficha deve apontar um documento oficial e explicar o próximo passo de conferência. Cadastre como rascunho até revisar. A publicação atualiza o Meu Radar automaticamente.</p>
     {loading?<p>Carregando fichas...</p>:<div className="brief-admin-list">{list.map(item=><div className="brief-admin-item" key={item.slug}><div><span className={item.is_published?'brief-published':'brief-draft'}>{item.is_published?'Público':'Rascunho'}</span><strong>{item.title}</strong><small>Fonte: {item.source_name} · Conferida em: {item.checked_on}</small></div><div><button className="button-secondary" onClick={()=>edit(item)}>Editar</button>{item.is_published&&<button className="button-secondary danger" disabled={busy} onClick={()=>void unpublish(item.slug)}>Retirar</button>}</div></div>)}</div>}
   </div>
   <form id="impact-form" className="admin-card brief-form" onSubmit={e=>void save(e,false)}>
     <div className="admin-card-title"><div><div className="section-kicker">NOVO CONTEÚDO</div><h2>{editing?'Atualizar ficha':'Criar ficha de acompanhamento'}</h2></div><FilePlus2 size={26}/></div>
     <label htmlFor="brief-title">Título que o advogado entenda</label><input required id="brief-title" minLength={15} maxLength={220} value={form.title} onChange={e=>input('title',e.target.value)}/>
     <div className="two-fields"><div><label htmlFor="brief-topic">Assunto</label><select id="brief-topic" value={form.topic} onChange={e=>input('topic',e.target.value)}>{topicOptions.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select></div><div><label htmlFor="brief-kind">Natureza</label><select id="brief-kind" value={form.kind} onChange={e=>input('kind',e.target.value)}><option value="decisao">Decisão</option><option value="norma">Norma</option><option value="orientacao">Orientação</option><option value="projeto">Projeto legislativo</option></select></div></div>
     <label htmlFor="brief-stage">Situação atual verificada</label><input required id="brief-stage" minLength={4} maxLength={90} value={form.stage} onChange={e=>input('stage',e.target.value)} placeholder="Ex.: em tramitação na Câmara, não é lei vigente"/>
     <label htmlFor="brief-summary">O que aconteceu (fatos)</label><textarea required id="brief-summary" minLength={20} maxLength={1000} value={form.summary} onChange={e=>input('summary',e.target.value)}/>
     <label htmlFor="brief-why">Por que isso interessa ao advogado?</label><textarea required id="brief-why" minLength={20} maxLength={1000} value={form.why_it_matters} onChange={e=>input('why_it_matters',e.target.value)}/>
     <label htmlFor="brief-action">O que o profissional deve conferir?</label><textarea required id="brief-action" minLength={20} maxLength={1000} value={form.next_step} onChange={e=>input('next_step',e.target.value)}/>
     <div className="two-fields"><div><label htmlFor="brief-source">Órgão / fonte</label><input required id="brief-source" value={form.source_name} onChange={e=>input('source_name',e.target.value)} maxLength={150}/></div><div><label htmlFor="brief-source-date">Data do documento original</label><input required id="brief-source-date" type="date" value={form.source_date} onChange={e=>input('source_date',e.target.value)}/></div></div>
     <label htmlFor="brief-url">Endereço HTTPS da fonte oficial</label><input required id="brief-url" type="url" value={form.source_url} onChange={e=>{input('source_url',e.target.value);setVerified(false)}}/>
     {form.source_url.startsWith('https://')&&<a className="plain-link" href={form.source_url} target="_blank" rel="noopener noreferrer">Abrir fonte antes de publicar <ArrowUpRight size={14}/></a>}
     <label className="editor-check"><input checked={verified} type="checkbox" onChange={e=>setVerified(e.target.checked)}/> Conferi conteúdo, situação e link na fonte indicada. Não apresento proposta como norma vigente.</label>
     <div className="brief-form-actions"><button type="submit" className="button-secondary" disabled={busy}><FileText size={17}/> Salvar rascunho</button><button type="button" className="button-primary" disabled={busy||!verified||form.title.length<15||form.summary.length<20} onClick={e=>{const formElement=e.currentTarget.closest('form');if(formElement?.reportValidity())void save({preventDefault:()=>{}} as FormEvent,true)}}><Check size={17}/> Publicar após revisão</button>{editing&&<button className="quiet-button" type="button" onClick={reset}><Trash2 size={15}/> Cancelar edição</button>}</div>
   </form>
 </div>;
}
