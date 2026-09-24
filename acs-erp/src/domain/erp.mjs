// ERP runtime. Assembles the store, the audit log, the provider gateway and the
// approval policy into one context, and exposes the eight modules' procedures.
//
// The default policy is always OWNER_DECISION_PENDING. A caller may pass a
// different policy, which is how the test suite exercises the steps downstream
// of approval; the HTTP server never does.

import { createAuditLog } from './audit.mjs';
import { emptyEvidence } from './evidence.mjs';
import { OWNER_DECISION_PENDING_POLICY } from './policy.mjs';
import { createStore, loadSeed } from './store.mjs';
import { createProviderGateway } from '../providers/registry.mjs';

import * as productRegistry from './modules/product-registry.mjs';
import * as purchasing from './modules/purchasing.mjs';
import * as inventory from './modules/inventory.mjs';
import * as pricing from './modules/pricing.mjs';
import * as salesCrm from './modules/sales-crm.mjs';
import * as financeDocuments from './modules/finance-documents.mjs';
import * as fulfillment from './modules/fulfillment.mjs';
import * as dashboard from './modules/dashboard.mjs';

export function createErp({ seed = loadSeed(), policy = OWNER_DECISION_PENDING_POLICY } = {}) {
  const store = createStore(seed);
  const audit = createAuditLog({ epoch: store.epoch });
  const providers = createProviderGateway(store.providers);
  const ctx = { store, audit, providers, policy, emptyEvidence };

  const bind = (namespace) =>
    Object.fromEntries(
      Object.entries(namespace).map(([name, fn]) => [
        name,
        (actor, params) => fn(ctx, actor, params),
      ]),
    );

  return {
    ctx,
    store,
    audit,
    providers,
    policy,
    modules: {
      productRegistry: bind(productRegistry),
      purchasing: bind(purchasing),
      inventory: bind(inventory),
      pricing: bind(pricing),
      salesCrm: bind(salesCrm),
      financeDocuments: bind(financeDocuments),
      fulfillment: bind(fulfillment),
      dashboard: bind(dashboard),
    },
  };
}
