/*
 * ด่านตรวจของชุดข้อมูลที่ส่งให้ Codex
 *
 *   node hr-screens/codex/check-contract.mjs
 *
 * ตรวจสิ่งที่เผลอพลาดได้จริง: ค่าที่ต้องตรงกับตารางในบรีฟ, ไฟล์ที่ generate
 * หลุดจาก data.js, ข้อความที่ขาดภาษาใดภาษาหนึ่ง, เกณฑ์รับงานที่อ้าง task ที่ไม่มีอยู่
 * และช่องที่ไม่ควรมีอยู่ในสัญญาเลย
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRoleRegistry, buildScreenIndex } from './build-contract.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const contract = (name) => JSON.parse(readFileSync(join(here, 'contract', name), 'utf8'));
const text = (name) => readFileSync(join(here, name), 'utf8');

const failures = [];
let checks = 0;
const ok = (label, condition, detail = '') => {
  checks += 1;
  if (!condition) failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
};

/*
 * ตารางจากบรีฟ เขียนไว้ตรงนี้โดยตั้งใจ ไม่ได้อ่านจาก data.js
 * ถ้าอ่านจากแหล่งเดียวกับที่ตรวจ การตรวจก็ไม่ได้ตรวจอะไรเลย
 */
const BRIEF_TABLE = [
  { screen: '01', role_id: 'HR-01', grok_id: 'GROK-10', call_sign: 'ORCHESTRATOR', space: 'THE COMMAND BRIDGE' },
  { screen: '02', role_id: 'HR-02', grok_id: 'GROK-01', call_sign: 'PEOPLE', space: 'THE PEOPLE CONSTELLATION' },
  { screen: '03', role_id: 'HR-03', grok_id: 'GROK-08', call_sign: 'WATCHTOWER', space: 'THE MISSION WATCH' },
  { screen: '04', role_id: 'HR-04', grok_id: 'GROK-02', call_sign: 'ANALYST', space: 'THE INTELLIGENCE OBSERVATORY' },
  { screen: '05', role_id: 'HR-05', grok_id: 'GROK-04', call_sign: 'CONNECTOR', space: 'THE CONNECTION NEXUS' },
  { screen: '06', role_id: 'HR-06', grok_id: 'GROK-07', call_sign: 'ECOSYSTEM', space: 'THE ECOSYSTEM DOCK' },
];

const BRIEF_SPECIALISTS = [
  { grok_id: 'GROK-03', call_sign: 'VERIFIER' },
  { grok_id: 'GROK-05', call_sign: 'NEGOTIATION' },
  { grok_id: 'GROK-06', call_sign: 'RISK' },
  { grok_id: 'GROK-09', call_sign: 'GOVERNANCE' },
];

/* 1 — ค่าต้องตรงกับตารางในบรีฟ */
const registry = contract('role-registry.json');
ok('มีครบ 6 ตำแหน่ง', registry.roles.length === 6, `พบ ${registry.roles.length}`);
for (const expected of BRIEF_TABLE) {
  const actual = registry.roles.find((role) => role.role_id === expected.role_id);
  ok(`${expected.role_id} มีอยู่`, Boolean(actual));
  if (!actual) continue;
  for (const field of ['screen', 'grok_id', 'call_sign', 'space']) {
    ok(
      `${expected.role_id}.${field} ตรงกับบรีฟ`,
      actual[field] === expected[field],
      `คาด ${expected[field]} ได้ ${actual[field]}`,
    );
  }
}
ok('grok_id ไม่ซ้ำกัน', new Set(registry.roles.map((r) => r.grok_id)).size === 6);
ok('call sign ไม่ซ้ำกัน', new Set(registry.roles.map((r) => r.call_sign)).size === 6);

for (const expected of BRIEF_SPECIALISTS) {
  const actual = registry.shared_specialists.find((s) => s.grok_id === expected.grok_id);
  ok(`specialist ${expected.grok_id} มีอยู่`, Boolean(actual));
  if (actual) {
    ok(
      `specialist ${expected.grok_id} call sign ตรง`,
      actual.call_sign === expected.call_sign,
      `คาด ${expected.call_sign} ได้ ${actual.call_sign}`,
    );
  }
}
ok('specialist pool มี 4 รายการ', registry.shared_specialists.length === 4);

// GROK ทั้ง 10 ต้องถูกกำหนดครบ ไม่มีเลขซ้ำและไม่มีเลขหาย
const allGrok = [...registry.roles, ...registry.shared_specialists].map((x) => x.grok_id).sort();
const expectedGrok = Array.from({ length: 10 }, (_, i) => `GROK-${String(i + 1).padStart(2, '0')}`).sort();
ok('GROK-01 ถึง GROK-10 ถูกกำหนดครบและไม่ซ้ำ', JSON.stringify(allGrok) === JSON.stringify(expectedGrok),
  `ได้ ${allGrok.join(',')}`);

/* 2 — ไฟล์ที่ generate ต้องไม่หลุดจาก data.js */
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
ok('role-registry.json ตรงกับ data.js', same(registry, buildRoleRegistry()),
  'รัน node hr-screens/codex/build-contract.mjs แล้ว commit ใหม่');
ok('screens.json ตรงกับ data.js', same(contract('screens.json'), buildScreenIndex()),
  'รัน node hr-screens/codex/build-contract.mjs แล้ว commit ใหม่');

/* 3 — ข้อความต้องมีสองภาษาครบ */
const strings = contract('ui-strings.json');
const stringKeys = Object.keys(strings.strings);
ok('มีข้อความอย่างน้อย 40 รายการ', stringKeys.length >= 40, `พบ ${stringKeys.length}`);
for (const key of stringKeys) {
  const entry = strings.strings[key];
  ok(`${key} มีภาษาไทย`, typeof entry.th === 'string' && entry.th.trim().length > 0);
  ok(`${key} มีภาษาอังกฤษ`, typeof entry.en === 'string' && entry.en.trim().length > 0);
}

/* 4 — เกณฑ์รับงานต้องอ้าง task ที่มีอยู่จริง */
const acceptance = contract('acceptance.json');
const tasks = text('TASKS.md');
const ids = acceptance.criteria.map((c) => c.id);
ok('รหัสเกณฑ์ไม่ซ้ำ', new Set(ids).size === ids.length);
for (const criterion of acceptance.criteria) {
  ok(`${criterion.id} อ้าง task ที่มีอยู่จริง`, tasks.includes(`### ${criterion.task} —`),
    `ไม่พบ ${criterion.task} ใน TASKS.md`);
  ok(`${criterion.id} ระบุวิธีตรวจ`, typeof criterion.how === 'string' && criterion.how.length > 10);
}

/* 5 — panel_kind ในทะเบียนต้องมี schema รองรับครบ */
const schema = contract('panel-payloads.schema.json');
const defs = Object.keys(schema.$defs);
for (const role of registry.roles) {
  ok(`panel_kind ${role.panel_kind} มี schema`, defs.includes(role.panel_kind));
}
ok('schema oneOf ครบทุก panel_kind', schema.oneOf.length === 6, `พบ ${schema.oneOf.length}`);

/* 6 — enum ที่สัญญาอ้างถึงต้องมีอยู่จริง */
const enums = contract('enums.json');
const server = contract('server-contract.json');
const enumRefs = [...JSON.stringify(server).matchAll(/enums\.json#([a-z_]+)/g)].map((m) => m[1]);
for (const ref of new Set(enumRefs)) {
  ok(`enum ${ref} มีอยู่`, Object.prototype.hasOwnProperty.call(enums, ref));
}
ok('มี enum อย่างน้อยหนึ่งรายการถูกอ้างถึง', enumRefs.length > 0);

/* 7 — ช่องที่ไม่ควรมีในสัญญาเลย */
const wholeContract = ['role-registry.json', 'screens.json', 'enums.json', 'server-contract.json',
  'panel-payloads.schema.json', 'ui-strings.json', 'acceptance.json']
  .map((name) => readFileSync(join(here, 'contract', name), 'utf8')).join('\n');
for (const banned of ['api_key', 'apiKey', 'access_token', 'accessToken', 'client_secret', 'private_key', 'password']) {
  ok(`ไม่มีช่องชื่อ ${banned} ในสัญญา`, !wholeContract.includes(banned));
}

/* 8 — ข้อกำหนดที่ตัวสัญญาเองต้องพูดให้ชัด */
ok('สัญญาระบุว่าห้าม derive role จากอีเมล', JSON.stringify(server).includes('ห้าม derive role_id จากอีเมล'));
ok('สัญญาระบุว่าคะแนนอ่านอย่างเดียว', JSON.stringify(schema).includes('score_is_read_only'));
ok('สถานะคำขอที่อนุญาตในเฟสนี้มีเฉพาะ DRAFT',
  JSON.stringify(enums.specialist_request_state.allowed_in_prototype) === JSON.stringify(['DRAFT']));
ok('ai_connection_state ปัจจุบันเป็น DEFINED_NOT_CONNECTED',
  enums.ai_connection_state.current_value_for_all_roles === 'DEFINED_NOT_CONNECTED');

/* รายงาน */
if (failures.length === 0) {
  process.stdout.write(`ผ่านทั้งหมด ${checks} ข้อ\n`);
  process.exit(0);
}
process.stdout.write(`ผ่าน ${checks - failures.length} จาก ${checks} ข้อ · ไม่ผ่าน ${failures.length}\n\n`);
for (const failure of failures) process.stdout.write(`  ไม่ผ่าน  ${failure}\n`);
process.exit(1);
