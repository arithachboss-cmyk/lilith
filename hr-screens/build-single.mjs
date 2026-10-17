/*
 * รวม prototype เป็นไฟล์เดียวเพื่อแชร์หรือฝัง
 *
 *   node hr-screens/build-single.mjs           → dist/prototype.html + dist/office.html (เปิดจากไฟล์ได้เลย)
 *   node hr-screens/build-single.mjs --page=office
 *        → เฉพาะหน้าสำนักงาน 100 เอเจนต์
 *   node hr-screens/build-single.mjs --fragment --out=<path> [--page=screens|office]
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
const pageArg = process.argv.find((arg) => arg.startsWith('--page='));

const baseCss = read('styles.css')
  // ในหน้าเดียวที่ host ครอบ skeleton ให้ ต้องประกาศ color-scheme เอง
  // และแถบ sticky ต้องเผื่อ safe-area ของมือถือ ไม่ใช่ top:0
  .replace(':root {', ':root {\n  color-scheme: dark;')
  .replace('.demo-strip {\n  position: sticky; top: 0;', '.demo-strip {\n  position: sticky; top: env(safe-area-inset-top, 0px);');

/*
 * แต่ละหน้า: ไฟล์ html, สไตล์เพิ่มเติม และสคริปต์ตามลำดับที่ต้องประกาศ
 * สคริปต์รวมเป็นโมดูลเดียว: ตัด export/import ภายในออก ตัวแปรอยู่ใน scope เดียวกัน
 * ลิงก์ข้ามหน้าเปลี่ยนเป็นชื่อไฟล์ใน dist/ เพื่อให้เปิดจากไฟล์แล้วยังกดไปมาได้
 */
const PAGES = {
  screens: {
    html: 'index.html', css: [], scripts: ['data.js', 'app.js'],
    title: 'AMI Command Console', file: 'prototype.html', links: { 'office.html': 'office.html' },
  },
  office: {
    html: 'office.html', css: ['office.css'], scripts: ['data.js', 'office-data.js', 'office-facts.js', 'office-prompt.js', 'office.js'],
    title: 'AMI Office · 100 agents', file: 'office.html', links: { 'index.html': 'prototype.html' },
  },
};

const stripModule = (source) =>
  source
    .replace(/^import \{[^}]*\} from '\.\/[a-z-]+\.js';\n/gm, '')
    .replace(/^export const /gm, 'const ');

function bundle(page) {
  const css = [baseCss, ...page.css.map(read)].join('\n');
  const script = page.scripts.map((name) => stripModule(read(name))).join('\n');

  const html = read(page.html);
  let body = html
    .slice(html.indexOf('>', html.indexOf('<body')) + 1, html.indexOf('</body>'))
    .replace(/<script type="module" src="[a-z-]+\.js"><\/script>\s*/, '')
    .trim();
  for (const [from, to] of Object.entries(page.links)) {
    body = body.split(`href="${from}"`).join(`href="${to}"`);
  }
  const bodyAttrs = (html.match(/<body([^>]*)>/) || ['', ''])[1];

  const head = `<title>${page.title}</title>\n<style>\n${css}\n</style>`;
  const tag = `<script type="module">\n${script}\n</script>`;
  return fragment
    ? `${head}\n${body}\n${tag}\n`
    : `<!doctype html>\n<html lang="th">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="robots" content="noindex,nofollow">\n${head}\n</head>\n<body${bodyAttrs}>\n${body}\n${tag}\n</body>\n</html>\n`;
}

// ไม่ระบุ --page และ --out: สร้างทั้งสองหน้าใน dist/ เพื่อให้ลิงก์ระหว่างหน้าใช้ได้
const names = pageArg ? [pageArg.slice('--page='.length)] : outArg ? ['screens'] : Object.keys(PAGES);
for (const name of names) {
  const page = PAGES[name];
  if (!page) {
    process.stderr.write(`ไม่รู้จักหน้า ${name} · ใช้ได้: ${Object.keys(PAGES).join(', ')}\n`);
    process.exit(2);
  }
  const out = bundle(page);
  const target = outArg ? outArg.slice('--out='.length) : join(here, 'dist', page.file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, out, 'utf8');
  process.stdout.write(`${target}  ${(out.length / 1024).toFixed(1)} KB\n`);
}
