# acs-seo/tools

## `claim-scan.mjs`

Mechanical enforcement of the central Claim Register. Zero dependencies, Node ≥ 18.

```sh
node claim-scan.mjs <file|dir> [...]     # report; exits 1 if anything is BLOCKED
node claim-scan.mjs <path> --strict      # also fail on EVIDENCE_REQUIRED
node claim-scan.mjs <path> --fix         # redact BLOCKED figures in place
node claim-scan.mjs <path> --json        # machine-readable, for CI
node claim-scan.mjs <dir>  --all         # include governance files (normally skipped)
```

It covers checklist steps **M-5** (forbidden words) and **M-6** (every number maps to a
claim row). Rules trace to `../01_CLAIM_REGISTER.md`:

| Rule | CR row | Class | `--fix` redacts |
|---|---|---|---|
| `pct-range-improvement`, `pct-any` | CR-02 | BLOCKED | yes |
| `read-range`, `speed`, `accuracy` | CR-02 | BLOCKED | yes |
| `time-saving` | CR-09 | BLOCKED | yes |
| `material-certainty`, `environment-certainty`, `absolute-scope` | CR-01 | EVIDENCE_REQUIRED | no — needs a datasheet or a rewrite |
| `partner-claim`, `vendor-name` | CR-06 | EVIDENCE_REQUIRED | no — needs vendor authorisation |
| `customer-name`, `customer-implied` | CR-08 | OWNER_REQUIRED | no — needs the *customer's* consent |
| `company-tenure` | CR-10 | OWNER_REQUIRED | no — needs an ACS document |
| `availability`, `lead-time` | CR-15 | OWNER_REQUIRED | no — needs ACS stock and lead-time data |
| `local-support` | CR-16 | OWNER_REQUIRED | no — needs ACS confirmation of coverage |
| `price`, `price-range`, `price-in-words`, `price-relative`, `price-promo`, `price-scope` | CR-03 | OWNER_REQUIRED | no — needs the ACS price list with dates |
| `ranking`, `guarantee` | CR-04 | BLOCKED | no — needs a rewrite, not a deletion |

`--fix` replaces a figure with `⟦ลบตัวเลข CR-02 — รอหลักฐาน⟧` rather than deleting it
silently, so the hole stays visible until a writer rewrites the sentence. Re-running is
idempotent: redacted lines are skipped.

**Adding a rule here without adding its CR row to the register is a bug** — the register
is the source of truth, this file is only its enforcement.

## `evidence-check.mjs`

```sh
node evidence-check.mjs <package-dir> [...]          # exit 1 if any record is incomplete
node evidence-check.mjs <dir> --as-of 2027-01-15     # evaluate price validity at a date
```

`claim-scan.mjs` finds claims that need evidence; this checks the evidence actually
arrived. It reads a package's `audit.json` and any `*evidence*.json`, and fails when a
claim is marked CLEARED without a source URI, revision, date checked and reviewer — or
when a record quotes a figure with **no measured conditions**. That last rule is the one
that matters: a value measured under dry heat at 150 °C is not a claim about steam, and
quoting the number without its conditions turns evidence into a false claim while still
looking sourced.

### Price records have an expiry

A price record must carry `effective_date` **and** `valid_until`, and the check fails once
`valid_until` has passed, warns inside 30 days, and fails if the effective date never
reaches the reader's copy. A price with no expiry does not stay correct — it rots on a live
page while still looking sourced. **Run this on a schedule, not only at authoring time:** a
record that passes in September fails in January, and only the scheduled run catches it.

### Verified behaviour

`fixtures/sample-draft.md` carries the figures named in the Owner decisions. Against it the
scanner reports 10 BLOCKED and 1 OWNER_REQUIRED finding, `--fix` redacts 7 figures, and a
re-scan leaves only the three findings that correctly require a human: the price, the brand
ranking and the guarantee.

`fixtures/sample-material-draft.md` carries Queue #4's definitive material and environment
wording: 13 EVIDENCE_REQUIRED findings, 0 BLOCKED. The default gate passes it (exit 0) and
`--strict` fails it (exit 1), which is the intended split.

`fixtures/pkg-bad/` and `fixtures/pkg-good/` exercise `evidence-check.mjs`: the first
raises 12 problems including the missing-conditions trap, the second passes clean.

`fixtures/pkg-price-good/` and `fixtures/pkg-price-stale/` exercise the price rules. The
stale one raises 5 problems including an expiry that passed 84 days ago. The good one is
also a time-travel test: it passes at `--as-of 2026-09-22`, warns at `2026-12-10`, and
fails at `2027-01-15` — the same record, three answers, which is the behaviour a price
gate has to have.

## `cannibalisation-check.mjs`

```sh
node cannibalisation-check.mjs "<target intent>" [--url /proposed-path] [--json]
```

Tier 3 of the checklist as a command. **Run it before writing a package, never after** —
writing the article first and finding the collision afterwards produces work that may have
to be thrown away.

| Verdict | Exit | Meaning |
|---|---|---|
| `PROCEED` | 0 | No cluster, no overlapping live URL |
| `PROCEED_WITH_CANONICAL` | 0 | In a cluster that has an owner — write it as a modifier page |
| `REVIEW` | 0 | No cluster, but live URLs overlap the intent |
| `HOLD` | 1 | The URL already exists, or the cluster has no canonical owner yet |

Data lives in `../data/clusters.json` and `../data/live-inventory.json`. The inventory is
generated from `00_SOURCE_PACK_INDEX.md` §S-2 rather than maintained separately, so the two
cannot drift. **Setting `canonical_owner` on a cluster is an Owner decision**, not a code
change — every cluster is null today, which is why every in-cluster intent currently holds.

## `regression.sh`

```sh
./regression.sh          # 13 checks across both tools; exit 1 on any failure
```

Run it after any rule change. It has caught five real bugs — an ASCII-only word boundary
that silently dropped every Thai unit, a class tally that folded EVIDENCE_REQUIRED into
OWNER_REQUIRED, and an argument filter that discarded the target directory whenever the
flag was absent. That last one was then written a second time in a new tool, which is why
flag parsing now lives in `argv.mjs` and the suite tests both tools with and without their
flags. The fifth was the largest: **CR-06, CR-08 and CR-10 were rows in the register with
no rule enforcing them**, so a draft naming a vendor as a partner, naming a customer, and
claiming a company age passed a clean scan. Each of these would have shipped as a tool that
quietly under-reports, which is worse than having no tool at all.

### Governance files are skipped

Scanning a directory skips `claim_register.md`, `package_status.json`, `audit.json`,
`brief.md`, the numbered pack documents and the spec/runbook files, because they quote the
claims they govern and would otherwise report the register against itself. Pass a file
path directly, or `--all`, to scan one anyway.

### Known limits

- Regex, not comprehension. A figure written in words ("ราว ๆ เก้าสิบเปอร์เซ็นต์") is not
  caught. Tier 2B human review still applies.
- `\b` in JavaScript is ASCII-only, so Thai units must not be followed by it. This bug was
  found during testing — it silently dropped every `… เมตร` match. Keep Thai and Latin unit
  alternations separate when adding rules.
