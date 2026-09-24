// Module 5 — Sales & CRM.
import { ACTIONS, MODULES, WORKFLOW_STATE } from '../constants.mjs';
import { commercialGates, requireEvidence } from '../evidence.mjs';
import { notFound, procedure } from './shared.mjs';

const M = MODULES.SALES_CRM;

export const listCustomers = procedure({
  module: M,
  action: ACTIONS.VIEW,
  name: 'listCustomers',
  run: (ctx) => ctx.store.customers.slice(),
});

export const listQuotations = procedure({
  module: M,
  action: ACTIONS.VIEW,
  name: 'listQuotations',
  run: (ctx) => ctx.store.quotations.slice(),
});

export const draftQuotation = procedure({
  module: M,
  action: ACTIONS.CREATE,
  name: 'draftQuotation',
  run: (ctx, actor, { quotation_id, customer_id, sku_id, qty_mock }) => {
    const sku = ctx.store.findSku(sku_id);
    if (!sku) throw notFound(`sku ${sku_id}`);
    const customer = ctx.store.customers.find((c) => c.customer_id === customer_id);
    if (!customer) throw notFound(`customer ${customer_id}`);
    // A quotation states a price for something ACS offers for sale, so it needs
    // both records. A datasheet alone never gets here.
    requireEvidence(sku, ['sale_authorization_status', 'price_status'], 'a quotation');
    const quotation = {
      quotation_id,
      customer_id,
      sku_id,
      qty_mock,
      unit_mock_units: sku.mock_list_units,
      state: 'MOCK_DRAFT',
      // Delivery and warranty language is only permitted where its own record
      // exists; the quotation carries the verdict so the reviewer sees it.
      statement_gates: commercialGates(sku),
    };
    ctx.store.quotations.push(quotation);
    if (sku.workflow_state === WORKFLOW_STATE.COST_CHECKED) {
      sku.workflow_state = WORKFLOW_STATE.QUOTATION_DRAFTED;
    }
    return quotation;
  },
});

export const submitForApproval = procedure({
  module: M,
  action: ACTIONS.EDIT,
  name: 'submitForApproval',
  run: (ctx, actor, { quotation_id }) => {
    const quotation = ctx.store.quotations.find((q) => q.quotation_id === quotation_id);
    if (!quotation) throw notFound(`quotation ${quotation_id}`);
    quotation.state = 'MOCK_AWAITING_APPROVAL';
    const sku = ctx.store.findSku(quotation.sku_id);
    if (sku && sku.workflow_state === WORKFLOW_STATE.QUOTATION_DRAFTED) {
      sku.workflow_state = WORKFLOW_STATE.AWAITING_APPROVAL;
    }
    return quotation;
  },
});

export const approveQuotation = procedure({
  module: M,
  action: ACTIONS.APPROVE,
  name: 'approveQuotation',
  run: (ctx, actor, { quotation_id }) => {
    // Reaching this body means an owner-supplied approval policy is in force;
    // the guard in procedure() refuses the action otherwise. The policy's own
    // actor, limit and sequence are still checked here rather than assumed.
    const policy = ctx.policy;
    const quotation = ctx.store.quotations.find((q) => q.quotation_id === quotation_id);
    if (!quotation) throw notFound(`quotation ${quotation_id}`);
    if (quotation.state !== 'MOCK_AWAITING_APPROVAL') {
      const error = new Error(
        `INVALID_TRANSITION: quotation ${quotation_id} is ${quotation.state}`,
      );
      error.code = 'INVALID_TRANSITION';
      throw error;
    }
    if (Array.isArray(policy.approval_sequence) && !policy.approval_sequence.includes(actor.role)) {
      const error = new Error(
        `INVALID_TRANSITION: role ${actor.role} is not in the approval sequence`,
      );
      error.code = 'INVALID_TRANSITION';
      throw error;
    }
    const amount = quotation.unit_mock_units * quotation.qty_mock;
    if (typeof policy.approval_limit === 'number' && amount > policy.approval_limit) {
      const error = new Error(
        `INVALID_TRANSITION: amount ${amount} exceeds approval limit ${policy.approval_limit}`,
      );
      error.code = 'INVALID_TRANSITION';
      throw error;
    }
    quotation.state = 'MOCK_APPROVED';
    quotation.approved_by_actor_id = actor.actor_id;
    const sku = ctx.store.findSku(quotation.sku_id);
    if (sku && sku.workflow_state === WORKFLOW_STATE.AWAITING_APPROVAL) {
      sku.workflow_state = WORKFLOW_STATE.APPROVED;
    }
    return quotation;
  },
});
