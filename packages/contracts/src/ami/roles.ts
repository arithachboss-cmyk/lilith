/*
 * AMI — HUMAN + AI COMMAND · ทะเบียนบทบาท
 *
 * GENERATED จาก hr-screens/data.js โดย hr-screens/codex/build-contract.mjs
 * ห้ามแก้ไฟล์นี้ด้วยมือ · แก้ที่ data.js แล้วรัน build-contract.mjs
 * hr-screens/codex/check-contract.mjs จะ fail ถ้าไฟล์นี้หลุดจากต้นทาง
 */

export const AMI_ROLES = [
  {
    screen: '01',
    roleId: 'HR-01',
    slug: 'hr-01',
    title: 'Director',
    grokId: 'GROK-10',
    callSign: 'ORCHESTRATOR',
    space: 'THE COMMAND BRIDGE',
    accent: 'gold',
    panelKind: 'director',
  },
  {
    screen: '02',
    roleId: 'HR-02',
    slug: 'hr-02',
    title: 'Human Resources',
    grokId: 'GROK-01',
    callSign: 'PEOPLE',
    space: 'THE PEOPLE CONSTELLATION',
    accent: 'violet',
    panelKind: 'hr',
  },
  {
    screen: '03',
    roleId: 'HR-03',
    slug: 'hr-03',
    title: 'Operations',
    grokId: 'GROK-08',
    callSign: 'WATCHTOWER',
    space: 'THE MISSION WATCH',
    accent: 'cyan',
    panelKind: 'ops',
  },
  {
    screen: '04',
    roleId: 'HR-04',
    slug: 'hr-04',
    title: 'Intelligence / Research',
    grokId: 'GROK-02',
    callSign: 'ANALYST',
    space: 'THE INTELLIGENCE OBSERVATORY',
    accent: 'indigo',
    panelKind: 'intel',
  },
  {
    screen: '05',
    roleId: 'HR-05',
    slug: 'hr-05',
    title: 'Matchmaker',
    grokId: 'GROK-04',
    callSign: 'CONNECTOR',
    space: 'THE CONNECTION NEXUS',
    accent: 'coral',
    panelKind: 'match',
  },
  {
    screen: '06',
    roleId: 'HR-06',
    slug: 'hr-06',
    title: 'AI Coordinator',
    grokId: 'GROK-07',
    callSign: 'ECOSYSTEM',
    space: 'THE ECOSYSTEM DOCK',
    accent: 'mint',
    panelKind: 'ai',
  },
] as const;

export const AMI_SHARED_SPECIALISTS = [
  {
    grokId: 'GROK-03',
    callSign: 'VERIFIER',
  },
  {
    grokId: 'GROK-05',
    callSign: 'NEGOTIATION',
  },
  {
    grokId: 'GROK-06',
    callSign: 'RISK',
  },
  {
    grokId: 'GROK-09',
    callSign: 'GOVERNANCE',
  },
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
