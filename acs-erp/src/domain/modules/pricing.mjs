// Module 4 — Pricing.
import { ACTIONS, EVIDENCE_STATUS, MODULES, WORKFLOW_STATE } from '../constants.mjs';
import { requireEvidence } from '../evidence.mjs';
import { notFound, procedure } from './shared.mjs';

const M = MODULES.PRICING;

export const listPricing = procedure({
  module: M,
  action: ACTIONS.VIEW,
  name: 'listPricing',
  run: (ctx) =>
    ctx.store.skus.map((sku) => {
      const priced = sku.evidence.price_status.status === EVIDENCE_STATUS.PRESENT;
      return {
        sku_id: sku.sku_id,
        price_status: sku.evidence.price_status.status,
        mock_cost_units: priced ? sku.mock_cost_units : null,
        mock_list_units: priced ? sku.mock_list_units : null,
      };
    }),
});

export const recordCostCheck = procedure({
  module: M,
  action: ACTIONS.EDIT,
  name: 'recordCostCheck',
  run: (ctx, actor, { sku_id, cost_mock }) => {
    const sku = ctx.store.findSku(sku_id);
    if (!sku) throw notFound(`sku ${sku_id}`);
    requireEvidence(sku, ['price_status'], 'a cost check');
    sku.mock_cost_units = cost_mock;
    if (sku.workflow_state === WORKFLOW_STATE.STOCK_CHECKED) {
      sku.workflow_state = WORKFLOW_STATE.COST_CHECKED;
    }
    return { sku_id, mock_cost_units: sku.mock_cost_units };
  },
});

export const publishPrice = procedure({
  module: M,
  action: ACTIONS.APPROVE,
  name: 'publishPrice',
  run: () => {
    throw new Error('OWNER_DECISION_PENDING: price publication policy not supplied');
  },
});
