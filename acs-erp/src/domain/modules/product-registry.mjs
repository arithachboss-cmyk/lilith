// Module 1 — Product & Evidence Registry.
import { ACTIONS, MODULES, WORKFLOW_STATE } from '../constants.mjs';
import { attachEvidence, commercialGates, missingTracks } from '../evidence.mjs';
import { notFound, procedure } from './shared.mjs';

const M = MODULES.PRODUCT_EVIDENCE_REGISTRY;

export const listSkus = procedure({
  module: M,
  action: ACTIONS.VIEW,
  name: 'listSkus',
  run: (ctx) =>
    ctx.store.skus.map((sku) => ({
      sku_id: sku.sku_id,
      name: sku.name,
      category: sku.category,
      supplier_id: sku.supplier_id,
      workflow_state: sku.workflow_state,
      evidence: sku.evidence,
      missing_tracks: missingTracks(sku),
      gates: commercialGates(sku),
    })),
});

export const getSku = procedure({
  module: M,
  action: ACTIONS.VIEW,
  name: 'getSku',
  run: (ctx, actor, { sku_id }) => {
    const sku = ctx.store.findSku(sku_id);
    if (!sku) throw notFound(`sku ${sku_id}`);
    return { ...sku, missing_tracks: missingTracks(sku), gates: commercialGates(sku) };
  },
});

export const createSku = procedure({
  module: M,
  action: ACTIONS.CREATE,
  name: 'createSku',
  run: (ctx, actor, { sku_id, name, category, supplier_id }) => {
    if (ctx.store.findSku(sku_id)) {
      const error = new Error(`INVALID_TRANSITION: ${sku_id} already exists`);
      error.code = 'INVALID_TRANSITION';
      throw error;
    }
    // A new SKU starts with every evidence track missing. Nothing is assumed.
    const sku = {
      sku_id,
      name,
      category,
      supplier_id,
      evidence: ctx.emptyEvidence(),
      standalone_assertions: [],
      mock_cost_units: null,
      mock_list_units: null,
      mock_on_hand: null,
      workflow_state: WORKFLOW_STATE.DRAFT,
    };
    ctx.store.skus.push(sku);
    return sku;
  },
});

export const attachEvidencePlaceholder = procedure({
  module: M,
  action: ACTIONS.EDIT,
  name: 'attachEvidencePlaceholder',
  run: (ctx, actor, { sku_id, kind, evidence_ref }) => {
    const sku = ctx.store.findSku(sku_id);
    if (!sku) throw notFound(`sku ${sku_id}`);
    sku.evidence = attachEvidence(sku.evidence, { kind, evidence_ref });
    if (sku.workflow_state === WORKFLOW_STATE.DRAFT) {
      sku.workflow_state = WORKFLOW_STATE.EVIDENCE_ATTACHED;
    }
    return { sku_id, evidence: sku.evidence, missing_tracks: missingTracks(sku) };
  },
});

export const exportRegistry = procedure({
  module: M,
  action: ACTIONS.EXPORT,
  name: 'exportRegistry',
  run: (ctx) => ctx.store.skus.map((sku) => sku.sku_id),
});
