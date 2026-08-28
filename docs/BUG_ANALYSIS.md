# Bug Analysis and Test Notes

Updated: 2026-08-28

## Scope Tested

This review covers the simple multilingual real estate lead app:

- Public SEO-ready lead form
- Dashboard lead pipeline
- `/api/leads` public submit and protected lead management
- `/api/import` JSON/CSV import contract
- D1 schema and migration fields

## Bugs Most Likely to Happen

### 1. Import field mismatch from Excel

Risk: Partner sends `client name`, `wechat id`, `budget RMB`, or translated headers that do not match the API schema.
Impact: Valid leads are rejected or saved with missing fields.
Current control: `/api/import` maps common aliases such as `clientName`, `phone`, `wechat`, `budgetTHB`, Chinese headers like `客户姓名`, `电话`, `微信`, and returns rejected rows with reasons.
Next hardening: Add a downloadable CSV template and an import preview before saving.

### 2. Wrong budget period

Risk: A purchase lead enters THB 8,000,000 but is treated as monthly rent, or a rental lead enters THB 250,001 and fails.
Impact: Lead rejection or wrong priority scoring.
Current control: `budgetPeriod` is explicit and validation separates monthly rent, purchase budget, and listing value.
Next hardening: Add dashboard UI warnings before submit.

### 3. Public data exposure

Risk: Public users can read lead records.
Impact: Privacy breach.
Current control: `GET /api/leads`, `PATCH /api/leads`, and `DELETE /api/leads` require ChatGPT authenticated headers. Public `POST /api/leads` accepts only submission, not reads.

### 4. Unauthorized API import

Risk: External users post junk lead data to `/api/import`.
Impact: CRM pollution and possible abuse.
Current control: Import requires dashboard sign-in or `LEAD_IMPORT_TOKEN` through `x-lilith-import-token` or `Authorization: Bearer`.

### 5. Consent gap from partner agents

Risk: A partner submits customer contact data without permission.
Impact: Legal/privacy risk and loss of trust.
Current control: Public form consent text and import guide instruct partners to confirm permission first.
Next hardening: Add a required `consentSource` field for partner imports.

### 6. Language/script rendering issues

Risk: Chinese or Russian text wraps poorly on small screens.
Impact: Poor UX and lower conversion.
Current control: Responsive single-column layout below 760px, no negative letter spacing, stable card/grid dimensions.

### 7. D1 schema drift

Risk: App code expects new fields but D1 lacks migration.
Impact: Runtime SQL errors.
Current control: `ensureLeadSchema()` adds missing optional columns defensively and Drizzle migration `0004_black_stick.sql` ships the new fields.

### 8. SEO over-indexing one mixed-language page

Risk: One page trying to rank for all languages may be less effective.
Impact: Lower organic performance.
Current control: Current MVP includes multilingual content and hreflang alternates.
Next hardening: Add separate localized routes for Chinese, English, Russian and Thai landing pages.

## Commands Run

```sh
PATH="/Users/arithachbossabc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" pnpm test
```

Result:

```text
Build complete.
tests 7
pass 7
fail 0
```

## Manual Runtime Check

The local development server was started with the bundled Node runtime and the root page returned:

```text
HTTP/1.1 200 OK
content-type: text/html; charset=utf-8
```

## Residual Risks

- Direct `.xlsx` binary parsing is not implemented yet; Excel should export CSV for this MVP.
- Import token still needs to be configured in hosting before external partner use.
- Privacy notice and company registration details should be added before real customer data collection at scale.
- DBD/FBA/tax issues require professional review before public commercial launch.
