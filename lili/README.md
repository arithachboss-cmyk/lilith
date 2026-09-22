# Lili — AI Sales & Co-agent Assistant (prototype)

Conversational intake for **The Middle Property**: Lili talks to a prospective tenant or a
co-agent, captures what they need, shows them a summary to check, and hands a traceable
request to the coordination team.

> **Origin note.** The prototype described in the original brief (Node app with
> `CONTRACT.md`, `DELIVERY.md` and a prepared OpenAI connector) did not reach this
> session — the repository contained only a static Lilith dashboard. This is a fresh
> implementation of that brief, built to be merged with the original if it turns up.

## Run it

```sh
cd lili
npm start            # → http://127.0.0.1:4180
npm test             # 59 scenario checks
```

No dependency install is needed: the server uses only the Node standard library
(Node ≥ 20). State is written to `lili/data/*.json`.

### Connect a live model (optional)

```sh
OPENAI_API_KEY=sk-... npm start
```

With no key the server runs in **demo mode** and makes no paid API call. The badge in the
header says which mode is actually running — it reads the server, it is not decorative.

| Variable | Default | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | *(unset)* | Enables the model layer. Server-side only. |
| `OPENAI_MODEL` | `gpt-4.1-mini` | Model id |
| `OPENAI_BASE_URL` | `https://api.openai.com` | Override for a proxy or a test double |
| `MODEL_TIMEOUT_MS` | `15000` | Per-attempt timeout |
| `MODEL_RETRIES` | `1` | Retries after the first attempt |
| `PORT` / `HOST` | `4180` / `127.0.0.1` | Listen address |
| `DATA_DIR` | `./data/` | JSON store location |

## Demo accounts

Switch with the buttons under the header. Role and account status come from the server;
the browser cannot claim either.

| Token | Role | Status | Can submit |
|---|---|---|---|
| `demo-tenant` | tenant | active | yes |
| `demo-agent-active` | co-agent | active | yes |
| `demo-agent-pending` | co-agent | pending | **yes** — pending may still submit |
| `demo-agent-suspended` | co-agent | suspended | no |
| `demo-agent-rejected` | co-agent | rejected | no |
| `demo-team` | team | active | yes, and only this role can confirm a request |

## What is in the box

```
server/
  index.js        HTTP routing, auth extraction, static files
  config.js       env + honest mode reporting
  auth.js         roles, account-status gates, record scoping
  schema.js       validation; drops unknown keys instead of merging them
  conversation.js slot-filling state machine
  nlu/rules.js    deterministic Thai/English extraction
  nlu/model.js    OpenAI Responses connector (structured output, timeout, retry)
  knowledge.js    verifiable answers + explicit "no data" topics
  readiness.js    missing fields and reasons — no invented score
  handoff.js      idempotent submission, status history, team-only transitions
  followup.js     Thai/English follow-up drafts (never sent automatically)
  events.js       append-only log, secrets redacted
public/           single-page UI, cream + deep green, Thai/English, mobile-first
tests/run.js      scenario tests
samples/          real transcripts produced by running the server
```

## Why no framework

The conversation is a bounded slot-filling machine: six slots, one review step, one
handoff. Every edge in it is a permission or validation decision that has to run on the
server anyway. LangChain or LangGraph would add a runtime surface without removing any of
that work, so the flow is plain code. If the flow later grows branches that genuinely need
orchestration — parallel tool calls, long-running human-in-the-loop steps — that is the
point to revisit, not before.

## Documents

- `CONTRACT.md` — data shapes, API, state machine, permission matrix, invariants
- `DELIVERY.md` — what works, what is demo, what is not connected, test results
- `samples/conversations.md` — transcripts captured from a real run
