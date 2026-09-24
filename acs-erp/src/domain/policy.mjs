// Approval policy.
//
// The owner has not supplied one. Until they do, the approval actor, limit and
// sequence are all OWNER_DECISION_PENDING and every approval-required state
// transition stops. This is the only policy the runtime can construct; the test
// suite supplies its own clearly-labelled fixture policy to exercise the steps
// that sit downstream of approval, and a test asserts the runtime cannot load it.

export const OWNER_DECISION_PENDING_POLICY = Object.freeze({
  policy_id: 'OWNER_DECISION_PENDING',
  supplied_by_owner: false,
  approval_actor: 'OWNER_DECISION_PENDING',
  approval_limit: 'OWNER_DECISION_PENDING',
  approval_sequence: 'OWNER_DECISION_PENDING',
  blocks_transitions: true,
});

export function isOwnerSuppliedPolicy(policy) {
  return Boolean(policy && policy.supplied_by_owner === true && policy.blocks_transitions === false);
}
