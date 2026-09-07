# Shared kernel — ARCH-002

Framework-free utilities under `packages/core/shared/`. They introduce no database, HTTP endpoint, authentication or fee workflow. Import the narrowest implemented subpath, such as `@lilith/core/shared/money`; the shared barrel and all six named subpaths also resolve. Source exports use erasable TypeScript under Node 24; emitted build imports are rewritten to JavaScript and tested separately.

## Money

Amounts are bigint satang within PostgreSQL's signed 64-bit range, inclusive: -9,223,372,036,854,775,808 through 9,223,372,036,854,775,807. `Money.fromBaht('12500.50')` returns `1250050n`. `Money.format(-1n)` returns `'-0.01'`. Formatting is canonical, ungrouped, two decimal places; negative zero becomes `'0.00'`.

For untrusted input use `Money.tryFromBaht(unknown)`, returning `Result<bigint, DomainError<'VALIDATION_FAILED'>>`. It never coerces arbitrary values, trims whitespace, accepts grouping/exponents, silently rounds fractional digits, or uses floating point. It limits input length before BigInt conversion. The strict convenience parser `fromBaht` delegates to the same implementation and throws RangeError for invalid programmer input. The formatter rejects non-bigint and out-of-range amounts at runtime as well as requiring bigint statically.

Baht/satang conversion does not decide currency, positivity, pricing, tax, fee basis or payer. Domain/DTO constraints belong to their owning tasks. Monetary JSON serialization will use decimal strings in ARCH-003; do not convert bigint to Number for transport.

## Results and errors

`ok(value)` and `err(error)` create frozen discriminated result envelopes. `mapResult` transforms a success; `flatMapResult` chains an operation returning Result. Both propagate existing errors without invoking the callback. Envelopes are shallowly frozen; application payloads keep their own immutability contract.

`domainError(code, message, options?)` produces a frozen error value with `retryable: false` by default and a copied, frozen field-error map. It contains no HTTP status, stack, actor or input value. Expected business failures return Result; programmer/provider failures may throw and must be handled by the server boundary. ARCH-003 owns the canonical error-code registry and public error envelope.

## Actor metadata

`ActorContext` is a readonly USER/SYSTEM union. User contexts carry validated UUID identity, verification tier, MFA status, scoped role grants, organization, correlation and explicit delegation. System contexts carry service/job identity and an empty user-role tuple. `GLOBAL` and `ORG` grants are distinct, and ORG grants require an organization ID.

These types are not runtime validation or authorization. Never deserialize client-supplied actor metadata into a trusted context. AUTH tasks must resolve the context from a secure session/job identity and check permissions, ownership and active delegation consent server-side. A SYSTEM context receives no implicit bypass. ADR-0014 tracks role vocabulary across the original requirements and Blueprint sections; no role capabilities are granted here.

## Clock and IDs

Pass `Clock` and `IdGenerator` dependencies to services. `fixedClock(epochMilliseconds)` gives deterministic time; `createClock(read)` validates each injected read as integer epoch milliseconds within the Date range. `systemClock` is the explicit ambient adapter and reads wall time only when called. Tests use fixed/injected time or a controlled fake timer, never direct `Date.now()` calls.

`parseUUID(unknown)` validates canonical UUID syntax (versions 1–8, RFC variant), normalizes case, and returns a branded UUID in Result. Syntax does not prove a record exists or belongs to an actor. `createIdGenerator(generate)` validates each generated value and throws on an invalid provider result without substituting randomness. It accepts any supported UUID version for injected implementations; `systemIds` specifically uses Node's cryptographic UUID v4 generator. Neither adapter reads time/entropy on module import.

## Verification

`pnpm check` runs builds, strict typecheck (including negative type fixtures), lint, unit/property tests, real-file workspace lint probes and native package-export checks. Kernel coverage enforces the Blueprint §22.1 overall minimum of 80%; future score, transition and fee-engine files retain their separate 95% target. The property test covers 10,000 signed-int64 values with a recorded repeatable seed, plus explicit endpoints, overflow and malformed-input cases.

The lint probes use exclusive temporary files, execute each workspace's actual lint script from its own cwd, require exit 1 plus both boundary rule IDs, and remove only their own files/directories in finally blocks. Run sequentially, after ordinary lint; do not overlap with builds. These are foundation checks, not the ARCH-005 integration/release pipeline.
