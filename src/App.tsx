import {useEffect,useMemo,useState} from 'react';
import {type User} from '@supabase/supabase-js';
import {Radar,Search,Scale,Newspaper,ShieldCheck,BookOpen,Mail,Bell,LogIn,LogOut,Bookmark,
  House,ChevronRight,ExternalLink,Send,Check,Smartphone,Users,
  TrendingUp,Eye,Settings,RefreshCw,Lightbulb,Archive,AlertTriangle, X,Info, CalendarDays} from 'lucide-react';
import {db,type Article,type Source,type Announcement,briefDate,isEditor,externalHttps} from './lib';

type View='inicio'|'noticias'|'legislacao'|'jurisprudencia'|'informes'|'minha-area'|'admin';
type Mode='essencial'|'avancado';
type CollectorRun={source_slug:string;status:string;examined:number;inserted:number;started_at:string;error_message:string|null};
type EditorialEvent={id:number;entity_type:string;action:string;previous_status:string|null;new_status:string;occurred_at:string};
type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice?:Promise<{outcome:string}>};
const nav:[View,string,typeof Radar][]=[
  ['inicio','Início',House],['noticias','Novidades',Newspaper],
  ['legislacao','Legislação',Scale],['jurisprudencia','Jurisprudência',BookOpen],
  ['informes','Comissão',Mail],['minha-area','Minha área',Bookmark]
];
function safeDate(when:string|null){return briefDate(when)}
function Summary({text}:{text:string}){return <p className="summary">{text||'Consulte a publicação original para conhecer os detalhes e seu contexto jurídico.'}</p>}

export default function App(){
  const [view,setView]=useState<View>('inicio');
  const [mode,setMode]=useState<Mode>('essencial');
  const [articles,setArticles]=useState<Article[]>([]);
  const [sources,setSources]=useState<Source[]>([]);
  const [announcements,setAnnouncements]=useState<Announcement[]>([]);
  const [drafts,setDrafts]=useState<Article[]>([]);
  const [user,setUser]=useState<User|null>(null);
  const [bookmarks,setBookmarks]=useState<string[]>([]);
  const [readIds,setReadIds]=useState<string[]>([]);
  const [search,setSearch]=useState('');
  const [filter,setFilter]=useState('Todos');
  const [email,setEmail]=useState('');
  const [displayName,setDisplayName]=useState('');
  const [area,setArea]=useState('');
  const [topics,setTopics]=useState<string[]>([]);
  const [info,setInfo]=useState('');
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);
  const [install,setInstall]=useState<InstallEvent|null>(null);
  const [iphoneGuide,setIphoneGuide]=useState(false);
  const [adminTitle,setAdminTitle]=useState('');
  const [adminBody,setAdminBody]=useState('');
  const [adminKind,setAdminKind]=useState('informe');
  const [adminAudience,setAdminAudience]=useState('all');
  const [suggestion,setSuggestion]=useState('');
  const [suggestionTopic,setSuggestionTopic]=useState('Capacitação');
  const [reviewNotes,setReviewNotes]=useState<Record<string,string>>({});
  const [reviewingId,setReviewingId]=useState<string|null>(null);
  const [runs,setRuns]=useState<CollectorRun[]>([]);
  const [audit,setAudit]=useState<EditorialEvent[]>([]);
  const role=user?.app_metadata?.radar_role as string|undefined;
  const editorial=isEditor(role);

  async function refresh(silent=false){
    if(!db){setLoading(false);return}
    if(!silent)setLoading(true);
    const [a,s,n]=await Promise.all([
      db.from('articles').select('id,title,url,excerpt,published_at,discovered_at,kind,topic,relevance_score,source_id,image_url,editorial_note,status').eq('status','published').order('discovered_at',{ascending:false}).limit(150),
      db.from('sources').select('id,slug,name,homepage').eq('active',true),
      db.from('announcements').select('id,title,body,kind,audience,status,published_at,created_at').eq('status','published').order('created_at',{ascending:false}).limit(60)
    ]);
    if(a.error||s.error||n.error){setInfo('Falha ao consultar o serviço. Tente atualizar a página.')}
    setArticles((a.data||[]) as Article[]);
    setSources((s.data||[]) as Source[]);
    setAnnouncements((n.data||[]) as Announcement[]);
    if(!silent)setLoading(false);
  }
  useEffect(()=>{
    void refresh();
    if(db){
      void db.auth.getUser().then(({data})=>setUser(data.user??null));
      const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>setUser(session?.user??null));
      return ()=>subscription.unsubscribe();
    }
  },[]);
  useEffect(()=>{
    if(!db||!user){setBookmarks([]);setReadIds([]);return}
    void Promise.all([
      db.from('bookmarks').select('article_id').eq('user_id',user.id),
      db.from('message_reads').select('announcement_id').eq('user_id',user.id),
      db.from('profiles').select('display_name,practice_area').eq('user_id',user.id).maybeSingle(),
      db.from('preferences').select('topics').eq('user_id',user.id).maybeSingle()
    ]).then(([b,r,p,pr])=>{
      setBookmarks((b.data||[]).map(x=>x.article_id));
      setReadIds((r.data||[]).map(x=>x.announcement_id));
      setDisplayName(p.data?.display_name||'');
      setArea(p.data?.practice_area||'');
      setTopics(pr.data?.topics||[]);
    });
  },[user?.id]);
  useEffect(()=>{
    if(!db||!editorial)return;
    void Promise.all([fetchDrafts(),fetchAdminOverview()]);
  },[user?.id,role]);
  async function fetchDrafts(){
    if(!db)return;
    const {data,error}=await db.from('articles').select('id,title,url,excerpt,published_at,discovered_at,kind,topic,relevance_score,source_id,image_url,editorial_note,status').eq('status','draft').order('discovered_at',{ascending:false}).limit(60);
    if(error)setInfo(error.message);
    setDrafts((data||[]) as Article[]);
  }
  async function fetchAdminOverview(){
    if(!db||!editorial)return;
    const requests=[
      db.from('editorial_events').select('id,entity_type,action,previous_status,new_status,occurred_at').order('occurred_at',{ascending:false}).limit(40),
      role==='admin'?db.from('collector_runs').select('source_slug,status,examined,inserted,started_at,error_message').order('started_at',{ascending:false}).limit(80):Promise.resolve({data:[] as CollectorRun[],error:null})
    ];
    const [a,r]=await Promise.all(requests);
    if(a.error||r.error)setInfo('Não foi possível consultar alguns indicadores administrativos.');
    setAudit((a.data||[]) as EditorialEvent[]);
    setRuns((r.data||[]) as CollectorRun[]);
  }
  useEffect(()=>{
    if(!db)return;
    const timer=window.setInterval(()=>{void refresh(true)},5*60*1000);
    const onFocus=()=>{void refresh(true)};
    window.addEventListener('focus',onFocus);
    return ()=>{window.clearInterval(timer);window.removeEventListener('focus',onFocus)};
  },[]);
  useEffect(()=>{
    const handler=(e:Event)=>{e.preventDefault();setInstall(e as InstallEvent)}
    window.addEventListener('beforeinstallprompt',handler);
    return ()=>window.removeEventListener('beforeinstallprompt',handler)
  },[]);
  const sourceMap=useMemo(()=>Object.fromEntries(sources.map(s=>[s.id,s.name])),[sources]);
  const sourceSlugMap=useMemo(()=>Object.fromEntries(sources.map(s=>[s.slug,s.name])),[sources]);
  const latestRuns=useMemo(()=>runs.filter((r,i,a)=>a.findIndex(x=>x.source_slug===r.source_slug)===i),[runs]);
  const visible=useMemo(()=>{
    const q=search.toLocaleLowerCase('pt-BR').trim();
    return articles.filter(a=>{
      const match=q===''||(a.title+' '+a.excerpt+' '+(sourceMap[a.source_id]||'')).toLocaleLowerCase('pt-BR').includes(q);
      const kind=filter==='Todos'||a.kind===filter;
      const page=(view!=='legislacao'||a.kind==='Legislação')&&(view!=='jurisprudencia'||a.kind==='Jurisprudência');
      return match&&kind&&page;
    });
  },[articles,search,filter,sourceMap,view]);
  const unread=announcements.filter(x=>!readIds.includes(x.id)&&(x.audience==='all'||user)).length;
  function go(v:View){setView(v);window.scrollTo({top:0,behavior:'smooth'})}
  async function login(e:React.FormEvent){e.preventDefault();if(!db)return;
    setSending(true);setInfo('');
    const {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin+'/radar-ia-portal/'}});
    setInfo(error?'Não foi possível enviar o link: '+error.message:'Verifique seu e-mail para acessar o Radar.');
    setSending(false);
  }
  async function saveProfile(e:React.FormEvent){e.preventDefault();if(!db||!user)return;
    const [p,q]=await Promise.all([
      db.from('profiles').upsert({user_id:user.id,display_name:displayName,practice_area:area}),
      db.from('preferences').upsert({user_id:user.id,topics,email_opt_in:false,updated_at:new Date().toISOString()})
    ]);
    setInfo(p.error?.message||q.error?.message||'Preferências salvas com sucesso.');
  }
  async function bookmark(id:string){if(!db||!user){go('minha-area');setInfo('Entre com seu e-mail para salvar notícias.');return}
    if(bookmarks.includes(id)){
      const {error}=await db.from('bookmarks').delete().eq('user_id',user.id).eq('article_id',id);
      if(!error)setBookmarks(x=>x.filter(y=>y!==id));else setInfo(error.message);
    }else{
      const {error}=await db.from('bookmarks').insert({user_id:user.id,article_id:id});
      if(!error)setBookmarks(x=>[...x,id]);else setInfo(error.message);
    }
  }
  async function markRead(id:string){if(!db||!user||readIds.includes(id))return;
    const {error}=await db.from('message_reads').insert({user_id:user.id,announcement_id:id});
    if(!error)setReadIds(x=>[...x,id]);
  }
  async function review(id:string,decision:'published'|'rejected'){
    if(!db||!user||!editorial||reviewingId)return;
    const note=(reviewNotes[id]||'').trim().slice(0,1000);
    if(decision==='rejected'&&note.length<10){
      setInfo('Informe o motivo da rejeição (mínimo de 10 caracteres) para manter a rastreabilidade editorial.');
      return;
    }
    setReviewingId(id);
    try{
      const {data,error}=await db.from('articles')
        .update({status:decision,approved_at:decision==='published'?new Date().toISOString():null,
          reviewed_by:user.id,editorial_note:note||null})
        .eq('id',id).eq('status','draft').select('id').single();
      if(error||!data){setInfo('Não foi possível registrar a revisão: '+(error?.message||'registro não atualizado'));return}
      setInfo(decision==='published'?'Notícia publicada após revisão.':'Notícia rejeitada e retirada da fila editorial.');
      await Promise.all([refresh(),fetchDrafts(),fetchAdminOverview()]);
    }finally{setReviewingId(null)}
  }
  async function postAnnouncement(e:React.FormEvent){e.preventDefault();if(!db||!user||!editorial)return;
    const {error}=await db.from('announcements').insert({title:adminTitle.trim(),body:adminBody.trim(),kind:adminKind,audience:adminAudience,
      status:'published',published_at:new Date().toISOString(),created_by:user.id});
    setInfo(error?'Falha ao publicar: '+error.message:'Informe publicado. Visível aos destinatários.');
    if(!error){setAdminTitle('');setAdminBody('');await refresh()}
  }
  async function submitSuggestion(e:React.FormEvent){e.preventDefault();if(!db||!user)return;
    const {error}=await db.from('suggestions').insert({user_id:user.id,topic:suggestionTopic,body:suggestion.trim()});
    setInfo(error?error.message:'Sugestão registrada para avaliação da equipe.');
    if(!error)setSuggestion('');
  }
  function Card({item}:{item:Article}){
    const link=externalHttps(item.url);
    return <article className="news-card">
      <div className="news-art">{item.image_url?<img src={item.image_url} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>:null}
        <div className="art-watermark"><Radar size={58}/></div>
        <span className="art-type">{item.kind}</span>
      </div>
      <div className="news-content">
        <div className="overline">{sourceMap[item.source_id]||'Fonte oficial'} · {safeDate(item.published_at||item.discovered_at)}</div>
        <h3>{item.title}</h3>
        <Summary text={item.excerpt}/>
        {mode==='avancado'&&<div className="advanced-detail"><TrendingUp size={15}/> Relevância temática: {item.relevance_score}/100 · Verifique o conteúdo integral na fonte.</div>}
        {item.editorial_note&&<div className="editorial-note"><Lightbulb size={16}/><span>{item.editorial_note}</span></div>}
        <div className="card-actions"><a href={link||'#'} target="_blank" rel="noopener noreferrer" className="source-link" aria-label={'Abrir fonte oficial: '+item.title}>Ler na fonte <ExternalLink size={15}/></a>
          <button className={bookmarks.includes(item.id)?'icon-btn saved':'icon-btn'} title="Salvar notícia" aria-label="Salvar notícia" onClick={()=>void bookmark(item.id)}><Bookmark size={19} fill={bookmarks.includes(item.id)?'currentColor':'none'}/></button>
        </div>
      </div>
    </article>
  }

  return <div className="app">
    <header className="topbar">
      <div className="shell top-inner">
        <button className="brand" onClick={()=>go('inicio')} aria-label="Radar: voltar ao início"><img src="/radar-ia-portal/logo.svg" width="44" height="44" alt=""/><span><strong>RADAR <em>IA & DIREITO</em></strong><small>Inteligência jurídica acessível</small></span></button>
        <nav className="desktop-nav" aria-label="Navegação principal">{nav.slice(0,5).map(([v,label])=><button className={view===v?'nav-active':''} key={v} onClick={()=>go(v)}>{label}</button>)}</nav>
        <div className="top-actions"><button className="header-alert" title="Informes" onClick={()=>go('informes')}><Bell size={19}/>{unread>0&&<span className="dot"/>}</button>
          <button className="outline-btn top-login" onClick={()=>go('minha-area')}><Users size={17}/>{user?'Minha área':'Entrar'}</button></div>
      </div>
    </header>
    <main>
      {view==='inicio'&&<section className="hero"><div className="shell hero-grid"><div>
        <span className="eyebrow"><span className="live-dot"/> OBSERVATÓRIO DE IA NA ADVOCACIA</span>
        <h1>O Direito evolui.<br/><span>Você acompanha.</span></h1>
        <p>Novidades jurídicas sobre inteligência artificial, com fontes oficiais e linguagem simples. Um espaço para acompanhar mudanças sem complicação.</p>
        <div className="hero-buttons"><button className="primary-btn" onClick={()=>go('noticias')}>Explorar novidades <ChevronRight size={18}/></button>
          <button className="ghost-btn" onClick={()=>go('informes')}>Informes da comissão <Mail size={17}/></button></div>
        <div className="hero-trust"><ShieldCheck size={17}/> Fontes verificáveis · Acesso gratuito · Sem cadastro obrigatório</div>
      </div><div className="hero-visual"><div className="radar-circle circle3"/><div className="radar-circle circle2"/><div className="radar-circle circle1"/><Radar size={100}/><div className="orb orb1"/><div className="orb orb2"/><span className="scan-label">RADAR ATIVO</span></div></div></section>}
      <div className="shell layout">
        <aside className="sidebar">
          <div className="side-title">NAVEGAÇÃO</div>
          {nav.map(([v,label,Icon])=><button key={v} className={'side-link '+(view===v?'active':'')} onClick={()=>go(v)}><Icon size={19}/><span>{label}</span>{v==='informes'&&unread>0&&<small className="count">{unread}</small>}</button>)}
          {editorial&&<button className={'side-link '+(view==='admin'?'active':'')} onClick={()=>go('admin')}><Settings size={19}/>Administração</button>}
          <div className="side-divider"/>
          <div className="side-title">PREFERÊNCIA DE LEITURA</div>
          <div className="mode-switch"><button className={mode==='essencial'?'selected':''} onClick={()=>setMode('essencial')}>Essencial</button><button className={mode==='avancado'?'selected':''} onClick={()=>setMode('avancado')}>Avançado</button></div>
          <div className="side-note"><Info size={16}/>Projeto técnico experimental. Não representa publicação oficial da OAB sem autorização institucional.</div>
        </aside>
        <section className="content">
          {info&&<div className="feedback" role="status"><Info size={17}/><span>{info}</span><button onClick={()=>setInfo('')} aria-label="Fechar aviso"><X size={16}/></button></div>}
          {(['inicio','noticias','legislacao','jurisprudencia'] as View[]).includes(view)&&<>
            <div className="section-heading"><div><span className="eyebrow soft">INFORMAÇÃO QUE IMPORTA</span><h2>{view==='legislacao'?'Legislação e projetos':view==='jurisprudencia'?'Jurisprudência e precedentes':'Últimas atualizações'}</h2><p>Publicações com origem identificada e acesso ao documento original.</p></div><button className="icon-btn" title="Atualizar notícias" onClick={()=>void refresh()}><RefreshCw size={19}/></button></div>
            {view==='inicio'&&<div className="quick-grid">
              <button onClick={()=>go('legislacao')}><Scale/><strong>O que mudou?</strong><span>Normas e projetos de lei</span><ChevronRight size={16}/></button>
              <button onClick={()=>go('noticias')}><Lightbulb/><strong>Como isso me afeta?</strong><span>Novidades explicadas</span><ChevronRight size={16}/></button>
              <button onClick={()=>go('informes')}><CalendarDays/><strong>Comissão</strong><span>Informes e atividades</span><ChevronRight size={16}/></button>
            </div>}
            <div className="toolbar"><div className="searchbox"><Search size={20}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Busque IA, decisões, normas, tribunais..." aria-label="Pesquisar notícias"/></div><select value={filter} onChange={e=>setFilter(e.target.value)} aria-label="Filtrar categoria"><option>Todos</option><option>Notícias</option><option>Legislação</option><option>Jurisprudência</option></select></div>
            {loading?<div className="empty-state">Carregando publicações verificadas...</div>:visible.length?<div className="news-grid">{visible.map(a=><Card key={a.id} item={a}/>)}</div>:<div className="empty-state"><Archive size={40}/><h3>Nenhuma publicação aprovada nesta seleção</h3><p>O motor de coleta identifica novidades, mas o conteúdo só aparece após revisão editorial. Tente outro filtro.</p></div>}
          </>}
          {view==='informes'&&<><div className="section-heading"><div><span className="eyebrow soft">COMUNICAÇÃO INSTITUCIONAL</span><h2>Informes e comunicados</h2><p>Atualizações publicadas pela equipe autorizada.</p></div><Mail size={27}/></div>
            {announcements.length?<div className="ann-list">{announcements.map(a=><article className="announcement" key={a.id}><div className="ann-icon"><Bell size={21}/></div><div><span className="overline">{a.kind.toUpperCase()} · {safeDate(a.published_at||a.created_at)}</span><h3>{a.title}</h3><p>{a.body}</p>{user&&<button className="small-action" onClick={()=>void markRead(a.id)}>{readIds.includes(a.id)?<><Check size={15}/> Lido</>:<><Eye size={15}/> Marcar como lido</>}</button>}</div></article>)}</div>:<div className="empty-state"><Mail size={40}/><h3>Sem informes publicados</h3><p>Os comunicados aparecerão aqui quando forem aprovados.</p></div>}
          </>}
          {view==='minha-area'&&<><div className="section-heading"><div><span className="eyebrow soft">PERSONALIZAÇÃO</span><h2>Meu Radar</h2><p>Salve publicações, acompanhe temas e envie sugestões.</p></div><Users size={26}/></div>
            {!user?<div className="panel login-panel"><LogIn size={32}/><h3>Entre com seu e-mail</h3><p>Enviaremos um link de acesso. A leitura pública continua liberada sem conta.</p><form onSubmit={e=>void login(e)}><label>E-mail<input type="email" value={email} required placeholder="seu@email.com" onChange={e=>setEmail(e.target.value)}/></label><button className="primary-btn" disabled={sending||!db}>{sending?'Enviando...':'Enviar link de acesso'} <Send size={16}/></button></form></div>:<div className="profile-grid">
              <form className="panel profile-card" onSubmit={e=>void saveProfile(e)}><h3>Meu perfil</h3><p className="muted">{user.email}</p><label>Nome<input value={displayName} onChange={e=>setDisplayName(e.target.value)} maxLength={90}/></label><label>Área de atuação<input value={area} onChange={e=>setArea(e.target.value)} maxLength={90}/></label><span className="field-label">Interesses</span><div className="tag-picker">{['Jurisprudência','Legislação','IA e ética','LGPD','Tecnologia jurídica','Capacitação'].map(t=><button type="button" key={t} className={topics.includes(t)?'tag picked':'tag'} onClick={()=>setTopics(v=>v.includes(t)?v.filter(x=>x!==t):[...v,t])}>{t}</button>)}</div><button className="primary-btn" type="submit">Salvar preferências <Check size={16}/></button><button className="logout-btn" type="button" onClick={()=>void db?.auth.signOut()}><LogOut size={16}/> Sair</button></form>
              <div className="profile-right"><div className="panel"><h3>Biblioteca de favoritos</h3>{articles.filter(a=>bookmarks.includes(a.id)).length?articles.filter(a=>bookmarks.includes(a.id)).map(a=><div className="saved-row" key={a.id}><a href={externalHttps(a.url)} target="_blank" rel="noreferrer">{a.title}</a><button className="icon-btn" onClick={()=>void bookmark(a.id)}><X size={16}/></button></div>):<p className="muted">Salve matérias pelo ícone de marcador nas notícias.</p>}</div>
              <form className="panel suggestion" onSubmit={e=>void submitSuggestion(e)}><h3>Sugerir assunto para a comissão</h3><select value={suggestionTopic} onChange={e=>setSuggestionTopic(e.target.value)}><option>Capacitação</option><option>Ferramenta jurídica</option><option>Dúvida sobre IA</option><option>Outro</option></select><textarea value={suggestion} onChange={e=>setSuggestion(e.target.value)} required minLength={8} maxLength={1500} placeholder="Qual tema seria útil para sua advocacia?"/><button className="outline-btn" type="submit">Enviar sugestão <Send size={16}/></button></form></div>
            </div>}
          </>}
          {view==='admin'&&editorial&&<><div className="section-heading"><div><span className="eyebrow soft">ÁREA RESTRITA</span><h2>Central da comissão</h2><p>Curadoria e comunicação. Toda publicação fica registrada no banco.</p></div><ShieldCheck size={28}/></div>
            <div className="admin-metrics"><div><Newspaper/><strong>{drafts.length}</strong><span>Aguardando revisão</span></div><div><Check/><strong>{articles.length}</strong><span>Publicadas</span></div><div><Mail/><strong>{announcements.length}</strong><span>Informes</span></div></div>
            <div className="panel"><div className="panel-title"><h3>Fila de curadoria</h3><button className="icon-btn" onClick={()=>void fetchDrafts()} title="Atualizar fila"><RefreshCw size={18}/></button></div>{drafts.length?drafts.map(a=><div className="queue-row" key={a.id}><div><strong>{a.title}</strong><small>{sourceMap[a.source_id]||'Fonte externa'} · Relevância {a.relevance_score}/100</small><a href={externalHttps(a.url)} target="_blank" rel="noreferrer">Conferir fonte <ExternalLink size={13}/></a><textarea className="review-note" maxLength={1000} value={reviewNotes[a.id]||''} onChange={e=>setReviewNotes(v=>({...v,[a.id]:e.target.value}))} placeholder="Nota revisada: por que isto importa para o advogado? (opcional)"/></div><div className="review-actions"><button className="primary-btn compact" disabled={reviewingId!==null} onClick={()=>void review(a.id,'published')}>Aprovar</button><button className="reject-btn" disabled={reviewingId!==null} onClick={()=>void review(a.id,'rejected')}>Rejeitar</button></div></div>):<p className="muted">Sem novas matérias na fila.</p>}</div>
            {role==='admin'&&<div className="panel"><div className="panel-title"><h3>Saúde dos robôs de coleta</h3><button className="icon-btn" title="Atualizar indicadores" onClick={()=>void fetchAdminOverview()}><RefreshCw size={18}/></button></div>
              <p className="muted">Última execução registrada no banco por fonte. Uma coleta pode terminar sem encontrar novas matérias.</p>
              {latestRuns.length?<div className="collector-grid">{latestRuns.map(r=><div className="collector-item" key={r.source_slug}><div className="collector-head"><strong>{sourceSlugMap[r.source_slug]||r.source_slug}</strong><span className={r.status==='success'?'health-ok':'health-error'}>{r.status==='success'?'Regular':'Falha'}</span></div><small>{new Date(r.started_at).toLocaleString('pt-BR')} · {r.examined} candidatos · {r.inserted} inseridos</small>{r.error_message&&<p className="collector-error">{r.error_message}</p>}</div>)}</div>:<p className="muted">Ainda não há execuções registradas.</p>}
            </div>}
            <div className="panel"><h3>Histórico editorial</h3>
              {audit.length?<div className="audit-log">{audit.map(e=><div className="audit-entry" key={e.id}><span className="audit-bullet"><Check size={14}/></span><div><strong>{e.action==='published'?'Publicação autorizada':e.action==='rejected'?'Publicação rejeitada':'Alteração editorial'}</strong><small>{e.entity_type==='articles'?'Notícia':'Informe'} · {new Date(e.occurred_at).toLocaleString('pt-BR')}</small></div></div>)}</div>:<p className="muted">Ainda não houve alterações editoriais registradas.</p>}
            </div>
            <form className="panel admin-compose" onSubmit={e=>void postAnnouncement(e)}><h3>Novo informe ou comunicado</h3><label>Título<input minLength={5} maxLength={200} required value={adminTitle} onChange={e=>setAdminTitle(e.target.value)} placeholder="Título do comunicado"/></label><label>Mensagem<textarea minLength={10} maxLength={10000} required value={adminBody} onChange={e=>setAdminBody(e.target.value)} placeholder="Mensagem destinada aos usuários..."/></label><div className="form-pair"><label>Tipo<select value={adminKind} onChange={e=>setAdminKind(e.target.value)}><option value="informe">Informe</option><option value="comunicado">Comunicado</option><option value="evento">Evento</option></select></label><label>Destinatários<select value={adminAudience} onChange={e=>setAdminAudience(e.target.value)}><option value="all">Todos os visitantes</option><option value="members">Somente cadastrados</option></select></label></div><div className="admin-note"><AlertTriangle size={17}/> Publique apenas materiais autorizados pela coordenação. O envio ocorre no portal, não por e-mail ou push.</div><button className="primary-btn" type="submit">Publicar comunicado <Send size={16}/></button></form>
          </>}
        </section>
      </div>
    </main>
    <section className="app-banner"><div className="shell app-banner-inner"><div className="app-icon"><Smartphone size={30}/></div><div><strong>Radar também no seu celular</strong><p>Adicione à tela inicial e acompanhe notícias como em um aplicativo.</p></div>{install?<button className="primary-btn" onClick={()=>void install.prompt()}>Instalar aplicativo</button>:<button className="outline-btn" onClick={()=>setIphoneGuide(!iphoneGuide)}>Como instalar <ChevronRight size={17}/></button>}</div>{iphoneGuide&&<div className="shell ios-help"><strong>iPhone (Safari):</strong> Compartilhar → Adicionar à Tela de Início → Abrir como App → Adicionar. <strong>Android:</strong> menu do Chrome → Instalar app. A instalação no iPhone requer confirmação.</div>}</section>
    <footer><div className="shell footer-content"><div><Radar size={22}/><strong>RADAR IA & DIREITO</strong><span>Projeto experimental de tecnologia jurídica.</span></div><p>Informações informativas, não substituem consulta às fontes oficiais ou orientação profissional. O uso institucional da marca depende de autorização.</p></div></footer>
    <nav className="mobile-nav" aria-label="Navegação móvel" style={editorial?{gridTemplateColumns:'repeat(5,1fr)'}:undefined}>{nav.filter(x=>['inicio','noticias','informes','minha-area'].includes(x[0])).map(([v,l,Icon])=><button key={v} className={view===v?'active':''} onClick={()=>go(v)}><Icon size={21}/><span>{l==='Minha área'?'Perfil':l}</span></button>)}{editorial&&<button className={view==='admin'?'active':''} onClick={()=>go('admin')}><Settings size={21}/><span>Admin</span></button>}</nav>
  </div>
}
