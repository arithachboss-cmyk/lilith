import { env } from 'cloudflare:workers';
import type { Listing, Member } from './model';
export const db=()=>env.DB;
export const bucket=()=>env.AGENT_PHOTOS;
export async function actor(request:Request):Promise<{me:Member;manager:boolean}|null>{
 const uid=request.headers.get('oai-authenticated-user-id');const email=request.headers.get('oai-authenticated-user-email')?.toLowerCase();if(!uid||!email)return null;
 const admin=String(env.LILITH_ADMIN_EMAIL??'').trim().toLowerCase();
 if(admin&&email===admin)return {me:{id:'M1',email,team:'M',tier:1,score:0,note:'ผู้จัดการระบบ'},manager:true};
 const me=await db().prepare('SELECT * FROM agent_members WHERE email = ?').bind(email).first<Member>();
 return me?{me,manager:false}:null;
}
export async function property(id:string){const p=await db().prepare('SELECT * FROM agent_properties WHERE id = ?').bind(id).first<Record<string,unknown>>();return p?{...p,photos:JSON.parse(String(p.photos))} as Listing:null;}
export function json(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store'}});}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !origin||origin===new URL(request.url).origin;}
