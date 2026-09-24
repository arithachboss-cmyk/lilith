// Role / permission matrix, enforced at the procedure layer.
// Nothing here knows about HTTP, HTML or any framework.

import {
  ACTIONS,
  ERROR_CODE,
  MODULES,
  ROLES,
  TECHNICAL_REVIEW_ACTION,
  VERDICT,
} from './constants.mjs';
import { OWNER_DECISION_PENDING_POLICY, isOwnerSuppliedPolicy } from './policy.mjs';

// Sentinel for the two actions the owner has reserved. It resolves to ALLOW
// only once an owner-supplied approval policy is in force, and to
// OWNER_DECISION_PENDING until then. It never resolves to DENY, because a
// permanent no is not what the owner said.
const OWNER_POLICY_GATED = 'OWNER_POLICY_GATED';

const ALL_MODULES = Object.freeze(Object.values(MODULES));
const ALL_ACTIONS = Object.freeze(Object.values(ACTIONS));

// Baseline capability per role, written once and expanded across every module
// so no module can quietly acquire a different rule.
//
// approve / export for Chairman and Manager resolve to OWNER_DECISION_PENDING
// rather than ALLOW: the owner has not supplied an approval policy, so the
// actor, the limit and the sequence are unknown. For every other role the
// baseline is a flat DENY — no role acquires commercial approval or export by
// implication.
const ROLE_BASELINE = Object.freeze({
  [ROLES.CHAIRMAN]: {
    view: VERDICT.ALLOW,
    create: VERDICT.DENY,
    edit: VERDICT.DENY,
    approve: OWNER_POLICY_GATED,
    export: OWNER_POLICY_GATED,
    technical_review: VERDICT.DENY,
  },
  [ROLES.MANAGER]: {
    view: VERDICT.ALLOW,
    create: VERDICT.ALLOW,
    edit: VERDICT.ALLOW,
    approve: OWNER_POLICY_GATED,
    export: OWNER_POLICY_GATED,
    technical_review: VERDICT.DENY,
  },
  [ROLES.ACCOUNT]: {
    view: VERDICT.ALLOW,
    create: VERDICT.ALLOW,
    edit: VERDICT.ALLOW,
    approve: VERDICT.DENY,
    export: VERDICT.DENY,
    technical_review: VERDICT.DENY,
  },
  [ROLES.STOCK]: {
    view: VERDICT.ALLOW,
    create: VERDICT.ALLOW,
    edit: VERDICT.ALLOW,
    approve: VERDICT.DENY,
    export: VERDICT.DENY,
    technical_review: VERDICT.DENY,
  },
  [ROLES.SALES]: {
    view: VERDICT.ALLOW,
    create: VERDICT.ALLOW,
    edit: VERDICT.ALLOW,
    approve: VERDICT.DENY,
    export: VERDICT.DENY,
    technical_review: VERDICT.DENY,
  },
  [ROLES.TECHNIC]: {
    view: VERDICT.ALLOW,
    create: VERDICT.ALLOW,
    edit: VERDICT.ALLOW,
    approve: VERDICT.DENY,
    export: VERDICT.DENY,
    technical_review: VERDICT.ALLOW,
  },
});

// technical_review only exists on the module that owns it.
function resolve(verdict, policy) {
  if (verdict !== OWNER_POLICY_GATED) return verdict;
  return isOwnerSuppliedPolicy(policy) ? VERDICT.ALLOW : VERDICT.OWNER_DECISION_PENDING;
}

function verdictFor(role, module, action, policy) {
  const baseline = ROLE_BASELINE[role];
  if (!baseline) return VERDICT.DENY;
  if (action === TECHNICAL_REVIEW_ACTION) {
    if (module !== MODULES.FULFILLMENT_TECHNICAL_REVIEW) return VERDICT.DENY;
    return resolve(baseline.technical_review, policy);
  }
  if (!ALL_ACTIONS.includes(action)) return VERDICT.DENY;
  // The executive dashboard is a read surface; nobody creates or edits it.
  if (
    module === MODULES.EXECUTIVE_DASHBOARD &&
    (action === ACTIONS.CREATE || action === ACTIONS.EDIT)
  ) {
    return VERDICT.DENY;
  }
  return resolve(baseline[action], policy);
}

/** The full matrix, materialised. Used by the UI and by the tests. */
export function permissionMatrix(policy = OWNER_DECISION_PENDING_POLICY) {
  const rows = [];
  for (const role of Object.values(ROLES)) {
    for (const module of ALL_MODULES) {
      const actions = {};
      for (const action of ALL_ACTIONS) {
        actions[action] = verdictFor(role, module, action, policy);
      }
      if (module === MODULES.FULFILLMENT_TECHNICAL_REVIEW) {
        actions[TECHNICAL_REVIEW_ACTION] = verdictFor(
          role,
          module,
          TECHNICAL_REVIEW_ACTION,
          policy,
        );
      }
      rows.push({ role, module, actions });
    }
  }
  return rows;
}

export function authorize(actor, module, action, policy = OWNER_DECISION_PENDING_POLICY) {
  if (!actor || typeof actor !== 'object') {
    return { verdict: VERDICT.DENY, reason: 'no actor supplied' };
  }
  if (actor.console_access !== true) {
    return { verdict: VERDICT.DENY, reason: 'actor has no ERP console access' };
  }
  if (!ALL_MODULES.includes(module)) {
    return { verdict: VERDICT.DENY, reason: `unknown module ${module}` };
  }
  const verdict = verdictFor(actor.role, module, action, policy);
  const reason =
    verdict === VERDICT.OWNER_DECISION_PENDING
      ? 'approval policy not supplied by owner: actor, limit and sequence are OWNER_DECISION_PENDING'
      : verdict === VERDICT.DENY
        ? `role ${actor.role} may not ${action} in ${module}`
        : 'permitted by role baseline';
  return { verdict, reason };
}

/**
 * Procedure-layer guard. Every service procedure calls this first; hiding a
 * control in the UI is never the enforcement point.
 */
export function requirePermission(actor, module, action, policy = OWNER_DECISION_PENDING_POLICY) {
  const { verdict, reason } = authorize(actor, module, action, policy);
  if (verdict === VERDICT.ALLOW) return;
  const code =
    verdict === VERDICT.OWNER_DECISION_PENDING
      ? ERROR_CODE.OWNER_DECISION_PENDING
      : ERROR_CODE.PERMISSION_DENIED;
  const error = new Error(`${code}: ${reason}`);
  error.code = code;
  error.module = module;
  error.action = action;
  error.actor_id = actor && actor.actor_id ? actor.actor_id : null;
  throw error;
}
