export { ok, err, mapResult, flatMapResult } from "./result.ts";
export type { Result } from "./result.ts";
export { domainError } from "./errors.ts";
export type { DomainError } from "./errors.ts";
export { Money, MIN_SATANG, MAX_SATANG } from "./money.ts";
export { parseUUID, createIdGenerator, systemIds } from "./ids.ts";
export type { UUID, IdGenerator } from "./ids.ts";
export { createClock, fixedClock, systemClock } from "./clock.ts";
export type { Clock } from "./clock.ts";
export type {
  ActorContext,
  UserActorContext,
  SystemActorContext,
  Role,
  RoleGrant,
  RoleScope,
  VerificationTier,
} from "./actor.ts";
