// The required executable synthetic workflow.
//
//   add mock product → attach synthetic evidence placeholder → Technic checks
//   specification → Stock checks mock quantity → Account checks mock cost →
//   Sales drafts quotation → Manager/Chairman approval path → create mock order
//   → mock fulfillment → dashboard update and append-only audit record
//
// Each evidence track is closed by its own placeholder record, deliberately as
// separate steps: the datasheet attached at step 2 closes the specification
// track and nothing else, and the run shows that plainly.
//
// Under the OWNER_DECISION_PENDING policy the run halts at the approval path
// and every later step is recorded as NOT_ATTEMPTED. That halt is the expected
// outcome, not a failure of the run.

import { ERROR_CODE, WORKFLOW_STATE } from './constants.mjs';
import { missingTracks } from './evidence.mjs';

const SKU_ID = 'MOCK-SKU-9001';
const QUOTATION_ID = 'MOCK-QT-9001';
const ORDER_ID = 'MOCK-ORD-9001';

export function runFixtureWorkflow(erp) {
  const { modules, store } = erp;
  const actor = (id) => store.findActor(id);
  const chairman = actor('ACTOR-0001');
  const manager = actor('ACTOR-0002');
  const account = actor('ACTOR-0003');
  const stock = actor('ACTOR-0004');
  const sales = actor('ACTOR-0005');
  const technic = actor('ACTOR-0006');

  const steps = [];
  let halted = null;

  function step(label, role, fn) {
    if (halted) {
      steps.push({ label, role, outcome: 'NOT_ATTEMPTED', detail: `blocked by ${halted}` });
      return null;
    }
    try {
      const result = fn();
      steps.push({ label, role, outcome: 'OK', detail: summarise(result) });
      return result;
    } catch (error) {
      steps.push({
        label,
        role,
        outcome: error.code || 'ERROR',
        detail: error.message,
      });
      if (error.code === ERROR_CODE.OWNER_DECISION_PENDING) halted = error.code;
      else halted = error.code || 'ERROR';
      return null;
    }
  }

  step('1. add mock product', 'MANAGER', () =>
    modules.productRegistry.createSku(manager, {
      sku_id: SKU_ID,
      name: 'Mock Workflow Device',
      category: 'MOCK_CATEGORY_HANDHELD',
      supplier_id: 'MOCK-SUP-01',
    }),
  );

  step('2. attach synthetic evidence placeholder (technical datasheet)', 'MANAGER', () =>
    modules.productRegistry.attachEvidencePlaceholder(manager, {
      sku_id: SKU_ID,
      kind: 'TECHNICAL_DATASHEET',
      evidence_ref: 'MOCK-EV-DS-9001',
    }),
  );

  // The datasheet closed one track. The other four are still missing, and the
  // run records that before anything commercial is attempted.
  const afterDatasheet = store.findSku(SKU_ID);
  steps.push({
    label: '2a. evidence state after the datasheet',
    role: '—',
    outcome: 'OBSERVED',
    detail: `still missing: ${missingTracks(afterDatasheet).join(', ')}`,
  });

  step('3. Technic checks specification', 'TECHNIC', () =>
    modules.fulfillment.recordTechnicalReview(technic, {
      sku_id: SKU_ID,
      specification_matches: true,
    }),
  );

  step('4a. attach stock count placeholder', 'STOCK', () =>
    modules.productRegistry.attachEvidencePlaceholder(stock, {
      sku_id: SKU_ID,
      kind: 'STOCK_COUNT',
      evidence_ref: 'MOCK-EV-ST-9001',
    }),
  );
  step('4b. Stock checks mock quantity', 'STOCK', () =>
    modules.inventory.recordStockCheck(stock, { sku_id: SKU_ID, counted_mock: 10 }),
  );

  step('5a. attach price record placeholder', 'ACCOUNT', () =>
    modules.productRegistry.attachEvidencePlaceholder(account, {
      sku_id: SKU_ID,
      kind: 'PRICE_RECORD',
      evidence_ref: 'MOCK-EV-PR-9001',
    }),
  );
  step('5b. Account checks mock cost', 'ACCOUNT', () =>
    modules.pricing.recordCostCheck(account, { sku_id: SKU_ID, cost_mock: 900 }),
  );

  step('6a. attach sale authorization placeholder', 'MANAGER', () =>
    modules.productRegistry.attachEvidencePlaceholder(manager, {
      sku_id: SKU_ID,
      kind: 'SALE_AUTHORIZATION',
      evidence_ref: 'MOCK-EV-SA-9001',
    }),
  );
  step('6b. attach warranty terms placeholder', 'MANAGER', () =>
    modules.productRegistry.attachEvidencePlaceholder(manager, {
      sku_id: SKU_ID,
      kind: 'WARRANTY_TERMS',
      evidence_ref: 'MOCK-EV-WT-9001',
    }),
  );

  // A list price needs its own record; the cost check does not create one.
  const workflowSku = store.findSku(SKU_ID);
  if (workflowSku) workflowSku.mock_list_units = 1400;

  step('6c. Sales drafts quotation', 'SALES', () =>
    modules.salesCrm.draftQuotation(sales, {
      quotation_id: QUOTATION_ID,
      customer_id: 'MOCK-CUST-01',
      sku_id: SKU_ID,
      qty_mock: 2,
    }),
  );
  step('6d. Sales submits the quotation for approval', 'SALES', () =>
    modules.salesCrm.submitForApproval(sales, { quotation_id: QUOTATION_ID }),
  );

  // The approval path. Both approving roles are attempted in sequence so the
  // record shows the outcome for each, not only for the first.
  const approvalAttempts = [];
  for (const [role, who] of [
    ['MANAGER', manager],
    ['CHAIRMAN', chairman],
  ]) {
    try {
      const approved = modules.salesCrm.approveQuotation(who, { quotation_id: QUOTATION_ID });
      approvalAttempts.push({ role, outcome: 'OK', detail: approved.state });
      break;
    } catch (error) {
      approvalAttempts.push({ role, outcome: error.code || 'ERROR', detail: error.message });
    }
  }
  const approved = approvalAttempts.some((attempt) => attempt.outcome === 'OK');
  for (const attempt of approvalAttempts) {
    steps.push({
      label: `7. approval path — ${attempt.role}`,
      role: attempt.role,
      outcome: attempt.outcome,
      detail: attempt.detail,
    });
  }
  if (!approved) halted = ERROR_CODE.OWNER_DECISION_PENDING;

  step('8. create mock order', 'MANAGER', () =>
    modules.fulfillment.createOrder(manager, {
      order_id: ORDER_ID,
      quotation_id: QUOTATION_ID,
    }),
  );
  step('9. mock fulfillment', 'STOCK', () =>
    modules.fulfillment.fulfillOrder(stock, { order_id: ORDER_ID }),
  );

  // The dashboard read and the audit head are always recorded, halted or not:
  // a run that stopped early still has to be visible.
  const summary = modules.dashboard.summary(manager);
  steps.push({
    label: '10. dashboard update and append-only audit record',
    role: 'MANAGER',
    outcome: 'OK',
    detail: `orders=${summary.orders} fulfillments=${summary.fulfillments} audit_entries=${erp.audit.size()}`,
  });

  const finalSku = store.findSku(SKU_ID);
  return {
    sku_id: SKU_ID,
    quotation_id: QUOTATION_ID,
    order_id: ORDER_ID,
    steps,
    halted_at: halted,
    approval_policy: erp.policy.policy_id,
    final_state: finalSku ? finalSku.workflow_state : WORKFLOW_STATE.DRAFT,
    summary,
    audit_head: erp.audit.head(),
  };
}

function summarise(result) {
  if (!result || typeof result !== 'object') return String(result);
  for (const key of ['state', 'workflow_state', 'review_id', 'fulfillment_id', 'order_id', 'sku_id']) {
    if (result[key]) return `${key}=${result[key]}`;
  }
  return 'ok';
}
