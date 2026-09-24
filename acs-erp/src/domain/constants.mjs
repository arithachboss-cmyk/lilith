// ACS Online Business ERP — internal mock prototype.
// Framework-free domain constants. No I/O, no framework imports.

export const PROTOTYPE_LABELS = Object.freeze({
  data: 'MOCK DATA',
  scope: 'INTERNAL PROTOTYPE — NOT FOR PRODUCTION USE',
});

export const ROLES = Object.freeze({
  CHAIRMAN: 'CHAIRMAN',
  MANAGER: 'MANAGER',
  ACCOUNT: 'ACCOUNT',
  STOCK: 'STOCK',
  SALES: 'SALES',
  TECHNIC: 'TECHNIC',
});

export const MODULES = Object.freeze({
  PRODUCT_EVIDENCE_REGISTRY: 'PRODUCT_EVIDENCE_REGISTRY',
  PURCHASING_SUPPLIER: 'PURCHASING_SUPPLIER',
  INVENTORY: 'INVENTORY',
  PRICING: 'PRICING',
  SALES_CRM: 'SALES_CRM',
  FINANCE_DOCUMENTS: 'FINANCE_DOCUMENTS',
  FULFILLMENT_TECHNICAL_REVIEW: 'FULFILLMENT_TECHNICAL_REVIEW',
  EXECUTIVE_DASHBOARD: 'EXECUTIVE_DASHBOARD',
});

export const MODULE_TITLES = Object.freeze({
  PRODUCT_EVIDENCE_REGISTRY: 'Product & Evidence Registry',
  PURCHASING_SUPPLIER: 'Purchasing & Supplier',
  INVENTORY: 'Inventory',
  PRICING: 'Pricing',
  SALES_CRM: 'Sales & CRM',
  FINANCE_DOCUMENTS: 'Finance Documents',
  FULFILLMENT_TECHNICAL_REVIEW: 'Fulfillment & Technical Review',
  EXECUTIVE_DASHBOARD: 'Executive Dashboard',
});

// Five actions encoded for every module, plus one module-scoped action.
export const ACTIONS = Object.freeze({
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  APPROVE: 'approve',
  EXPORT: 'export',
});

export const TECHNICAL_REVIEW_ACTION = 'technical_review';

// Authorisation verdicts. OWNER_DECISION_PENDING is deliberately distinct from
// DENY: the owner has not yet supplied an approval policy, so the system must
// not silently grant it and must not pretend the answer is a permanent no.
export const VERDICT = Object.freeze({
  ALLOW: 'ALLOW',
  DENY: 'DENY',
  OWNER_DECISION_PENDING: 'OWNER_DECISION_PENDING',
});

// Per-SKU evidence tracks. Each is independent on purpose.
export const EVIDENCE_TRACKS = Object.freeze([
  'claim_source_status',
  'sale_authorization_status',
  'price_status',
  'stock_status',
  'warranty_status',
]);

export const EVIDENCE_STATUS = Object.freeze({
  PRESENT: 'EVIDENCE_PRESENT',
  MISSING: 'BLOCKED_EVIDENCE_MISSING',
});

// An evidence record of a given kind may close exactly one track, and nothing
// else. A technical datasheet is not proof of the right to sell, of stock, of a
// price, of a warranty, of delivery, or of partner status.
export const EVIDENCE_KIND_CLOSES = Object.freeze({
  TECHNICAL_DATASHEET: 'claim_source_status',
  SALE_AUTHORIZATION: 'sale_authorization_status',
  PRICE_RECORD: 'price_status',
  STOCK_COUNT: 'stock_status',
  WARRANTY_TERMS: 'warranty_status',
});

// Assertions that are never derivable from any tracked field. They need their
// own evidence record, which the mock fixtures never supply.
export const STANDALONE_ASSERTIONS = Object.freeze({
  DELIVERY_AVAILABILITY: 'DELIVERY_AVAILABILITY',
  PARTNER_AUTHORIZATION: 'PARTNER_AUTHORIZATION',
});

export const WORKFLOW_STATE = Object.freeze({
  DRAFT: 'DRAFT',
  EVIDENCE_ATTACHED: 'EVIDENCE_ATTACHED',
  TECHNICAL_REVIEWED: 'TECHNICAL_REVIEWED',
  STOCK_CHECKED: 'STOCK_CHECKED',
  COST_CHECKED: 'COST_CHECKED',
  QUOTATION_DRAFTED: 'QUOTATION_DRAFTED',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  APPROVED: 'APPROVED',
  ORDER_CREATED: 'ORDER_CREATED',
  FULFILLED: 'FULFILLED',
});

export const ERROR_CODE = Object.freeze({
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  OWNER_DECISION_PENDING: 'OWNER_DECISION_PENDING',
  BLOCKED_EVIDENCE_MISSING: 'BLOCKED_EVIDENCE_MISSING',
  BLOCKED_SOURCE_UNAVAILABLE: 'BLOCKED_SOURCE_UNAVAILABLE',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  NOT_FOUND: 'NOT_FOUND',
});

export const PROVIDER_MODE = 'LOCAL_MOCK';
