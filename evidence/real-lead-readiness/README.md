# Middle Property readiness evidence

Current tested implementation: `e49c7a9eaaf7c2f3109421e101d7595a0bc25fcd`.
Decision source: [REAL_LEAD_READINESS_REPORT.md](../../REAL_LEAD_READINESS_REPORT.md).

- The repaired source directory contains exact-SHA local logs/screenshots, a separate `ci/` copy from GitHub Actions, source/build identity, and a reproducible scoped credential scan.
- Current Manus QA: **PASS in mock scope**, with real release **BLOCKED / NO-GO**. The current source directory includes the actual final response and artifact links; current Claude review remains blocked by reviewer availability.
- `8bd0e3d7a223db392e55c5f2533451bff716a464/` is **historical defective source**, not current acceptance. Its initially passing test manifests are retained because independent Manus QA later reproduced the image-loss defect D1. Original Claude approval covers only that earlier source and did not detect D1.
- `8bd0e3d7a223db392e55c5f2533451bff716a464/reopen-race/` contains two independent Codex reproductions: omitted uploads and stale UI overwrite. The recorded script was originally run from `output/playwright/reopen-race-qa.mjs`; reproduce from that location in an exact old-source checkout with the loopback test server running. Never run this test ingress publicly.
- Reviewer text captures are actual browser-visible responses. Their artifact URLs resolve in the signed-in Manus/Claude applications. They are evidence of the reviews, not automatic endorsement of every reviewer claim; the consolidated report records corrections and current-SHA limitations.
- Existing manifests are original outputs, not retroactively rewritten. The evidence inventory hashes all packaged files separately. All lead records/images are synthetic; no external test delivery was made.

This leadership round adds signed loopback mock identity, closed production identity, and atomic mock withdrawal/retention. Historical `cd259153...` was REVISE for a CI-reproduced contact click suppressed during restoration; `e4d6435...` was REVISE after an additional stale-feedback reproduction. Their original passing local manifests are preserved without rewriting history. `f3cbd744...` contains an earlier lint stop. Only the current-source report governs acceptance.
