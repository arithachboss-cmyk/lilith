import { extractFigures, quoteCovers } from './figures';

/**
 * Evidence records and their activation gate.
 *
 * A spec figure appears on a product page only while an ACTIVE record covers
 * it. A record goes draft → active only when:
 *   1. every figure in the feature line is stated by the source's own words
 *      (same number, same unit; see `quoteCovers`),
 *   2. a source and its revision are named, and
 *   3. the approver is not the author.
 * Nothing is edited in place: every decision is appended to an audit log.
 */
export type EvidenceStatus = 'draft' | 'active';

export interface EvidenceRecord {
  id: string;
  /** Claim-register row, e.g. CR-07. */
  claimId: string;
  subject: { productId: string; feature: string };
  /** The figure as the source states it, verbatim. */
  quote: string;
  /** Measured conditions, where the register requires them. */
  conditions?: string;
  sourceUrl: string;
  sourceRevision: string;
  retrievedOn: string;
  /** Set for prices; a price claim expires. */
  expiresOn?: string;
  status: EvidenceStatus;
  author: string;
  approvedBy?: string;
}

export interface CheckResult {
  name: string;
  pass: boolean;
  detail: string;
}

export interface AuditEntry {
  at: string;
  recordId: string;
  action: 'activation_refused' | 'activated';
  actor: string;
  checks: readonly CheckResult[];
}

/** Append-only. There is deliberately no method to edit or remove an entry. */
export class AuditLog {
  readonly #entries: AuditEntry[] = [];

  append(entry: AuditEntry): void {
    this.#entries.push(Object.freeze({ ...entry, checks: Object.freeze([...entry.checks]) }));
  }

  entries(): readonly AuditEntry[] {
    return [...this.#entries];
  }
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The record's test cases: one per figure the page would show. */
export function runChecks(record: EvidenceRecord, approver: string): CheckResult[] {
  const checks: CheckResult[] = [];
  const figures = extractFigures(record.subject.feature);

  checks.push({
    name: 'feature-has-figure',
    pass: figures.length > 0,
    detail: figures.length ? `${figures.length} figure(s) to cover` : 'the feature line holds no figure to evidence',
  });
  for (const figure of figures) {
    const covered = quoteCovers(figure, record.quote);
    checks.push({
      name: `quote-covers:${figure}`,
      pass: covered,
      detail: covered ? 'stated by the source quote' : 'not found in the source quote',
    });
  }
  checks.push({
    name: 'source-named',
    pass: /^https?:\/\/\S+$/.test(record.sourceUrl.trim()) && record.sourceRevision.trim().length > 0,
    detail: 'needs a source URL and the revision of the document',
  });
  checks.push({
    name: 'retrieved-date',
    pass: /^\d{4}-\d{2}-\d{2}$/.test(record.retrievedOn),
    detail: 'needs the date the source was retrieved (YYYY-MM-DD)',
  });
  checks.push({
    name: 'approver-is-not-author',
    pass: approver.trim().length > 0 && record.author.trim().length > 0 && !same(approver, record.author),
    detail: 'the approver must be a named person other than the author',
  });
  checks.push({
    name: 'is-draft',
    pass: record.status === 'draft',
    detail: 'only a draft can be activated',
  });
  return checks;
}

export type ActivationResult =
  | { ok: true; record: EvidenceRecord }
  | { ok: false; failed: CheckResult[] };

/** Returns a NEW active record on success; the input is never mutated. */
export function activate(
  record: EvidenceRecord,
  approver: string,
  log: AuditLog,
  now: () => string = () => new Date().toISOString(),
): ActivationResult {
  const checks = runChecks(record, approver);
  const failed = checks.filter((c) => !c.pass);
  if (failed.length) {
    log.append({ at: now(), recordId: record.id, action: 'activation_refused', actor: approver, checks });
    return { ok: false, failed };
  }
  log.append({ at: now(), recordId: record.id, action: 'activated', actor: approver, checks });
  return { ok: true, record: { ...record, status: 'active', approvedBy: approver.trim() } };
}

/** One line of evidence-approvals.json: a named person approving one draft. */
export interface Approval {
  recordId: string;
  approvedBy: string;
  /** ISO date or timestamp of the approval. */
  approvedOn: string;
}

/**
 * Runs every recorded approval through the same gate as `activate`. A draft
 * with an accepted approval comes back active; one whose approval is refused
 * stays a draft, and the refusal is in the log. This is the only way a record
 * becomes active in a build.
 */
export function applyApprovals(
  drafts: readonly EvidenceRecord[],
  approvals: readonly Approval[],
  log: AuditLog,
): { records: EvidenceRecord[]; problems: string[] } {
  const problems: string[] = [];
  const ids = drafts.map((d) => d.id);
  for (const id of ids.filter((x, i) => ids.indexOf(x) !== i)) problems.push(`draft id used twice: ${id}`);
  for (const d of drafts) if (d.status !== 'draft') problems.push(`${d.id}: a record must be written as a draft`);
  for (const a of approvals) {
    if (!ids.includes(a.recordId)) problems.push(`approval names no draft: ${a.recordId}`);
    if (approvals.filter((x) => x.recordId === a.recordId).length > 1) problems.push(`more than one approval for ${a.recordId}`);
  }
  const records = drafts.map((draft) => {
    const approval = approvals.find((a) => a.recordId === draft.id);
    if (!approval || draft.status !== 'draft') return { ...draft, status: 'draft' as const };
    const result = activate(draft, approval.approvedBy, log, () => approval.approvedOn);
    return result.ok ? result.record : draft;
  });
  return { records, problems: [...new Set(problems)] };
}

/** What still stands between a draft and activation, apart from someone approving it. */
export function draftBlockers(record: EvidenceRecord): CheckResult[] {
  return runChecks(record, `not ${record.author}`).filter((c) => !c.pass);
}

/** May this feature line be rendered with its figures? */
export function figureAllowed(
  productId: string,
  feature: string,
  records: readonly EvidenceRecord[],
  asOf: string,
): boolean {
  return records.some(
    (r) =>
      r.status === 'active' &&
      r.subject.productId === productId &&
      r.subject.feature === feature &&
      Boolean(r.approvedBy) &&
      !same(r.approvedBy ?? '', r.author) &&
      (!r.expiresOn || r.expiresOn >= asOf),
  );
}

export interface FeatureSplit {
  shown: string[];
  omitted: string[];
}

/** Splits a product's feature lines into what may be shown and what is held back. */
export function splitFeatures(
  productId: string,
  features: readonly string[],
  records: readonly EvidenceRecord[],
  asOf: string,
): FeatureSplit {
  const shown: string[] = [];
  const omitted: string[] = [];
  for (const feature of features) {
    if (extractFigures(feature).length === 0 || figureAllowed(productId, feature, records, asOf)) {
      shown.push(feature);
    } else {
      omitted.push(feature);
    }
  }
  return { shown, omitted };
}
