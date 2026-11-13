import { applyApprovals, AuditLog, type Approval, type EvidenceRecord } from '../rules/evidence';
import approvals from './evidence-approvals.json';

/**
 * Evidence for spec figures.
 *
 * A record starts here as a DRAFT and shows nothing. It becomes active only
 * when a line naming it is added to evidence-approvals.json and the gate in
 * rules/evidence.ts accepts that approval: the source quotes every figure, the
 * source is named, and the approver is not the author. A record is never typed
 * in as `active`.
 *
 * The author of every draft below is the drafting assistant, so no draft can
 * be approved by it. A named person at ACS has to.
 */
const AUTHOR = 'Claude (drafting assistant)';
const HONEYWELL_1950G = 'https://automation.honeywell.com/us/en/products/productivity-solutions/barcode-scanners/general-purpose-handheld/xenon-xp-1950g-general-duty-scanner';
const PAGE_1950G = 'Honeywell product page "Xenon XP 1950g General Duty Scanner", Specifications section, as served on 2026-11-13. The page carries no revision number; the data sheet it links is dated 2/1/2023.';
const SCOPE_1950G = 'The manufacturer\'s published figure for the Xenon XP 1950g. The approver confirms the 1950g that ACS sells is this model, not a regional variant with a different rating.';

export const evidenceDrafts: readonly EvidenceRecord[] = [
  {
    id: 'EV-1950G-01',
    claimId: 'CR-07',
    subject: { productId: '1950g', feature: 'มาตรฐานการป้องกัน IP52' },
    quote: 'IP Rating : IP52',
    conditions: SCOPE_1950G,
    sourceUrl: HONEYWELL_1950G,
    sourceRevision: PAGE_1950G,
    retrievedOn: '2026-11-13',
    status: 'draft',
    author: AUTHOR,
  },
  {
    id: 'EV-1950G-02',
    claimId: 'CR-07',
    subject: { productId: '1950g', feature: 'ช่วงอุณหภูมิใช้งาน 0–50 °C' },
    quote: 'Operating Temperature : 0 - 50 °C|32 - 122 °F',
    conditions: SCOPE_1950G,
    sourceUrl: HONEYWELL_1950G,
    sourceRevision: PAGE_1950G,
    retrievedOn: '2026-11-13',
    status: 'draft',
    author: AUTHOR,
  },
];

/**
 * Figures still without even a draft, and why. Nothing here is a judgement on
 * the figure; it only records that no source has been read for it yet.
 */
export const evidenceGaps: ReadonlyArray<{ productId: string; feature: string; why: string }> = [
  { productId: '1960g', feature: 'มาตรฐานการป้องกัน IP52', why: 'manufacturer page fetched on 2026-11-13 but its specification section was not read' },
  { productId: 'm510', feature: 'พิมพ์แบบ Thermal Transfer ความละเอียด 300 dpi', why: 'manufacturer page timed out on 2026-11-13' },
  { productId: 'm510', feature: 'รองรับฉลากกว้างสูงสุด 1.5 นิ้ว (38.1 มม.)', why: 'manufacturer page timed out on 2026-11-13' },
  { productId: 'zd421', feature: 'ความละเอียด 203 หรือ 300 dpi ตามรุ่นย่อย', why: 'manufacturer page fetched on 2026-11-13 but its specification section was not read' },
  { productId: 'ds2208', feature: 'เซนเซอร์ภาพ 640 × 480 พิกเซล', why: 'manufacturer page fetched on 2026-11-13 but its specification section was not read' },
];

export const evidenceApprovals: readonly Approval[] = approvals as Approval[];
/** Every approval decision of this build, accepted or refused. */
export const evidenceLog = new AuditLog();
const applied = applyApprovals(evidenceDrafts, evidenceApprovals, evidenceLog);
/** An approval that names no draft is a mistake worth stopping for. */
export const evidenceProblems: readonly string[] = applied.problems;
export const evidenceRecords: readonly EvidenceRecord[] = applied.records;
