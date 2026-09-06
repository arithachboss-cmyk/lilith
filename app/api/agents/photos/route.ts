import { actor,bucket,db,json,sameOrigin } from '../storage';
export async function POST(request:Request){
 if(!sameOrigin(request))return json({error:'Invalid origin'},403);
 const a=await actor(request);if(!a)return json({error:'ไม่มีสิทธิ์อัปโหลด'},403);
 if(Number(request.headers.get('content-length'))>32*1024*1024)return json({error:'ไฟล์รวมใหญ่เกิน 30 MB'},413);
 // Cap the body before multipart parsing, including chunked requests.
 const reader=request.body?.getReader();if(!reader)return json({error:'ไม่มีไฟล์'},400);
 const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>31*1024*1024){await reader.cancel();return json({error:'ไฟล์รวมใหญ่เกิน 30 MB'},413);}chunks.push(value);}
 let form:FormData;try{form=await new Response(new Blob(chunks as BlobPart[]),{headers:{'Content-Type':request.headers.get('content-type')??''}}).formData();}catch{return json({error:'รูปแบบไฟล์ไม่ถูกต้อง'},400);}
 const files=form.getAll('photos');if(files.length<1||files.length>6||files.some(f=>typeof f==='string'||f.size===0||f.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(f.type)))return json({error:'ใช้ JPG, PNG หรือ WebP สูงสุด 6 รูป รูปละ 5 MB'},422);
 const photos:string[]=[];for(const file of files as File[]){const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());const valid=file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:file.type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71:new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';if(!valid)return json({error:'เนื้อหาไฟล์ไม่ตรงกับชนิดรูป'},422);}
 for(const file of files as File[]){const id=crypto.randomUUID();await bucket().put(id,file.stream(),{httpMetadata:{contentType:file.type}});await db().prepare('INSERT INTO agent_photos (id,owner) VALUES (?,?)').bind(id,a.me.id).run();photos.push(id);}
 return json({photos},201);
}
export async function GET(request:Request){
 const a=await actor(request);if(!a)return json({error:'ไม่มีสิทธิ์ดูรูป'},403);const id=new URL(request.url).searchParams.get('id');if(!id)return json({error:'ไม่พบรูป'},404);
 const photo=await db().prepare('SELECT * FROM agent_photos WHERE id=?').bind(id).first();if(!photo)return json({error:'ไม่พบรูป'},404);
 if(!a.manager){const allowed=await db().prepare('SELECT p.id FROM agent_properties p, json_each(p.photos) j WHERE j.value=? AND p.tier>=? LIMIT 1').bind(id,a.me.tier).first();if(!allowed)return json({error:'ไม่มีสิทธิ์ดูรูป'},403);}
 const object=await bucket().get(id);if(!object)return json({error:'ไม่พบรูป'},404);return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType??'application/octet-stream','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
