/*
 * AMI — HUMAN + AI COMMAND · รูปร่างของ payload ต่อแผง
 *
 * สอดคล้องกับ hr-screens/codex/contract/panel-payloads.schema.json
 * ข้อกำหนดที่ไม่ได้อยู่ในระบบ type (เช่น lanes ต้องมีครบห้าขั้น) บังคับด้วย
 * JSON Schema และ contract test ฝั่ง server
 */

import type {
  AmiAccessVerdict,
  AmiEvidenceKind,
  AmiFunnelStage,
  AmiIntegrationReadiness,
  AmiMissionHealth,
  AmiPanelState,
} from './enums';
import type { AmiPanelKind, AmiRoleId } from './roles';

/* ---------- แผง 01 Director ---------- */

export interface AmiMissionMapRow {
  id: string;
  name: string;
  stage: AmiFunnelStage;
  ownerRoleId: AmiRoleId;
  health: AmiMissionHealth;
  note: string | null;
}

export interface AmiDecisionRow {
  title: string;
  fromRoleId: AmiRoleId;
  ageLabel: string;
  waitingOn?: string;
}

export interface AmiEscalationRow {
  title: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  route: string;
}

export interface AmiDirectorPayload {
  panelKind: 'director';
  missionMap: readonly AmiMissionMapRow[];
  decisions: readonly AmiDecisionRow[];
  escalations: readonly AmiEscalationRow[];
}

/* ---------- แผง 02 Human Resources ---------- */

export interface AmiJourneyStep {
  step: string;
  state: 'done' | 'active' | 'todo';
  note: string | null;
}

/** personRef เป็นตัวอ้างอิง ไม่ใช่ชื่อจริง เว้นแต่ผู้เรียกมีสิทธิ์เห็นชื่อ */
export interface AmiPersonRow {
  personRef: string;
  roleId: AmiRoleId;
  stage: string;
  status: string;
}

export interface AmiRegistryRow {
  roleId: AmiRoleId;
  role: string;
  clarity: 'CONFIRMED' | 'PENDING_REVIEW';
}

export interface AmiHrPayload {
  panelKind: 'hr';
  journey: readonly AmiJourneyStep[];
  people: readonly AmiPersonRow[];
  registry: readonly AmiRegistryRow[];
}

/* ---------- แผง 03 Operations ---------- */

export interface AmiWorkItem {
  id: string;
  title: string;
  ownerRoleId: AmiRoleId;
  ageLabel: string;
  flag: 'bottleneck' | 'handoff' | null;
}

/** ต้องส่งครบทั้งห้าขั้นเสมอ ขั้นที่ว่างส่ง items เป็นอาร์เรย์ว่าง ไม่ใช่ตัดออก */
export interface AmiLane {
  stage: AmiFunnelStage;
  items: readonly AmiWorkItem[];
}

export interface AmiHandoffRow {
  itemId: string;
  fromRoleId: AmiRoleId;
  toRoleId: AmiRoleId;
  waitingLabel: string;
  state: string;
}

export interface AmiOpsPayload {
  panelKind: 'ops';
  lanes: readonly AmiLane[];
  handoffs: readonly AmiHandoffRow[];
}

/* ---------- แผง 04 Intelligence / Research ---------- */

/** source และ date เป็น null เมื่อยังไม่มีข้อมูล ห้ามเติมค่าแทน */
export interface AmiEvidenceRow {
  ref: string;
  title: string;
  source: string | null;
  date: string | null;
  hasEvidence: boolean;
}

/**
 * ข้อความที่ไม่มี sourceRef ห้ามเป็น FACT
 *
 * ระบบ type บังคับได้เท่านี้: FACT ต้องมี sourceRef เป็น string ส่วนอีกสองชนิด
 * ยอมให้เป็น null ได้
 */
export type AmiStatement =
  | { kind: 'FACT'; text: string; sourceRef: string }
  | { kind: Exclude<AmiEvidenceKind, 'FACT'>; text: string; sourceRef: string | null };

export interface AmiIntelPayload {
  panelKind: 'intel';
  evidence: readonly AmiEvidenceRow[];
  statements: readonly AmiStatement[];
}

/* ---------- แผง 05 Matchmaker ---------- */

export interface AmiMatchBrief {
  ref: string;
  need: string;
  qualified: boolean;
  constraints: readonly string[];
}

/**
 * คะแนนมาจากการจับคู่แบบ deterministic
 *
 * scoreIsReadOnly เป็น true เสมอโดยระบบ type · ไม่มี endpoint ใดใน AMI ที่รับ
 * หรือเขียนคะแนน และ AI เปลี่ยนตัวเลขนี้ไม่ได้ อธิบายได้อย่างเดียว
 */
export interface AmiCandidate {
  ref: string;
  score: number;
  scoreIsReadOnly: true;
  reasons: readonly string[];
  conflict: string | null;
}

export interface AmiMatchPayload {
  panelKind: 'match';
  brief: AmiMatchBrief;
  candidates: readonly AmiCandidate[];
  receiver: { roleId: AmiRoleId; note: string };
}

/* ---------- แผง 06 AI Coordinator ---------- */

/** ห้ามมีช่องใดในแผงนี้ที่บรรจุ key, token หรือ secret แม้จะไม่ถูกแสดงผล */
export interface AmiAgentRow {
  grokId: string;
  callSign: string;
  owner: AmiRoleId | 'shared';
  designed: boolean;
  connected: boolean;
}

export interface AmiReadinessRow {
  item: string;
  state: AmiIntegrationReadiness;
}

export interface AmiAiPayload {
  panelKind: 'ai';
  agents: readonly AmiAgentRow[];
  readiness: readonly AmiReadinessRow[];
}

/* ---------- รวม ---------- */

export type AmiPanelPayload =
  | AmiDirectorPayload
  | AmiHrPayload
  | AmiOpsPayload
  | AmiIntelPayload
  | AmiMatchPayload
  | AmiAiPayload;

/** payload มาเมื่อ state=READY และ access=GRANTED เท่านั้น */
export interface AmiPanelResponse {
  state: AmiPanelState;
  access: AmiAccessVerdict;
  payload?: AmiPanelPayload;
}

/** ยืนยันตอนคอมไพล์ว่าทุก panelKind ในทะเบียนบทบาทมี payload รองรับ */
type PayloadKinds = AmiPanelPayload['panelKind'];
type MissingPayloadFor = Exclude<AmiPanelKind, PayloadKinds>;
type UnusedPayloadKind = Exclude<PayloadKinds, AmiPanelKind>;
const _everyPanelKindIsCovered: [MissingPayloadFor, UnusedPayloadKind] = [
  undefined as never,
  undefined as never,
];
void _everyPanelKindIsCovered;
