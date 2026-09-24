// In-memory deterministic state, built from the synthetic fixture file.
// Nothing is read from or written to any external system.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { WORKFLOW_STATE } from './constants.mjs';
import { attachEvidence, emptyEvidence } from './evidence.mjs';

const SEED_PATH = fileURLToPath(new URL('../fixtures/seed.json', import.meta.url));

export function loadSeed() {
  return JSON.parse(readFileSync(SEED_PATH, 'utf8'));
}

export function createStore(seed = loadSeed()) {
  const skus = seed.skus.map((fixture) => {
    let evidence = emptyEvidence();
    for (const record of fixture.evidence_records) {
      evidence = attachEvidence(evidence, record);
    }
    return {
      sku_id: fixture.sku_id,
      name: fixture.name,
      category: fixture.category,
      supplier_id: fixture.supplier_id,
      evidence,
      // Standalone assertions are never seeded. Delivery availability and
      // partner authorisation stay unprovable in this prototype.
      standalone_assertions: [],
      mock_cost_units: fixture.mock_cost_units,
      mock_list_units: fixture.mock_list_units,
      mock_on_hand: fixture.mock_on_hand,
      workflow_state: WORKFLOW_STATE.DRAFT,
    };
  });

  return {
    data_class: seed.data_class,
    notice: seed.notice,
    epoch: seed.epoch,
    actors: seed.actors.map((actor) => Object.freeze({ ...actor })),
    suppliers: seed.suppliers.map((supplier) => ({ ...supplier })),
    customers: seed.customers.map((customer) => ({ ...customer })),
    purchase_orders: seed.purchase_orders.map((po) => ({ ...po })),
    providers: seed.providers.map((provider) => ({ ...provider })),
    skus,
    quotations: [],
    orders: [],
    fulfillments: [],
    technical_reviews: [],

    findActorByToken(token) {
      if (!token) return null;
      return this.actors.find((actor) => actor.mock_token === token) || null;
    },
    findActor(actorId) {
      return this.actors.find((actor) => actor.actor_id === actorId) || null;
    },
    findSku(skuId) {
      return this.skus.find((sku) => sku.sku_id === skuId) || null;
    },
  };
}
