# Lilith Homes International Real Estate Pipeline

## LILITH by THE MIDDLE — matching platform

New application route: **`/middle`**. The existing public homepage, lead intake, dashboard and tiered agent inventory are preserved.

The first implementation batch adds actual D1-backed role onboarding, owner supply, client requirements, deterministic matching, two-sided interest, private deal rooms, chat and viewing requests/confirmation. It includes transactional audit/events and ownership checks. It does **not** yet implement negotiation, signed agreements, closing, collected fees or Lilith AI. See [implementation status](docs/IMPLEMENTATION_STATUS.md).

Use Node 24 and the repository's pnpm lockfile:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm dev
```

On a Mac where the current Playwright Chromium build is unsupported, use installed Chrome: `PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e`. Browser tests run the compiled Worker with a temporary **real SQLite database** and test-only trusted identities on a loopback ingress. They do not mock product API responses or certify hosted sign-in.

For an existing local development D1 database without the new matching tables, build first and apply the additive migration locally:

```sh
pnpm build
pnpm exec wrangler d1 execute DB --local --persist-to .wrangler/state --config dist/server/wrangler.json --file drizzle/0007_lame_microbe.sql
```

Apply that file once; inspect existing migration state before reapplying. The explicit `--persist-to .wrangler/state` is required to share the development server database and survive rebuilds; the generated config lives under disposable `dist/`. Production Sites packaging includes the ordered Drizzle migrations and requires a reviewed deployment. No schema is created silently during application requests. The migration seeds only role vocabulary and a fee policy, never users/listings/deals.

`.env.example` lists the operator email, existing import token, and optional matching weights. Production sign-in is dispatcher-owned Sites authentication; local application code contains no fake login or role bypass. Raw identity headers are trustworthy only behind that authenticated ingress.

Plain `pnpm dev` does not implement the dispatcher-owned `/signin-with-chatgpt` route; completing interactive sign-in requires a Sites-hosted staging environment. Use the isolated Playwright journey for local end-to-end validation. The temporary development server was stopped after this batch's verification.

Architecture and contracts: [Architecture / ADRs](docs/ARCHITECTURE.md), [Domain](docs/DOMAIN_MODEL.md), [Matching](docs/MATCHING_ENGINE.md), [State machine](docs/DEAL_STATE_MACHINE.md), [API](docs/API.md), [Security](docs/SECURITY.md), [Events](docs/EVENT_SCHEMA.md), [Lilith AI status](docs/AI_LILITH.md).

The platform is being implemented in reviewable batches. Passing the first vertical slice is not a claim of production readiness or completion of 38 independent screens.

ระบบรับและจัดการ lead อสังหาไทยสำหรับลูกค้าไทย จีน อังกฤษ และรัสเซีย รองรับเช่า ซื้อ ขาย/listing และ China agent referral พร้อม public form, dashboard, SEO on-page และ CSV/JSON import API

## Production

- Public rental brief: `https://lilith-renter-leads.yacht369.chatgpt.site`
- Private operator dashboard: `https://lilith-renter-leads.yacht369.chatgpt.site/dashboard`

หน้า public รับโจทย์ลูกค้าโดยไม่ต้องล็อกอิน ส่วนรายชื่อลูกค้า การ export การ import และเครื่องมือหลังบ้านต้องผ่าน ChatGPT sign-in หรือ import token

## Current Scope

- Multilingual public intake: Thai, Chinese, English and Russian
- Real estate brief types: rent 12-month, buy condo, sell/list property and China agent referral
- Contact, WeChat, customer country, language, budget period, area, property type and bedrooms
- Required 12-month lease confirmation for monthly rental leads
- UTM source/campaign/content tracking
- D1-backed lead storage with protected read access
- Protected `/api/import` for JSON, CSV and Excel-exported lead files
- Priority scoring, protected stage updates, next follow-up scheduling, multilingual response scripts and CSV export
- Campaign copy for China brokers, Xiaohongshu, Russian relocation, expat, corporate relocation, portals and referrals
- Thai/English social sharing preview
- DBD planning, acquisition plan, bug analysis, project report and slide deck deliverables

## Local Development

```sh
pnpm install
pnpm dev
```

Build and tests:

```sh
pnpm test
pnpm lint
```

## Operating Documents

- `docs/IMPORT_API.md`: JSON/CSV import contract and Excel header template
- `docs/DBD_BUSINESS_STRUCTURE.md`: business structure draft for DBD planning
- `docs/ONLINE_ACQUISITION_PLAN.md`: online acquisition strategy and weekly plan
- `docs/BUG_ANALYSIS.md`: expected bugs and verification notes
- `docs/PROJECT_REPORT.md`: project implementation report
- `deliverables/LILITH_HOMES_DELIVERABLES.md`: final deliverables index
- `LAUNCH_TODAY.md`: tracked links and launch sequence
- `OUTREACH_PACK.md`: Thai/English outreach and follow-up copy
- `PARTNER_PIPELINE.csv`: prioritized company-level partner contacts and tracked links
- `PARTNER_OUTREACH.md`: permission-aware partner launch sequence and message templates
- `OUTBOUND_DRAFTS.md`: personalized Priority A drafts ready for sender details and approval
- `ACQUISITION_PLAYBOOK.md`: qualification, funnel and response standard

The system is ready to receive qualified briefs. A lead is counted only after contact/WeChat, target budget, area, property type, language and intent are confirmed.
