import {createClient} from '@supabase/supabase-js';
export const url=import.meta.env.VITE_SUPABASE_URL as string|undefined;
export const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string|undefined;
export const db=(url&&key)?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
export type Article={id:string;title:string;url:string;excerpt:string;published_at:string|null;discovered_at:string;kind:string;topic:string;relevance_score:number;source_id:string;image_url:string|null;editorial_note:string|null;status:string};
export type Source={id:string;slug:string;name:string;homepage:string};
export type Announcement={id:string;title:string;body:string;kind:string;audience:string;status:string;published_at:string|null;created_at:string};
export function externalHttps(value:string){try{const u=new URL(value);return u.protocol==='https:'?u.href:''}catch{return ''}}
export function briefDate(value:string|null){if(!value)return 'Data não informada';return new Date(value).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}
export function isEditor(role?:string){return role==='admin'||role==='editor'}
