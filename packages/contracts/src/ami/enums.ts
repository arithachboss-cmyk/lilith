/*
 * AMI — HUMAN + AI COMMAND · ค่าคงที่
 *
 * สอดคล้องกับ hr-screens/codex/contract/enums.json
 * hr-screens/codex/check-contract.mjs ตรวจว่าทั้งสองฝั่งมีค่าครบเท่ากัน
 */

/** สถานะของแผงข้อมูลหนึ่งแผง · server เป็นผู้บอก ไม่ใช่ client เดาจากข้อมูลว่าง */
export const AMI_PANEL_STATES = ['READY', 'LOADING', 'EMPTY', 'ERROR', 'ACCESS_PENDING_CHECK'] as const;
export type AmiPanelState = (typeof AMI_PANEL_STATES)[number];

/**
 * ผลการตรวจสิทธิ์ต่อแผงหนึ่ง ๆ
 *
 * ต้องผ่านทั้ง AMI permission และ Keeper disclosure · เมื่อยังไม่ทราบให้ตอบ
 * PENDING_CHECK ไม่ใช่เดาว่าเข้าถึงได้ และไม่ว่ากรณีใดห้ามบอกจำนวนหรือลักษณะ
 * ของข้อมูลที่ถูกกั้น
 */
export const AMI_ACCESS_VERDICTS = [
  'GRANTED',
  'PENDING_CHECK',
  'DENIED_BY_AMI',
  'WITHHELD_BY_KEEPER',
] as const;
export type AmiAccessVerdict = (typeof AMI_ACCESS_VERDICTS)[number];

/** สถานะการเชื่อมต่อ Grok · ทุกบทบาทอยู่ที่ DEFINED_NOT_CONNECTED ในเฟสนี้ */
export const AMI_AI_CONNECTION_STATES = [
  'DEFINED_NOT_CONNECTED',
  'CONNECTED',
  'DEGRADED',
  'UNAVAILABLE',
] as const;
export type AmiAiConnectionState = (typeof AMI_AI_CONNECTION_STATES)[number];

export const AMI_AI_CONNECTION_STATE_NOW: AmiAiConnectionState = 'DEFINED_NOT_CONNECTED';

/** สถานะคำขอผู้เชี่ยวชาญ · เฟสนี้ระบบยอมรับเฉพาะ DRAFT */
export const AMI_SPECIALIST_REQUEST_STATES = [
  'DRAFT',
  'AWAITING_AMI_PERMISSION',
  'AWAITING_KEEPER_DISCLOSURE',
  'READY_TO_SEND',
] as const;
export type AmiSpecialistRequestState = (typeof AMI_SPECIALIST_REQUEST_STATES)[number];

export const AMI_SPECIALIST_REQUEST_STATES_ALLOWED_NOW = ['DRAFT'] as const;
export type AmiSpecialistRequestStateAllowedNow =
  (typeof AMI_SPECIALIST_REQUEST_STATES_ALLOWED_NOW)[number];

export const AMI_MISSION_HEALTH = ['ON_TRACK', 'ATTENTION', 'BLOCKED'] as const;
export type AmiMissionHealth = (typeof AMI_MISSION_HEALTH)[number];

/**
 * การแยกสิ่งที่พิสูจน์ได้ออกจากสิ่งที่ยังพิสูจน์ไม่ได้ · หน้าจอ 04
 *
 * ข้อความที่ไม่มี sourceRef ห้ามส่งเป็น FACT และระบบห้ามเติมแหล่งอ้างอิง
 * หรือระดับความมั่นใจให้เอง
 */
export const AMI_EVIDENCE_KINDS = ['FACT', 'HYPOTHESIS', 'NEEDS_CHECK'] as const;
export type AmiEvidenceKind = (typeof AMI_EVIDENCE_KINDS)[number];

/** สองค่านี้ต้องแยกกันเสมอ ห้ามรวมเป็นสถานะเดียวที่อ่านได้ว่าพร้อมใช้งาน */
export const AMI_INTEGRATION_READINESS = ['DESIGNED', 'NOT_CONNECTED'] as const;
export type AmiIntegrationReadiness = (typeof AMI_INTEGRATION_READINESS)[number];

/** ผลของการกดปุ่ม · เฟสนี้ทุกปุ่มจบที่ DRAFT_PREPARED เท่านั้น */
export const AMI_ACTION_VERDICTS = ['DRAFT_PREPARED'] as const;
export type AmiActionVerdict = (typeof AMI_ACTION_VERDICTS)[number];

/** ลำดับงานธุรกิจของ Middle Property · ใช้ร่วมกันทุกหน้าจอ */
export const AMI_FUNNEL_STAGES = [
  'demand',
  'qualification',
  'matching',
  'viewing',
  'closed',
] as const;
export type AmiFunnelStage = (typeof AMI_FUNNEL_STAGES)[number];
