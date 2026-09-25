# QA ROLE PACK — for Grok

**Prepared by:** Claude · **Date:** 2026-09-25 · **Owner:** ACS Owner (Yacht)
**Subject:** what a QA role may and may not do on this codebase
**Status:** briefing only. Nothing here authorises code, migrations, deployment or publication.

---

## 0 · Read this page before anything else

> **Note on the checker and this file** — §0.1 cites both fee figures so as to put the
> contradiction in front of the reader. `node acs-seo/tools/redact.mjs docs/GROK-QA-ROLE-PACK.md`
> therefore reports two findings — `FW-E-001` on the percentages and `FW-O-001` on the two baht
> amounts — and **zero BLOCK hits**. Both are a **reference made in order to prohibit**, not a claim.
> Left as is deliberately: a brief that cannot spell out what must not be said does not do its job.
> `validate.mjs` scans only files destined for the live site; this file is not one and never will be.

### 0.1 Why this pack exists

Two incidents, both real, both in this portfolio.

**The first is why any briefing pack exists here.** A blueprint produced elsewhere stated a success
fee of ฿17,800,000 on a ฿280,000,000 asset — **6.36%** — while the only fee rate recorded anywhere
in this portfolio is **0.1%**. That is **63.6× too high**, and it was written as a worked example an
implementer would have copied.

**The second is a QA failure specifically, and it happened in this repository on 2026-09-25.**

Claude added a regression test asserting that a cluster's canonical-owner URL "appears somewhere in
the generated document." The test passed. It could never have failed — that URL always appears in
the same row's `competing_urls` list regardless of the bug. It was rewritten to read the canonical
owner column of that row, and only then did it fail when the defect was put back.

In the next round the same lesson had to be learned again at larger scale: six defect classes were
reintroduced one at a time to check the new test suite, and **two of the six were caught by nothing
at all**. The unit tests called the module directly, so unwiring the caller left them all green.

> A test that cannot fail is not a test. It is false confidence with a maintenance cost.

That is why rule 1 below is rule 1.

### 0.2 The single most important fact

> **There are 15 recorded acceptance criteria for the AMI work. 3 are automated. 12 are not.
> And the entire monorepo contains exactly one test file.**

- `hr-screens/codex/contract/acceptance.json` — 15 criteria, `automated: true` on `AC-01`, `AC-02`,
  `AC-03` only
- `packages/config/__tests__/boundaries.test.ts` — the only `*.test.*` file in `apps/` or
  `packages/`. It holds 84 tests
- 8 of the 9 workspaces have no `test` script at all (`@lilith/web`, `@lilith/worker`, `@lilith/ai`,
  `@lilith/contracts`, `@lilith/core`, `@lilith/db`, `@lilith/i18n`, `@lilith/ui`)

Those two statements are consistent, and the reason matters. The three automated criteria are not
automated by a test file — commit `605d21e`, *"make the tests the task card specified actually
exist"*, implemented them as **additional assertions inside `hr-screens/codex/check-contract.mjs`**
and wired that script into CI. It changed exactly two files and added no test file. So "automated"
here means "the contract checker asserts it", not "a test suite covers it".

**The 12 unautomated criteria are the QA work.** They are already written, already agreed, and
already tied to a task each. Nothing needs to be invented to start.

### 0.3 Three things that must not merge in your head

| | `lilith` repository | Lovable project `8f4f3787` | `hr-screens/` prototype |
|---|---|---|---|
| What it is | the monorepo under review | a separate deployed app | a zero-dependency HTML/CSS/JS mock |
| Is its code here? | yes | **no** | yes, but it is not the product |
| Runs in CI? | yes (`.github/workflows/arch-001.yml`) | no | contract checker only |
| Safe to write tests against? | yes | not from here | it is a specification artefact, not the implementation |

`hr-screens/` is the trap. It looks like a working app because it is one — `node hr-screens/serve.mjs`
serves six screens on `http://127.0.0.1:4300`. It is a **mock built from synthetic fixtures**
(`hr-screens/data.js`). Testing it proves nothing about `apps/web`, which does not yet contain these
screens. When you cite something, say which of the three it came from.

### 0.4 Rules that apply to every topic below

1. **A test that cannot be shown to fail is not a test.** Reintroduce the defect, watch it go red,
   restore. If nothing goes red, the test is decoration — say so and rewrite it.
2. **Never weaken a rule, a constraint, an assertion or a type to obtain a pass.** `AGENTS.md`:
   *"Never weaken constraints, authorization or tests to obtain a pass."* If a rule is wrong,
   propose the change and say why; do not make it yourself to clear a failure.
3. **Never skip, disable or quarantine a test** to get a green run.
4. **"Flake" is not a root cause.** A re-run is justified only when the job died before any test body
   executed (checkout, install, runner loss), or when the same commit passed earlier. Once. A second
   failure is real.
5. **Equal pass/fail counts are not evidence** when one change loosens and another tightens — a
   package can newly pass one check and newly fail another with the totals unmoved. Compare the full
   output (`validate.mjs --json`: every finding and every tier) against a baseline taken before the
   change.
6. **Report local verification separately from CI.** `AGENTS.md` requires this. They are not the same
   environment — see §3.
7. **Every number needs a source.** Cite a file path, or write `UNSOURCED` next to it. Do not
   estimate, do not round, do not carry a number over from an older document without re-running it.

---

## 1 · What QA means on this project, and what it does not

QA here is **the role that decides whether a claim about the system has been demonstrated**. It is
not the role that writes the feature, and it is not the role that decides whether the feature was
worth building.

Three kinds of claim need demonstrating, and they have different gates:

| Kind of claim | Example | Gate |
|---|---|---|
| The code does what it says | role resolution refuses a role the user does not hold | tests in `packages/` and `apps/` |
| The contract matches the design | the six roles and their call signs match the brief | `hr-screens/codex/check-contract.mjs` |
| The published wording is supportable | a page does not assert something without evidence | `acs-seo/tools/validate.mjs` + `redact.mjs` |

A QA role that only covers the first is covering a third of this project.

---

## 2 · FACT — gates that exist and ran today

Every number in this section was produced by running the command on 2026-09-25, not copied from a
previous document.

| Command | What it checks | Result today |
|---|---|---|
| `node hr-screens/codex/check-contract.mjs` | contract files match `data.js`; six roles, Grok ids and call signs; bilingual strings complete | **274/274, exit 0** |
| `node acs-seo/tools/selftest.mjs` | the governance rules still function — every rule still matches its own samples | **163 assertions, all pass** |
| `node acs-seo/tools/validate.mjs` | mechanical QA of every content package | **PASS=20 FAIL=0** |
| `node acs-seo/tools/validate.mjs --fixtures` | the same, plus deliberate negative fixtures | **PASS=24 FAIL=4** — the 4 are meant to fail |
| `pnpm test:boundaries` | cross-package import restrictions | **84 tests pass** |
| `node acs-seo/tools/redact.mjs <file>` | wording the claim register forbids | per file |
| `node acs-seo/tools/evidence-check.mjs` | evidence completeness and price expiry | per package |

Two of these deserve a note.

**`--fixtures` reporting `FAIL=4` is the correct result.** Four fixtures exist in order to fail:
`__fixture-violations__`, `__fixture-cannibal__`, `__fixture-private-claims__` and
`__fixture-body-links__`. A run reporting `FAIL=0` there would mean the checker had stopped working.
Do not "fix" them.

**`evidence-check.mjs` must run on a schedule, not on file change.** Price evidence expires by the
calendar, not because somebody edited a file. A package that passed last month can be failing today
with nothing changed.

---

## 3 · FACT — what test infrastructure actually exists

This is smaller than it looks from the outside, and the gaps are the point.

**Runner:** `vitest` 5.0.0, declared in **`packages/config/package.json` only**. It is not a root
dev-dependency. Any other workspace that needs it must add it first.

**Browser/E2E:** **none declared by this repository.** `playwright` appears in `node_modules` as a
transitive dependency of something else; no `package.json` in `apps/`, `packages/` or the root
declares it. There is no browser-test harness to write `AC-13`, `AC-14` or `AC-15` against yet.

**CI** — `.github/workflows/arch-001.yml`, on pull request and on pushes to three branches:

```
pnpm install --frozen-lockfile → pnpm build → pnpm typecheck → pnpm lint
→ pnpm test:boundaries → node hr-screens/codex/check-contract.mjs
→ git diff --exit-code -- pnpm-lock.yaml
```

Two facts about CI that a QA role must hold on to:

**① CI does not run any `acs-seo` gate.** Not `selftest.mjs`, not `validate.mjs`, not
`evidence-check.mjs`, not `redact.mjs`. A pull request that changes content packages, claim rules or
forbidden-term patterns passes CI **without a single one of those 163 assertions executing**. Those
gates exist only on whoever's machine remembers to run them.

**② CI and local run different major versions of Node.** The workflow pins `node-version: "24"`.
The root `package.json` declares `"engines": { "node": ">=24 <25" }`. This container runs
**v22.22.2**, and pnpm prints an unsupported-engine warning on every command. A result obtained here
is not automatically a result CI will reproduce — which is exactly why rule 6 exists.

Neither of these is a defect to fix unasked. Both are facts to state in any report.

---

## 4 · FACT and ASK — the 12 criteria with no test

From `hr-screens/codex/contract/acceptance.json`. The `how` field of each already proposes a method;
it is a proposal, not a decision.

| Task | Criteria | What must be demonstrated |
|---|---|---|
| AMI-003 | `AC-04` `AC-05` `AC-06` | a request with no session returns no panel name and no fixture value · setting `active_role` client-side does not reveal another role's data · unknown permission renders a waiting state that does not leak how many items were withheld |
| AMI-004 | `AC-07` `AC-08` `AC-09` | every panel payload validates against `panel-payloads.schema.json` · the ops panel always returns all five lanes, empty ones as empty arrays rather than omitted · a statement without `source_ref` is never emitted as fact |
| AMI-005 | `AC-10` `AC-11` `AC-12` | no route writes a match score and no component can edit one · no control anywhere overrides the Keeper or reveals everything · no endpoint response carries a field named like a key, token or secret |
| AMI-006 | `AC-13` `AC-14` `AC-15` | the role bar is fully keyboard operable with visible focus · no horizontal overflow across the stated width range · `prefers-reduced-motion` respected, nothing plays by itself |

**The blocker is not the tests. It is that AMI-002…007 are not built.** `packages/i18n/src/ami` and
`apps/web/src/app/api` do not exist. `docs/IMPLEMENTATION_STATUS.md` records AMI-001 as the current
task with AMI-002 onward not started.

So the honest QA answer to "where are the tests for screen AMI-006" is **"there are none, and the
screen does not exist either."** What can be done now is write the tests that will gate those
screens when they arrive — which is the correct order, not a consolation prize.

`AC-10`, `AC-11` and `AC-12` are the unusual ones: they assert that something is **absent** from the
code. An absence test is easy to write and easy to write uselessly (see §0.1). Each needs a
demonstration that it fails when the forbidden thing is added.

---

## 5 · Working with Developer, BA, SA and PM

**Source note:** these four roles come from a job advertisement the Owner described to me. I have
not seen it. They are used here as a **model of who decides what**. They are not a statement that
this business employs these people, and nothing here should be repeated as one —
`acs-seo/data/forbidden_terms.json` rules `FW-O-012` and `FW-O-015` require confirmed company
documentation before any claim about a team, and that documentation (`SRC-ACS-004`) has not been
supplied.

| Role | Decides | QA's question to them |
|---|---|---|
| **BA** | what outcome the business needs | is this acceptance criterion the one the business actually wants demonstrated? |
| **SA** | how the system is shaped to deliver it | where is the boundary this test should sit on — route, service or schema? |
| **Developer** | how the code implements it | what did you change, and what would make it wrong? |
| **PM** | what ships and when | this criterion has no test and no harness; do we hold, or ship with it stated as untested? |
| **QA** | whether it has been demonstrated | — |

The two failure modes to avoid:

**QA deciding scope.** If a criterion looks wrong, that is a question for BA, not a licence to test
something else instead.

**QA accepting "it works" as evidence.** A demonstration is a command someone else can run and a
result they can see. In this repository there is a precedent for what that means: a change was
verified not by its pass count but by diffing the complete `--json` output against a baseline, and
by reintroducing six defects one at a time to prove the tests could catch them.

Within the AMI structure this maps to the existing pairing: the role holder owns accountability, the
Grok id supplies intelligence, and the boundary between them is the point of the whole design. QA
sits on the accountability side. A Grok playing QA **proposes and demonstrates; it does not sign off.**

---

## 6 · UNDECIDED — ask, do not choose

- **What runs integration and contract tests.** `vitest` exists in one package. Nothing is set up for
  HTTP-level or DOM-level testing. Adding a runner is a dependency decision with lockfile
  consequences, and CI verifies the lockfile did not change.
- **What measures `AC-14`.** The criterion names a pixel width range. No browser harness is declared.
- **Whether `acs-seo` gates should join CI.** Stated as a fact in §3, not as a recommendation. It
  changes what a pull request costs and who gets blocked.
- **Who accepts a test as sufficient.** `acceptance.json` says what must be true. It does not say who
  signs that it now is.
- **Whether the Node version gap gets closed, and which way.**

---

## 7 · FORBIDDEN

- **Editing `hr-screens/codex/contract/role-registry.json` or `screens.json` by hand.** Both are
  generated by `build-contract.mjs`; the checker fails if they drift.
- **Validating `data.js` using values read from `data.js`.** The checker embeds the brief's table
  inside itself for exactly this reason. Reading from the source you are validating validates nothing.
- **Letting the client decide `role_id`** — for example deriving it from an email address.
  `hr-screens/HANDOFF.md` §3 forbids it.
- **Moving the Keeper's disclosure decision to the UI.** Decision `D-AMI-02` puts it server-side,
  after `authorize()`, on the stated ground that a UI-side Keeper *"is hiding, not gating."* Recorded
  as not reversible.
- **Changing a rule, a threshold or an assertion so a failing thing passes.** See rule 2.
- **Reporting a CI result you did not see, or presenting a local result as a CI result.**
- **Inventing a customer case, a statistic, a partnership or a named person** to illustrate a test.
  `FW-O-016` is explicit that consent belongs to the customer, not to us, and that removing the name
  does not help.
- **Asserting that this business has a QA, Developer, BA, SA or PM team.** See §5.

---

## 8 · ASK

1. Which of the 12 criteria should be written first, given that the code they gate does not exist yet?
2. Should a test runner for integration and contract tests be added now, or should the 12 wait until
   AMI-002…007 land?
3. Do the `acs-seo` gates belong in CI? If yes, blocking or reporting only?
4. For `AC-10`/`AC-11`/`AC-12` — absence assertions — is a static check over the source acceptable,
   or must there be a runtime demonstration?
5. Who signs that a criterion is met?

---

## 9 · How to tell whether this pack worked

Ask Grok one question whose answer is already known: **"Where are the tests for the AMI-006 screens?"**

- ✅ **Correct:** it answers that there are none, and that the screens do not exist either — AMI-001
  is merged and AMI-002 onward are not started — then offers to write the tests that will gate them.
- ❌ **Failed:** it names a plausible path such as `apps/web/__tests__/ami-006.test.ts`, or describes
  what those tests currently cover.

The first answer shows the pack transferred a fact together with its limit. The second shows it
transferred an expectation of what a repository like this usually contains.

If the answer is the second kind, §0.2 and §4 are not written strongly enough and this pack should be
revised before real work is handed over.

---

## 10 · Scope of this pack

It does not authorise code, schema or migrations · does not enable any database · does not approve
publication · does not add a dependency · does not change CI · does not decide any item in §6. It is
handed to the Owner, who forwards it.

Source of every claim above is a path in the `lilith` repository or a command run on 2026-09-25 and
reported with its output. The four collaborating roles in §5 are the one exception and are marked as
such. Anything without such a source is not in this document.
