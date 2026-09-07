# ADR-0014 — Shared kernel boundaries, localization and deterministic hashing

Status: accepted for ARCH-002 implementation; PR review pending.
Date: 2026-09-08
Predecessor: ARCH-001 PR #2, reviewed by Claude at `9334a4e`, merged as `762affe`.

## Decisions

1. Permit `core → i18n` and `worker → i18n` for MATCH-006 reasons, notifications and FEE-003 documents. i18n remains a dependency leaf. Numeric scoring and the pure Money/Result/error modules still cannot import localization; reason assembly is separate from scoring. Actual reason templates belong to MATCH-006.
2. Preserve the three-input deterministic scoring contract in §9.1/§9.6. SHA-256 over a supplied string is deterministic and needs no I/O. Do not accept a caller-selected hash algorithm or arbitrary injected hasher as an unrecorded fourth input. MATCH-001/004 will supply a fixed `sha256Utf8(string)` helper, with one narrowly reviewed named `createHash` import from `node:crypto` in `core/shared/hash.ts`. Only UTF-8 string input and lowercase SHA-256 hex output are permitted; no streams, files, entropy or shared mutable hash object. The broad crypto prohibition remains in this task; no unused exception or matching implementation is added prematurely.
3. Hash canonical normalized inputs: recursively ordered object keys, preserved array order, explicit UTF-8, monetary bigint represented as decimal strings, and rejected unsupported values. Profile identity must identify an immutable published revision. Evaluation time/derived freshness age must be captured in normalized inputs and hashed, never obtained from ambient time during scoring. These specify MATCH-001/004 acceptance details, without changing weights, constraints, thresholds, confidence formula or fee policy.
4. Money conversion is a pure, signed, PostgreSQL-int64 satang utility. `Money.fromBaht('12500.50')` returns `1250050n`; `Money.format` returns an ungrouped canonical two-decimal string. `Money.tryFromBaht(unknown)` returns Result for expected input failures. The strict convenience function uses that same parser and throws RangeError for invalid trusted/programmer input; HTTP/domain services must use the Result parser for untrusted amounts. Parsing never rounds. Workflow positivity/currency constraints remain in their owning tasks.
5. Core tests participate in `pnpm typecheck`; only build emission excludes tests/configuration. Add real workspace-cwd ESLint probes in CI with guaranteed cleanup, plus actual source/subpath and compiled-module loading checks. Advertise only implemented core subpath exports; AI/DB client subpaths are added when their corresponding modules exist.
6. Source exports remain TypeScript as in ARCH-001. Pin Node 24, enforce erasable TypeScript syntax, and rewrite relative `.ts` imports to `.js` in emitted builds. Test native Node loading and emitted JS so source exports work outside Next's transpiler too.

## Actor vocabulary and authority

The original user requirements include OPERATOR. Blueprint §8.2.1 lists SUPPORT, while §17.2 additionally distinguishes OPERATOR, FINANCE and SUPER_ADMIN. The shared actor type retains these distinct role names without assigning capabilities or equating SUPPORT with OPERATOR. ARCH-003/DB-001/AUTH-002 must reconcile their canonical schema/matrix with §17.2 before granting roles. This type-only vocabulary does not grant privileges or implement authorization.

Actor contexts distinguish USER and SYSTEM, retain GLOBAL/ORG role scope, and carry explicit correlation and delegation metadata. They can be produced only by trusted server resolution in AUTH tasks; structural typing, valid UUIDs and SYSTEM identity are never proof of authorization. There is no active-role shortcut or automatic system bypass.

## Source corrections and traceability

The nine imported Blueprint v1.0 files remain byte-identical. This ADR is an explicit amendment/clarification overlay for the sections named above; it does not silently rewrite the original source or manifest. Future tasks must read the original plus accepted ADRs.

§13.3's written satang example has a factor-of-100 typo: ฿12,500,000.00 is **1,250,000,000 satang**, matching §18.0. At the example's stated 10 bp, its illustrative fee is 1,250,000 satang, VAT 87,500 satang, and total 1,337,500 satang. This corrects units only; fee basis/payer and legal/tax decisions are not approved here and remain at their original gates.

## Alternatives

An injected arbitrary hash callback moves entropy/I/O out of a linted file but does not guarantee a reproducible hash. A fixed pure helper keeps the documented function inputs and algorithm stable. A pure-JavaScript SHA-256 implementation would also work, but introduces another dependency or security-sensitive implementation without a requirement to avoid the standard Node library.

## Follow-up ownership

- ARCH-002: kernel, exports, typechecked tests, i18n dependency directions and real lint probes.
- ARCH-003: canonical transport schemas/error registry and role vocabulary consistency.
- ARCH-004/AI-001: real DB/AI subpath exports when modules exist.
- MATCH-001/004/006: canonicalization/hash helper, deterministic freshness and bilingual reasons.
- Worker deployment task: configure no restart loop for unconfigured exit 78.
- DB-008: owner fee basis/payer decision; no billing policy is implemented by this ADR.
