# ADR-0015 — Shared kernel: how ARCH-002 reads the blueprint

Status: proposed; owner review pending.
Date: 2026-11-14

## Context

ARCH-002 asks for `Result`, `DomainError`, `ActorContext`, `Money`, id generation and an injectable `Clock` in `packages/core/shared`. Blueprint v1.0 fixes a few points exactly: money is `bigint` satang, `Money.fromBaht('12500.50')` is `1250050n`, formatting round-trips, and tests never read `Date.now()` directly. It shows the other shapes only through usage, so the choices below are interpretations and are recorded here.

## Decision

1. **Money is a set of functions over a `bigint` number of satang.** There is no wrapper class and no `number` anywhere in the module.
   - THB is the only currency; `Money.CURRENCY` is `"THB"`.
   - `Money.format` gives the plain decimal form (`"12500.50"`), the exact inverse of the acceptance example. `Money.formatBaht` gives the display form (`"฿12,500.50"`).
   - The parser is strict: an optional minus sign, an optional `฿`, whole baht either plain or correctly grouped in threes, and at most two decimal places. It rejects spaces, exponents, a third decimal place and wrong grouping; it never rounds input.
   - Amounts are limited to the range of a PostgreSQL `BIGINT`, the type of every `*_amount` column (§8).
   - `Money.parseBaht` returns a `Result` for user input. `Money.fromBaht` throws and is for values the code controls.
   - Rounding and splitting an amount are left to the fee engine (FEE-001). No fee rule, rate or payer is defined here.
2. **`Result` is a plain tagged union**: `{ ok: true, value }` or `{ ok: false, error }`. `ok` and `err` build it; the other helpers live on the `Result` object so the barrel does not export generic names such as `map`.
3. **`DomainError` is an immutable plain object**, not an `Error` subclass, because it travels in a `Result` and is never thrown.
   - `code` is a string that a caller can narrow with a type parameter. The canonical list of codes belongs to `packages/contracts` (ARCH-003, §18.0) and is not copied here.
   - `message` is English text for logs. The API edge resolves the localized `message_en` and `message_th` from `code`.
4. **`ActorContext` carries the three fields §5 names (`userId`, `roles`, `orgId`) and three members that the policy sample in §14.2 uses**: `tier`, `mfaVerified` and `hasRole(...)`.
   - Roles are the `user_roles.role` values of §8; tiers are the five of §3.3, in order.
   - `createActorContext` defaults everything it is not given to the least-privileged value: no organisation, `T0_UNVERIFIED`, MFA not verified.
   - Resolving a context from a session and `authorize()` remain AUTH-002. A context for background jobs is not defined yet.
5. **Ids are UUID v4 from Web Crypto**, the same kind `gen_random_uuid()` produces (§8). `IdGenerator` is injectable, and `sequentialIds()` gives well-formed, predictable UUIDs for tests.
6. **`Clock` is `{ now(): Date }`.** `systemClock` is the one implementation that reads the system time. `manualClock()` only moves when a test tells it to.

## Enforcement

- `packages/core/shared/{money,result,errors}.ts` were already listed as pure modules by the ARCH-001 boundary rule, so lint rejects ambient time, randomness, I/O or imports of non-pure modules in them.
- Core tests are now type-checked: `packages/core/tsconfig.json` includes `__tests__`, and only the build config excludes them.
- The foundation workflow gains one step, `pnpm test:core`, so the ARCH-002 tests run in CI before ARCH-005 builds the full pipeline.

## Consequences

- ARCH-003 can narrow `DomainError` codes and may move `Role` and `VerificationTier` into `packages/contracts` if the DTOs need them; core would then re-export them.
- Nothing here stops other core code from calling `new Date()` or `Date.now()`. A lint rule for that can come with the first module that depends on time.
- `packages/core` now exports `@lilith/core/shared`, the only core path `packages/ai` is allowed to import.
