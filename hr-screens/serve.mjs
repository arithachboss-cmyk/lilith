/*
 * เซิร์ฟเวอร์ static สำหรับเปิดดู prototype ในเครื่องเท่านั้น
 * ผูกกับ loopback ไม่มี dependency ไม่เขียนไฟล์ ไม่เรียกบริการภายนอก
 *   node hr-screens/serve.mjs
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
const root = process.argv[2] || new URL('.', import.meta.url).pathname;
const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json' };
createServer((req,res)=>{
  const p = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const body = readFileSync(join(root, p));
    res.writeHead(200, {'content-type': (types[extname(p)]||'text/plain')+'; charset=utf-8'});
    res.end(body);
  } catch { res.writeHead(404); res.end('nf'); }
}).listen(4300,'127.0.0.1',()=>console.log('serving'));
