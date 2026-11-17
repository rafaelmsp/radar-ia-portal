import {lazy,Suspense,useEffect,useMemo,useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {ArrowRight,ArrowUpRight,Bell,Bookmark,BookOpen,CheckCircle2,ChevronRight,
 Clock3,Compass,FileCheck2,FileText,House,Info,Lightbulb,
 LogIn,Menu,Newspaper,Radar,RefreshCw,Scale,Search,ShieldCheck,Sparkles,
 Users,X} from 'lucide-react';
import {db,type Article,type Announcement,type Source,briefDate,externalHttps,isEditor} from './lib';
import type {PracticeTab} from './Practice';
const Practice=lazy(()=>import('./Practice'));
const MyArea=lazy(()=>import('./MyArea'));
const AdminPanel=lazy(()=>import('./AdminPanel'));
const ImpactRadar=lazy(()=>import('./ImpactRadar'));
import type {Brief,LegislativeStatus,LegislativeEvent} from './ImpactRadar';

type View='inicio'|'impacto'|'atualizacoes'|'pratica'|'informes'|'minha-area'|'admin';
type ReadingMode='essencial'|'avancado';
type InstallEvent=Event&{prompt:()=>Promise<void>};
const navigation:{view:View;label:string}[]=[
 {view:'inicio',label:'Início'},{view:'impacto',label:'Meu Radar'},
 {view:'atualizacoes',label:'Fontes e notícias'},{view:'pratica',label:'Ferramentas'},
 {view:'informes',label:'Comissão'}
];
function niceDate(s:string|null){return s?briefDate(s):'Sem data informada'}
function getCategoryIcon(kind:string){
 return kind==='Legislação'?<Scale size={17}/>:kind==='Jurisprudência'?<BookOpen size={17}/>:<Newspaper size={17}/>;
}
function ArticleCard({item,source,favorite,onSave,mode,index=0}:{item:Article;source:string;favorite:boolean;onSave:(id:string)=>void;mode:ReadingMode;index?:number}){
 const link=externalHttps(item.url);
 return <article className="article-card">
   <div className="article-number">{String(index+1).padStart(2,'0')}</div>
   <div className="article-main">
     <div className="article-meta"><span className="article-type">{getCategoryIcon(item.kind)} {item.kind}</span><span className="meta-divider"/><span>{source}</span><span className="meta-divider"/><span>{niceDate(item.published_at||item.discovered_at)}</span></div>
     <h3>{item.title}</h3><p>{item.excerpt||'Confira a publicação original para conhecer o contexto e os detalhes.'}</p>
     {item.editorial_note&&<div className="impact-note"><Lightbulb size={18}/><div><strong>Por que vale sua atenção</strong><span>{item.editorial_note}</span></div></div>}
     {mode==='avancado'&&<p className="article-tech">Relevância temática estimada: {item.relevance_score}/100. Esta classificação não substitui análise jurídica.</p>}
     <div className="article-actions"><a className="text-cta" href={link||'#'} target="_blank" rel="noopener noreferrer">Ler publicação original <ArrowUpRight size={17}/></a><button className={'save-button '+(favorite?'selected':'')} onClick={()=>onSave(item.id)} aria-label={favorite?'Remover dos favoritos':'Salvar nos favoritos'} aria-pressed={favorite}><Bookmark size={18} fill={favorite?'currentColor':'none'}/><span>{favorite?'Salvo':'Salvar'}</span></button></div>
   </div>
 </article>;
}

export default function App(){
 const [view,setView]=useState<View>('inicio');
 const [mode,setMode]=useState<ReadingMode>('essencial');
 const [practiceTab,setPracticeTab]=useState<PracticeTab>('guias');
 const [articles,setArticles]=useState<Article[]>([]);
 const [briefs,setBriefs]=useState<Brief[]>([]);
 const [legislative,setLegislative]=useState<LegislativeStatus|null>(null);
 const [legislativeEvents,setLegislativeEvents]=useState<LegislativeEvent[]>([]);
 const [sources,setSources]=useState<Source[]>([]);
 const [announcements,setAnnouncements]=useState<Announcement[]>([]);
 const [bookmarks,setBookmarks]=useState<string[]>([]);
 const [reads,setReads]=useState<string[]>([]);
 const [user,setUser]=useState<User|null>(null);
 const [search,setSearch]=useState('');
 const [kind,setKind]=useState('Todos');
 const [loading,setLoading]=useState(true);
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const [install,setInstall]=useState<InstallEvent|null>(null);
 const [showInstall,setShowInstall]=useState(false);
 const [menuOpen,setMenuOpen]=useState(false);
 const [lastLoaded,setLastLoaded]=useState<Date|null>(null);
 const editorial=isEditor(user?.app_metadata?.radar_role as string|undefined);
 const sourceMap=useMemo(()=>Object.fromEntries(sources.map(s=>[s.id,s.name])),[sources]);
 const filtered=useMemo(()=>{
   const query=search.trim().toLocaleLowerCase('pt-BR');
   return articles.filter(a=>(kind==='Todos'||a.kind===kind)&&(!query||(a.title+' '+a.excerpt+' '+(sourceMap[a.source_id]||'')).toLocaleLowerCase('pt-BR').includes(query)));
 },[articles,kind,search,sourceMap]);
 const latest=articles[0]||null;
 const unread=user?announcements.filter(a=>!reads.includes(a.id)).length:0;

 function navigate(to:View,tab?:PracticeTab){
   setView(to);setMenuOpen(false);if(tab)setPracticeTab(tab);
   window.scrollTo({top:0,behavior:'smooth'});
 }
 async function refresh(silent=false){
   if(!db){setError('O serviço de dados está indisponível.');setLoading(false);return}
   if(!silent)setLoading(true);
   const [a,s,n,b,l,e]=await Promise.all([
     db.from('articles').select('id,title,url,excerpt,published_at,discovered_at,kind,topic,relevance_score,source_id,image_url,editorial_note,status').eq('status','published').order('discovered_at',{ascending:false}).limit(120),
     db.from('sources').select('id,slug,name,homepage').eq('active',true),
     db.from('announcements').select('id,title,body,kind,audience,status,published_at,created_at').eq('status','published').order('created_at',{ascending:false}).limit(50),
     db.from('impact_briefs').select('*').eq('is_published',true).order('checked_on',{ascending:false}).limit(80),
     db.from('legislative_status').select('id,title,stage,last_action,action_at_local,last_checked_at,source_url').eq('id','pl-2338-2023').maybeSingle(),
     db.from('legislative_events').select('id,monitor_id,action,stage,detected_at,action_at_local').eq('monitor_id','pl-2338-2023').order('detected_at',{ascending:false}).limit(20)
   ]);
   if(a.error||s.error||n.error||b.error||l.error||e.error)setError('Não foi possível atualizar todos os dados agora. Acompanhe novamente em instantes.');
   else {setError('');setArticles((a.data||[]) as Article[]);setSources((s.data||[]) as Source[]);setAnnouncements((n.data||[]) as Announcement[]);setBriefs((b.data||[]) as Brief[]);setLegislative((l.data||null) as LegislativeStatus|null);setLegislativeEvents((e.data||[]) as LegislativeEvent[]);setLastLoaded(new Date())}
   if(!silent)setLoading(false);
 }
 useEffect(()=>{
   void refresh();
   if(!db)return;
   void db.auth.getUser().then(({data})=>setUser(data.user??null));
   const {data:{subscription}}=db.auth.onAuthStateChange((_event,session)=>setUser(session?.user??null));
   return ()=>subscription.unsubscribe();
 },[]);
 useEffect(()=>{
   if(!db||!user){setBookmarks([]);setReads([]);return}
   let alive=true;
   void Promise.all([
     db.from('bookmarks').select('article_id').eq('user_id',user.id),
     db.from('message_reads').select('announcement_id').eq('user_id',user.id)
   ]).then(([b,r])=>{if(alive){setBookmarks((b.data||[]).map(x=>x.article_id));setReads((r.data||[]).map(x=>x.announcement_id))}});
   return ()=>{alive=false}
 },[user?.id]);
 useEffect(()=>{
   const id=window.setInterval(()=>{void refresh(true)},5*60*1000);
   const handler=()=>{void refresh(true)};
   window.addEventListener('focus',handler);
   return ()=>{window.clearInterval(id);window.removeEventListener('focus',handler)}
 },[]);
 useEffect(()=>{
   const handle=(e:Event)=>{e.preventDefault();setInstall(e as InstallEvent)};
   window.addEventListener('beforeinstallprompt',handle);
   return ()=>window.removeEventListener('beforeinstallprompt',handle);
 },[]);
 async function toggleBookmark(id:string){
   if(!user||!db){setNotice('Entre na sua conta gratuita para salvar matérias.');navigate('minha-area');return}
   if(bookmarks.includes(id)){
     const {error}=await db.from('bookmarks').delete().eq('user_id',user.id).eq('article_id',id);
     if(error)setNotice('Não foi possível remover: '+error.message);
     else setBookmarks(v=>v.filter(x=>x!==id));
   }else{
     const {error}=await db.from('bookmarks').insert({user_id:user.id,article_id:id});
     if(error)setNotice('Não foi possível salvar: '+error.message);
     else setBookmarks(v=>[...v,id]);
   }
 }
 async function markRead(id:string){
   if(!db||!user||reads.includes(id))return;
   const {error}=await db.from('message_reads').insert({user_id:user.id,announcement_id:id});
   if(!error)setReads(v=>[...v,id]);
   else setNotice(error.message);
 }
 const newsItems=(items:Article[],showCount=4)=>items.slice(0,showCount).map((item,i)=><ArticleCard key={item.id} index={i} item={item} source={sourceMap[item.source_id]||'Fonte oficial'} favorite={bookmarks.includes(item.id)} onSave={id=>void toggleBookmark(id)} mode={mode}/>);
 return <div className="app-shell">
  <div className="top-rule"><div className="container top-rule-inner"><ShieldCheck size={13}/> Observatório independente em desenvolvimento · Conteúdos com link à fonte original <span>Projeto piloto</span></div></div>
  <header className="site-header"><div className="container header-inner">
    <button className="site-brand" aria-label="Radar IA & Direito — Início" onClick={()=>navigate('inicio')}><span className="brand-icon"><img src="/radar-ia-portal/logo.svg" width="36" height="36" alt=""/></span><span className="brand-name"><strong>RADAR<span>IA & DIREITO</span></strong><small>Inteligência para a advocacia</small></span></button>
    <nav className="desktop-links" aria-label="Navegação principal">{navigation.map(n=><button key={n.view} onClick={()=>navigate(n.view)} className={view===n.view?'active':''}>{n.label}</button>)}</nav>
    <div className="header-buttons">{editorial&&<button className="admin-header" onClick={()=>navigate('admin')}><ShieldCheck size={17}/> Painel</button>}<button className="account-header" onClick={()=>navigate('minha-area')}>{user?<Users size={17}/>:<LogIn size={17}/>} <span>{user?'Minha área':'Entrar'}</span></button><button aria-label="Abrir menu" className="menu-toggle" onClick={()=>setMenuOpen(o=>!o)}>{menuOpen?<X size={22}/>:<Menu size={22}/>}</button></div>
  </div>
  {menuOpen&&<nav className="mobile-dropdown" aria-label="Menu">{navigation.map(n=><button key={n.view} onClick={()=>navigate(n.view)}>{n.label}<ChevronRight size={16}/></button>)}{editorial&&<button onClick={()=>navigate('admin')}>Administração <ChevronRight size={16}/></button>}</nav>}
  </header>
  {notice&&<div className="site-toast" role="status"><Info size={18}/><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Fechar aviso"><X size={16}/></button></div>}
  <main>
   <Suspense fallback={<div className="container content-page"><div className="calm-empty">Abrindo módulo...</div></div>}>
    {view==='inicio'&&<>
      <section className="hero-section"><div className="container hero-layout">
        <div className="hero-copy"><div className="section-kicker light"><span className="eyebrow-line"/> O SEU DIREITO, MAIS INFORMADO</div>
          <h1>O que mudou?<br/><i>O que importa?</i><br/>O que conferir?</h1>
          <p>Acompanhe decisões, normas e projetos que merecem atenção na sua advocacia. Selecione temas, entenda a situação e saiba onde conferir, sem perder tempo com notícias soltas.</p>
          <div className="hero-ctas"><button className="button-accent" onClick={()=>navigate('impacto')}>Montar meu Radar <ArrowUpRight size={18}/></button><button className="button-ghost" onClick={()=>navigate('atualizacoes')}>Ver fontes oficiais <ArrowRight size={18}/></button></div>
          <div className="hero-note"><CheckCircle2 size={16}/> Sem cadastro para acompanhar <span>·</span> Fontes oficiais <span>·</span> Situação identificada</div>
        </div>
        <div className="hero-feature"><div className="feature-top"><span><span className="feature-pulse"/> DESTAQUE DO RADAR</span><Radar size={19}/></div>
          <div className="feature-body">{latest?<><div className="feature-meta">{sourceMap[latest.source_id]||'Fonte oficial'} <span>•</span> {niceDate(latest.published_at||latest.discovered_at)}</div><h2>{latest.title}</h2><p>{latest.excerpt||'Leia a publicação original para conferir o conteúdo completo.'}</p><a className="feature-link" href={externalHttps(latest.url)} target="_blank" rel="noopener noreferrer">Abrir fonte oficial <ArrowUpRight size={19}/></a></>:<><div className="feature-meta">CURADORIA EM ANDAMENTO</div><h2>Informação confiável começa pela fonte.</h2><p>As novidades aparecerão aqui após a revisão editorial. Enquanto isso, use os guias práticos gratuitos.</p><button className="feature-link" onClick={()=>navigate('pratica')}>Aprender agora <ArrowRight size={19}/></button></>}</div>
          <div className="feature-bottom"><span>RADAR / OBSERVATÓRIO</span><span>01 — ATUALIZAÇÕES</span></div>
        </div>
      </div></section>
      <div className="fact-strip"><div className="container fact-strip-inner"><span><strong>{sources.length||'—'}</strong> fontes oficiais monitoradas</span><span className="fact-sep"/><span><strong>{briefs.length}</strong> fichas práticas verificadas</span><span className="fact-sep"/><span><ShieldCheck size={18}/> revisão antes da publicação</span></div></div>
      <section className="container value-section"><div className="section-heading-row"><div><div className="section-kicker"><span className="eyebrow-line"/> IMPACTO NA ADVOCACIA</div><h2>Esses assuntos merecem <i>sua atenção.</i></h2><p>Veja o fato, a situação e o próximo passo de conferência. Sem tratar projeto como lei ou orientação como obrigação.</p></div><button className="simple-link" onClick={()=>navigate('impacto')}>Personalizar meu radar <ArrowRight size={18}/></button></div>
        <div className="home-impact-grid">{briefs.slice(0,3).map((b,i)=><button className="home-impact-card" key={b.slug} onClick={()=>navigate('impacto')}><div className="home-impact-meta"><span>{String(i+1).padStart(2,'0')} / {b.kind==='projeto'?'PROJETO DE LEI':b.kind==='decisao'?'DECISÃO':b.kind==='norma'?'NORMA':'ORIENTAÇÃO'}</span><ArrowUpRight size={17}/></div><h3>{b.title}</h3><p>{b.why_it_matters}</p><span className="home-impact-stage">{b.stage}</span><span className="card-link">Ver o que conferir <ArrowRight size={17}/></span></button>)}{!loading&&briefs.length===0&&<div className="calm-empty">As fichas estão sendo revisadas. Consulte as fontes oficiais na seção Atualizações.</div>}</div>
        <div className="home-tool-strip"><div><FileCheck2 size={24}/><span><strong>Vai usar uma resposta de IA em uma peça?</strong><small>Confira seis pontos antes de confiar em um texto gerado automaticamente.</small></span></div><button className="button-secondary" onClick={()=>navigate('pratica','checklist')}>Abrir checklist <ArrowRight size={17}/></button></div>
      </section>
      <section className="container highlights-section"><div className="section-heading-row"><div><div className="section-kicker"><span className="eyebrow-line"/> ACOMPANHAMENTO JURÍDICO</div><h2>Atualizações <i>verificáveis.</i></h2><p>Sem manchetes inventadas. Cada item leva à publicação original.</p></div><button className="simple-link" onClick={()=>navigate('atualizacoes')}>Ver todas <ArrowRight size={18}/></button></div>
        <div className="highlights-layout"><div className="editorial-feed">{loading?<div className="calm-empty">Consultando fontes...</div>:articles.length?newsItems(articles,3):<div className="calm-empty"><Newspaper size={28}/><strong>Novidades em curadoria</strong><p>Ainda não há publicações aprovadas. Acompanhe novamente ou experimente as ferramentas disponíveis.</p></div>}</div>
          <aside className="side-brief"><div className="brief-icon"><Compass size={29}/></div><span className="section-kicker">LEITURA ORIENTADA</span><h3>Notícia não é necessariamente uma regra nova.</h3><p>Antes de aplicar uma atualização, confirme se ela trata de projeto, decisão, norma vigente ou apenas orientação.</p><button className="text-cta" onClick={()=>navigate('pratica','guias')}>Aprender a conferir <ArrowRight size={17}/></button><div className="brief-divider"/><div className="side-mini"><Clock3 size={16}/> Guia de 3 minutos</div></aside></div>
      </section>
      <section className="container lower-section"><div className="commission-teaser"><div><div className="section-kicker"><span className="eyebrow-line"/> COMISSÃO EM FOCO</div><h2>Informação, capacitação e <i>participação.</i></h2><p>Comunicados institucionais autorizados, oportunidades de aprendizado e espaço para sugerir assuntos que a advocacia quer conhecer.</p><button className="button-dark" onClick={()=>navigate('informes')}>Ver informes <ArrowUpRight size={17}/></button></div><div className="commission-symbol"><Scale size={66}/></div></div></section>
    </>}
    {view==='impacto'&&<section className="container content-page"><ImpactRadar briefs={briefs} loading={loading} onNotice={setNotice} legislative={legislative} events={legislativeEvents}/></section>}
    {view==='atualizacoes'&&<section className="container content-page">
      <div className="page-intro"><div className="section-kicker"><span className="eyebrow-line"/> RADAR DE ATUALIZAÇÕES</div><h1>O que mudou <i>no Direito e na IA?</i></h1><p>Notícias, normas e decisões selecionadas a partir de fontes identificadas. Utilize os filtros e confira o material original antes de aplicar qualquer informação.</p></div>
      <div className="news-toolbar"><div className="search-field"><Search size={20}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar assunto, tribunal ou termo..." aria-label="Pesquisar"/></div><div className="reading-switch" aria-label="Nível de leitura"><button className={mode==='essencial'?'active':''} onClick={()=>setMode('essencial')}>Essencial</button><button className={mode==='avancado'?'active':''} onClick={()=>setMode('avancado')}>Avançado</button></div><button className="refresh-button" onClick={()=>void refresh()} title="Atualizar publicações"><RefreshCw size={18}/></button></div>
      <div className="filter-row">{['Todos','Notícias','Legislação','Jurisprudência'].map(k=><button className={kind===k?'active':''} key={k} onClick={()=>setKind(k)}>{k}</button>)}<span>{filtered.length} resultado{filtered.length===1?'':'s'}</span></div>
      {error&&<div className="error-note"><Info size={17}/>{error}</div>}
      <div className="updates-layout"><div className="editorial-feed">{loading?<div className="calm-empty">Consultando publicações...</div>:filtered.length?newsItems(filtered,120):<div className="calm-empty"><Search size={31}/><strong>Nenhum resultado nesta seleção</strong><p>Tente outro filtro ou uma busca mais ampla. Novos conteúdos dependem da coleta e da aprovação editorial.</p></div>}</div><aside className="updates-aside"><div className="aside-block"><div className="section-kicker">FONTES MONITORADAS</div><h3>De onde vem a informação</h3><p>Acompanhamos publicações oficiais e exibimos somente as matérias aprovadas pela curadoria.</p><div className="source-list">{sources.map(s=><a key={s.id} href={externalHttps(s.homepage)} rel="noopener noreferrer" target="_blank"><span>{s.name}</span><ArrowUpRight size={15}/></a>)}</div></div><div className="aside-block tinted"><ShieldCheck size={25}/><h3>Conferir é essencial.</h3><p>Um resumo facilita a leitura, mas não substitui o exame da decisão, da norma e de sua vigência.</p><button className="text-cta" onClick={()=>navigate('pratica','checklist')}>Usar checklist <ArrowRight size={17}/></button></div></aside></div>
      {lastLoaded&&<p className="last-sync">Última consulta do portal: {lastLoaded.toLocaleString('pt-BR')}. A coleta das fontes ocorre em outro processo.</p>}
    </section>}
    {view==='pratica'&&<div className="container content-page"><Practice active={practiceTab} setActive={setPracticeTab}/></div>}
    {view==='informes'&&<section className="container content-page"><div className="page-intro"><div className="section-kicker"><span className="eyebrow-line"/> CANAL INSTITUCIONAL</div><h1>Informes da <i>comissão.</i></h1><p>Comunicados, eventos e iniciativas divulgados por membros autorizados. A publicação depende da aprovação editorial e institucional.</p></div>
      <div className="notice-layout"><div className="notice-list">{announcements.length?announcements.map(a=><article className="notice-card" key={a.id}><div className="notice-icon"><Bell size={21}/></div><div><div className="article-meta"><span className="article-type">{a.kind}</span><span>{niceDate(a.published_at||a.created_at)}</span></div><h2>{a.title}</h2><p>{a.body}</p>{user&&<button className="read-toggle" onClick={()=>void markRead(a.id)}>{reads.includes(a.id)?<><CheckCircle2 size={16}/> Lido</>:<><CheckCircle2 size={16}/> Marcar como lido</>}</button>}</div></article>):<div className="calm-empty"><Bell size={32}/><strong>Sem informes publicados</strong><p>Este espaço receberá comunicados autorizados, eventos e oportunidades de capacitação. Os guias e ferramentas continuam disponíveis.</p><button className="button-secondary" onClick={()=>navigate('pratica')}>Explorar ferramentas <ArrowRight size={16}/></button></div>}</div><aside className="notice-aside"><FileText size={29}/><h3>Quer sugerir um tema?</h3><p>Os usuários cadastrados podem enviar sugestões de oficinas, ferramentas e capacitações diretamente à equipe.</p><button className="text-cta" onClick={()=>navigate('minha-area')}>Minha área <ArrowRight size={16}/></button></aside></div>
    </section>}
    {view==='minha-area'&&<div className="container content-page"><MyArea user={user} articles={articles} bookmarks={bookmarks} onToggleBookmark={id=>void toggleBookmark(id)} onNotice={setNotice}/></div>}
    {view==='admin'&&editorial&&user&&<div className="container content-page"><AdminPanel user={user} sources={sources} onNotice={setNotice} onPublished={()=>refresh()}/></div>}
   </Suspense>
  </main>
  <section className="mobile-app-band"><div className="container app-band-inner"><div className="band-icon"><Radar size={27}/></div><div className="band-copy"><strong>Radar na tela inicial do seu celular</strong><span>Abra como aplicativo, sem depender de uma loja.</span></div>{install?<button className="button-secondary" onClick={()=>void install.prompt()}>Instalar <ArrowRight size={16}/></button>:<button className="button-secondary" onClick={()=>setShowInstall(v=>!v)}>{showInstall?'Fechar':'Como instalar'} <ArrowRight size={16}/></button>}</div>{showInstall&&<div className="container install-instructions"><p><strong>Android:</strong> abra no Chrome e escolha Instalar app no menu, quando disponível.</p><p><strong>iPhone:</strong> abra no Safari, toque em Compartilhar, selecione Adicionar à Tela de Início e confirme Abrir como App. A instalação exige sua confirmação.</p></div>}</section>
  <footer className="site-footer"><div className="container footer-layout"><div className="footer-brand"><Radar size={27}/><div><strong>RADAR IA & DIREITO</strong><p>Da informação à aplicação responsável.</p></div></div><p>Projeto técnico experimental independente. As publicações possuem fontes identificadas e não constituem orientação jurídica individual. Uso institucional do nome e da identidade da OAB depende de aprovação.</p><span>© 2026 · Tecnologia para a advocacia</span></div></footer>
  <nav className="bottom-nav" aria-label="Navegação móvel"><button className={view==='inicio'?'active':''} onClick={()=>navigate('inicio')}><House size={20}/>Início</button><button className={view==='impacto'?'active':''} onClick={()=>navigate('impacto')}><Scale size={20}/>Meu Radar</button><button className={view==='atualizacoes'?'active':''} onClick={()=>navigate('atualizacoes')}><Newspaper size={20}/>Fontes</button><button className={view==='pratica'?'active':''} onClick={()=>navigate('pratica')}><Sparkles size={20}/>Ferramentas</button><button className={view==='informes'?'active':''} onClick={()=>navigate('informes')}><Bell size={20}/>Avisos{unread>0&&<i/>}</button></nav>
 </div>;
}
