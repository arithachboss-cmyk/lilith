# LILITH implementation rules

The supplied Blueprint v1.0 is the architecture specification. Read `BLUEPRINT_README.md`, `IMPLEMENTATION_ORDER.md`, and the assigned task in `docs/07-codex-handoff.md` before changes. Consult the relevant numbered architecture document.

- One task, one branch (`feat/<TASK-ID>-slug`), one PR (`<TASK-ID>: <goal>`). Do not begin a task until its dependencies are merged.
- Mark Done only after every acceptance criterion and the listed CI tests pass. Report local verification separately from CI.
- Keep core framework-free, Prisma inside the DB package, routes behind core, AI outside business rules, and matching deterministic. Never weaken constraints, authorization or tests to obtain a pass.
- Preserve the root static prototype and unrelated local work. No production deployment or prototype disposition is part of ARCH-001.
- Record architecture interpretations in an ADR. Do not invent fee basis/payer or legal approvals.
- Update `docs/IMPLEMENTATION_STATUS.md` after meaningful phases. End a PR with `STATUS / EVIDENCE / RISKS / BLOCKERS / NEXT / OWNER APPROVAL`.

Foundation validation: `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test:boundaries`.

## Cursor Cloud specific instructions

- Put Node.js 24 first on `PATH` before foundation commands: `export PATH="/usr/local/bin:$PATH"`. Login shells also see Node 22 earlier on `PATH`. This monorepo requires Node 24 and pnpm 11.19.0, pinned in `packageManager`.
- No environment file is required for the foundation. Keep `AI_ENABLED=false`. `pnpm dev` serves http://127.0.0.1:3100.
- Do not start `apps/worker`. `pnpm --filter @lilith/worker start` exits 78 until PostgreSQL and pg-boss exist.
- `lili/` has no dependency install. `node server/index.js` serves http://127.0.0.1:4180 in demo mode when `OPENAI_API_KEY` is unset. From `lili/`, `node tests/run.js` runs the scenario checks. JSON under `lili/data/` is gitignored.
- The sibling checkout `creativex2026-chula-cea-arithach` is a static site. From that repo root, `python3 -m http.server 4173 --bind 127.0.0.1` previews http://127.0.0.1:4173. `.env.example` there is for a future hosted database and is not used by the static preview.
