// Module 3 — Inventory.
import { ACTIONS, EVIDENCE_STATUS, MODULES, WORKFLOW_STATE } from '../constants.mjs';
import { requireEvidence } from '../evidence.mjs';
import { notFound, procedure } from './shared.mjs';

const M = MODULES.INVENTORY;

export const listStock = procedure({
  module: M,
  action: ACTIONS.VIEW,
  name: 'listStock',
  run: (ctx) =>
    ctx.store.skus.map((sku) => ({
      sku_id: sku.sku_id,
      // A quantity is only shown when a stock count record exists. Otherwise the
      // answer is the blocked status, never a zero and never a guess.
      on_hand_mock:
        sku.evidence.stock_status.status === EVIDENCE_STATUS.PRESENT ? sku.mock_on_hand : null,
      stock_status: sku.evidence.stock_status.status,
    })),
});

export const recordStockCheck = procedure({
  module: M,
  action: ACTIONS.EDIT,
  name: 'recordStockCheck',
  run: (ctx, actor, { sku_id, counted_mock }) => {
    const sku = ctx.store.findSku(sku_id);
    if (!sku) throw notFound(`sku ${sku_id}`);
    requireEvidence(sku, ['stock_status'], 'a stock check');
    sku.mock_on_hand = counted_mock;
    if (sku.workflow_state === WORKFLOW_STATE.TECHNICAL_REVIEWED) {
      sku.workflow_state = WORKFLOW_STATE.STOCK_CHECKED;
    }
    return { sku_id, on_hand_mock: sku.mock_on_hand };
  },
});
