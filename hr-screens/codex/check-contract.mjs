/*
 * ด่านตรวจของชุดข้อมูลที่ส่งให้ Codex
 *
 *   node hr-screens/codex/check-contract.mjs
 *
 * ตรวจสิ่งที่เผลอพลาดได้จริง: ค่าที่ต้องตรงกับตารางในบรีฟ, ไฟล์ที่ generate
 * หลุดจาก data.js, ข้อความที่ขาดภาษาใดภาษาหนึ่ง, เกณฑ์รับงานที่อ้าง task ที่ไม่มีอยู่
 * และช่องที่ไม่ควรมีอยู่ในสัญญาเลย
 */

import { copyFileSync, existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROMPTS_OUT, buildAgentPromptFiles, buildAgentRoster, buildRoleRegistry, buildRolesTs, buildScreenIndex,
} from './build-contract.mjs';
import { ROLES } from '../data.js';
import { AGENTS as SOURCE_AGENTS, TEAMS as SOURCE_TEAMS } from '../office-data.js';

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
  'panel-payloads.schema.json', 'ui-strings.json', 'acceptance.json', 'agent-roster.json']
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

/* 9 — คำตัดสินที่ปลดล็อก AMI-003 ขึ้นไป ต้องถูกบันทึกและถูกบังคับจริง */
const decisions = contract('decisions.json');
for (const id of ['D-AMI-01', 'D-AMI-02', 'D-AMI-03', 'D-AMI-04']) {
  const decision = decisions.decisions.find((d) => d.id === id);
  ok(`${id} ถูกบันทึก`, Boolean(decision));
  if (!decision) continue;
  ok(`${id} ระบุว่าบังคับด้วยอะไร`, typeof decision.enforced_by === 'string' && decision.enforced_by.length > 5);
  ok(`${id} ระบุว่ากลับทางได้หรือไม่`, typeof decision.reversible === 'boolean');
}
// ที่มาของคำตัดสินต้องพูดตรง ๆ ว่ามาจากการอนุญาตให้เดินต่อ ไม่ใช่คำตอบอิสระรายข้อ
ok('บันทึกที่มาของคำตัดสินไว้', typeof decisions.provenance_th === 'string' && decisions.provenance_th.length > 40);
ok('ความเสี่ยงที่ยังค้างถูกบันทึกไว้ ไม่ใช่หายไปเฉย ๆ', Array.isArray(decisions.open_risks) && decisions.open_risks.length >= 1);
for (const risk of decisions.open_risks || []) {
  ok(`${risk.id} ระบุว่าทำไมถึงไม่บล็อก`, typeof risk.why_not_blocking_th === 'string' && risk.why_not_blocking_th.length > 20);
  ok(`${risk.id} ระบุทางแก้ถ้ากลายเป็นปัญหา`, typeof risk.if_it_becomes_a_problem_th === 'string');
}

// แต่ละคำตัดสินต้องมีผลจริงในไฟล์ที่มันอ้างว่าบังคับ ไม่ใช่แค่เขียนไว้เฉย ๆ
ok('D-AMI-01 บังคับจริง: มีกฎห้าม AMI ทำ auth เอง',
  server.hard_rules.some((rule) => rule.id === 'SR-06' && /ไม่มี endpoint ที่สร้าง ยืนยัน/.test(rule.rule_th)));
ok('D-AMI-02 บังคับจริง: access_verdict มีค่าที่ Keeper ใช้',
  Object.prototype.hasOwnProperty.call(enums.access_verdict.values, 'WITHHELD_BY_KEEPER'));
ok('D-AMI-03 บังคับจริง: route_base เป็น /ami', contract('screens.json').route_base === '/ami');
ok('D-AMI-03 บังคับจริง: ไม่ได้อยู่ใต้ /admin/', !contract('screens.json').route_base.startsWith('/admin'));
ok('D-AMI-04 บังคับจริง: en ผ่านการรีวิวแล้ว', strings.en_status === 'REVIEWED_MEANING_OK');

/* 10 — ทะเบียนฝั่ง TypeScript ต้องไม่หลุดจาก data.js */
const TS_ROLES = join(here, '..', '..', 'packages', 'contracts', 'src', 'ami', 'roles.ts');
ok('มีทะเบียนบทบาทฝั่ง TypeScript', existsSync(TS_ROLES));
if (existsSync(TS_ROLES)) {
  ok('roles.ts ตรงกับ data.js', readFileSync(TS_ROLES, 'utf8') === buildRolesTs(),
    'รัน node hr-screens/codex/build-contract.mjs แล้ว commit ใหม่');
  const tsText = readFileSync(TS_ROLES, 'utf8');
  for (const expected of BRIEF_TABLE) {
    ok(`roles.ts มี ${expected.role_id} พร้อม call sign ที่ตรงบรีฟ`,
      tsText.includes(`roleId: '${expected.role_id}'`) &&
      tsText.includes(`callSign: '${expected.call_sign}'`));
  }
}

/*
 * 11 — ค่าที่สัญญาบอกว่าห้าม ต้องคอมไพล์ไม่ผ่านจริง
 *
 * ตรวจโดยวางไฟล์ fixture เข้าไปในแพ็กเกจชั่วคราวแล้วเรียก tsc · ถ้ามันคอมไพล์
 * ผ่าน แปลว่าสัญญาฝั่ง type หลวมลง ซึ่งเป็นความล้มเหลวที่ต้องรู้
 */
const PKG = join(here, '..', '..', 'packages', 'contracts');
const fixtureSrc = join(here, 'fixtures', 'rejected-by-types.ts');
const fixtureDst = join(PKG, 'src', 'ami', '__contract_negative__.ts');
if (existsSync(join(PKG, 'node_modules', 'typescript'))) {
  let output = '';
  let compiled = false;
  try {
    copyFileSync(fixtureSrc, fixtureDst);
    execFileSync('node', ['node_modules/typescript/bin/tsc', '--noEmit'], { cwd: PKG });
    compiled = true;
  } catch (error) {
    output = `${error.stdout || ''}${error.stderr || ''}`;
  } finally {
    rmSync(fixtureDst, { force: true });
  }
  ok('ค่าที่ห้ามต้องคอมไพล์ไม่ผ่าน', compiled === false,
    'fixture คอมไพล์ผ่าน แปลว่าสัญญาฝั่ง type หลวมลง');
  for (const [label, needle] of [
    ['บทบาทนอกทะเบียน', '"HR-99"'],
    ['panel kind ที่ไม่มีอยู่', '"accounting"'],
    ['FACT ที่ไม่มีแหล่งอ้างอิง', 'AmiStatement'],
    ['คะแนนที่อ้างว่าแก้ได้', "Type 'false' is not assignable"],
  ]) {
    ok(`type ปฏิเสธ${label}`, output.includes(needle), 'ไม่พบ error ที่คาดไว้');
  }
} else {
  /*
   * ใน CI การข้ามคือการปล่อยผ่านเงียบ ๆ ซึ่งทำให้ด่านนี้ไร้ความหมาย
   * นอกเครื่อง CI ยอมให้ข้ามได้ เพื่อให้ clone มาแล้วรันได้ทันทีก่อน install
   */
  ok('ตรวจ type ได้จริง ไม่ถูกข้ามใน CI', !process.env.CI,
    'ไม่พบ typescript ใน packages/contracts — รัน pnpm install --frozen-lockfile ก่อน');
  if (!process.env.CI) ok('ข้ามการตรวจ type เพราะยังไม่ได้ pnpm install', true);
}

/*
 * 12 — enum ต้อง round-trip ระหว่าง enums.json กับ enums.ts
 *
 * ตารางชื่อเขียนไว้ตรงนี้โดยตั้งใจ ไม่ได้ derive จากไฟล์ใดไฟล์หนึ่ง · ถ้ามีคน
 * เพิ่ม enum ใน enums.json โดยไม่มีฝั่ง TypeScript ข้อนี้จะฟ้อง ไม่ใช่เงียบ
 */
const ENUM_PAIRS = [
  ['panel_state', 'AMI_PANEL_STATES'],
  ['access_verdict', 'AMI_ACCESS_VERDICTS'],
  ['ai_connection_state', 'AMI_AI_CONNECTION_STATES'],
  ['specialist_request_state', 'AMI_SPECIALIST_REQUEST_STATES'],
  ['mission_health', 'AMI_MISSION_HEALTH'],
  ['evidence_kind', 'AMI_EVIDENCE_KINDS'],
  ['integration_readiness', 'AMI_INTEGRATION_READINESS'],
  ['action_verdict', 'AMI_ACTION_VERDICTS'],
];

const TS_ENUMS = join(here, '..', '..', 'packages', 'contracts', 'src', 'ami', 'enums.ts');
ok('มีไฟล์ค่าคงที่ฝั่ง TypeScript', existsSync(TS_ENUMS));
if (existsSync(TS_ENUMS)) {
  const enumsTs = readFileSync(TS_ENUMS, 'utf8');
  const tsArray = (name) => {
    const match = enumsTs.match(new RegExp(`export const ${name} = \\[([^\\]]*)\\] as const;`));
    if (!match) return null;
    return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  };

  const jsonEnumKeys = Object.keys(enums)
    .filter((key) => enums[key] && typeof enums[key] === 'object' && enums[key].values);
  ok('ทุก enum ใน enums.json มีคู่ฝั่ง TypeScript',
    jsonEnumKeys.every((key) => ENUM_PAIRS.some(([jsonKey]) => jsonKey === key)),
    `ไม่มีคู่: ${jsonEnumKeys.filter((key) => !ENUM_PAIRS.some(([j]) => j === key)).join(', ')}`);

  for (const [jsonKey, tsName] of ENUM_PAIRS) {
    const fromJson = Object.keys(enums[jsonKey]?.values ?? {});
    const fromTs = tsArray(tsName);
    ok(`enums.ts มี ${tsName}`, fromTs !== null);
    if (fromTs !== null) {
      ok(`${tsName} ตรงกับ enums.json#${jsonKey} ทุกค่าและเรียงเหมือนกัน`,
        JSON.stringify(fromTs) === JSON.stringify(fromJson),
        `json=${fromJson.join('|')} ts=${fromTs.join('|')}`);
    }
  }

  ok('ค่าปัจจุบันของ ai_connection_state ตรงกันทั้งสองฝั่ง',
    enumsTs.includes(`AMI_AI_CONNECTION_STATE_NOW: AmiAiConnectionState = '${enums.ai_connection_state.current_value_for_all_roles}'`));
  ok('สถานะคำขอที่อนุญาตในเฟสนี้ตรงกันทั้งสองฝั่ง',
    JSON.stringify(tsArray('AMI_SPECIALIST_REQUEST_STATES_ALLOWED_NOW')) ===
    JSON.stringify(enums.specialist_request_state.allowed_in_prototype));
}

/*
 * 13 — สำนักงาน 100 เอเจนต์ · ADR-0014
 *
 * จำนวน หัวหน้าทีม และผู้ดูแลทีมเขียนไว้ตรงนี้โดยตั้งใจ ไม่ได้อ่านจาก office-data.js
 * เส้นทางส่งต่อคำนวณใหม่ที่นี่จาก handoff_to ไม่เชื่อ route_to_human ที่ generate มา
 */
const EXPECTED_AGENT_TOTAL = 100;
const EXPECTED_TEAM_TOTAL = 10;
const EXPECTED_MEMBER_TOTAL = 90;
const MAX_ROUTE_HOPS = 10;
// Shared Specialist ไม่ผูกกับพนักงานคนเดียว แต่ทีมของมันต้องมีคนหนึ่งตำแหน่งดูแล · ADR-0014
const SHARED_TEAM_STEWARDS = { 'GROK-03': 'HR-04', 'GROK-05': 'HR-05', 'GROK-06': 'HR-01', 'GROK-09': 'HR-01' };
const KNOWN_BLOCKERS = ['OWNER_DECISION_FEE_MODEL'];
const RUNTIME_KEYS = ['model', 'endpoint', 'url', 'base_url', 'schedule', 'cron', 'replicas', 'instances',
  'concurrency', 'budget', 'max_tokens', 'temperature', 'webhook', 'api_key', 'token', 'secret', 'credential'];

const roster = contract('agent-roster.json');
const humanIds = BRIEF_TABLE.map((row) => row.role_id);
const isHuman = (id) => humanIds.includes(id);
const pad = (n, width) => String(n).padStart(width, '0');

ok('agent-roster.json ตรงกับ office-data.js', same(roster, buildAgentRoster()),
  'รัน node hr-screens/codex/build-contract.mjs แล้ว commit ใหม่');

const agents = roster.agents || [];
const teams = roster.teams || [];
const agentById = new Map(agents.map((agent) => [agent.agent_id, agent]));
const teamById = new Map(teams.map((team) => [team.team_id, team]));

/* 13.1 ครบ 100 ไม่ซ้ำ ไม่หาย */
ok(`มีเอเจนต์ครบ ${EXPECTED_AGENT_TOTAL} ตัว`, agents.length === EXPECTED_AGENT_TOTAL, `พบ ${agents.length}`);
ok(`มีทีมครบ ${EXPECTED_TEAM_TOTAL} ทีม`, teams.length === EXPECTED_TEAM_TOTAL, `พบ ${teams.length}`);
for (const field of ['agent_id', 'call_sign', 'title_th', 'title_en', 'duty_th', 'duty_en']) {
  const values = agents.map((agent) => agent[field]);
  const dupes = values.filter((value, i) => values.indexOf(value) !== i);
  ok(`${field} ของเอเจนต์ไม่ซ้ำกัน`, dupes.length === 0, `ซ้ำ: ${[...new Set(dupes)].join(', ')}`);
}
ok('team_id ไม่ซ้ำกัน', teamById.size === teams.length);

const memberIds = agents.filter((a) => a.agent_id.startsWith('AGT-')).map((a) => a.agent_id).sort();
const expectedMembers = Array.from({ length: EXPECTED_MEMBER_TOTAL }, (_, i) => `AGT-${pad(i + 1, 3)}`);
ok(`สมาชิกเป็น AGT-001 ถึง AGT-${pad(EXPECTED_MEMBER_TOTAL, 3)} ครบ ไม่มีเลขหาย`,
  JSON.stringify(memberIds) === JSON.stringify(expectedMembers), `ได้ ${memberIds.length} รายการ`);
const leadIds = agents.filter((a) => a.agent_id.startsWith('GROK-')).map((a) => a.agent_id).sort();
ok('หัวหน้าทีมคือ GROK-01 ถึง GROK-10 พอดี ไม่เพิ่มรหัส Grok ใหม่',
  JSON.stringify(leadIds) === JSON.stringify(expectedGrok), `ได้ ${leadIds.join(',')}`);
ok('ไม่มีรหัสเอเจนต์รูปแบบอื่น',
  agents.every((a) => /^(GROK-\d{2}|AGT-\d{3})$/.test(a.agent_id)));

/* 13.2 หัวหน้าทีม ผู้ดูแลทีม และ pool ตรงกับบรีฟและ ADR-0014 */
const briefCallSign = new Map([
  ...BRIEF_TABLE.map((row) => [row.grok_id, row.call_sign]),
  ...BRIEF_SPECIALISTS.map((row) => [row.grok_id, row.call_sign]),
]);
const expectedOwner = new Map([
  ...BRIEF_TABLE.map((row) => [row.grok_id, row.role_id]),
  ...Object.entries(SHARED_TEAM_STEWARDS),
]);
for (const grokId of expectedGrok) {
  const led = teams.filter((team) => team.lead_id === grokId);
  ok(`${grokId} เป็นหัวหน้าทีมเดียวพอดี`, led.length === 1, `เป็นหัวหน้า ${led.length} ทีม`);
  const lead = agentById.get(grokId);
  ok(`${grokId} call sign ตรงกับบรีฟ`, lead?.call_sign === briefCallSign.get(grokId),
    `คาด ${briefCallSign.get(grokId)} ได้ ${lead?.call_sign}`);
  if (led.length !== 1) continue;
  const [team] = led;
  ok(`ทีมของ ${grokId} มีผู้รับผิดชอบตามบรีฟหรือ ADR-0014`, team.owner_role_id === expectedOwner.get(grokId),
    `คาด ${expectedOwner.get(grokId)} ได้ ${team.owner_role_id}`);
  const shared = Object.prototype.hasOwnProperty.call(SHARED_TEAM_STEWARDS, grokId);
  ok(`ทีมของ ${grokId} เป็น pool ${shared ? 'shared' : 'dedicated'}`, team.pool === (shared ? 'shared' : 'dedicated'));
  ok(`ทีมของ ${grokId} ระบุ call sign หัวหน้าตรงกัน`, team.lead_call_sign === lead?.call_sign);
}

/* 13.3 ทุกตัวมีหน้าที่ ทีม และผู้รับผิดชอบ */
let sizeSum = 0;
for (const team of teams) {
  const members = agents.filter((a) => a.team_id === team.team_id);
  sizeSum += members.length;
  ok(`${team.team_id} ขนาดที่ประกาศตรงกับจำนวนจริง`, team.size === members.length, `ประกาศ ${team.size} จริง ${members.length}`);
  ok(`${team.team_id} มีหัวหน้าหนึ่งตัวและสมาชิกอย่างน้อยหนึ่งตัว`,
    members.filter((a) => a.kind === 'lead').length === 1 && members.length >= 2);
  ok(`${team.team_id} ผู้รับผิดชอบเป็นหนึ่งในหกตำแหน่งเดิม`, isHuman(team.owner_role_id), team.owner_role_id);
  for (const key of ['name_th', 'name_en', 'mission_th', 'mission_en']) {
    ok(`${team.team_id}.${key} ไม่ว่าง`, typeof team[key] === 'string' && team[key].trim().length > 0);
  }
}
ok(`ขนาดทีมรวมกันได้ ${EXPECTED_AGENT_TOTAL}`, sizeSum === EXPECTED_AGENT_TOTAL, `ได้ ${sizeSum}`);

for (const agent of agents) {
  const id = agent.agent_id;
  const team = teamById.get(agent.team_id);
  ok(`${id} อยู่ในทีมที่มีอยู่จริง`, Boolean(team), agent.team_id);
  ok(`${id} kind ตรงกับตำแหน่งในทีม`, agent.kind === (team && team.lead_id === id ? 'lead' : 'member'));
  ok(`${id} ผู้รับผิดชอบคือผู้รับผิดชอบทีม`, Boolean(team) && agent.owner_role_id === team.owner_role_id);
  for (const key of ['title_th', 'title_en', 'duty_th', 'duty_en']) {
    ok(`${id}.${key} ไม่ว่าง`, typeof agent[key] === 'string' && agent[key].trim().length > 0);
  }
  ok(`${id} call sign เป็นตัวพิมพ์ใหญ่`, /^[A-Z][A-Z0-9-]*$/.test(agent.call_sign), agent.call_sign);
  ok(`${id} ไม่ใช้ชื่อของ Confidentiality Gate`, !/KEEPER|MATCHMAKER/.test(agent.call_sign));
}

/* 13.4 เส้นทางส่งต่องาน ต้องจบที่คน ไม่วน และไม่ข้ามหัวหน้าทีม */
for (const agent of agents) {
  const id = agent.agent_id;
  const team = teamById.get(agent.team_id);
  const to = agent.handoff_to;
  ok(`${id} มีปลายทางส่งต่อ`, typeof to === 'string' && to.length > 0, 'อ้าง call sign ที่ไม่มีอยู่');
  ok(`${id} ไม่ส่งต่อให้ตัวเอง`, to !== id);
  if (agent.kind === 'lead') {
    ok(`${id} หัวหน้าทีมส่งต่อให้ผู้รับผิดชอบทีม`, Boolean(team) && to === team.owner_role_id, `ส่งให้ ${to}`);
    ok(`${id} ยกระดับไปที่ผู้รับผิดชอบทีม`, Boolean(team) && agent.escalate_to === team.owner_role_id);
  } else {
    ok(`${id} สมาชิกส่งต่อให้เอเจนต์ ไม่ข้ามไปหาคนเอง`, agentById.has(to), `ส่งให้ ${to}`);
    ok(`${id} ยกระดับไปที่หัวหน้าทีม`, Boolean(team) && agent.escalate_to === team.lead_id);
  }

  const route = [];
  const seen = new Set([id]);
  let at = to;
  let verdict = 'ok';
  while (true) {
    if (isHuman(at)) { route.push(at); break; }
    if (!agentById.has(at)) { verdict = `อ้าง ${at} ที่ไม่มีอยู่`; break; }
    if (seen.has(at)) { verdict = `วนกลับมาที่ ${at}`; break; }
    if (route.length >= MAX_ROUTE_HOPS) { verdict = `ยาวเกิน ${MAX_ROUTE_HOPS} ขั้น`; break; }
    route.push(at);
    seen.add(at);
    at = agentById.get(at).handoff_to;
  }
  ok(`${id} เส้นทางส่งต่อจบที่คนโดยไม่วน`, verdict === 'ok', verdict);
  if (verdict === 'ok') {
    const lastAgent = route.length >= 2 ? agentById.get(route[route.length - 2]) : agent;
    ok(`${id} คนที่รับงานปลายทางได้รับผ่านหัวหน้าทีม`, lastAgent.kind === 'lead');
    ok(`${id} route_to_human ตรงกับที่คำนวณใหม่`,
      JSON.stringify(agent.route_to_human) === JSON.stringify(route), `ได้ ${agent.route_to_human.join(' → ')}`);
  }
}

/* 13.5 การตั้งค่าแยกจากการเปิดใช้จริง · ไม่เปิด 100 ตัวและไม่เพิ่มค่าใช้จ่ายเพียงให้ครบจำนวน */
const nowState = enums.ai_connection_state.current_value_for_all_roles;
ok('ทะเบียนประกาศว่าเป็นการตั้งค่าเท่านั้น', roster.nature === 'CONFIGURATION_ONLY');
ok('ยังไม่มีเอเจนต์ที่ถูกเปิดใช้จริง', roster.runtime?.provisioned_agents === 0);
ok('ไม่มีค่าใช้จ่ายที่เพิ่มขึ้นจากทะเบียนนี้', roster.runtime?.added_running_cost === 'NONE');
ok('สถานะการเชื่อมต่อรวมตรงกับ enums.json', roster.runtime?.connection_state_for_all === nowState);
ok(`เอเจนต์ทุกตัวอยู่ที่ ${nowState}`, agents.every((a) => a.connection_state === nowState),
  `ไม่ตรง: ${agents.filter((a) => a.connection_state !== nowState).map((a) => a.agent_id).join(', ')}`);
ok('กติกาการเปิดใช้ระบุไว้ทั้งสองภาษา',
  typeof roster.runtime?.rule_th === 'string' && roster.runtime.rule_th.length > 40 &&
  typeof roster.runtime?.rule_en === 'string' && roster.runtime.rule_en.length > 40);
const keysIn = (value, out = []) => {
  if (Array.isArray(value)) value.forEach((item) => keysIn(item, out));
  else if (value && typeof value === 'object') {
    for (const [key, inner] of Object.entries(value)) { out.push(key); keysIn(inner, out); }
  }
  return out;
};
const rosterKeys = new Set(keysIn(roster));
for (const key of RUNTIME_KEYS) {
  ok(`ทะเบียนไม่มีช่อง runtime ชื่อ ${key}`, !rosterKeys.has(key));
}
/*
 * generator คัดลอกเฉพาะช่องที่รู้จัก ช่อง runtime ที่เพิ่มในไฟล์ต้นทางจึงหายเงียบจาก JSON
 * ต้องตรวจที่ไฟล์ต้นทางด้วย ไม่อย่างนั้นการตั้งค่า runtime จะซ่อนอยู่ใน office-data.js ได้
 */
const SOURCE_AGENT_FIELDS = ['id', 'callSign', 'team', 'titleTh', 'titleEn', 'dutyTh', 'dutyEn', 'to', 'blockedBy'];
const SOURCE_TEAM_FIELDS = ['id', 'lead', 'owner', 'pool', 'nameTh', 'nameEn', 'missionTh', 'missionEn'];
for (const agent of SOURCE_AGENTS) {
  const extra = Object.keys(agent).filter((key) => !SOURCE_AGENT_FIELDS.includes(key));
  ok(`office-data.js ${agent.id} มีเฉพาะช่องการตั้งค่า`, extra.length === 0, `ช่องเกิน: ${extra.join(', ')}`);
}
for (const team of SOURCE_TEAMS) {
  const extra = Object.keys(team).filter((key) => !SOURCE_TEAM_FIELDS.includes(key));
  ok(`office-data.js ${team.id} มีเฉพาะช่องการตั้งค่า`, extra.length === 0, `ช่องเกิน: ${extra.join(', ')}`);
}

const officeFiles = ['office-data.js', 'office-prompt.js', 'office.html', 'office.js', 'office.css'];
for (const name of officeFiles) {
  const path = join(here, '..', name);
  ok(`มีไฟล์ ${name}`, existsSync(path));
  if (existsSync(path)) {
    ok(`${name} ไม่เรียกบริการภายนอก`, !/https?:\/\/|url\(/.test(readFileSync(path, 'utf8')));
  }
}
ok('agent-roster.json ไม่มีที่อยู่ภายนอก', !/https?:\/\//.test(JSON.stringify(roster)));

/* 13.6 ห้ามแต่งฐานค่าธรรมเนียม ผู้จ่าย หรือการอนุมัติขึ้นเอง · AGENTS.md */
for (const [id, blocker] of Object.entries(roster.blockers || {})) {
  ok(`blocker ${id} เป็นค่าที่รู้จัก`, KNOWN_BLOCKERS.includes(id));
  ok(`blocker ${id} มีทั้งสองภาษา`, Boolean(blocker.th) && Boolean(blocker.en));
}
for (const agent of agents) {
  if (agent.blocked_by !== null) {
    ok(`${agent.agent_id} blocked_by อ้าง blocker ที่ประกาศไว้`,
      Object.prototype.hasOwnProperty.call(roster.blockers || {}, agent.blocked_by), agent.blocked_by);
  }
  const touchesFee = /\b(fee|fees|invoice|commission)\b/i.test(agent.duty_en) || /ค่าธรรมเนียม|ค่าคอม/.test(agent.duty_th);
  if (touchesFee) {
    ok(`${agent.agent_id} งานที่แตะค่าธรรมเนียมต้องรอคำตัดสินของเจ้าของ`,
      agent.blocked_by === 'OWNER_DECISION_FEE_MODEL');
  }
  if (/\bscore\b/i.test(agent.duty_en)) {
    ok(`${agent.agent_id} พูดถึงคะแนนได้เฉพาะแบบอ่านอย่างเดียว`,
      /read-only/i.test(agent.duty_en) && /never changes/i.test(agent.duty_en));
  }
}

/* 13.7 ฉบับ en ที่ยังไม่รีวิวต้องถูกระบุไว้ ไม่ใช่ซ่อนอยู่ใต้ REVIEWED_MEANING_OK */
ok('ทะเบียนระบุสถานะฉบับ en', ['DRAFT_NEEDS_REVIEW', 'REVIEWED_MEANING_OK'].includes(roster.en_status), roster.en_status);
const pending = strings.en_pending_review || [];
const officeKeys = stringKeys.filter((key) => key.startsWith('office.'));
ok('มีข้อความของหน้าสำนักงานอย่างน้อย 20 รายการ', officeKeys.length >= 20, `พบ ${officeKeys.length}`);
ok('ข้อความ office.* ทุกตัวถูกระบุว่ารอรีวิว en', officeKeys.every((key) => pending.includes(key)),
  `ไม่ได้ระบุ: ${officeKeys.filter((key) => !pending.includes(key)).join(', ')}`);
ok('รายการรอรีวิวอ้างข้อความที่มีอยู่จริง', pending.every((key) => stringKeys.includes(key)));

/* 13.8 จุดที่เคยอ้างจำนวนเดิม ต้องพูดตรงกับทะเบียน */
const coordinator = ROLES.find((role) => role.roleId === 'HR-06');
const coordinatorText = JSON.stringify(coordinator?.nextActions ?? []);
ok('หน้าจอ AI Coordinator อ้างจำนวนเอเจนต์ตามทะเบียน', coordinatorText.includes(`${EXPECTED_AGENT_TOTAL} เอเจนต์`));
ok('หน้าจอ AI Coordinator ไม่อ้างจำนวนเดิม 10 บทบาทแล้ว', !coordinatorText.includes('10 บทบาท'));
ok('ทะเบียน Grok บนหน้าจอ AI Coordinator ยังมี 10 ตัวเท่ากับหัวหน้าทีม',
  (coordinator?.panels?.agents ?? []).length === EXPECTED_TEAM_TOTAL);

/*
 * 14 — prompt ประจำตัวเอเจนต์ · หนึ่งเอเจนต์หนึ่งแชต ส่งงานกันด้วยบล็อก HANDOFF ที่คนคัดลอก
 *
 * ชื่อไฟล์และปลายทาง to: ที่คาดไว้คำนวณจาก agent-roster.json ไม่ได้อ่านจาก office-prompt.js
 */
const PROMPT_RULE_MARKERS = [
  'คุณทำได้แค่ร่าง', 'ห้ามแต่งข้อมูล', 'คะแนนจับคู่มาจากระบบจับคู่เท่านั้น', 'ข้อมูลส่วนบุคคล',
  'ค่าธรรมเนียม: ห้ามคำนวณ', 'ไม่ให้ความเห็นทางกฎหมาย', 'status: DRAFT', '=== HANDOFF ===', '=== END HANDOFF ===',
];
const PERSONAL_DATA = /[\w.+-]+@[\w-]+\.[\w.]+|\b0\d{1,2}-\d{3}-\d{4}\b|\b0[689]\d{8}\b|\b\d-\d{4}-\d{5}-\d{2}-\d\b/;
const expectedPromptFiles = [...agents.map((a) => `${a.agent_id}-${a.call_sign}.md`), 'README.md'].sort();
const actualPromptFiles = existsSync(PROMPTS_OUT)
  ? readdirSync(PROMPTS_OUT).filter((name) => name.endsWith('.md')).sort() : [];
ok(`มีไฟล์ prompt ครบ ${EXPECTED_AGENT_TOTAL} ไฟล์และสารบัญ ไม่มีไฟล์เกิน`,
  JSON.stringify(actualPromptFiles) === JSON.stringify(expectedPromptFiles),
  `ขาด: ${expectedPromptFiles.filter((n) => !actualPromptFiles.includes(n)).join(', ') || '-'} · ` +
  `เกิน: ${actualPromptFiles.filter((n) => !expectedPromptFiles.includes(n)).join(', ') || '-'}`);
const generatedPrompts = new Map(buildAgentPromptFiles().map((file) => [file.name, file.content]));
for (const name of actualPromptFiles) {
  ok(`prompts/agents/${name} ตรงกับต้นทาง`, readFileSync(join(PROMPTS_OUT, name), 'utf8') === generatedPrompts.get(name),
    'รัน node hr-screens/codex/build-contract.mjs แล้ว commit ใหม่');
}
for (const agent of agents) {
  const name = `${agent.agent_id}-${agent.call_sign}.md`;
  if (!actualPromptFiles.includes(name)) continue;
  const prompt = readFileSync(join(PROMPTS_OUT, name), 'utf8');
  const id = agent.agent_id;
  const target = agentById.get(agent.handoff_to);
  const expectedTo = target ? `${target.agent_id} ${target.call_sign}` : agent.handoff_to;
  ok(`${id} prompt ระบุตัวตนของตัวเอง`, prompt.startsWith(`# บทบาทของคุณ: ${id} · ${agent.call_sign}\n`));
  ok(`${id} prompt ส่ง HANDOFF จากตัวเอง`, prompt.includes(`\nfrom: ${id} ${agent.call_sign}\n`));
  ok(`${id} prompt ส่ง HANDOFF ไปที่ปลายทางตามทะเบียน`, prompt.includes(`\nto: ${expectedTo}\n`), `คาด ${expectedTo}`);
  ok(`${id} prompt มีหน้าที่ทั้งสองภาษา`, prompt.includes(agent.duty_th) && prompt.includes(agent.duty_en));
  ok(`${id} prompt ระบุคนที่รับผิดชอบ`, prompt.includes(`คนที่รับผิดชอบงานของทีม: ${agent.owner_role_id} · `));
  for (const marker of PROMPT_RULE_MARKERS) {
    ok(`${id} prompt มีกติกา "${marker}"`, prompt.includes(marker));
  }
  ok(`${id} prompt ไม่มีข้อมูลส่วนบุคคลหรือที่อยู่ภายนอก`, !PERSONAL_DATA.test(prompt) && !/https?:\/\//.test(prompt));
  ok(`${id} prompt ไม่มีช่อง key หรือ token`, !/api[_ ]?key|access[_ ]?token|client[_ ]?secret|password/i.test(prompt));
  if (agent.blocked_by) {
    ok(`${id} prompt ระบุว่ารอคำตัดสินของเจ้าของ`, prompt.includes(roster.blockers[agent.blocked_by].th));
  }
}
if (actualPromptFiles.includes('README.md')) {
  const index = readFileSync(join(PROMPTS_OUT, 'README.md'), 'utf8');
  ok('สารบัญ prompt ลิงก์ครบทุกเอเจนต์',
    agents.every((a) => index.includes(`](${a.agent_id}-${a.call_sign}.md)`)));
  ok('สารบัญ prompt บอกให้เริ่มทีละเส้นทาง ไม่เปิดครบทุกตัว', index.includes(`อย่าเปิดทั้ง ${EXPECTED_AGENT_TOTAL} แชตพร้อมกัน`));
}

/* รายงาน */
if (failures.length === 0) {
  process.stdout.write(`ผ่านทั้งหมด ${checks} ข้อ\n`);
  process.exit(0);
}
process.stdout.write(`ผ่าน ${checks - failures.length} จาก ${checks} ข้อ · ไม่ผ่าน ${failures.length}\n\n`);
for (const failure of failures) process.stdout.write(`  ไม่ผ่าน  ${failure}\n`);
process.exit(1);
