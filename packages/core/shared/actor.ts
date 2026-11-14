// `user_roles.role` in Blueprint §8.
export const ROLES = ["OWNER", "AGENT", "CLIENT", "ADMIN", "SUPPORT"] as const;
export type Role = (typeof ROLES)[number];

// Blueprint §3.3, lowest to highest.
export const VERIFICATION_TIERS = [
  "T0_UNVERIFIED",
  "T1_CONTACT",
  "T2_IDENTITY",
  "T3_PROFESSIONAL",
  "T4_OWNERSHIP",
] as const;
export type VerificationTier = (typeof VERIFICATION_TIERS)[number];

/**
 * Who is acting. Every domain service takes one explicitly; core never reads
 * identity from ambient state (Blueprint §5, §7.2).
 */
export interface ActorContext {
  readonly userId: string;
  readonly roles: readonly Role[];
  readonly orgId: string | null;
  readonly tier: VerificationTier;
  readonly mfaVerified: boolean;
  /** True when the actor holds at least one of the given roles. */
  hasRole(...roles: readonly Role[]): boolean;
}

export interface ActorContextInput {
  readonly userId: string;
  readonly roles: readonly Role[];
  readonly orgId?: string | null;
  readonly tier?: VerificationTier;
  readonly mfaVerified?: boolean;
}

export function tierAtLeast(
  tier: VerificationTier,
  minimum: VerificationTier,
): boolean {
  return (
    VERIFICATION_TIERS.indexOf(tier) >= VERIFICATION_TIERS.indexOf(minimum)
  );
}

/**
 * Builds an immutable context. Anything left out takes the least-privileged
 * value: no organisation, tier T0 and MFA not verified.
 */
export function createActorContext(input: ActorContextInput): ActorContext {
  if (input.userId.length === 0)
    throw new TypeError("ActorContext userId is required");
  const tier = input.tier ?? "T0_UNVERIFIED";
  if (!VERIFICATION_TIERS.includes(tier))
    throw new TypeError(`Unknown verification tier: ${String(tier)}`);
  for (const role of input.roles) {
    if (!ROLES.includes(role))
      throw new TypeError(`Unknown role: ${String(role)}`);
  }
  const roles = Object.freeze([...new Set(input.roles)]);
  return Object.freeze({
    userId: input.userId,
    roles,
    orgId: input.orgId ?? null,
    tier,
    mfaVerified: input.mfaVerified ?? false,
    hasRole: (...wanted: readonly Role[]) =>
      wanted.some((role) => roles.includes(role)),
  });
}
