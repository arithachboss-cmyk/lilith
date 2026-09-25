/*
 * ค่าที่ระบบ type ต้องปฏิเสธ · ใช้โดย check-contract.mjs
 *
 * ไฟล์นี้ต้อง "คอมไพล์ไม่ผ่าน" จึงจะถือว่าผ่าน ถ้าวันหนึ่งมันคอมไพล์ผ่าน
 * แปลว่าสัญญาฝั่ง type หลวมลงแล้ว และด่านตรวจจะรายงานว่าไม่ผ่าน
 */

import type { AmiPanelKind, AmiRoleId } from './roles';
import type { AmiCandidate, AmiStatement } from './panels';

// บทบาทที่ไม่มีในทะเบียน
const badRole: AmiRoleId = 'HR-99';
// panel kind ที่ไม่มีอยู่
const badKind: AmiPanelKind = 'accounting';
// FACT ที่ไม่มีแหล่งอ้างอิง
const badFact: AmiStatement = { kind: 'FACT', text: 'x', sourceRef: null };
// อ้างว่าคะแนนการจับคู่แก้ได้
const badScore: AmiCandidate = {
  ref: 'a',
  score: 1,
  scoreIsReadOnly: false,
  reasons: [],
  conflict: null,
};

void badRole;
void badKind;
void badFact;
void badScore;
