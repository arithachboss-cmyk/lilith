/*
 * สร้างชุดข้อมูลสัญญา (contract) จาก data.js ซึ่งเป็นแหล่งเดียวของค่าเหล่านี้
 *
 *   node hr-screens/codex/build-contract.mjs
 *
 * ไฟล์ที่ generate ห้ามแก้ด้วยมือ ถ้าจะเปลี่ยนค่าให้แก้ที่ data.js แล้ว build ใหม่
 * check-contract.mjs จะ fail ถ้าไฟล์ที่ commit ไว้ไม่ตรงกับ data.js
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROLES, SPECIALISTS, FUNNEL, PRINCIPLES } from '../data.js';
import { TEAMS, AGENTS, BLOCKERS } from '../office-data.js';

const here = dirname(fileURLToPath(import.meta.url));
export const OUT = join(here, 'contract');

const slug = (role) => role.roleId.toLowerCase();

export function buildRoleRegistry() {
  return {
    $generated_from: 'hr-screens/data.js',
    $do_not_edit_by_hand: true,
    version: '1.0.0',
    roles: ROLES.map((role) => ({
      screen: role.screen,
      role_id: role.roleId,
      slug: slug(role),
      title: role.title,
      title_note_th: role.titleNote,
      grok_id: role.grokId,
      call_sign: role.callSign,
      space: role.space,
      welcome_th: role.welcome,
      accent: role.accent,
      accent_name: role.accentName,
      primary_action_th: role.primaryAction,
      panel_kind: role.panels.kind,
      ai_scope_th: role.aiScope,
      boundary_th: role.boundary,
    })),
    shared_specialists: SPECIALISTS.map((s) => ({
      grok_id: s.id,
      call_sign: s.callSign,
      purpose_th: s.th,
    })),
    funnel: FUNNEL.map((stage) => ({ id: stage.id, label: stage.label, label_th: stage.th })),
    principles: PRINCIPLES.map((p) => ({ en: p.en, th: p.th })),
  };
}

export function buildScreenIndex() {
  return {
    $generated_from: 'hr-screens/data.js',
    $do_not_edit_by_hand: true,
    version: '1.0.0',
    route_base: '/ami',
    note_th:
      'ตัดสินแล้วตาม decisions.json#D-AMI-03 · noindex,nofollow ทั้ง robots และ googlebot ' +
      'และไม่อยู่ใน sitemap · ไม่วางไว้ใต้ /admin/ เพราะทั้ง 6 ตำแหน่งนี้ไม่ใช่ admin',
    screens: ROLES.map((role) => ({
      screen: role.screen,
      role_id: role.roleId,
      route: `/ami/${slug(role)}`,
      prototype_anchor: `#role=${role.roleId}`,
      panel_kind: role.panels.kind,
      required_blocks: [
        'welcome',
        'mission_passport',
        'mission_today',
        'next_actions',
        'primary_action',
        'role_panel',
        'copilot',
        'specialist_request',
        'authority',
      ],
    })),
  };
}

/*
 * ทะเบียนสำนักงาน 100 เอเจนต์ — generate จาก office-data.js
 *
 * เป็นการตั้งค่าเท่านั้น ไม่มีช่องของ runtime (โมเดล ปลายทาง คีย์ ตารางเวลา
 * จำนวน instance หรืองบประมาณ) · ทุกตัวอยู่ที่ DEFINED_NOT_CONNECTED
 * ดู docs/adr/ADR-0014-ami-agent-office-roster.md
 */
export const CONNECTION_STATE_NOW = 'DEFINED_NOT_CONNECTED';
const HUMAN_ROLE = /^HR-\d{2}$/;

export function buildAgentRoster() {
  const byCallSign = new Map(AGENTS.map((agent) => [agent.callSign, agent]));
  const teamOf = new Map(TEAMS.map((team) => [team.id, team]));
  const roleTitle = new Map(ROLES.map((role) => [role.roleId, role.title]));

  // call sign → agent_id · คนอ้างด้วย role_id ตรง ๆ · อ้างไม่เจอเป็น null ให้ checker ฟ้อง
  const resolve = (to) => (HUMAN_ROLE.test(to) ? to : byCallSign.get(to)?.id ?? null);
  const next = new Map(AGENTS.map((agent) => [agent.id, resolve(agent.to)]));

  // เส้นทางจนถึงคน · หยุดเมื่อวนหรืออ้างไม่เจอ เพื่อให้ checker รายงานได้แทนที่จะค้าง
  const routeOf = (id) => {
    const route = [];
    const seen = new Set([id]);
    let at = next.get(id);
    while (at && !HUMAN_ROLE.test(at) && !seen.has(at) && route.length < AGENTS.length) {
      route.push(at);
      seen.add(at);
      at = next.get(at);
    }
    if (at) route.push(at);
    return route;
  };

  return {
    $generated_from: 'hr-screens/office-data.js',
    $do_not_edit_by_hand: true,
    version: '1.0.0',
    nature: 'CONFIGURATION_ONLY',
    // ฉบับ en ของชื่อและหน้าที่เอเจนต์ยังไม่ผ่านการรีวิว · D-AMI-04 ครอบเฉพาะข้อความของหน้าจอ 6 ตำแหน่ง
    en_status: 'DRAFT_NEEDS_REVIEW',
    runtime: {
      provisioned_agents: 0,
      connection_state_for_all: CONNECTION_STATE_NOW,
      added_running_cost: 'NONE',
      rule_th:
        'ทะเบียนนี้เป็นการตั้งค่า ไม่ใช่การเปิดใช้งาน · 100 เอเจนต์ไม่ได้แปลว่า 100 process ' +
        'หรือ 100 การเชื่อมต่อ · การเปิดใช้จริงทำทีละตัวผ่าน ACTIVATION-REQUEST ' +
        'พร้อมผลทดสอบ ค่าใช้จ่ายที่ประเมินแล้ว และการอนุมัติของเจ้าของ',
      rule_en:
        'This roster is configuration, not activation. 100 agents do not mean 100 processes ' +
        'or 100 connections. Each agent is activated one at a time through ACTIVATION-REQUEST, ' +
        'with test results, an estimated cost and owner approval.',
    },
    teams: TEAMS.map((team) => {
      const lead = AGENTS.find((agent) => agent.id === team.lead);
      return {
        team_id: team.id,
        lead_id: team.lead,
        lead_call_sign: lead ? lead.callSign : null,
        owner_role_id: team.owner,
        owner_title: roleTitle.get(team.owner) ?? null,
        pool: team.pool,
        name_th: team.nameTh,
        name_en: team.nameEn,
        mission_th: team.missionTh,
        mission_en: team.missionEn,
        size: AGENTS.filter((agent) => agent.team === team.id).length,
      };
    }),
    agents: AGENTS.map((agent) => {
      const team = teamOf.get(agent.team);
      const isLead = Boolean(team && team.lead === agent.id);
      return {
        agent_id: agent.id,
        call_sign: agent.callSign,
        kind: isLead ? 'lead' : 'member',
        team_id: agent.team,
        owner_role_id: team ? team.owner : null,
        title_th: agent.titleTh,
        title_en: agent.titleEn,
        duty_th: agent.dutyTh,
        duty_en: agent.dutyEn,
        handoff_to: next.get(agent.id),
        escalate_to: isLead ? (team ? team.owner : null) : (team ? team.lead : null),
        route_to_human: routeOf(agent.id),
        blocked_by: agent.blockedBy ?? null,
        connection_state: CONNECTION_STATE_NOW,
      };
    }),
    blockers: Object.fromEntries(
      Object.entries(BLOCKERS).map(([id, b]) => [id, { th: b.th, en: b.en }]),
    ),
  };
}

const writeJson = (name, value) =>
  writeFileSync(join(OUT, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');

/*
 * ทะเบียนบทบาทฝั่ง TypeScript — generate จาก data.js เหมือนกับไฟล์ JSON
 * เพื่อไม่ให้มีสำเนาที่หลุดเวอร์ชันกัน · AMI-001
 */
const TS_OUT = join(here, '..', '..', 'packages', 'contracts', 'src', 'ami');

const quote = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

export function buildRolesTs() {
  const registry = buildRoleRegistry();
  const role = (r) => `  {
    screen: ${quote(r.screen)},
    roleId: ${quote(r.role_id)},
    slug: ${quote(r.slug)},
    title: ${quote(r.title)},
    grokId: ${quote(r.grok_id)},
    callSign: ${quote(r.call_sign)},
    space: ${quote(r.space)},
    accent: ${quote(r.accent)},
    panelKind: ${quote(r.panel_kind)},
  },`;
  const specialist = (s) => `  {
    grokId: ${quote(s.grok_id)},
    callSign: ${quote(s.call_sign)},
  },`;

  return `/*
 * AMI — HUMAN + AI COMMAND · ทะเบียนบทบาท
 *
 * GENERATED จาก hr-screens/data.js โดย hr-screens/codex/build-contract.mjs
 * ห้ามแก้ไฟล์นี้ด้วยมือ · แก้ที่ data.js แล้วรัน build-contract.mjs
 * hr-screens/codex/check-contract.mjs จะ fail ถ้าไฟล์นี้หลุดจากต้นทาง
 */

export const AMI_ROLES = [
${registry.roles.map(role).join('\n')}
] as const;

export const AMI_SHARED_SPECIALISTS = [
${registry.shared_specialists.map(specialist).join('\n')}
] as const;

export type AmiRole = (typeof AMI_ROLES)[number];

/** role_id ที่มีอยู่จริงเท่านั้น · บทบาทที่ไม่อยู่ในทะเบียนเป็น type error */
export type AmiRoleId = AmiRole['roleId'];
export type AmiCallSign = AmiRole['callSign'];
export type AmiPanelKind = AmiRole['panelKind'];
export type AmiAccent = AmiRole['accent'];
export type AmiSpecialistCallSign = (typeof AMI_SHARED_SPECIALISTS)[number]['callSign'];

/** Grok ทุกตัวในระบบ ทั้งที่ประจำตำแหน่งและที่อยู่ใน shared pool */
export type AmiGrokId =
  | AmiRole['grokId']
  | (typeof AMI_SHARED_SPECIALISTS)[number]['grokId'];

const BY_ROLE_ID = new Map<AmiRoleId, AmiRole>(
  AMI_ROLES.map((role) => [role.roleId, role]),
);

/** คืนบทบาทจาก role_id · undefined เมื่อไม่รู้จัก ผู้เรียกต้องจัดการเอง */
export function findAmiRole(roleId: string): AmiRole | undefined {
  return BY_ROLE_ID.get(roleId as AmiRoleId);
}

export function isAmiRoleId(value: string): value is AmiRoleId {
  return BY_ROLE_ID.has(value as AmiRoleId);
}
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeJson('role-registry.json', buildRoleRegistry());
  writeJson('screens.json', buildScreenIndex());
  writeJson('agent-roster.json', buildAgentRoster());
  mkdirSync(TS_OUT, { recursive: true });
  writeFileSync(join(TS_OUT, 'roles.ts'), buildRolesTs(), 'utf8');
  process.stdout.write(
    'เขียน contract/role-registry.json, contract/screens.json, contract/agent-roster.json ' +
      'และ packages/contracts/src/ami/roles.ts แล้ว\n',
  );
}

export { TS_OUT };
