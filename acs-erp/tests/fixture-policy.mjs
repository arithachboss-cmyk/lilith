// FIXTURE ONLY — NOT AN OWNER APPROVAL POLICY.
//
// This file exists so the test suite can exercise the steps that sit downstream
// of approval (create mock order, mock fulfillment, dashboard update). It is not
// an owner decision, it is not evidence that one exists, and it lives under
// tests/ so the runtime cannot reach it. A test asserts that nothing under src/
// imports this module.

export const FIXTURE_ONLY_APPROVAL_POLICY = Object.freeze({
  policy_id: 'FIXTURE_ONLY_NOT_AN_OWNER_POLICY',
  supplied_by_owner: true,
  blocks_transitions: false,
  approval_actor: 'ACTOR-0002',
  approval_limit: 100000,
  approval_sequence: ['MANAGER', 'CHAIRMAN'],
});
