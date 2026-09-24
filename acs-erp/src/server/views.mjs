// One view per module. Every view calls the real procedures as the signed-in
// actor, so a refusal shown on screen is the procedure layer refusing, not the
// template choosing to hide something.

import { MODULES, MODULE_TITLES } from '../domain/constants.mjs';
import { permissionMatrix } from '../domain/rbac.mjs';
import { runFixtureWorkflow } from '../domain/workflow.mjs';
import { createErp } from '../domain/erp.mjs';
import { blocked, escapeHtml, table, tag } from './render.mjs';

function attempt(fn) {
  try {
    return { ok: true, value: fn() };
  } catch (error) {
    return { ok: false, error };
  }
}

function section(title, result, render) {
  if (!result.ok) return `<h2>${escapeHtml(title)}</h2>${blocked(result.error)}`;
  return `<h2>${escapeHtml(title)}</h2>${render(result.value)}`;
}

export function overview(erp, actor) {
  const summary = attempt(() => erp.modules.dashboard.summary(actor));
  const providers = erp.providers.list();
  return [
    `<p class="note">Eight modules over deterministic synthetic fixtures. Every number below is invented for this prototype. No ACS customer, staff, supplier, product, SKU, price, stock, warranty, payment, delivery, contract, partner or sales data is present anywhere in this process.</p>`,
    section('Executive dashboard', summary, (value) =>
      table(
        ['metric', 'value'],
        Object.entries(value)
          .filter(([key]) => key !== 'workflow_states')
          .map(([key, val]) => [escapeHtml(key), escapeHtml(typeof val === 'object' ? JSON.stringify(val) : val)]),
      ),
    ),
    `<h2>Provider configuration</h2>`,
    table(
      ['provider', 'mode', 'enabled', 'adapter approved'],
      providers.map((provider) => [
        escapeHtml(provider.provider_id),
        escapeHtml(provider.mode),
        tag(provider.enabled ? 'OK' : 'DENY'),
        tag(provider.adapter_approved ? 'OK' : 'BLOCKED_SOURCE_UNAVAILABLE'),
      ]),
    ),
    `<p class="note">Disabled entries are interface declarations only. No SDK is installed, no credential is read, and a request for one returns BLOCKED_SOURCE_UNAVAILABLE with no network call and no fallback to another provider.</p>`,
  ].join('');
}

function evidenceRow(sku) {
  return [
    escapeHtml(sku.sku_id),
    escapeHtml(sku.name),
    tag(sku.evidence.claim_source_status.status),
    tag(sku.evidence.sale_authorization_status.status),
    tag(sku.evidence.price_status.status),
    tag(sku.evidence.stock_status.status),
    tag(sku.evidence.warranty_status.status),
    escapeHtml(sku.workflow_state),
  ];
}

export function productRegistry(erp, actor) {
  const list = attempt(() => erp.modules.productRegistry.listSkus(actor));
  const exported = attempt(() => erp.modules.productRegistry.exportRegistry(actor));
  return [
    `<p class="note">Each SKU tracks five evidence states independently. A technical datasheet closes the specification track only — it is never evidence that ACS may sell the item, holds stock, has a price, offers a warranty, can deliver, or is an authorised partner.</p>`,
    section('SKUs', list, (skus) =>
      table(
        ['sku', 'name', 'claim source', 'sale auth', 'price', 'stock', 'warranty', 'workflow'],
        skus.map(evidenceRow),
      ),
    ),
    section('What may be stated', list, (skus) =>
      table(
        ['sku', 'specification', 'offer for sale', 'price', 'stock', 'warranty', 'delivery', 'partner status'],
        skus.map((sku) => [
          escapeHtml(sku.sku_id),
          tag(sku.gates.may_state_specification ? 'ALLOW' : 'DENY'),
          tag(sku.gates.may_offer_for_sale ? 'ALLOW' : 'DENY'),
          tag(sku.gates.may_state_price ? 'ALLOW' : 'DENY'),
          tag(sku.gates.may_state_stock ? 'ALLOW' : 'DENY'),
          tag(sku.gates.may_state_warranty ? 'ALLOW' : 'DENY'),
          tag(sku.gates.may_state_delivery ? 'ALLOW' : 'BLOCKED_EVIDENCE_MISSING'),
          tag(sku.gates.may_state_partner_status ? 'ALLOW' : 'BLOCKED_EVIDENCE_MISSING'),
        ]),
      ),
    ),
    section('Export', exported, (ids) => `<p class="note">${escapeHtml(ids.join(', '))}</p>`),
  ].join('');
}

export function purchasing(erp, actor) {
  const suppliers = attempt(() => erp.modules.purchasing.listSuppliers(actor));
  const orders = attempt(() => erp.modules.purchasing.listPurchaseOrders(actor));
  return [
    section('Suppliers', suppliers, (rows) =>
      table(
        ['supplier', 'name', 'mock lead time (days)', 'partner status'],
        rows.map((row) => [
          escapeHtml(row.supplier_id),
          escapeHtml(row.name),
          escapeHtml(row.lead_time_days_mock),
          tag(row.partner_status === 'ON_FILE' ? 'ALLOW' : 'BLOCKED_EVIDENCE_MISSING'),
        ]),
      ),
    ),
    section('Purchase orders', orders, (rows) =>
      table(
        ['po', 'supplier', 'sku', 'mock qty', 'state'],
        rows.map((row) => [
          escapeHtml(row.po_id),
          escapeHtml(row.supplier_id),
          escapeHtml(row.sku_id),
          escapeHtml(row.qty_mock),
          escapeHtml(row.state),
        ]),
      ),
    ),
  ].join('');
}

export function inventory(erp, actor) {
  const rows = attempt(() => erp.modules.inventory.listStock(actor));
  return [
    `<p class="note">A quantity appears only where a stock count record exists. Where it does not, the cell states the blocked status rather than a zero.</p>`,
    section('Stock', rows, (list) =>
      table(
        ['sku', 'mock on hand', 'stock evidence'],
        list.map((row) => [
          escapeHtml(row.sku_id),
          escapeHtml(row.on_hand_mock),
          tag(row.stock_status),
        ]),
      ),
    ),
  ].join('');
}

export function pricing(erp, actor) {
  const rows = attempt(() => erp.modules.pricing.listPricing(actor));
  return [
    `<p class="note">Amounts are in mock_units, which is not a currency and is not an ACS price.</p>`,
    section('Pricing', rows, (list) =>
      table(
        ['sku', 'price evidence', 'mock cost', 'mock list'],
        list.map((row) => [
          escapeHtml(row.sku_id),
          tag(row.price_status),
          escapeHtml(row.mock_cost_units),
          escapeHtml(row.mock_list_units),
        ]),
      ),
    ),
  ].join('');
}

export function salesCrm(erp, actor) {
  const customers = attempt(() => erp.modules.salesCrm.listCustomers(actor));
  const quotations = attempt(() => erp.modules.salesCrm.listQuotations(actor));
  return [
    section('Customers', customers, (rows) =>
      table(
        ['customer', 'name', 'segment'],
        rows.map((row) => [
          escapeHtml(row.customer_id),
          escapeHtml(row.name),
          escapeHtml(row.segment),
        ]),
      ),
    ),
    section('Quotations', quotations, (rows) =>
      rows.length === 0
        ? `<p class="note">No quotation in this session. The fixture workflow page runs one end to end.</p>`
        : table(
            ['quotation', 'customer', 'sku', 'mock qty', 'state'],
            rows.map((row) => [
              escapeHtml(row.quotation_id),
              escapeHtml(row.customer_id),
              escapeHtml(row.sku_id),
              escapeHtml(row.qty_mock),
              escapeHtml(row.state),
            ]),
          ),
    ),
  ].join('');
}

export function financeDocuments(erp, actor) {
  const documents = attempt(() => erp.modules.financeDocuments.listDocuments(actor));
  const exported = attempt(() => erp.modules.financeDocuments.exportDocuments(actor));
  return [
    `<p class="note">Issuing a document is an approval-required transition and is stopped while the owner approval policy is OWNER_DECISION_PENDING.</p>`,
    section('Documents', documents, (rows) =>
      rows.length === 0
        ? `<p class="note">No mock document in this session.</p>`
        : table(
            ['document', 'order', 'state', 'mock amount'],
            rows.map((row) => [
              escapeHtml(row.document_id),
              escapeHtml(row.order_id),
              escapeHtml(row.state),
              escapeHtml(row.amount_mock_units),
            ]),
          ),
    ),
    section('Export', exported, (ids) =>
      `<p class="note">${escapeHtml(ids.length === 0 ? 'nothing to export' : ids.join(', '))}</p>`,
    ),
  ].join('');
}

export function fulfillmentView(erp, actor) {
  const reviews = attempt(() => erp.modules.fulfillment.listTechnicalReviews(actor));
  const fulfillments = attempt(() => erp.modules.fulfillment.listFulfillments(actor));
  return [
    section('Technical reviews', reviews, (rows) =>
      rows.length === 0
        ? `<p class="note">No technical review in this session. Only the Technic role may record one.</p>`
        : table(
            ['review', 'sku', 'reviewer', 'specification matches', 'source'],
            rows.map((row) => [
              escapeHtml(row.review_id),
              escapeHtml(row.sku_id),
              escapeHtml(row.reviewer_actor_id),
              tag(row.specification_matches ? 'OK' : 'DENY'),
              escapeHtml(row.source_ref),
            ]),
          ),
    ),
    section('Fulfillments', fulfillments, (rows) =>
      rows.length === 0
        ? `<p class="note">No fulfillment in this session.</p>`
        : table(
            ['fulfillment', 'order', 'delivery statement'],
            rows.map((row) => [
              escapeHtml(row.fulfillment_id),
              escapeHtml(row.order_id),
              tag(row.delivery_statement),
            ]),
          ),
    ),
  ].join('');
}

export function dashboardView(erp, actor) {
  const summary = attempt(() => erp.modules.dashboard.summary(actor));
  const exported = attempt(() => erp.modules.dashboard.exportSummary(actor));
  return [
    section('Summary', summary, (value) =>
      table(
        ['sku', 'workflow state'],
        value.workflow_states.map((row) => [escapeHtml(row.sku_id), escapeHtml(row.state)]),
      ),
    ),
    section('Export', exported, () => `<p class="note">exported</p>`),
  ].join('');
}

export function permissions(erp) {
  const rows = permissionMatrix(erp.policy);
  const actions = ['view', 'create', 'edit', 'approve', 'export', 'technical_review'];
  return [
    `<p class="note">The matrix below is the one the procedure layer enforces; this page reads it rather than restating it. OWNER_DECISION_PENDING is not a denial — it is the owner's decision that has not been made, so the transition stops instead of defaulting either way.</p>`,
    table(
      ['role', 'module', ...actions],
      rows.map((row) => [
        escapeHtml(row.role),
        escapeHtml(MODULE_TITLES[row.module]),
        ...actions.map((action) =>
          row.actions[action] === undefined ? '<span class="tag">n/a</span>' : tag(row.actions[action]),
        ),
      ]),
    ),
  ].join('');
}

export function workflowView() {
  // Runs on a throwaway runtime so the page is deterministic and cannot disturb
  // the session's own state.
  const run = runFixtureWorkflow(createErp());
  return [
    `<p class="note">The required synthetic workflow, executed on a fresh runtime for this page. It halts at the approval path because the owner approval policy is OWNER_DECISION_PENDING. That halt is the expected result, not a defect.</p>`,
    table(
      ['step', 'role', 'outcome', 'detail'],
      run.steps.map((step) => [
        escapeHtml(step.label),
        escapeHtml(step.role),
        tag(step.outcome),
        escapeHtml(step.detail),
      ]),
    ),
    `<p class="note">halted at ${tag(run.halted_at || 'OK')} · final state ${escapeHtml(run.final_state)} · approval policy ${escapeHtml(run.approval_policy)} · audit head ${escapeHtml(run.audit_head.slice(0, 16))}…</p>`,
  ].join('');
}

export function auditView(erp) {
  const entries = erp.audit.list();
  const chain = erp.audit.verifyChain();
  return [
    `<p class="note">Append-only, hash-chained. Chain verification: ${tag(chain.ok ? 'OK' : 'ERROR')}${chain.ok ? '' : ` broken at ${escapeHtml(chain.broken_at)}`}. Refusals are recorded as well as successes.</p>`,
    entries.length === 0
      ? `<p class="note">No entry yet in this session.</p>`
      : table(
          ['#', 'at', 'actor', 'role', 'module', 'action', 'outcome', 'detail'],
          entries.map((entry) => [
            escapeHtml(entry.seq),
            escapeHtml(entry.at),
            escapeHtml(entry.actor_id),
            escapeHtml(entry.role),
            escapeHtml(MODULE_TITLES[entry.module] || entry.module),
            escapeHtml(entry.action),
            tag(entry.outcome),
            escapeHtml(entry.detail),
          ]),
        ),
  ].join('');
}

export const MODULE_VIEWS = {
  [MODULES.PRODUCT_EVIDENCE_REGISTRY]: productRegistry,
  [MODULES.PURCHASING_SUPPLIER]: purchasing,
  [MODULES.INVENTORY]: inventory,
  [MODULES.PRICING]: pricing,
  [MODULES.SALES_CRM]: salesCrm,
  [MODULES.FINANCE_DOCUMENTS]: financeDocuments,
  [MODULES.FULFILLMENT_TECHNICAL_REVIEW]: fulfillmentView,
  [MODULES.EXECUTIVE_DASHBOARD]: dashboardView,
};
