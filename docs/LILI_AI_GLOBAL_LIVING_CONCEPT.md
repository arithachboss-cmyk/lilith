# Lili AI — your familiar guide to a new city

Status: internal product concept, 2026-09-10. Captures the owner's direction; this is not a claim of delivered services or a production release.

## Owner's direction

Middleproperty helps people plan a year of living in a destination, with Korea, Japan and Thailand as the initial examples. Lili is the brand's mascot and the proposed continuing AI assistant: a familiar representative who helps residents connect with housing and local services as they move between cities.

The owner described the visual references as “Miniangel” and “looks Lisa.” The exact reference character/person and artwork have not been supplied. Retain these as creative references pending clarification, without assuming a specific identity, endorsement or right to reuse artwork.

“1year contact” is provisionally interpreted as a 12-month housing arrangement. Whether the annual offer also includes a concierge service agreement remains an open business decision. No subscription, charge, automatic renewal or contract is introduced by this brief.

## Confirmed storytelling roles — owner's correction

Use **Lili / ลิลิ** as the character name. The **owner** supplies the source memories and story information; **The Middle** supplies the voiceover script; **Lili** is the character who presents it. This does not identify The Middle as the voice performer or attribute real transactions or firsthand memories to the character.

The current story and episode documents are preparation drafts, not a claim that the owner's memories or The Middle's final scripts have been received. The proposed future AI assistant capabilities remain separate from this confirmed storytelling role. See [Lili's storytelling roles](LILI_STORY_ROLES.md).

## Draft brand copy

**Lili AI — A new city. A familiar guide.**

Plan a year in Korea, Japan or Thailand with Middleproperty. Lili is being designed to help you explore homes, connect with owners and agents, and request support for mobile data, exchange services and local legal assistance. Carry your chosen preferences into your next move, with your permission.

Thai working line: **ลิลิ AI — เมืองใหม่ ผู้ช่วยที่คุ้นเคย**

Service availability, prices and terms depend on the destination, provider and team confirmation. This copy describes the proposed service and should remain labelled as a concept until the relevant capabilities and coverage are verified.

Use “รับคำขอได้ตลอด 24 ชั่วโมง” for request availability. It does not promise immediate replies or successful service delivery at all times. Request confirmation must include “ได้รับคำขอแล้ว แต่ยังไม่ใช่การยืนยันการจอง”; the prototype must separately explain that the request is simulated and has not reached a team or provider.

## Lili's character

- Original mini-angel mascot; warm, capable, quietly confident and approachable.
- Retain matte black, charcoal, warm ivory and restrained antique-gold accents for continuity with the requested Quiet Luxury direction.
- Introduce Lili clearly as an AI assistant. Distinguish Lili's guidance from messages and decisions made by people.
- Use the mascot beside readable text, labels and controls. Core navigation, forms and status must remain accessible without the portrait, animation or chat.
- Treat “permanent assistant everywhere” as the intended continuity of the service: user-controlled preferences and stay history across supported destinations. It is not a present availability guarantee or permission for background tracking.

## Who connects with whom

| Participant | Proposed responsibility | Current source capability |
| --- | --- | --- |
| Resident / client | Describe destination, housing needs and proposed stay | Individual CLIENT requirement creation |
| Broker / agent | Represent a client's brief and coordinate with owners | Individual AGENT requirements and mutual matching |
| Property owner | Supply a property and confirm its terms and availability | OWNER property creation, matching and viewing coordination |
| Agency | Manage authorized representatives, clients and properties | Organization schema only; team access and delegation remain unfinished |
| Lili | Explain choices, organize the next steps and prepare consented handoffs | AI provider and assistant interface are not implemented |
| Service provider | Confirm its own eligibility, coverage, quote and delivery | No eSIM, exchange or law-firm workflow is implemented |

The existing housing flow is requirement → property match → mutual interest → private room → viewing. Preserve that foundation. Service-provider requests need their own eligibility and handoff workflow rather than using the property scoring formula.

## Proposed resident journey

1. **Plan a stay:** choose country, city, intended arrival and departure, language, monthly housing budget and currency. A one-year example is a planning preference, not a confirmed lease or permission to reside.
2. **Find a home:** match suitable owner properties with the resident's or agent's requirements; show reasons, missing information and constraints.
3. **Connect with people:** obtain both parties' interest and use the private room for housing coordination. Agency participation requires explicit delegated access.
4. **Prepare the move:** Lili presents a checklist for housing, connectivity, the selected exchange service and legal assistance. Users choose which services they need.
5. **Request help:** show what information each provider would receive and obtain separate consent. A mock request does not contact a provider or purchase anything.
6. **Manage the stay:** show user-selected tasks, support requests and intended end-of-stay dates. Reminders and notifications require their own implementation and user choice.
7. **Plan the next city:** let the resident review, edit or delete saved preferences before carrying them forward. Do not silently share prior contacts or documents with a new provider.

## Partner identity and evidence

| Service | Owner-supplied information | What remains unresolved |
| --- | --- | --- |
| eSIM | Owner identifies “Roamly.com” as the intended partner | Correct eSIM company/domain, confirmed relationship, country coverage, referral terms and approved brand assets |
| Exchange | Owner refers to an exchange partner | Whether this means currency exchange or student/cultural exchange; provider identity and service scope |
| Law-firm / agency assistance | Owner proposes a law-firm connection including Thailand | Firm identity, supported jurisdictions, languages, scope and agreed handoff process |

Public-source check on 2026-09-10: [Roamly's official help page](https://www.roamly.com/help) describes insurance services, including RV insurance. This does not establish an eSIM service or Middleproperty partnership. Preserve the owner's nominated name while requesting the intended eSIM URL; do not silently substitute another similarly named provider.

Do not invent provider names, logos, coverage, testimonials, rates or referral agreements. Partner contact details and eventual endpoints must come from environment configuration. Prototype service cards should identify the category and pending confirmation without presenting an unverified provider as integrated.

## Implementation sequence

1. **Local concept prototype:** reusable Lili panel, a destination/stay planner, checklist, service-request cards and simulated statuses. Use mock data and consented device storage; provide reset/delete controls. Guest users can start a request. No external AI calls or provider requests.
2. **International housing contracts:** extend the domain with country/city identifiers, local currencies, stay dates, lease duration and property availability. The current matching API accepts THB only and uses district labels; it does not establish Korean or Japanese market support. Preserve deterministic scoring and reject incompatible country, currency and stay constraints. Do not infer exchange rates.
3. **Agency representation:** implement organization membership and resource-specific authority before agents act for an agency or owner. Keep existing private-room access scoped to authorized participants.
4. **Continuing stay support:** introduce a stay record, versioned preferences, consent and retention controls, and user-selected tasks. Existing agreement/closing tables alone do not provide an annual tenancy workflow.
5. **Partner handoffs:** define categories, destinations, languages, eligibility evidence, consented payloads and statuses such as draft, pending review, referred, provider confirmed and cancelled. Keep real delivery disabled until the relevant owner approvals and provider details exist.
6. **AI assistance:** implement the provider interface described in [AI_LILITH.md](AI_LILITH.md), structured outputs, authorization, error states and human handoff. AI must not change numeric match scores or independently confirm bookings, legal outcomes or provider availability.

## Prototype acceptance boundaries

- Demonstrate the Korea → Japan → Thailand example with clearly labelled mock stays; exact cities remain user choices.
- Preserve existing routes and unrelated work. The concept does not establish the missing 38-route Private Concierge source package.
- Use the requested eight-language framework (th, en, zh, ja, ko, ar, ru, hi), persistent language selection and Arabic RTL when building the new experience; these are requirements, not a claim about the current app.
- Keep form labels, keyboard/focus behavior, error messages, reduced motion and layouts usable at 390px, 768px and 1440px.
- Personal details require the Privacy Notice consent before persistence; provider sharing requires its own permission. Do not collect passports or financial documents in the prototype.
- No payment, live messaging, external analytics, live provider delivery, publish, deployment or DNS change is authorized by this concept.

## Owner decisions still needed

- Exact eSIM provider URL and the intended meaning of “exchange.”
- Named exchange and legal-service providers, evidence of partnership, agreed country coverage and permission to use their branding.
- Whether “one year” refers to a housing lease, a concierge service agreement, or both; supported cities and the actual scope of assistance.
- The intended Miniangel/Lisa reference and final original mascot artwork.
- Future live-service scope, response expectations, privacy/storage policy and any commercial terms before publication.

## Verification of this change

Added this document only. Reviewed existing source and [implementation status](IMPLEMENTATION_STATUS.md); checked the supplied provider domain against a public official source. No application behavior, data, tests, configuration, partner records or production systems were changed. Build and runtime tests are not applicable to this documentation-only addition.
