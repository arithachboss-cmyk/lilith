/*
 * สร้างชุดข้อมูลสัญญา (contract) จาก data.js ซึ่งเป็นแหล่งเดียวของค่าเหล่านี้
 *
 *   node hr-screens/codex/build-contract.mjs
 *
 * ไฟล์ที่ generate ห้ามแก้ด้วยมือ ถ้าจะเปลี่ยนค่าให้แก้ที่ data.js แล้ว build ใหม่
 * check-contract.mjs จะ fail ถ้าไฟล์ที่ commit ไว้ไม่ตรงกับ data.js
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROLES, SPECIALISTS, FUNNEL, PRINCIPLES } from '../data.js';

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

const writeJson = (name, value) =>
  writeFileSync(join(OUT, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');

if (import.meta.url === `file://${process.argv[1]}`) {
  writeJson('role-registry.json', buildRoleRegistry());
  writeJson('screens.json', buildScreenIndex());
  process.stdout.write('เขียน contract/role-registry.json และ contract/screens.json แล้ว\n');
}
