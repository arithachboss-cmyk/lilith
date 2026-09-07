import type { ActorContext, RoleGrant, SystemActorContext } from "../actor.ts";
import type { UUID } from "../ids.ts";
import type { Result } from "../result.ts";

// Compile-only negative cases: tsc must verify these, not just the test runner.
export function assertTypes(
  actor: ActorContext,
  uuid: UUID,
  result: Result<number, string>,
): void {
  // @ts-expect-error Context is immutable.
  actor.requestId = "changed";
  // @ts-expect-error Organization role grants need an explicit organization.
  const missingScope: RoleGrant = { role: "AGENT", scope: { type: "ORG" } };
  // @ts-expect-error Unknown roles cannot acquire authority through a typo.
  const unknownRole: RoleGrant = { role: "ROOT", scope: { type: "GLOBAL" } };
  // @ts-expect-error A worker must identify its job and service.
  const missingJob: SystemActorContext = {
    kind: "SYSTEM",
    userId: null,
    roles: [],
    requestId: "request",
    orgId: null,
    onBehalfOf: null,
  };
  // @ts-expect-error Unvalidated strings cannot be assigned as a UUID.
  const rawId: UUID = "raw-client-input";
  if (actor.kind === "SYSTEM") {
    // @ts-expect-error SYSTEM actors cannot carry user role grants.
    actor.roles.push({ role: "ADMIN", scope: { type: "GLOBAL" } });
  }
  if (result.ok) {
    const value: number = result.value;
    // @ts-expect-error A success has no error payload.
    const error = result.error;
    void [value, error];
  }
  const scopedRole: RoleGrant = {
    role: "AGENT",
    scope: { type: "ORG", orgId: uuid },
  };
  void [missingScope, unknownRole, missingJob, rawId, scopedRole];
}
