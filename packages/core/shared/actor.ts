import type { UUID } from "./ids.ts";

// See ADR-0014: preserve distinct Blueprint §17.2 roles; AUTH-002 owns permissions.
export type Role =
  | "OWNER"
  | "AGENT"
  | "CLIENT"
  | "ADMIN"
  | "SUPPORT"
  | "OPERATOR"
  | "FINANCE"
  | "SUPER_ADMIN";
export type VerificationTier = "T0" | "T1" | "T2" | "T3" | "T4";
export type RoleScope =
  Readonly<{ type: "GLOBAL" }> | Readonly<{ type: "ORG"; orgId: UUID }>;
export interface RoleGrant {
  readonly role: Role;
  readonly scope: RoleScope;
}

interface Correlation {
  readonly requestId: string;
  readonly orgId: UUID | null;
}

export interface UserActorContext extends Correlation {
  readonly kind: "USER";
  readonly userId: UUID;
  readonly roles: readonly RoleGrant[];
  readonly tier: VerificationTier;
  readonly mfaVerified: boolean;
  /** Set only after server-side management and active-consent verification. */
  readonly onBehalfOf: UUID | null;
}

export interface SystemActorContext extends Correlation {
  readonly kind: "SYSTEM";
  readonly userId: null;
  readonly roles: readonly [];
  readonly serviceId: string;
  readonly jobId: UUID;
  readonly onBehalfOf: null;
}

/** Metadata for a trusted resolver, never evidence of authentication or permission. */
export type ActorContext = UserActorContext | SystemActorContext;
