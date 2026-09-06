import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { normalizeProperty,normalizeMember,canView,canEdit } from '../app/api/agents/model.ts';
const member={id:'A1',email:'agent@example.test',team:'A',tier:3,score:20,note:'Reviewed'};
const listing={name:'TEST Condo',area:'TEST BTS',rent:45000,bedrooms:1,size:35.5,tier:3,status:'Available',photos:['11111111-1111-4111-a111-111111111111']};
test('validates levels and rejects malformed inventory',()=>{
 assert.ok(normalizeProperty(listing));assert.equal(normalizeProperty({...listing,rent:NaN}),null);assert.equal(normalizeProperty({...listing,photos:['javascript:alert(1)']}),null);assert.equal(normalizeMember({...member,id:'M1'}),null);
 assert.equal(canView(member,{tier:1}),false);assert.equal(canView(member,{tier:4}),true);assert.equal(canEdit(member,{tier:4,owner:'B1'}),false);
});
test('persistent agent API enforces memberships, ownership, tier and photo access',async()=>{
 const sqlite=new DatabaseSync(':memory:');for(const name of ['0005_flawless_frank_castle.sql','0006_mature_iron_lad.sql'])sqlite.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8'));
 const DB={prepare(sql){let args=[];return {bind(...v){args=v;return this},async first(){return sqlite.prepare(sql).get(...args)??null},async all(){return {results:sqlite.prepare(sql).all(...args)}},async run(){return sqlite.prepare(sql).run(...args)}}},async batch(statements){sqlite.exec('BEGIN');try{const r=[];for(const s of statements)r.push(await s.run());sqlite.exec('COMMIT');return r}catch(e){sqlite.exec('ROLLBACK');throw e}}};
 registerHooks({resolve(specifier,context,next){if(specifier==='cloudflare:workers')return {url:'data:text/javascript,export const env = globalThis.__agentTestEnv',shortCircuit:true};return next(specifier,context)}});
 const {default:worker}=await import('../dist/server/index.js');
 const objects=new Map();const AGENT_PHOTOS={async put(id,stream,options){objects.set(id,{body:await new Response(stream).arrayBuffer(),httpMetadata:options.httpMetadata})},async get(id){return objects.get(id)}};
 globalThis.__agentTestEnv={DB,AGENT_PHOTOS,LILITH_ADMIN_EMAIL:'owner@example.test'};
 async function call(path,email,body,method){const headers={};if(email){headers['oai-authenticated-user-id']='test-'+email;headers['oai-authenticated-user-email']=email}if(body&&!(body instanceof FormData))headers['content-type']='application/json';return worker.fetch(new Request('http://localhost'+path,{method:method??(body?'POST':'GET'),headers,body:body instanceof FormData?body:body?JSON.stringify(body):undefined}),{DB,AGENT_PHOTOS,LILITH_ADMIN_EMAIL:'owner@example.test',ASSETS:{fetch:()=>new Response('',{status:404})}},{waitUntil(){},passThroughOnException(){}})}
 assert.equal((await call('/api/agents')).status,403);assert.equal((await call('/api/agents','stranger@example.test')).status,403);
 const admin=await call('/api/agents','owner@example.test');assert.equal(admin.status,200);assert.equal((await admin.json()).me.id,'M1');
 assert.equal((await call('/api/agents','owner@example.test',{action:'agent',...member})).status,200);
 assert.equal((await call('/api/agents',member.email,{action:'agent',...member,tier:1})).status,403);
 assert.equal((await call('/api/agents','owner@example.test',{action:'agent',...member,id:'B1'})).status,409);
 const form=new FormData();form.append('photos',new Blob([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])],{type:'image/png'}),'test.png');
 const upload=await call('/api/agents/photos',member.email,form);assert.equal(upload.status,201);const {photos}=await upload.json();
 const saved=await call('/api/agents',member.email,{...listing,photos,action:'property'});assert.equal(saved.status,201);const {id}=await saved.json();
 const stored=await call('/api/agents',member.email);assert.equal((await stored.json()).properties[0].size,35.5);
 assert.equal((await call('/api/agents/photos?id='+photos[0],member.email)).status,200);
 assert.equal((await call('/api/agents',member.email,{...listing,photos,action:'property',tier:1})).status,403);
 assert.equal((await call('/api/agents','owner@example.test',{...listing,photos,id,action:'property',tier:1})).status,200);
 assert.equal((await (await call('/api/agents',member.email)).json()).properties.length,0);
 assert.equal((await call('/api/agents/photos?id='+photos[0],member.email)).status,403);
 assert.equal((await call('/api/agents',member.email,{...listing,photos,id,action:'property'})).status,403);
 assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM agent_reviews').get().n,1);
 sqlite.close();
});
