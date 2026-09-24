// Module 2 — Purchasing & Supplier.
import { ACTIONS, MODULES } from '../constants.mjs';
import { notFound, procedure } from './shared.mjs';

const M = MODULES.PURCHASING_SUPPLIER;

export const listSuppliers = procedure({
  module: M,
  action: ACTIONS.VIEW,
  name: 'listSuppliers',
  run: (ctx) =>
    ctx.store.suppliers.map((supplier) => ({
      ...supplier,
      // Supplier authorisation is a document, not an inference from trading
      // history. Nothing in the fixtures supplies one.
      partner_status: supplier.authorization_on_file ? 'ON_FILE' : 'BLOCKED_EVIDENCE_MISSING',
    })),
});

export const listPurchaseOrders = procedure({
  module: M,
  action: ACTIONS.VIEW,
  name: 'listPurchaseOrders',
  run: (ctx) => ctx.store.purchase_orders.slice(),
});

export const createPurchaseOrder = procedure({
  module: M,
  action: ACTIONS.CREATE,
  name: 'createPurchaseOrder',
  run: (ctx, actor, { po_id, supplier_id, sku_id, qty_mock }) => {
    const supplier = ctx.store.suppliers.find((s) => s.supplier_id === supplier_id);
    if (!supplier) throw notFound(`supplier ${supplier_id}`);
    const po = { po_id, supplier_id, sku_id, qty_mock, state: 'MOCK_DRAFT' };
    ctx.store.purchase_orders.push(po);
    return po;
  },
});

export const approvePurchaseOrder = procedure({
  module: M,
  action: ACTIONS.APPROVE,
  name: 'approvePurchaseOrder',
  run: () => {
    // Unreachable while the owner approval policy is OWNER_DECISION_PENDING:
    // the guard in procedure() refuses the action before the body runs.
    throw new Error('OWNER_DECISION_PENDING: purchase approval policy not supplied');
  },
});
