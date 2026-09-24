// Module 8 — Executive Dashboard.
import { ACTIONS, EVIDENCE_STATUS, MODULES } from '../constants.mjs';
import { missingTracks } from '../evidence.mjs';
import { procedure } from './shared.mjs';

const M = MODULES.EXECUTIVE_DASHBOARD;

export const summary = procedure({
  module: M,
  action: ACTIONS.VIEW,
  name: 'summary',
  run: (ctx) => {
    const skus = ctx.store.skus;
    const blocked = skus.filter((sku) => missingTracks(sku).length > 0);
    return {
      data_class: ctx.store.data_class,
      sku_total: skus.length,
      sku_fully_evidenced: skus.length - blocked.length,
      sku_blocked_evidence_missing: blocked.length,
      sellable_now: skus.filter(
        (sku) =>
          sku.evidence.sale_authorization_status.status === EVIDENCE_STATUS.PRESENT &&
          sku.evidence.price_status.status === EVIDENCE_STATUS.PRESENT,
      ).length,
      quotations: ctx.store.quotations.length,
      orders: ctx.store.orders.length,
      fulfillments: ctx.store.fulfillments.length,
      technical_reviews: ctx.store.technical_reviews.length,
      audit_entries: ctx.audit.size(),
      audit_head: ctx.audit.head(),
      approval_policy: ctx.policy.policy_id,
      workflow_states: skus.map((sku) => ({ sku_id: sku.sku_id, state: sku.workflow_state })),
    };
  },
});

export const exportSummary = procedure({
  module: M,
  action: ACTIONS.EXPORT,
  name: 'exportSummary',
  run: () => {
    throw new Error('OWNER_DECISION_PENDING: export policy not supplied');
  },
});
