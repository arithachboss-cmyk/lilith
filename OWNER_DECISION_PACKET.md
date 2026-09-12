# Middle Property — decisions for the Owner

Current recommendation: **NO-GO FOR REAL LEADS**. This packet is a proposal, not approval or activation.

Confirmed contacts: **Middle Property**, LINE OA **@middleproperty**, business phone **0933888594**. The phone has already been supplied; it is not being requested again. It does not identify a notification transport or grant an Operations account access.

## 1. Operations destination and people

Recommended initial scope: Arithach as the only pilot operator, with one destination controlled by the Owner. Additional operators can be named explicitly. No account has been authorized or configured by inference.

Owner to specify:

- Where the generated lead notice should arrive: the exact controlled LINE destination, business inbox, or another named destination. A LINE OA handle is a contact path; an outbound messaging destination and its credentials still need verified integration.
- Which actual accounts may open the lead record, and whether each can only read or also qualify and prepare a viewing.

Implementation follows these decisions: verify the identity provider and site-scoped account IDs; enforce the approved role list; build the approved notification transport; verify the same Lead ID from creation to the authorized record. Credentials belong in server-managed runtime storage, never in chat, Git or browser code. Mock tests continue until authorization is complete.

## 2. Real-data lifecycle policy

Owner to specify the permitted retention period for lead details, images and attribution; the retention of consent/erasure receipts; the person responsible for withdrawal/deletion requests; and any required exceptions and backup/log handling. These are business/governance decisions, not invented legal requirements.

The current **test-only** policy is concrete: hide content at the 24-hour draft deadline; erase due content through the local maintenance sweep; allow capability-scoped withdrawal or deletion; retain only a minimal replay-prevention receipt until the isolated test database is destroyed. The test policy does not become a real-data policy automatically. No hosted retention scheduler is configured.

## 3. Pilot approval — request only after the gates pass

The proposed later pilot remains 5–10 real leads through Organic / Direct / Owner-controlled traffic, after all P0 evidence passes, Manus passes the exact source, Claude has no BLOCK, the approved destination and operators are verified, and the Owner explicitly approves activation.

`PAID_TRAFFIC:false` · `GOOGLE_ADS:false` · `MASS_CAMPAIGN:false`

Do not approve activation based on this packet alone. The final technical report and independent reviews must be available first. Existing public hosting was observed read-only; no publication, access policy, DNS/domain/email configuration or real customer interaction was performed in this round.
