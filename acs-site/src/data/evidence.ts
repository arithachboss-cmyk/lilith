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
const BRADY_M510 = 'https://www.bradyid.com/label-printers/portable/m510-portable-industrial-label-printer-pid-176546';
const PAGE_M510 = 'Brady product page "M510 Portable Industrial Label Printer - Brady Part: M510", sections "Key features" and "Printing specifications", as served on 2026-11-13. The page carries no revision number.';
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
  {
    id: 'EV-1960G-01',
    claimId: 'CR-07',
    subject: { productId: '1960g', feature: 'มาตรฐานการป้องกัน IP52' },
    quote: 'IP Rating : IP52',
    conditions: 'The manufacturer\'s published figure for the Xenon Ultra 1960g. The approver confirms the 1960g that ACS sells is this model.',
    sourceUrl: 'https://automation.honeywell.com/us/en/products/productivity-solutions/barcode-scanners/general-purpose-handheld/xenon-ultra-1960-scanner',
    sourceRevision: 'Honeywell product page "Xenon Ultra 1960 Scanner", Specifications section, as served on 2026-11-13. The page carries no revision number; the "Xenon Ultra 1960g Data Sheet" it links is dated 5/4/2026.',
    retrievedOn: '2026-11-13',
    status: 'draft',
    author: AUTHOR,
  },
  {
    id: 'EV-ZD421-01',
    claimId: 'CR-07',
    subject: { productId: 'zd421', feature: 'ความละเอียด 203 หรือ 300 dpi ตามรุ่นย่อย' },
    quote: 'Print Resolution 203 dpi (8 dot/mm)|300 dpi (12 dot/mm)',
    conditions: 'Both resolutions are listed as available configurations of the ZD421; a given unit has one of them. The approver confirms which ACS supplies.',
    sourceUrl: 'https://www.zebra.com/us/en/products/printers/desktop/zd400-series/zd421.html',
    sourceRevision: 'Zebra product page "ZD421 Desktop Printer: 4-Inch Wide", sections "Available configurations" and "Compare with similar items", as served on 2026-11-13. The page carries no revision number.',
    retrievedOn: '2026-11-13',
    status: 'draft',
    author: AUTHOR,
  },
  {
    id: 'EV-DS2208-01',
    claimId: 'CR-07',
    subject: { productId: 'ds2208', feature: 'เซนเซอร์ภาพ 640 × 480 พิกเซล' },
    quote: 'IMAGE SENSOR: 640X480 PIXELS',
    conditions: 'The manufacturer\'s published figure for the DS2208. The approver confirms the DS2208 that ACS sells is this model.',
    sourceUrl: 'https://www.zebra.com/us/en/products/scanners/general-purpose-handheld-scanners/ds2200-series/ds2208.html',
    sourceRevision: 'Zebra product page "DS2208 Handheld Scanner", section "Key features", as served on 2026-11-13. The page carries no revision number.',
    retrievedOn: '2026-11-13',
    status: 'draft',
    author: AUTHOR,
  },
  {
    id: 'EV-M510-01',
    claimId: 'CR-07',
    subject: { productId: 'm510', feature: 'พิมพ์แบบ Thermal Transfer ความละเอียด 300 dpi' },
    quote: 'Print Resolution: 300 dpi',
    conditions: 'The same Key Features list states "Print Technology: Thermal Transfer". The approver confirms the M510 that ACS sells is this model (Brady part M510, product number 176546).',
    sourceUrl: BRADY_M510,
    sourceRevision: PAGE_M510,
    retrievedOn: '2026-11-13',
    status: 'draft',
    author: AUTHOR,
  },
  {
    // The catalogue snapshot adds "(38.1 มม.)", which the page does not state. On
    // 2026-11-13 the Owner decided (D-12) to show only the inch figure; the line
    // below is the overridden one from catalog.overrides.json.
    id: 'EV-M510-02',
    claimId: 'CR-07',
    subject: { productId: 'm510', feature: 'รองรับฉลากกว้างสูงสุด 1.5 นิ้ว' },
    quote: 'Maximum Label/Tape Width: 1.5 in',
    conditions: 'The page states 1.5 in and no millimetre value. It also lists "Maximum Print Width 1.44 in", which is the printed area, not the label.',
    sourceUrl: BRADY_M510,
    sourceRevision: PAGE_M510,
    retrievedOn: '2026-11-13',
    status: 'draft',
    author: AUTHOR,
  },
];

/**
 * Figures still without even a draft, and why. Nothing here is a judgement on
 * the figure; it only records that no source has been read for it yet.
 */
export const evidenceGaps: ReadonlyArray<{ productId: string; feature: string; why: string }> = [];

export const evidenceApprovals: readonly Approval[] = approvals as Approval[];
/** Every approval decision of this build, accepted or refused. */
export const evidenceLog = new AuditLog();
const applied = applyApprovals(evidenceDrafts, evidenceApprovals, evidenceLog);
/** An approval that names no draft is a mistake worth stopping for. */
export const evidenceProblems: readonly string[] = applied.problems;
export const evidenceRecords: readonly EvidenceRecord[] = applied.records;
