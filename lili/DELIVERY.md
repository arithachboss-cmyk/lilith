# Lili — Delivery Note

**22 September 2026** · prototype, not production

---

## 1. Status in one line

A runnable prototype: both journeys work end to end against a real HTTP server with
persisted state, permission checks and 59 passing scenario checks. The model layer is
implemented and wired but **has never been run against a live API** — no key was provided
and calling a paid API without authorised configuration is out of scope.

## 2. What actually works

| Capability | State | Evidence |
|---|---|---|
| Tenant conversation, Thai + English | **working** | `samples/conversations.md`, tests §2 |
| Co-agent conversation, separate agent and client data | **working** | tests §6 |
| One question at a time, no re-asking an answered slot | **working** | tests §2 |
| Editing a requirement mid-conversation, and from the summary card | **working** | tests §3 |
| Edit withdraws a prior confirmation | **working** | tests §3 |
| Unknown fields dropped rather than stored | **working** | tests §3 |
| Answers from a verifiable knowledge base | **working** | tests §4 |
| Says "I don't know" instead of improvising | **working** | tests §4 |
| Readiness as missing fields + reasons, no score | **working** | tests §2, §4 |
| Submission creates a REQUEST, never a confirmed appointment | **working** | tests §5 |
| Duplicate submission suppressed | **working** | tests §5 |
| pending may submit; suspended and rejected refused server-side | **working** | tests §7 |
| Co-agent sees only their own records | **working** | tests §8 |
| Only the team can confirm a request | **working** | tests §8 |
| Status history and append-only event log | **working** | tests §8, §10 |
| Thai/English follow-up draft, marked manual-only | **working** | tests §9 |
| Model failure keeps data and is reported | **working** | tests §10 — exercised against a dead endpoint |
| Oversized body, malformed JSON, injection-shaped text | **working** | tests §11 |
| Mobile and desktop layout, no horizontal overflow | **working** | measured at 390 px and 1265 px: `scrollWidth == clientWidth`, zero overflowing elements |

## 3. What is demo, and honest about it

- **Accounts are seeded demo users.** There is no real signup, login, or partner registry.
  The header shows the real role and status of whoever is selected.
- **The knowledge base holds only the facts the owner stated** — service, 12-month lease,
  worldwide co-agents, free signup, per-deal success fee, matching not live, coverage.
  Everything else returns "I don't have verified information on that".
- **No availability, price, commission rate, track record or guarantee exists anywhere in
  the system**, not even as placeholder data. There is nothing to leak into a reply.
- **Storage is JSON files.** Fine for a prototype, not for production concurrency.

## 4. Not connected — the remaining integration points

| # | Integration | What is ready | What is needed |
|---|---|---|---|
| 1 | **Live model** | Full Responses connector: structured output, schema validation, timeout, retry, rule fallback | An `OPENAI_API_KEY` and a decision on model and spend. One env var; no code change. |
| 2 | **Real accounts** | `auth.js` is the single place role and status are resolved | Point `userByToken` at the real partner directory / identity provider |
| 3 | **Database** | `store.js` is the only module touching persistence | Replace `load`/`save` with the real database. No other file changes. |
| 4 | **Outbound messaging** | `followup.js` produces the Thai/English draft and marks it `manual_only` | An authorised channel (LINE OA, email) plus recipient permission. Deliberately not wired. |
| 5 | **Team notification** | Every submission raises a `submission_created` event | A consumer for that event |
| 6 | **Production site** | Nothing touches `middleproperty.online` | A decision on where this is embedded |

## 5. What was NOT done, and why

- **The production website, DNS, database and email were not touched.** Out of scope by
  instruction, and nothing here reaches them.
- **No paid API call was made.** The model path was verified against a closed port to
  prove the failure behaviour, not against OpenAI.
- **Success fee rates are absent everywhere.** The owner states the fee is agreed per deal
  before any obligation, so quoting a number would be inventing one. Lili says that
  explicitly when asked.
- **The attached prototype was not extended, because it never arrived** — the repository,
  `/mnt/attach` and `/mnt/user-data/working` were all checked and contained no Node app,
  no `CONTRACT.md` and no `DELIVERY.md`. This is a fresh build against the written brief.
  If the original appears, the pieces worth merging are `knowledge.js`, `readiness.js` and
  `handoff.js`, which hold the business rules.

## 6. Two defects found and fixed during testing

| Defect | Symptom | Fix |
|---|---|---|
| Oversized request body | Server destroyed the socket before replying — the client saw `ECONNRESET` instead of a status | Stop buffering, reply `413`, close after the response flushes |
| Language flipped on contact details | Typing `agent@example.com` switched the conversation to English mid-flow | `detectLanguage` returns null when text carries no language signal; the conversation keeps its current language |

A third was a cosmetic finding: Lili repeated the "please confirm the summary" line on
every turn. It now repeats only when something changed.

## 7. Test run

```
passed 59   failed 0
all scenario checks passed
```

Reproduce with `npm test`. The suite runs the real server on an ephemeral port with a
throwaway data directory and covers: mode honesty, both journeys, editing, incomplete
data, out-of-knowledge questions, submission and duplicates, account-status gating, data
separation and permissions, follow-up drafting, model failure, and input hygiene.
