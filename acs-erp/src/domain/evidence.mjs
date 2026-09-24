// Evidence-first commercial safety gates.
//
// The governing rule: a technical source proves a specification and nothing
// else. It is not evidence that ACS may sell the item, holds stock, has a
// price, offers a warranty, can deliver, or is an authorised partner. Each of
// those needs its own record, and when the record is absent the answer is
// BLOCKED_EVIDENCE_MISSING — never an invented value.

import {
  ERROR_CODE,
  EVIDENCE_KIND_CLOSES,
  EVIDENCE_STATUS,
  EVIDENCE_TRACKS,
  STANDALONE_ASSERTIONS,
} from './constants.mjs';

export function emptyEvidence() {
  const evidence = {};
  for (const track of EVIDENCE_TRACKS) {
    evidence[track] = { status: EVIDENCE_STATUS.MISSING, evidence_ref: null };
  }
  return evidence;
}

/**
 * Attach one synthetic evidence placeholder. Returns a new evidence object;
 * the caller decides what to do with it, so nothing mutates behind its back.
 */
export function attachEvidence(evidence, { kind, evidence_ref }) {
  const track = EVIDENCE_KIND_CLOSES[kind];
  if (!track) {
    const error = new Error(`${ERROR_CODE.NOT_FOUND}: unknown evidence kind ${kind}`);
    error.code = ERROR_CODE.NOT_FOUND;
    throw error;
  }
  if (!evidence_ref) {
    const error = new Error(`${ERROR_CODE.BLOCKED_EVIDENCE_MISSING}: evidence_ref is required`);
    error.code = ERROR_CODE.BLOCKED_EVIDENCE_MISSING;
    throw error;
  }
  const next = {};
  for (const name of EVIDENCE_TRACKS) {
    next[name] = { ...evidence[name] };
  }
  // Exactly one track moves. Every other track is left untouched on purpose.
  next[track] = { status: EVIDENCE_STATUS.PRESENT, evidence_ref };
  return next;
}

export function trackStatus(sku, track) {
  if (!EVIDENCE_TRACKS.includes(track)) {
    const error = new Error(`${ERROR_CODE.NOT_FOUND}: unknown evidence track ${track}`);
    error.code = ERROR_CODE.NOT_FOUND;
    throw error;
  }
  return sku.evidence[track].status;
}

export function missingTracks(sku) {
  return EVIDENCE_TRACKS.filter(
    (track) => sku.evidence[track].status !== EVIDENCE_STATUS.PRESENT,
  );
}

/** Throws unless every listed track carries its own evidence record. */
export function requireEvidence(sku, tracks, purpose) {
  const missing = tracks.filter(
    (track) => sku.evidence[track].status !== EVIDENCE_STATUS.PRESENT,
  );
  if (missing.length === 0) return;
  const error = new Error(
    `${ERROR_CODE.BLOCKED_EVIDENCE_MISSING}: ${purpose} needs ${missing.join(', ')} for ${sku.sku_id}`,
  );
  error.code = ERROR_CODE.BLOCKED_EVIDENCE_MISSING;
  error.sku_id = sku.sku_id;
  error.missing = missing;
  throw error;
}

/**
 * Delivery availability and partner authorisation are never derived from the
 * tracked fields. They are answered only by their own standalone record, which
 * the mock fixtures deliberately never supply.
 */
export function assertStandalone(sku, assertion) {
  if (!Object.values(STANDALONE_ASSERTIONS).includes(assertion)) {
    const error = new Error(`${ERROR_CODE.NOT_FOUND}: unknown assertion ${assertion}`);
    error.code = ERROR_CODE.NOT_FOUND;
    throw error;
  }
  const held = (sku.standalone_assertions || []).find((record) => record.assertion === assertion);
  if (!held) {
    return {
      assertion,
      status: EVIDENCE_STATUS.MISSING,
      code: ERROR_CODE.BLOCKED_EVIDENCE_MISSING,
      statement_permitted: false,
    };
  }
  return {
    assertion,
    status: EVIDENCE_STATUS.PRESENT,
    evidence_ref: held.evidence_ref,
    statement_permitted: true,
  };
}

/** What the prototype is allowed to say about a SKU right now. */
export function commercialGates(sku) {
  const present = (track) => sku.evidence[track].status === EVIDENCE_STATUS.PRESENT;
  return {
    may_state_specification: present('claim_source_status'),
    may_offer_for_sale: present('sale_authorization_status'),
    may_state_price: present('price_status'),
    may_state_stock: present('stock_status'),
    may_state_warranty: present('warranty_status'),
    may_draft_quotation: present('sale_authorization_status') && present('price_status'),
    may_state_delivery: assertStandalone(sku, STANDALONE_ASSERTIONS.DELIVERY_AVAILABILITY)
      .statement_permitted,
    may_state_partner_status: assertStandalone(sku, STANDALONE_ASSERTIONS.PARTNER_AUTHORIZATION)
      .statement_permitted,
  };
}
