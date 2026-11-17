import {useEffect,useMemo,useState,type FormEvent} from 'react';
import type {User} from '@supabase/supabase-js';
import {Activity,ArrowUpRight,Bell,Check,CheckCircle2,ClipboardList,Clock3,
 FileText,Info,RefreshCw,Send,ShieldCheck,XCircle} from 'lucide-react';
import {db,type Article,type Source,externalHttps} from './lib';
type Run={source_slug:string;status:string;examined:number;inserted:number;started_at:string;error_message:string|null};
type EventLog={id:number;entity_type:string;action:string;occurred_at:string};
type AdminTab='curadoria'|'comunicados'|'monitor';
export default function AdminPanel({user,sources,onNotice,onPublished}:{user:User;sources:Source[];onNotice:(msg:string)=>void;onPublished:()=>Promise<void>}){
 const [tab,setTab]=useState<AdminTab>('curadoria');
 const [drafts,setDrafts]=useState<Article[]>([]);
 const [runs,setRuns]=useState<Run[]>([]);
 const [audit,setAudit]=useState<EventLog[]>([]);
 const [notes,setNotes]=useState<Record<string,string>>({});
 const [verified,setVerified]=useState<string[]>([]);
 const [busy,setBusy]=useState<string|null>(null);
 const [title,setTitle]=useState('');
 const [body,setBody]=useState('');
 const [kind,setKind]=useState('informe');
 const [audience,setAudience]=useState('all');
 const isAdmin=user.app_metadata?.radar_role==='admin';
 const sourceName=useMemo(()=>Object.fromEntries(sources.map(s=>[s.slug,s.name])),[sources]);
 const sourceId=useMemo(()=>Object.fromEntries(sources.map(s=>[s.id,s.name])),[sources]);
 const latestRuns=useMemo(()=>runs.filter((r,i,a)=>a.findIndex(x=>x.source_slug===r.source_slug)===i),[runs]);
 async function refresh(){
  if(!db)return;
  const queries=[
    db.from('articles').select('id,title,url,excerpt,published_at,discovered_at,kind,topic,relevance_score,source_id,image_url,editorial_note,status').eq('status','draft').order('discovered_at',{ascending:false}).limit(80),
    db.from('editorial_events').select('id,entity_type,action,occurred_at').order('occurred_at',{ascending:false}).limit(30),
    isAdmin?db.from('collector_runs').select('source_slug,status,examined,inserted,started_at,error_message').order('started_at',{ascending:false}).limit(70):Promise.resolve({data:[],error:null})
  ];
  const [a,e,r]=await Promise.all(queries);
  setDrafts((a.data||[]) as Article[]);
  setAudit((e.data||[]) as EventLog[]);
  setRuns((r.data||[]) as Run[]);
  if(a.error||e.error||r.error)onNotice('Não foi possível consultar todos os indicadores da administração.');
 }
 useEffect(()=>{void refresh()},[user.id]);
 async function review(article:Article,decision:'published'|'rejected'){
  if(!db||busy)return;
  const note=(notes[article.id]||'').trim().slice(0,1000);
  if(decision==='rejected'&&note.length<10){onNotice('Descreva em pelo menos 10 caracteres o motivo da rejeição.');return}
  if(decision==='published'&&!verified.includes(article.id)){onNotice('Confirme que você conferiu a publicação na fonte antes de aprová-la.');return}
  setBusy(article.id);
  const {data,error}=await db.from('articles').update({
    status:decision,reviewed_by:user.id,editorial_note:note||null,
    approved_at:decision==='published'?new Date().toISOString():null
  }).eq('id',article.id).eq('status','draft').select('id').single();
  if(error||!data){onNotice('Falha ao registrar revisão: '+(error?.message||'registro não atualizado'))}
  else {onNotice(decision==='published'?'Notícia publicada com sucesso.':'Notícia rejeitada e registrada no histórico.');await Promise.all([refresh(),onPublished()])}
  setBusy(null);
 }
 async function publishAnnouncement(e:FormEvent){e.preventDefault();if(!db||busy)return;
  setBusy('comunicado');
  const {error}=await db.from('announcements').insert({
    title:title.trim(),body:body.trim(),kind,audience,status:'published',
    published_at:new Date().toISOString(),created_by:user.id
  });
  if(error)onNotice('Não foi possível publicar: '+error.message);
  else {setTitle('');setBody('');onNotice('Comunicado publicado para o público selecionado.');await Promise.all([onPublished(),refresh()])}
  setBusy(null);
 }
 return <section className="admin-page">
  <div className="page-intro"><div className="section-kicker"><span className="eyebrow-line"/> ACESSO RESTRITO</div><h1>Central da <i>comissão.</i></h1><p>Revise conteúdos, publique informes autorizados e acompanhe as fontes monitoradas.</p></div>
  <div className="admin-summary">
    <div><ClipboardList size={19}/><strong>{drafts.length}</strong><span>Na fila editorial</span></div>
    <div><Bell size={19}/><strong>{audit.length}</strong><span>Eventos recentes</span></div>
    <div><Activity size={19}/><strong>{latestRuns.length||'—'}</strong><span>Fontes executadas</span></div>
  </div>
  <div className="practice-nav admin-tabs">
    <button className={tab==='curadoria'?'active':''} onClick={()=>setTab('curadoria')}><ClipboardList size={17}/> Curadoria</button>
    <button className={tab==='comunicados'?'active':''} onClick={()=>setTab('comunicados')}><Bell size={17}/> Comunicados</button>
    <button className={tab==='monitor'?'active':''} onClick={()=>setTab('monitor')}><Activity size={17}/> Monitoramento</button>
  </div>
  {tab==='curadoria'&&<div className="admin-card"><div className="admin-card-title"><div><span className="section-kicker">REVISÃO HUMANA</span><h2>Publicações aguardando avaliação</h2></div><button className="quiet-button" onClick={()=>void refresh()}><RefreshCw size={16}/> Atualizar</button></div>
    {drafts.length?<div className="review-list">{drafts.map(a=><article className="review-item" key={a.id}><div className="review-label"><span className="status-chip">RASCUNHO</span><span>{sourceId[a.source_id]||'Fonte monitorada'}</span></div>
      <h3>{a.title}</h3><p>{a.excerpt||'Sem resumo disponível. Consulte a origem antes da aprovação.'}</p>
      <a className="plain-link" target="_blank" rel="noopener noreferrer" href={externalHttps(a.url)}>Conferir publicação na fonte <ArrowUpRight size={15}/></a>
      <label className="field-label" htmlFor={'note-'+a.id}>Nota para leitores ou motivo da rejeição</label>
      <textarea id={'note-'+a.id} value={notes[a.id]||''} maxLength={1000} onChange={e=>setNotes(v=>({...v,[a.id]:e.target.value}))} placeholder="Explique em linguagem simples o que importa. Para rejeitar, informe o motivo."/>
      <label className="editor-check"><input type="checkbox" checked={verified.includes(a.id)} onChange={e=>setVerified(v=>e.target.checked?[...v,a.id]:v.filter(id=>id!==a.id))}/> Conferi o texto e o link diretamente na fonte.</label>
      <div className="review-buttons"><button className="button-secondary danger" disabled={busy!==null} onClick={()=>void review(a,'rejected')}><XCircle size={16}/> Rejeitar</button><button className="button-primary" disabled={busy!==null||!verified.includes(a.id)} onClick={()=>void review(a,'published')}><Check size={16}/> Aprovar publicação</button></div>
    </article>)}</div>:<div className="calm-empty"><CheckCircle2 size={28}/><strong>Fila editorial em dia</strong><p>Não existem publicações aguardando avaliação neste momento. A próxima coleta poderá trazer novas candidatas.</p></div>}
  </div>}
  {tab==='comunicados'&&<div className="admin-card"><div className="admin-card-title"><div><span className="section-kicker">CANAL DA COMISSÃO</span><h2>Publicar informe</h2></div><FileText size={27}/></div>
    <p className="muted-text">Os informes aparecerão no portal ou na caixa de entrada dos cadastrados. Esta função não dispara e-mails nem notificações push.</p>
    <form className="compose-form" onSubmit={e=>void publishAnnouncement(e)}>
      <label htmlFor="admin-title">Título</label><input id="admin-title" minLength={5} maxLength={200} required placeholder="Ex.: Oficina de IA para a advocacia" value={title} onChange={e=>setTitle(e.target.value)}/>
      <label htmlFor="admin-body">Comunicado</label><textarea id="admin-body" minLength={10} maxLength={10000} required value={body} onChange={e=>setBody(e.target.value)} placeholder="Escreva aqui o texto autorizado pela coordenação..."/>
      <div className="two-fields"><div><label htmlFor="admin-kind">Tipo</label><select id="admin-kind" value={kind} onChange={e=>setKind(e.target.value)}><option value="informe">Informe</option><option value="comunicado">Comunicado</option><option value="evento">Evento</option></select></div><div><label htmlFor="admin-audience">Visibilidade</label><select id="admin-audience" value={audience} onChange={e=>setAudience(e.target.value)}><option value="all">Público geral</option><option value="members">Usuários cadastrados</option></select></div></div>
      <div className="privacy-warning"><ShieldCheck size={18}/> Publique apenas comunicações com autorização institucional e sem dados pessoais indevidos.</div>
      <button disabled={busy!==null} className="button-primary" type="submit"><Send size={16}/> Publicar informe</button>
    </form>
  </div>}
  {tab==='monitor'&&<div className="admin-card"><div className="admin-card-title"><div><span className="section-kicker">AUDITORIA E OPERAÇÃO</span><h2>Saúde da plataforma</h2></div><button className="quiet-button" onClick={()=>void refresh()}><RefreshCw size={16}/> Atualizar</button></div>
    {isAdmin?<><h3 className="subhead">Coletas recentes por fonte</h3><div className="collector-grid">{latestRuns.map(r=><div className="collector-item" key={r.source_slug}><div className="collector-head"><strong>{sourceName[r.source_slug]||r.source_slug}</strong><span className={r.status==='success'?'health-ok':'health-error'}>{r.status==='success'?'Sem erro':'Falha'}</span></div><small><Clock3 size={12}/> {new Date(r.started_at).toLocaleString('pt-BR')} · {r.examined} selecionadas · {r.inserted} novas</small>{r.error_message&&<p className="collector-error">{r.error_message}</p>}</div>)}</div></>:<p className="muted-text">Os detalhes técnicos de coleta ficam disponíveis para administradores.</p>}
    <h3 className="subhead">Histórico editorial</h3>{audit.length?<div className="audit-list">{audit.map(e=><div className="audit-entry" key={e.id}><div className="audit-bullet"><Check size={15}/></div><div><strong>{e.action==='published'?'Publicação autorizada':e.action==='rejected'?'Conteúdo rejeitado':'Alteração registrada'}</strong><small>{e.entity_type==='articles'?'Notícia':'Informe'} · {new Date(e.occurred_at).toLocaleString('pt-BR')}</small></div></div>)}</div>:<div className="calm-empty"><Info size={22}/><p>Nenhum evento editorial recente.</p></div>}
  </div>}
 </section>;
}
