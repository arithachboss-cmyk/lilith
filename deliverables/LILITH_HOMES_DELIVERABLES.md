# Lilith Homes Deliverables

Updated: 2026-08-28

## Website / App

Built in the existing Next/Vinext project:

- Public page: `/`
- Private dashboard: `/dashboard`
- Lead API: `/api/leads`
- Import API: `/api/import`

Core capabilities:

- Thai, Chinese, English and Russian lead intake
- On-page SEO metadata and schema.org real estate agent structured data
- Public lead capture for rent, buy, sell/list and China agent referral
- Protected dashboard for pipeline follow-up
- CSV/JSON import for Excel and external partner systems

## Documentation

- `docs/IMPORT_API.md`: API contract and CSV template
- `docs/DBD_BUSINESS_STRUCTURE.md`: DBD-ready business structure draft
- `docs/ONLINE_ACQUISITION_PLAN.md`: 30/60/90-day online lead acquisition plan
- `docs/BUG_ANALYSIS.md`: likely bug analysis and test notes
- `docs/PROJECT_REPORT.md`: project report and implementation map

## Slide Deck

The presentation deck is generated as:

- `deliverables/lilith-homes-business-plan.pptx`

## Zip Package

The combined website, documentation, report, plan and presentation package is:

- `deliverables/lilith-homes-launch-pack.zip`

## Test Summary

Latest command:

```sh
PATH="/Users/arithachbossabc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" pnpm test
```

Result:

```text
tests 7
pass 7
fail 0
```

## Before Real Customer Launch

- Configure `LEAD_IMPORT_TOKEN` in hosting before sharing `/api/import`.
- Add privacy notice and registered company details after DBD setup.
- Confirm commission/referral/legal wording with qualified Thai counsel.
- Confirm direct `.xlsx` support is required; current MVP expects Excel CSV export.
