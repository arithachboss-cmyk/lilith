# Middle Property readiness evidence

Current repaired implementation: `bee6a6e93a88820bba0d709c8356092c65cfae75`.
Decision source: [REAL_LEAD_READINESS_REPORT.md](../../REAL_LEAD_READINESS_REPORT.md).

- The repaired source directory contains exact-SHA local logs/screenshots, a separate `ci/` copy from GitHub Actions, source/build identity, and a reproducible scoped credential scan.
- `8bd0e3d7a223db392e55c5f2533451bff716a464/` is **historical defective source**, not current acceptance. Its initially passing test manifests are retained because independent Manus QA later reproduced the image-loss defect D1. Original Claude approval covers only that earlier source and did not detect D1.
- `8bd0e3d7a223db392e55c5f2533451bff716a464/reopen-race/` contains two independent Codex reproductions: omitted uploads and stale UI overwrite. The recorded script was originally run from `output/playwright/reopen-race-qa.mjs`; reproduce from that location in an exact old-source checkout with the loopback test server running. Never run this test ingress publicly.
- Reviewer text captures are actual browser-visible responses. Their artifact URLs resolve in the signed-in Manus/Claude applications. They are evidence of the reviews, not automatic endorsement of every reviewer claim; the consolidated report records corrections and current-SHA limitations.
- Existing manifests are original outputs, not retroactively rewritten. The evidence inventory hashes all packaged files separately. All lead records/images are synthetic; no external test delivery was made.
