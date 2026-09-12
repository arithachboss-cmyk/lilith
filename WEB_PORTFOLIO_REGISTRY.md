# WEB_PORTFOLIO_REGISTRY

วันที่ตรวจ: 2026-09-12 (Asia/Bangkok) · ผลทะเบียน: **BLOCKED — หลักฐาน identity ยังไม่ครบ**

ทะเบียนนี้มี 4 numbered slots ตาม Owner input ไม่ใช่การยืนยันว่ามีเว็บไซต์อิสระครบ 4 แห่ง พบชื่อโปรเจกต์ใน workspace นี้เพียงพอสำหรับบันทึกชั่วคราว 1 ช่อง อีก 3 ช่องยังไม่จัดสรร ไม่เติมด้วยการแยกโดเมนหรือเส้นทางของ Middle Property

## ขอบเขตและระดับหลักฐาน

- จัดทำเอกสารจาก Owner input และการอ่านไฟล์ใน workspace เท่านั้น ไม่แก้ Production ไม่ deploy/push ไม่ติดต่อ LINE และไม่สร้าง Lead จริง
- ทุกช่องที่ไม่ทราบใช้ `identity_status:missing` โดยแสดงเป็น YAML `identity_status: missing` คู่กับ `value: null`; `null` หมายถึงยังไม่มีหลักฐาน ไม่ใช่ไม่มีสิ่งนั้นอยู่
- ชื่อแบรนด์ที่พบใน source, Git remote และ URL ใน README เป็นหลักฐานเฉพาะสิ่งที่ระบุ ไม่ยืนยันเจ้าของธุรกิจ การให้บริการจริง หรือ canonical domain
- Snapshot: branch `codex/lilith-prototype`, local HEAD `2ff8ce7f933217a4b8ee92054cdd0f42bd83b12a`; working tree มี modified/untracked files อยู่ก่อนงานนี้ หลักฐานไฟล์ด้านล่างอ้าง working tree ไม่ใช่การรับรองว่าอยู่ใน GitHub commit นี้แล้ว
- ไม่ได้ตรวจ GitHub remote manifest, DNS, redirect หรือเว็บไซต์สดในรอบนี้ จึงไม่อ้างว่าหลักฐานเหล่านั้นไม่มีอยู่ภายนอก workspace

## 1. Slot 1 — Lilith (ระบุตัวตนจาก local source บางส่วน)

```yaml
slot: 1
project_name: "Lilith Homes International Real Estate Pipeline"
canonical_domain:
  value: null
  identity_status: missing
serving_brand:
  value:
    - "Middle Property — / และ /index.html (static homepage)"
    - "Lilith Homes — /lead-form (React intake)"
    - "LILITH by THE MIDDLE — /middle"
    - "Lilithconnect by Middleproperty — /connect"
  evidence_scope: local_source_only
repository:
  value: "https://github.com/arithachboss-cmyk/lilith"
  evidence_scope: local_git_remote_and_publish_notes
owner:
  value: null
  identity_status: missing
identity_status: missing
status: BLOCKED
evidence: [E-01, E-02, E-03, E-04, E-05, E-06, E-07, E-08]
missing_evidence:
  - "Named accountable owner and approved project/brand mapping"
  - "Owner-approved canonical domain and domain-to-project manifest"
  - "Immutable GitHub manifest and independent identity/deployment QA"
```

ชื่อ route/แบรนด์ในช่องนี้เป็นรายการที่สังเกตพบใน repository เดียวกัน ไม่ใช่การนับเว็บไซต์เพิ่ม และยังไม่ยืนยันว่าเว็บไซต์ภายนอก MiddleProperty เป็น alias ของ Lilith หรือเป็นคนละเว็บไซต์

## 2. Slot 2 — ยังไม่ระบุ

```yaml
slot: 2
project_name: { value: null, identity_status: missing }
canonical_domain: { value: null, identity_status: missing }
serving_brand: { value: null, identity_status: missing }
repository: { value: null, identity_status: missing }
owner: { value: null, identity_status: missing }
identity_status: missing
status: BLOCKED
evidence:
  - "E-00: Owner requests four slots; no identity supplied for this slot"
missing_evidence:
  - "Project name, canonical domain, serving brand, repository and owner"
  - "Evidence that this is a distinct website rather than a domain alias or route"
```

## 3. Slot 3 — ยังไม่ระบุ

```yaml
slot: 3
project_name: { value: null, identity_status: missing }
canonical_domain: { value: null, identity_status: missing }
serving_brand: { value: null, identity_status: missing }
repository: { value: null, identity_status: missing }
owner: { value: null, identity_status: missing }
identity_status: missing
status: BLOCKED
evidence:
  - "E-00: Owner requests four slots; no identity supplied for this slot"
missing_evidence:
  - "Project name, canonical domain, serving brand, repository and owner"
  - "Evidence that this is a distinct website rather than a domain alias or route"
```

## 4. Slot 4 — ยังไม่ระบุ

```yaml
slot: 4
project_name: { value: null, identity_status: missing }
canonical_domain: { value: null, identity_status: missing }
serving_brand: { value: null, identity_status: missing }
repository: { value: null, identity_status: missing }
owner: { value: null, identity_status: missing }
identity_status: missing
status: BLOCKED
evidence:
  - "E-00: Owner requests four slots; no identity supplied for this slot"
missing_evidence:
  - "Project name, canonical domain, serving brand, repository and owner"
  - "Evidence that this is a distinct website rather than a domain alias or route"
```

## Domain observations — ยังไม่ใช้เพิ่มจำนวนเว็บไซต์

| สิ่งที่พบ | หลักฐาน | สิ่งที่ยังสรุปไม่ได้ |
| --- | --- | --- |
| `lilith-renter-leads.yacht369.chatgpt.site` | E-02 ระบุเป็น Production URL; E-03 ใช้เป็น fallback host และสร้าง canonical จาก host | canonical ที่ Owner อนุมัติ, deployment ปัจจุบัน และความสัมพันธ์กับโดเมนอื่น |
| `www.middleproperty.com` | E-04 และ E-05 เป็น outbound link พร้อมชื่อ MiddleProperty | repository, owner, canonical/redirect และเป็น alias หรือเว็บแยก |
| `/`, `/lead-form`, `/dashboard`, `/agents`, `/middle`, `/connect` | E-01, E-02, E-05, E-06 และ E-07 เป็น routes ใน workspace | ไม่ใช่หลักฐานเว็บไซต์อิสระหลายแห่ง |

หลายโดเมนของ Middle Property ต้องคงอยู่ในกลุ่มตรวจสอบ identity เดียวกันก่อน ห้ามนับ host, `www`, subdomain, preview URL, ชื่อแบรนด์ หรือ route เป็นคนละเว็บไซต์โดยอัตโนมัติ และห้ามสรุปว่าเป็นเว็บเดียวกันเพียงเพราะชื่อคล้ายกัน

การจัดสรรช่องเพิ่มต้องมี Owner-approved project identity พร้อม manifest ที่ผูก canonical domain, aliases/redirects, serving brand, repository, commit/deployment และผู้รับผิดชอบเข้าด้วยกัน รวมทั้งหลักฐานตรวจแยกเว็บไซต์ได้ หากใช้ repository เดียวกันให้ระบุ app/build target ที่แยกกัน ไม่บังคับว่าต้องคนละ repository

## Owner input — LINE OA

บันทึกค่าที่ Owner ให้มา: `canonical_line_oa:@middleproperty` นี่คือข้อกำหนดช่องทาง ไม่ใช่ผลตรวจ integration และไม่ใช่หลักฐานชื่อผู้รับผิดชอบในช่อง `owner`

```yaml
canonical_line_oa: "@middleproperty"
source: Owner input
implementation_verified: false
verification_status: BLOCKED
github_manifest: { value: null, identity_status: missing }
independent_qa: { value: null, identity_status: missing }
```

คง `implementation_verified: false` จนมีทั้ง GitHub manifest ที่อ้าง immutable commit และ independent QA ของ implementation revision เดียวกัน ซึ่งยืนยัน mapping ช่องทาง/ปลายทางและการใช้งานผ่าน mock/staging โดยไม่ส่งข้อความจริง รายละเอียดเกณฑ์อยู่ใน [LILITH_P0_RELIABILITY_GATE.md](LILITH_P0_RELIABILITY_GATE.md) การมี string หรือปุ่ม LINE อย่างเดียวไม่เพียงพอ

พบความต่างใน local source: E-08 ยังตั้ง `LINE_OA_URL` เป็น `https://line.me/R/ti/p/@themiddleproperty` ซึ่งไม่ตรง Owner input `@middleproperty` และ E-07 route `/` ไปยัง static file นี้ ต้อง reconcile ใน candidate ที่ระบุใน GitHub manifest และตรวจด้วย independent QA ก่อนยืนยัน ไม่ได้แก้ source หรือทดสอบปลายทาง LINE ในรอบนี้

## Evidence ledger

| ID | แหล่งหลักฐาน | ขอบเขตที่ยืนยันได้ |
| --- | --- | --- |
| E-00 | Owner input ในคำขอจัดทำเอกสารนี้, 2026-09-12 | 4 slots, missing identity policy, LINE OA, P0 ทั้ง 3 ข้อ, Lili flow และ mock-only |
| E-01 | [README.md](README.md), ชื่อเอกสารและหัวข้อ LILITH by THE MIDDLE (บรรทัด 1–7) | ชื่อโปรเจกต์และ route `/middle` ใน local docs |
| E-02 | [GITHUB_PUBLISH.md](GITHUB_PUBLISH.md), บรรทัด 3–7; local `git remote -v` | remote `git@github.com:arithachboss-cmyk/lilith.git` และ URL ที่เอกสารระบุ; GitHub namespace ไม่เท่ากับ business owner |
| E-03 | [app/layout.tsx](app/layout.tsx), บรรทัด 5–31 | host fallback และ metadata canonical ของ React app; ไม่ใช่ Owner-approved domain manifest หรือ metadata ของ static homepage |
| E-04 | [app/page.tsx](app/page.tsx), บรรทัด 552–557 | Lilith Homes footer และ outbound MiddleProperty link ของ React intake ซึ่ง E-07 map ไป `/lead-form` |
| E-05 | [src/components/connect/explorer.tsx](src/components/connect/explorer.tsx), บรรทัด 156–166, 530–535; [app/connect/page.tsx](app/connect/page.tsx), บรรทัด 5–9 | Lilithconnect by Middleproperty และ route canonical `/connect` |
| E-06 | [README.md](README.md), บรรทัด 42–47; [app/dashboard/page.tsx](app/dashboard/page.tsx), บรรทัด 14–25 | dashboard ในแอปนี้และ route `/agents`; ไม่ได้ตรวจ live |
| E-07 | [worker/index.ts](worker/index.ts), บรรทัด 32–38 | `/` และ `/index.html` serve `current-home.html`; `/lead-form` ใช้ React root handler ตาม local source |
| E-08 | [public/current-home.html](public/current-home.html), บรรทัด 6–7 และ 658 | static homepage ใช้แบรนด์ Middle Property และ LINE handle เดิม `@themiddleproperty`; ไม่ใช่หลักฐาน live deployment หรือ OA verification |

## Verdict และ missing evidence

| ผล | ความหมายสำหรับทะเบียน |
| --- | --- |
| PASS | มี identity ครบและหลักฐานระบุเว็บอิสระของทั้ง 4 slots โดยไม่ซ้ำ alias |
| REVISE | มีหลักฐานแล้วแต่ชื่อ/โดเมน/แบรนด์/เจ้าของขัดกัน หรือพบการนับ alias ซ้ำ ต้องแก้ทะเบียน |
| BLOCKED | หลักฐานยังไม่พอจัดสรรหรือยืนยัน identity; ใช้ `identity_status:missing` และระบุรายการที่ขาด |

**ผลปัจจุบัน: BLOCKED.** ขาด identity ของ slots 2–4, named owner และ canonical domain ของ slot 1, mapping MiddleProperty กับ Lilith, GitHub manifest และ independent QA เอกสารทะเบียนครบ 4 ช่องแล้ว แต่ยังไม่รับรองจำนวนเว็บไซต์จริงหรือ implementation

ข้อมูลในทะเบียนเป็น observation/Owner input ไม่ใช่ Example; หากเพิ่ม Example หรือ fixture ต้องกำกับ `mock_data: true` ทุก Example และห้ามใช้ข้อมูลหรือ Lead จริง
