/*
 * รวม prototype เป็นไฟล์เดียวเพื่อแชร์หรือฝัง
 *
 *   node hr-screens/build-single.mjs           → dist/prototype.html (เปิดจากไฟล์ได้เลย)
 *   node hr-screens/build-single.mjs --fragment --out=<path>
 *        → ไม่มี doctype/html/head/body สำหรับ host ที่ครอบ skeleton ให้เอง
 *
 * อ่านจากไฟล์ต้นทางเสมอ จึงไม่มีสำเนาที่หลุดเวอร์ชันกัน
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (name) => readFileSync(join(here, name), 'utf8');

const fragment = process.argv.includes('--fragment');
const outArg = process.argv.find((arg) => arg.startsWith('--out='));

const css = read('styles.css')
  // ในหน้าเดียวที่ host ครอบ skeleton ให้ ต้องประกาศ color-scheme เอง
  // และแถบ sticky ต้องเผื่อ safe-area ของมือถือ ไม่ใช่ top:0
  .replace(':root {', ':root {\n  color-scheme: dark;')
  .replace('.demo-strip {\n  position: sticky; top: 0;', '.demo-strip {\n  position: sticky; top: env(safe-area-inset-top, 0px);');

// data.js + app.js รวมเป็นสคริปต์เดียว: ตัด export/import ออก ตัวแปรอยู่ใน scope เดียวกัน
const data = read('data.js').replace(/^export const /gm, 'const ');
const app = read('app.js').replace(/^import \{[^}]*\} from '\.\/data\.js';\n/m, '');

const html = read('index.html');
const body = html
  .slice(html.indexOf('<body>') + '<body>'.length, html.indexOf('</body>'))
  .replace(/<script type="module" src="app\.js"><\/script>\s*/, '')
  .trim();

const title = 'AMI Command Console';
const head = `<title>${title}</title>\n<style>\n${css}\n</style>`;
const script = `<script type="module">\n${data}\n${app}\n</script>`;

const out = fragment
  ? `${head}\n${body}\n${script}\n`
  : `<!doctype html>\n<html lang="th">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="robots" content="noindex,nofollow">\n${head}\n</head>\n<body>\n${body}\n${script}\n</body>\n</html>\n`;

const target = outArg ? outArg.slice('--out='.length) : join(here, 'dist', 'prototype.html');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, out, 'utf8');
process.stdout.write(`${target}  ${(out.length / 1024).toFixed(1)} KB\n`);
