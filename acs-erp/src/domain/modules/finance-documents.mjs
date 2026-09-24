// Module 6 — Finance Documents.
import { ACTIONS, MODULES } from '../constants.mjs';
import { notFound, procedure } from './shared.mjs';

const M = MODULES.FINANCE_DOCUMENTS;

export const listDocuments = procedure({
  module: M,
  action: ACTIONS.VIEW,
  name: 'listDocuments',
  run: (ctx) => ctx.store.orders.map((order) => ({
    document_id: `MOCK-DOC-${order.order_id}`,
    order_id: order.order_id,
    state: order.state,
    amount_mock_units: order.amount_mock_units,
  })),
});

export const createDraftDocument = procedure({
  module: M,
  action: ACTIONS.CREATE,
  name: 'createDraftDocument',
  run: (ctx, actor, { order_id }) => {
    const order = ctx.store.orders.find((o) => o.order_id === order_id);
    if (!order) throw notFound(`order ${order_id}`);
    return { document_id: `MOCK-DOC-${order_id}`, state: 'MOCK_DRAFT' };
  },
});

export const issueDocument = procedure({
  module: M,
  action: ACTIONS.APPROVE,
  name: 'issueDocument',
  run: () => {
    throw new Error('OWNER_DECISION_PENDING: document issuance policy not supplied');
  },
});

export const exportDocuments = procedure({
  module: M,
  action: ACTIONS.EXPORT,
  name: 'exportDocuments',
  run: (ctx) => ctx.store.orders.map((order) => order.order_id),
});
