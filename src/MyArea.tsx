import {useEffect,useState,type FormEvent} from 'react';
import type {User} from '@supabase/supabase-js';
import {ArrowUpRight,Bookmark,Check,Inbox,LogIn,LogOut,Send,ShieldCheck,UserRound,X} from 'lucide-react';
import {db,type Article,externalHttps} from './lib';

const topicsOptions=['Jurisprudência','Legislação','IA e ética','LGPD','Tecnologia jurídica','Capacitação'];
export default function MyArea({user,articles,bookmarks,onToggleBookmark,onNotice}:{user:User|null;articles:Article[];bookmarks:string[];onToggleBookmark:(id:string)=>void;onNotice:(msg:string)=>void}){
 const [email,setEmail]=useState('');
 const [sending,setSending]=useState(false);
 const [displayName,setDisplayName]=useState('');
 const [area,setArea]=useState('');
 const [topics,setTopics]=useState<string[]>([]);
 const [suggestion,setSuggestion]=useState('');
 const [suggestionTopic,setSuggestionTopic]=useState('Capacitação');
 useEffect(()=>{
   if(!db||!user)return;
   let valid=true;
   void Promise.all([
     db.from('profiles').select('display_name,practice_area').eq('user_id',user.id).maybeSingle(),
     db.from('preferences').select('topics').eq('user_id',user.id).maybeSingle()
   ]).then(([p,pr])=>{
     if(!valid)return;
     setDisplayName(p.data?.display_name||'');setArea(p.data?.practice_area||'');setTopics(pr.data?.topics||[]);
   });
   return ()=>{valid=false}
 },[user?.id]);
 async function login(e:FormEvent){e.preventDefault();if(!db)return;
  setSending(true);
  const {error}=await db.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin+'/radar-ia-portal/'}});
  onNotice(error?'Erro ao enviar link: '+error.message:'Confira sua caixa de entrada e spam para acessar o Radar.');
  setSending(false);
 }
 async function save(e:FormEvent){e.preventDefault();if(!db||!user)return;
  const [a,b]=await Promise.all([
    db.from('profiles').upsert({user_id:user.id,display_name:displayName.trim(),practice_area:area.trim()}),
    db.from('preferences').upsert({user_id:user.id,topics,email_opt_in:false,updated_at:new Date().toISOString()})
  ]);
  onNotice(a.error?.message||b.error?.message||'Preferências salvas.');
 }
 async function submit(e:FormEvent){e.preventDefault();if(!db||!user)return;
  const {error}=await db.from('suggestions').insert({user_id:user.id,topic:suggestionTopic,body:suggestion.trim()});
  onNotice(error?error.message:'Sua sugestão foi registrada para avaliação.');
  if(!error)setSuggestion('');
 }
 return <section className="account-page">
   <div className="page-intro"><div className="section-kicker"><span className="eyebrow-line"/> ÁREA DO ADVOGADO</div>
     <h1>Seu Radar, <i>do seu jeito.</i></h1>
     <p>Guarde o que importa, escolha os temas que quer acompanhar e participe das atividades da comissão.</p>
   </div>
   {!user?<div className="account-entry"><div className="account-entry-art"><div className="account-symbol"><UserRound size={47}/></div><h2>Uma conta para acompanhar o que interessa.</h2><p>Salve leituras e personalize seus interesses. A consulta pública continua aberta para todos.</p><div className="account-perk"><Bookmark size={17}/> Matérias salvas em qualquer aparelho</div><div className="account-perk"><Inbox size={17}/> Informes da comissão em um só lugar</div></div>
     <form className="account-login" onSubmit={e=>void login(e)}><LogIn size={27}/><h2>Entrar no Radar</h2><p>Sem senha para memorizar. Enviaremos um link de acesso para o seu e-mail.</p><label htmlFor="login-email">E-mail</label><input id="login-email" type="email" autoComplete="email" required placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)}/><button type="submit" disabled={!db||sending} className="button-primary">{sending?'Enviando...':'Receber link de acesso'} <Send size={17}/></button><small>Não enviamos mensagens promocionais sem autorização.</small></form>
   </div>:<div className="account-grid">
     <div><form className="form-card" onSubmit={e=>void save(e)}><div className="form-card-head"><UserRound/><div><h2>Meu perfil</h2><p>{user.email}</p></div></div>
       <label htmlFor="display-name">Como quer ser chamado?</label><input id="display-name" maxLength={90} value={displayName} onChange={e=>setDisplayName(e.target.value)}/>
       <label htmlFor="practice-area">Área de atuação (opcional)</label><input id="practice-area" maxLength={90} value={area} onChange={e=>setArea(e.target.value)}/>
       <span className="field-label">Assuntos que quero acompanhar</span><div className="interest-picker">{topicsOptions.map(t=><button key={t} type="button" className={topics.includes(t)?'selected':''} aria-pressed={topics.includes(t)} onClick={()=>setTopics(v=>v.includes(t)?v.filter(x=>x!==t):[...v,t])}>{topics.includes(t)&&<Check size={13}/>} {t}</button>)}</div>
       <button type="submit" className="button-primary">Salvar preferências <Check size={16}/></button>
       <button type="button" className="quiet-button" onClick={()=>void db?.auth.signOut()}><LogOut size={16}/> Sair da conta</button>
     </form></div>
     <div><div className="form-card"><div className="form-card-head"><Bookmark/><div><h2>Leituras salvas</h2><p>{bookmarks.length} itens na biblioteca</p></div></div>
       {articles.filter(a=>bookmarks.includes(a.id)).length?articles.filter(a=>bookmarks.includes(a.id)).map(a=><div className="saved-article" key={a.id}><a href={externalHttps(a.url)} target="_blank" rel="noopener noreferrer">{a.title} <ArrowUpRight size={15}/></a><button aria-label="Remover dos favoritos" onClick={()=>onToggleBookmark(a.id)}><X size={17}/></button></div>):<p className="muted-text">Toque no marcador de uma publicação para guardá-la aqui.</p>}
     </div>
     <form className="form-card" onSubmit={e=>void submit(e)}><div className="form-card-head"><ShieldCheck/><div><h2>Ajude a escolher os próximos temas</h2><p>Envie ideias para futuras oficinas e conteúdos.</p></div></div><label htmlFor="suggestion-kind">Assunto</label><select id="suggestion-kind" value={suggestionTopic} onChange={e=>setSuggestionTopic(e.target.value)}><option>Capacitação</option><option>Ferramenta jurídica</option><option>Dúvida sobre IA</option><option>Outro</option></select><label htmlFor="suggestion-text">Sua sugestão</label><textarea id="suggestion-text" value={suggestion} required minLength={8} maxLength={1500} onChange={e=>setSuggestion(e.target.value)} placeholder="Ex.: gostaria de uma oficina prática para conferir decisões citadas pela IA."/><button type="submit" className="button-secondary">Enviar sugestão <Send size={17}/></button></form></div>
   </div>}
 </section>;
}
