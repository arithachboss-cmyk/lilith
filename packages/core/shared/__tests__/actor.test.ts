import { describe, expect, it } from "vitest";
import {
  createActorContext,
  ROLES,
  tierAtLeast,
  VERIFICATION_TIERS,
  type Role,
  type VerificationTier,
} from "../actor";

describe("createActorContext", () => {
  it("defaults everything it is not given to the least-privileged value", () => {
    const actor = createActorContext({ userId: "user-1", roles: [] });
    expect(actor.userId).toBe("user-1");
    expect(actor.roles).toEqual([]);
    expect(actor.orgId).toBeNull();
    expect(actor.tier).toBe("T0_UNVERIFIED");
    expect(actor.mfaVerified).toBe(false);
  });

  it("keeps what it is given", () => {
    const actor = createActorContext({
      userId: "user-1",
      roles: ["AGENT", "OWNER"],
      orgId: "org-1",
      tier: "T3_PROFESSIONAL",
      mfaVerified: true,
    });
    expect(actor.roles).toEqual(["AGENT", "OWNER"]);
    expect(actor.orgId).toBe("org-1");
    expect(actor.tier).toBe("T3_PROFESSIONAL");
    expect(actor.mfaVerified).toBe(true);
  });

  it("hasRole is true when the actor holds any of the roles asked for", () => {
    const actor = createActorContext({ userId: "user-1", roles: ["AGENT"] });
    expect(actor.hasRole("AGENT")).toBe(true);
    expect(actor.hasRole("OWNER", "AGENT")).toBe(true);
    expect(actor.hasRole("OWNER")).toBe(false);
    expect(actor.hasRole("ADMIN", "SUPPORT")).toBe(false);
    expect(actor.hasRole()).toBe(false);
  });

  it("removes duplicate roles", () => {
    const actor = createActorContext({
      userId: "user-1",
      roles: ["AGENT", "AGENT", "CLIENT"],
    });
    expect(actor.roles).toEqual(["AGENT", "CLIENT"]);
  });

  it("is immutable and independent of the caller's array", () => {
    const roles: Role[] = ["CLIENT"];
    const actor = createActorContext({ userId: "user-1", roles });
    roles.push("ADMIN");
    expect(actor.roles).toEqual(["CLIENT"]);
    expect(actor.hasRole("ADMIN")).toBe(false);
    expect(Object.isFrozen(actor)).toBe(true);
    expect(Object.isFrozen(actor.roles)).toBe(true);
  });

  it("refuses an empty user id, an unknown role and an unknown tier", () => {
    expect(() => createActorContext({ userId: "", roles: [] })).toThrow(
      TypeError,
    );
    expect(() =>
      createActorContext({ userId: "user-1", roles: ["ROOT" as Role] }),
    ).toThrow(TypeError);
    expect(() =>
      createActorContext({
        userId: "user-1",
        roles: [],
        tier: "T9" as VerificationTier,
      }),
    ).toThrow(TypeError);
  });
});

describe("roles and tiers", () => {
  it("match the blueprint lists", () => {
    expect(ROLES).toEqual(["OWNER", "AGENT", "CLIENT", "ADMIN", "SUPPORT"]);
    expect(VERIFICATION_TIERS).toEqual([
      "T0_UNVERIFIED",
      "T1_CONTACT",
      "T2_IDENTITY",
      "T3_PROFESSIONAL",
      "T4_OWNERSHIP",
    ]);
  });

  it("tierAtLeast follows the tier order for every pair", () => {
    VERIFICATION_TIERS.forEach((tier, tierIndex) => {
      VERIFICATION_TIERS.forEach((minimum, minimumIndex) => {
        expect(tierAtLeast(tier, minimum)).toBe(tierIndex >= minimumIndex);
      });
    });
  });
});
