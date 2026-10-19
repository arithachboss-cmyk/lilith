# Package Claim Register — about-acs

Copy requested by the Owner on 23 Sep 2026: praise ACS, mention Honeywell, 7-Eleven,
30 years of serving customers, and a commitment to continue honestly and steadily.

Two drafts exist. `draft-v1-publishable.md` carries **zero gated claims** and can go live
today. `draft-v2-full.md` carries the four requested facts and **cannot**, until the rows
below close.

| # | Sentence | Row | Class | What closes it | Who can close it |
|---|---|---|---|---|---|
| 1 | "…มา 30 ปี" | CR-10 | **CLOSED 19 Oct** | CEO email to the vendor, 27 Sep 2026, stating the company was founded in 1994 | **Corrected: 32 years, not 30.** Publishes the founding year instead of a running total |
| 2 | "เป็นพาร์ทเนอร์ของ Honeywell" | CR-06 | **CLOSED 19 Oct, reworded** | Written reply from the vendor's partner team, 28 Sep 2026 | **Corrected: Brady IPS, not Honeywell.** See note below |
| 3 | "ทำงานร่วมกับ … Honeywell" | CR-06 | **CLOSED 19 Oct, reworded** | Same source | Same correction |
| 4 | "ดูแลระบบให้กับ 7-Eleven" | CR-08 | OWNER_REQUIRED | Written consent from the customer to be named publicly | **The customer** — ACS approving it does not clear it |
| 5 | "ร้านสะดวกซื้อรายใหญ่ที่สุดในประเทศ" | CR-04 | **BLOCKED** | Nothing. It is a superlative, and it identifies the customer without naming them | — |
| 6 | "ซื่อสัตย์", "มั่นคง" | CR-14 | SAFE_WORDING | — a stated commitment, not a checkable fact | publishable |

## What the evidence changed

Both closures are **corrections**, not confirmations — the requested copy was wrong in each
case, and in ACS's favour both times.

**"30 ปี" understated it.** The CEO's own email to the vendor, 27 Sep 2026, states the
company was founded in 1994. That is 32 years as of 2026. The page now publishes the
founding year rather than a running total, so it does not quietly go stale every January.

**"พาร์ทเนอร์ Honeywell" is out of date.** Honeywell PSS was acquired by Brady. The vendor's
partner team wrote on 28 Sep 2026: *"your existing partner agreement for Brady IPS (formerly
known as Honeywell PSS) remains valid, the pricing and support terms continue unchanged and
no new agreement or registration is required."* So the accurate claim is **a partner under
the Brady IPS programme**. The same email is explicit that Brady **core** products sit in a
separate **Brady IDS** programme that ACS must still request to join — so "Brady partner"
unqualified would overclaim.

That source also carries an expiry signal: it says *"At this time"*. A partner status is not
permanent and should be re-confirmed before any renewal cycle.

## CR-08 is still open, and the same mailbox shows why that matters

The CEO's 27 Sep email says ACS has supplied scanners "deployed at 7-Eleven Counter Service
stores nationwide". That makes the relationship real — and it still does not close CR-08.
ACS asserting a deployment to a vendor is not the customer consenting to be named on a
public page. The distinction the register drew holds: **this one is not ACS's to grant.**

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
node acs-seo/tools/claim-scan.mjs acs-seo/packages/about-acs
```

v1 → 0 findings. v2 → 7 findings: 1 BLOCKED, 3 EVIDENCE_REQUIRED, 3 OWNER_REQUIRED.

**These three rows had no scanner rule until this package was written.** The register
carried CR-06, CR-08 and CR-10, but nothing enforced them, so this exact copy passed a
clean scan on the first run. Rules `partner-claim`, `vendor-name`, `customer-name`,
`customer-implied` and `company-tenure` were added in response, and the superlative rule
was widened from `ดีที่สุด` to cover `ใหญ่ที่สุด` and `รายใหญ่`.
