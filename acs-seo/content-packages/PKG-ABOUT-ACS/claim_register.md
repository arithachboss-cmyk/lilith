# Package Claim Register — about-acs

Copy requested by the Owner on 23 Sep 2026: praise ACS, mention Honeywell, 7-Eleven,
30 years of serving customers, and a commitment to continue honestly and steadily.

Two drafts exist. `draft-v1-publishable.md` carries **zero gated claims** and can go live
today. `draft-v2-full.md` carries the four requested facts and **cannot**, until the rows
below close.

| # | Sentence | Row | Class | What closes it | Who can close it |
|---|---|---|---|---|---|
| 1 | "…มา 30 ปี" | CLM-O-006 | OWNER_REQUIRED | Company registration or an ACS document stating the founding year | **ACS** — likely a same-day fix |
| 2 | "เป็นพาร์ทเนอร์ของ Honeywell" | CLM-O-003 | EVIDENCE_REQUIRED | A written authorisation from Honeywell, with dates | **Honeywell**, not ACS |
| 3 | "ทำงานร่วมกับ … Honeywell" | CLM-O-003 | EVIDENCE_REQUIRED | Same. Softening "partner" to "work with" does not change what a reader infers | **Honeywell** |
| 4 | "ดูแลระบบให้กับ 7-Eleven" | CLM-O-004 | OWNER_REQUIRED | Written consent from the customer to be named publicly | **The customer** — ACS approving it does not clear it |
| 5 | "ร้านสะดวกซื้อรายใหญ่ที่สุดในประเทศ" | CLM-B-004 | **BLOCKED** | Nothing. It is a superlative, and it identifies the customer without naming them | — |
| 6 | "ซื่อสัตย์", "มั่นคง" | CLM-S-003 | SAFE_WORDING | — a stated commitment, not a checkable fact | publishable |

## Three notes worth keeping

**Claim 4 is not ACS's to approve.** Every other row here closes when ACS produces a
document. This one closes when *the customer* agrees to be named. Naming a major retailer
as a client without that is the kind of claim that gets a supplier a letter rather than a
lead. If consent is not available, draft v1's "ค้าปลีก และร้านสะดวกซื้อ" — the sector, not
the client — says most of it and is safe.

**Claim 5 is worse than claim 4, not better.** Removing the name while keeping "the
largest convenience store chain in the country" identifies the same company and adds a
superlative on top. Anonymising an unconsented customer claim does not make it safe.

**The copy's own subject makes this stricter, not looser.** A page whose argument is
"we say only what we can verify" is the single worst place on the site to carry an
unverified claim. If one of these four is ever challenged, the sentence it discredits is
"พูดเท่าที่ตรวจสอบได้".

## Detection

```sh
node acs-seo/tools/redact.mjs acs-seo/packages/about-acs
```

v1 → 0 findings. v2 → 7 findings: 1 BLOCKED, 3 EVIDENCE_REQUIRED, 3 OWNER_REQUIRED.

**These three rows had no scanner rule until this package was written.** The register
carried CLM-O-003, CLM-O-004 and CLM-O-006, but nothing enforced them, so this exact copy passed a
clean scan on the first run. Rules `partner-claim`, `vendor-name`, `customer-name`,
`customer-implied` and `company-tenure` were added in response, and the superlative rule
was widened from `ดีที่สุด` to cover `ใหญ่ที่สุด` and `รายใหญ่`.

---

*ที่มา: ยกมาจาก PR #1 (`claude/acs-brady-prototype-brief-fqwxe7`) แล้วปรับ path และรหัส claim/source ให้ตรงกับทะเบียนกลางของแพ็กนี้ เนื้อหาการวิเคราะห์และคำแนะนำไม่ถูกแก้*
