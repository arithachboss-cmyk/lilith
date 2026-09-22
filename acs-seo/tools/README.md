# acs-seo/tools

## `claim-scan.mjs`

Mechanical enforcement of the central Claim Register. Zero dependencies, Node ≥ 18.

```sh
node claim-scan.mjs <file|dir> [...]     # report; exits 1 if anything is BLOCKED
node claim-scan.mjs <path> --fix         # redact BLOCKED figures in place
node claim-scan.mjs <path> --json        # machine-readable, for CI
```

It covers checklist steps **M-5** (forbidden words) and **M-6** (every number maps to a
claim row). Rules trace to `../01_CLAIM_REGISTER.md`:

| Rule | CR row | Class | `--fix` redacts |
|---|---|---|---|
| `pct-range-improvement`, `pct-any` | CR-02 | BLOCKED | yes |
| `read-range`, `speed`, `accuracy` | CR-02 | BLOCKED | yes |
| `time-saving` | CR-09 | BLOCKED | yes |
| `price` | CR-03 | OWNER_REQUIRED | no — needs the Owner's price list |
| `ranking`, `guarantee` | CR-04 | BLOCKED | no — needs a rewrite, not a deletion |

`--fix` replaces a figure with `⟦ลบตัวเลข CR-02 — รอหลักฐาน⟧` rather than deleting it
silently, so the hole stays visible until a writer rewrites the sentence. Re-running is
idempotent: redacted lines are skipped.

**Adding a rule here without adding its CR row to the register is a bug** — the register
is the source of truth, this file is only its enforcement.

### Verified behaviour

`fixtures/sample-draft.md` carries the figures named in the Owner decisions. Against it the
scanner reports 10 BLOCKED and 1 OWNER_REQUIRED finding, `--fix` redacts 7 figures, and a
re-scan leaves only the three findings that correctly require a human: the price, the brand
ranking and the guarantee.

### Known limits

- Regex, not comprehension. A figure written in words ("ราว ๆ เก้าสิบเปอร์เซ็นต์") is not
  caught. Tier 2B human review still applies.
- `\b` in JavaScript is ASCII-only, so Thai units must not be followed by it. This bug was
  found during testing — it silently dropped every `… เมตร` match. Keep Thai and Latin unit
  alternations separate when adding rules.
