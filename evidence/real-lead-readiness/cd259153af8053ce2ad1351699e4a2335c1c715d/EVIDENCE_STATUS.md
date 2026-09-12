# Historical source — REVISE

Exact source cd259153af8053ce2ad1351699e4a2335c1c715d passed local79 checks but CI34722951902 failed the mobile contact assertion at readiness.spec.ts244. contact() silently ignored the visible Test call click while restoration was active. This is a product UX regression, not a passing CI run or timing-delay workaround. The subsequent e4d643538a8a2b61c2ba52c4cf0eed524ad1449b removes that suppression and adds a deterministic held-restore contact-event test; its evidence is separate. Raw original local/CI outputs remain unchanged.
