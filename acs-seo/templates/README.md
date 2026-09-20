# Package template

Copy this folder to `packages/queue-<id>/` for every new package. All seven files are
mandatory — `03_QA_CHECKLIST.md` step M-1 fails the package if any is missing.

Order of work: `brief.md` (with the cannibalisation gate run) → `article.md` →
`claim_register.md` → `meta.json` + `schema.jsonld` → `audit.json` → `package_status.json`.

Writing the article before the cannibalisation gate is the single most expensive mistake
available here: it produces work that may have to be thrown away.
