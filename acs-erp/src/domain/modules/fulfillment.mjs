// Module 7 — Fulfillment & Technical Review.
import {
  ACTIONS,
  MODULES,
  TECHNICAL_REVIEW_ACTION,
  WORKFLOW_STATE,
} from '../constants.mjs';
import { requireEvidence } from '../evidence.mjs';
import { notFound, procedure } from './shared.mjs';

const M = MODULES.FULFILLMENT_TECHNICAL_REVIEW;

export const listFulfillments = procedure({
  module: M,
  action: ACTIONS.VIEW,
  name: 'listFulfillments',
  run: (ctx) => ctx.store.fulfillments.slice(),
});

export const listTechnicalReviews = procedure({
  module: M,
  action: ACTIONS.VIEW,
  name: 'listTechnicalReviews',
  run: (ctx) => ctx.store.technical_reviews.slice(),
});

export const recordTechnicalReview = procedure({
  module: M,
  action: TECHNICAL_REVIEW_ACTION,
  name: 'recordTechnicalReview',
  run: (ctx, actor, { sku_id, specification_matches }) => {
    const sku = ctx.store.findSku(sku_id);
    if (!sku) throw notFound(`sku ${sku_id}`);
    // A specification check reads the technical source, so that source must be
    // on file. It closes nothing else.
    requireEvidence(sku, ['claim_source_status'], 'a technical review');
    const review = {
      review_id: `MOCK-TR-${ctx.store.technical_reviews.length + 1}`,
      sku_id,
      reviewer_actor_id: actor.actor_id,
      specification_matches: Boolean(specification_matches),
      source_ref: sku.evidence.claim_source_status.evidence_ref,
    };
    ctx.store.technical_reviews.push(review);
    if (sku.workflow_state === WORKFLOW_STATE.EVIDENCE_ATTACHED && review.specification_matches) {
      sku.workflow_state = WORKFLOW_STATE.TECHNICAL_REVIEWED;
    }
    return review;
  },
});

export const createOrder = procedure({
  module: M,
  action: ACTIONS.CREATE,
  name: 'createOrder',
  run: (ctx, actor, { order_id, quotation_id }) => {
    const quotation = ctx.store.quotations.find((q) => q.quotation_id === quotation_id);
    if (!quotation) throw notFound(`quotation ${quotation_id}`);
    if (quotation.state !== 'MOCK_APPROVED') {
      const error = new Error(
        `INVALID_TRANSITION: quotation ${quotation_id} is ${quotation.state}, not MOCK_APPROVED`,
      );
      error.code = 'INVALID_TRANSITION';
      throw error;
    }
    const sku = ctx.store.findSku(quotation.sku_id);
    const order = {
      order_id,
      quotation_id,
      sku_id: quotation.sku_id,
      customer_id: quotation.customer_id,
      qty_mock: quotation.qty_mock,
      amount_mock_units: quotation.unit_mock_units * quotation.qty_mock,
      state: 'MOCK_ORDER_CREATED',
    };
    ctx.store.orders.push(order);
    if (sku) sku.workflow_state = WORKFLOW_STATE.ORDER_CREATED;
    return order;
  },
});

export const fulfillOrder = procedure({
  module: M,
  action: ACTIONS.EDIT,
  name: 'fulfillOrder',
  run: (ctx, actor, { order_id }) => {
    const order = ctx.store.orders.find((o) => o.order_id === order_id);
    if (!order) throw notFound(`order ${order_id}`);
    const sku = ctx.store.findSku(order.sku_id);
    if (sku) {
      requireEvidence(sku, ['stock_status'], 'a fulfillment');
      sku.mock_on_hand -= order.qty_mock;
      sku.workflow_state = WORKFLOW_STATE.FULFILLED;
    }
    order.state = 'MOCK_FULFILLED';
    const fulfillment = {
      fulfillment_id: `MOCK-FF-${ctx.store.fulfillments.length + 1}`,
      order_id,
      // Delivery availability is a separate assertion with no record in this
      // prototype, so the fulfillment states a mock internal step only.
      delivery_statement: 'BLOCKED_EVIDENCE_MISSING',
    };
    ctx.store.fulfillments.push(fulfillment);
    return fulfillment;
  },
});
