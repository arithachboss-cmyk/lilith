# LILITH_P0_RELIABILITY_GATE

วันที่ตรวจ: 2026-09-12 (Asia/Bangkok) · **Overall: BLOCKED** · `implementation_verified: false`

เอกสารนี้กำหนดเกณฑ์และรายงานผลจากการอ่าน local source ไม่ใช่ผลทดสอบ runtime หรือใบรับรอง Production ใช้ข้อมูล identity จาก [WEB_PORTFOLIO_REGISTRY.md](WEB_PORTFOLIO_REGISTRY.md)

## Scope และข้อจำกัดของรอบนี้

P0 มีเพียง 3 เรื่อง:

1. Owner Inbox authorization
2. Readable/operable consent
3. Staged image persistence สูงสุด 4 ภาพ

Lili flow ด้านล่างเป็นเส้นทางตรวจรับของสามเรื่องนี้ ไม่เพิ่ม P0 เรื่องการจอง การชำระเงิน AI provider หรือบริการอื่น งานรอบนี้แก้เฉพาะเอกสาร ไม่แก้ implementation/Production ไม่ deploy/push ไม่สร้าง Lead จริง และไม่ส่งข้อความหรือ handoff จริง

ทุก Example, test case และ fixture ในเอกสารนี้เป็น `mock_data: true` การทดสอบในอนาคตใช้ isolated local/staging พร้อม mock identities, mock storage และ stub การส่งต่อ; `mock_data: true` เป็นฉลากข้อมูล ไม่ได้หยุด network side effects ให้เอง ห้ามยิง public lead endpoint จริงแม้ payload จะติดฉลาก mock

Snapshot ที่อ่าน: local HEAD `2ff8ce7f933217a4b8ee92054cdd0f42bd83b12a`, branch `codex/lilith-prototype` พร้อม working tree ที่มีงานค้างอยู่ หลักฐานด้านล่างรวมไฟล์ modified/untracked; ยังไม่ผูกกับ GitHub manifest หรือ independent QA ของ revision นี้ ไม่มีการรัน browser/API mutation tests ในงานเอกสารนี้

## Owner input และ verification lock

ค่าจาก Owner: `canonical_line_oa:@middleproperty`

```yaml
canonical_line_oa: "@middleproperty"
source: Owner input
implementation_verified: false
github_manifest: { value: null, identity_status: missing }
independent_qa: { value: null, identity_status: missing }
verification_status: BLOCKED
```

ห้ามเปลี่ยนเป็น verified จาก Owner input, ภาพหน้าจอปุ่ม, local config, build ผ่าน หรือรายงาน source review อย่างเดียว ต้องมี **ทั้ง GitHub manifest และ independent QA** ที่อ้าง implementation commit/deployment เดียวกันและครอบคลุม P0 รวมทั้ง OA mapping การตรวจเอกสารโดย reviewer คนอื่นไม่ทดแทน independent runtime QA นี้ ข้อกำหนดนี้ไม่อนุญาตส่ง LINE จริงหรือ deploy เพื่อทดสอบ

**Local discrepancy:** [public/current-home.html](public/current-home.html) บรรทัด 658 ยังใช้ `@themiddleproperty` ต่างจาก Owner input `@middleproperty`; [worker/index.ts](worker/index.ts) บรรทัด 32–38 serve static file นี้ที่ `/` และ React intake ที่ `/lead-form` จึงต้องตรวจ mapping ของ candidate ทั้งสองเส้นทางใน M-05 ไม่ใช้การตรวจ React form แทน static homepage และไม่ถือ local source เป็นผลตรวจ Production

## Required Lili flow

**Welcome → Category → Minimum Details → No-guarantee Notice → Consent → Pending Review → Human/Operations Handoff**

ตารางนี้เป็น acceptance contract ยังไม่ใช่ flow ที่ตรวจพบว่าทำงานแล้ว

| State | พฤติกรรมที่ต้องตรวจรับ | เชื่อมกับ P0 |
| --- | --- | --- |
| Welcome | อธิบายบทบาท Lili และแสดงว่ารอบทดลองเป็น mock | P0-2: อ่านคำอธิบายและเริ่มได้โดยคีย์บอร์ด |
| Category | เลือกประเภทคำขอที่กำหนดไว้; ไม่สร้างรายการจริง | P0-2: label/focus/การเลือกใช้งานได้ |
| Minimum Details | เก็บเฉพาะข้อมูลจำเป็นสำหรับประเภทนั้นและช่องทางตอบกลับที่เลือก; รูปเป็น optional จำนวน 0–4 | P0-3: preview ก่อน consent อยู่ชั่วคราว; ยังไม่ persist รายละเอียดส่วนบุคคลหรือรูป |
| No-guarantee Notice | แจ้งว่าการรับคำขอไม่รับประกันทรัพย์ว่าง การจอง ราคา ผลลัพธ์ หรือเวลาตอบกลับ; ทีมต้องตรวจสอบ | P0-2: แสดงก่อน consent อ่านได้ครบและย้อนกลับได้ |
| Consent | แสดงข้อมูลที่จะเก็บ วัตถุประสงค์ และทีมผู้รับ; ยินยอมโดยผู้ใช้เอง ไม่มี precheck; ปฏิเสธได้ | P0-2: ไม่ยินยอมต้องไม่บันทึก/ส่งต่อ; P0-3: เริ่ม persistence ได้หลังยินยอม |
| Pending Review | แสดงสถานะหลังบันทึก mock request และรูปสำเร็จเท่านั้น; ยังไม่ใช่การยืนยันบริการ | P0-3: failure/retry ไม่แสดง success หลอก; P0-1: Inbox แสดงเฉพาะผู้มีสิทธิ์ |
| Human/Operations Handoff | ผู้มีสิทธิ์ตรวจสอบและรับงานอย่างชัดเจน ก่อนเปลี่ยนจาก Pending Review; รอบนี้ใช้ stub และระบุว่าไม่มีการส่งจริง | P0-1: คุมสิทธิ์และบันทึกผู้ดำเนินการ; ใช้ OA ตาม Owner input แต่ยังไม่ verified |

การเลือก Category หรือกรอก Minimum Details ต้องไม่ข้าม Notice/Consent; Back, reload หรือ retry ต้องไม่ข้ามเงื่อนไขเดิม เปลี่ยนวัตถุประสงค์/ผู้รับหรือขอบเขตข้อมูลแล้วต้องทบทวน consent ให้ตรง ไม่ถือว่า pending เท่ากับส่งถึงคนแล้ว

## P0-1 — Owner Inbox authorization

**เกณฑ์ PASS**

- Manifest ระบุ Owner Inbox page, API และ data scope จริง รวมการอ่านรายละเอียด รูป และการเปลี่ยนสถานะ/ส่งต่อที่ Inbox ใช้
- Server ตรวจทั้ง trusted identity และ authorization ทุก request; ไม่อาศัยการซ่อน UI, การรู้ URL หรือเพียง login สำเร็จ บทบาท OWNER ใน matching platform ไม่ได้แปลว่าเป็นผู้ดูแล Owner Inbox
- อนุญาตเฉพาะ Owner/Operations ที่ถูกกำหนดสิทธิ์ไว้และเฉพาะข้อมูลใน scope; ไม่อนุมานสิทธิ์จาก OA handle หรือ GitHub username
- Anonymous, ผู้ใช้ทั่วไป, session ที่หมดอายุ, ผู้ถูกเพิกถอนสิทธิ์ และผู้ที่แก้ request ID เพื่อข้าม scope ต้องถูกปฏิเสธโดยไม่มีข้อมูลรั่ว; session/header ที่ปลอมต้องไม่ผ่าน trusted ingress
- บันทึก mock handoff/status change พร้อม actor และ request ID ที่ตรวจย้อนหลังได้; refresh/direct URL ต้องคงผล authorization เดิม

**หลักฐานที่พบ:** [app/api/leads/auth.ts](app/api/leads/auth.ts) บรรทัด 3–10 ตรวจ configured operator email กับ authenticated headers; [app/api/leads/route.ts](app/api/leads/route.ts) บรรทัด 28–36 และ 69–95 มี guard ก่อนอ่าน/แก้/ลบ ส่วน [app/dashboard/page.tsx](app/dashboard/page.tsx) บรรทัด 14–15 เรียก sign-in guard และ [app/chatgpt-auth.ts](app/chatgpt-auth.ts) บรรทัด 42–48 ยอมรับ signed-in user โดยยังไม่ตรวจ operator ที่ระดับ page สิ่งนี้ไม่ใช่หลักฐานว่า API เปิดเผยข้อมูลแก่ทุกคน แต่ยังไม่พิสูจน์ Owner Inbox ตามเกณฑ์นี้

**ผล: BLOCKED.** ขาด route/data-scope mapping ของ Owner Inbox, authority/delegation ของ Owner/Operations และ independent QA ของ trusted ingress, deny cases และ mock handoff หากเลือก dashboard เดิมเป็น Inbox ต้องทบทวน page authorization ให้ตรงเกณฑ์ก่อนส่งตรวจ

## P0-2 — Readable/operable consent

**เกณฑ์ PASS**

- No-guarantee Notice อยู่ก่อน Consent; consent copy ระบุข้อมูล วัตถุประสงค์ การเก็บรูป และผู้รับงานในภาษาที่เลือก โดยไม่กล่าวรับประกันบริการ
- ข้อความและ control อ่านครบ ไม่ถูก overlay บัง ไม่ตัดบรรทัดจนสูญความหมาย; ทดสอบ mobile 390px, desktop 1440px และ zoom 200% พร้อมหลักฐานภาพและการใช้งาน
- Checkbox/ปุ่มมี accessible name; ใช้ Tab, Shift+Tab, Space/Enter ได้ตามชนิด control มี focus ที่เห็นได้; การแตะ label, error และสถานะอ่านเข้าใจได้ หลัง validation error ผู้ใช้แก้ข้อมูล/consent แล้วลองใหม่ได้โดยไม่ต้อง reload ทดสอบทุกภาษาที่ manifest ระบุว่ารองรับ
- ค่าเริ่มต้นไม่ยินยอม ปฏิเสธหรือยกเลิกได้ การกด Next, reload หรือ direct API ต้องไม่ bypass consent; ฝั่ง server ตรวจ explicit consent ที่ตรงกับ request
- บันทึก consent version, เวลา, scope และ request association ใน mock persistence เมื่อยินยอมเท่านั้น; ถ้าไม่ยินยอมต้องไม่มี persistent personal details, staged image หรือ handoff

**หลักฐานที่พบ:** [app/page.tsx](app/page.tsx) บรรทัด 418–427 มี labelled required checkbox และ live status; [app/api/leads/validation.ts](app/api/leads/validation.ts) บรรทัด 258–270 ตรวจ `payload.consent !== true` สำหรับ public/untrusted source เงื่อนไขนี้มี trusted-source exception จึงยังยืนยันไม่ได้ว่า consent ของ Lili ทุกช่องทางถูกบังคับตาม contract

**จุดที่ต้อง REVISE หาก reuse public form:** [public/capture.js](public/capture.js) บรรทัด 916 ปิด submit ก่อน validation และบรรทัด 945–948 return เมื่อ validation ไม่ผ่าน โดยยังไม่เข้า `try/finally` ที่เปิดปุ่มคืนในบรรทัด 979–981 จึงมีเส้นทางที่ปุ่มส่งค้างหลังข้อมูลหรือ consent ไม่ผ่าน นี่คือข้อพบจาก source inspection ยังไม่ได้รันยืนยันใน browser ต้องแก้ error recovery ใน target ที่ใช้โค้ดนี้และแนบ QA ไม่ใช่แก้ Production ในรอบนี้

ข้อพบนี้มีเงื่อนไขว่า submit handler ได้ทำงานและ JavaScript validation ปฏิเสธข้อมูลแล้ว ส่วน required checkbox อาจถูก native browser validation กั้นก่อนถึง handler จึงไม่อ้างว่าการกดส่งโดยไม่ติ๊ก checkbox ผ่าน UI ปกติทำให้เกิดอาการนี้เสมอ ต้องระบุ trigger จริงใน mock runtime reproduction

**ผลตรวจรับ Lili: BLOCKED; candidate public form: REVISE.** ขาด Lili Notice/Consent implementation mapping, consent record/version evidence และ independent readability/keyboard/mobile/zoom/error-recovery QA รวม deny/bypass cases การมี checkbox ไม่ใช่หลักฐานว่าอ่านหรือใช้งานได้จริง

## P0-3 — Staged image persistence (0–4 ภาพต่อคำขอ)

**เกณฑ์ PASS**

- รูปเป็น optional; สูงสุด **4 ภาพรวมต่อ request/draft** บังคับทั้ง UI และ server รวมหลาย upload batches, retry และ concurrent requests ไม่ใช่จำกัดเฉพาะครั้งละ 4
- รูปที่เลือกก่อน Consent เป็น temporary preview เท่านั้น หลังยินยอมจึง persist ลง isolated staging store และผูก durable image ID กับ mock request/authorized owner; object URL หรือ component memory อย่างเดียวไม่ผ่าน persistence
- 1–4 ภาพที่บันทึกสำเร็จเปิดกลับหลัง reload/ออกแล้วกลับเข้าได้ โดยเนื้อหา จำนวน และลำดับยังตรงเดิม; request ที่ไม่มีรูปเดิน flow ต่อได้
- การเพิ่มภาพที่ 5 ถูกปฏิเสธพร้อมข้อความอ่านได้ และไม่ทำให้ 4 ภาพเดิมหาย ไม่มี silent truncation; ฝั่ง server ยังคง invariant นี้เมื่อเรียกตรงหรือแข่งกันส่ง
- Save/upload failure แสดงสถานะที่ตรงจริง เก็บ 4 ภาพเดิมที่บันทึกแล้ว retry ไม่เกิด duplicate; ลบ/แทนที่รูปแล้ว reload สะท้อนผลจริง ไม่ทิ้งรูปที่ถูกยกเลิกให้ถูกส่งต่อ
- ผู้ไม่มีสิทธิ์อ่าน/แก้/แนบ image ID ของคำขออื่นไม่ได้ และ Inbox/handoff ได้เฉพาะรูปที่บันทึกสำเร็จภายใต้ consent; ขั้นตอน rollback/cleanup ทดสอบเฉพาะ mock store

**หลักฐานที่พบ:** [app/api/agents/photos/route.ts](app/api/agents/photos/route.ts) บรรทัด 34–36 และ [app/api/agents/model.ts](app/api/agents/model.ts) บรรทัด 23–30 ยอมรับสูงสุด **6** ภาพใน agent inventory เดิม; upload route บรรทัด 44–48 เขียน object/DB เป็นหลักฐาน storage ของ agent flow เท่านั้น ไม่ใช่ Lili staged persistence

**ผล: REVISE สำหรับเส้นทาง agent เดิมหากนำมาใช้กับ Lili; การตรวจรับ Lili ยัง BLOCKED.** ห้ามนำหลักฐาน route นี้มาประกาศผ่าน 4-image gate ต้องระบุ target implementation ใน manifest และทำให้ target นั้นผ่านขีดจำกัดรวม 4 พร้อม persistence QA ขาด request-image binding, reload, fifth-image, concurrent/retry, removal/failure และ access evidence ของ Lili โดยตรง ไม่ได้สั่งเปลี่ยนขอบเขต agent inventory เดิมในงานเอกสารนี้

## Acceptance cases — แผนทดสอบ ยังไม่ได้รัน

ทุกแถวเป็น Example แยกกัน ใช้ `mock_data: true` และ fixture IDs ภายใน sandbox เท่านั้น ไม่มี contact, Lead หรือภาพของบุคคลจริง

| Case | mock_data | สิ่งที่จะทดลอง | Expected | ผลรอบนี้ |
| --- | --- | --- | --- | --- |
| AUTH-01 | true | Anonymous และ signed-in user ที่ไม่มีสิทธิ์ เปิด Inbox/page/API/รูปโดยตรง | deny ไม่มี private payload หรือภาพ | NOT_RUN |
| AUTH-02 | true | Authorized Owner/Operations อ่านและรับ mock request; user อีกคนลอง ID เดียวกัน | ผู้มีสิทธิ์ทำได้ตาม scope; อีกคน deny; actor trace ครบ | NOT_RUN |
| AUTH-03 | true | ปลอม identity header, session หมดอายุ, revoke สิทธิ์ แล้ว reload/retry | deny ผ่าน test ingress; ไม่มี stale access | NOT_RUN |
| CONSENT-01 | true | เดิน Welcome ถึง Notice แล้วปฏิเสธ; เรียก API โดยไม่ยินยอม | ไม่ persist details/รูป ไม่ handoff | NOT_RUN |
| CONSENT-02 | true | อ่านและใช้ Notice/Consent ด้วย keyboard/touch ทุกภาษาที่ประกาศ, 390px/1440px, zoom 200% | ข้อความครบ focus/control/error ใช้งานได้ | NOT_RUN |
| CONSENT-03 | true | ยินยอมแล้ว Back/reload; เปลี่ยนขอบเขตข้อมูล; ส่งผ่านช่องทาง trusted | version/scope ตรง; ไม่มี bypass หรือ inherited consent ที่ผิดขอบเขต | NOT_RUN |
| CONSENT-04 | true | Submit ข้อมูลหรือ consent ที่ไม่ผ่าน แล้วแก้ไขและลองใหม่ใน stub flow | ปุ่ม/control กลับมาใช้งานได้ ไม่ส่งข้อมูลก่อนผ่าน validation; ไม่ต้อง reload | NOT_RUN |
| IMAGE-01 | true | บันทึก mock requests ที่มีรูป 0, 1 และ 4 ภาพหลัง consent แล้ว reload/reopen | flow ผ่าน; durable images และจำนวน/ลำดับตรง | NOT_RUN |
| IMAGE-02 | true | เพิ่มภาพที่ 5 ผ่าน UI/API หลาย batch และ concurrent uploads | reject ภาพเกิน; จำนวนรวมไม่เกิน 4; ของเดิมครบ | NOT_RUN |
| IMAGE-03 | true | จำลอง upload/save fail แล้ว retry; ลบ/แทนที่แล้ว reload | ไม่แสดง success ก่อน durable save, ไม่ซ้ำ, ข้อมูลตรงกับสถานะ | NOT_RUN |
| IMAGE-04 | true | ใช้ image ID ของ request/owner อื่นเพื่ออ่านหรือแนบ | deny; ไม่มีภาพรั่วหรือ cross-request attachment | NOT_RUN |
| FLOW-01 | true | เดินทั้ง 7 states ด้วย fixture และ stub handoff | ลำดับตรง contract, Pending Review หลัง save, ผู้มีสิทธิ์รับงาน; ไม่มี outbound จริง | NOT_RUN |

ตัวอย่าง payload สำหรับ fixture เท่านั้น ไม่ใช่ API contract ที่ใช้งานแล้ว:

```json
{
  "mock_data": true,
  "request_id": "mock-request-001",
  "category": "housing",
  "minimum_details": { "display_name": "Mock Resident", "contact": "resident@example.invalid" },
  "no_guarantee_notice_seen": true,
  "consent": { "accepted": true, "version": "mock-v1", "scope": "mock-owner-review" },
  "staged_image_ids": ["mock-image-01", "mock-image-02", "mock-image-03", "mock-image-04"],
  "status": "pending_review",
  "handoff": { "transport": "stub", "sent": false }
}
```

fixture นี้ไม่ใช่หลักฐานผลทดสอบ และ flag `no_guarantee_notice_seen` จาก client อย่างเดียวไม่พิสูจน์ว่าลำดับ flow ถูกบังคับจริง

## Missing evidence ที่ต้องแนบก่อนตัดสิน PASS

| ID | สิ่งที่ต้องส่ง | ใช้ยืนยัน |
| --- | --- | --- |
| M-01 | GitHub manifest permalink ที่ตรึง commit SHA พร้อม repository, target app/routes, build/deployment ID และ isolated environment | หลักฐานที่ตรวจทั้งหมดมาจาก implementation เดียวกัน; local HEAD อย่างเดียวไม่พอ |
| M-02 | Manifest ระบุ accountable Owner/Operations, Inbox page/API, role/resource policy และ trusted auth boundary โดยไม่เปิดเผย secrets | P0-1; ตอนนี้ target identity/authority ที่ไม่ทราบมี `identity_status:missing` |
| M-03 | Manifest mapping Lili states, Notice/Consent version และ persistence fields ไป source/route; screenshots และ keyboard/touch/zoom results | P0-2 และลำดับ flow |
| M-04 | Manifest ระบุ staging store, request-image binding, server/UI cap 4; logs/ภาพ/ผล assert ของ reload, cap, concurrency, failure/retry และ authorization | P0-3; ไม่ใช้ agent 6-image flow เป็นหลักฐานผ่าน |
| M-05 | Manifest บันทึก `canonical_line_oa: "@middleproperty"`, provenance `Owner input`, UI/config/handoff mapping และ stub trace ไม่มี outbound จริง | ยืนยัน implementation ใช้ OA ตามข้อกำหนดโดยไม่ส่ง LINE จริง |
| M-06 | Independent QA report: reviewer ที่แยกจากผู้ implement, วันที่, environment, commit/deployment เดียวกับ manifest, case IDs, expected/actual, artifacts และ verdict/missing evidence | ทั้ง 3 P0 และ OA mapping; test plan หรือ source review อย่างเดียวไม่พอ |

Reviewer ต้องสามารถตรวจ artifacts ได้จริง ลบ secrets/ข้อมูลส่วนบุคคลออกจากหลักฐานแต่คง mock request IDs สำหรับเชื่อมผล ไม่มีข้อใดในรายการนี้เป็นการอนุญาตแก้ Production

รายงานเดิม [docs/USER_SIMULATION_QA.md](docs/USER_SIMULATION_QA.md) ทดสอบ public lead form วันที่ 2026-09-03 และ [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) รายงาน matching/viewing slice วันที่ 2026-09-08 จึงไม่ใช้แทน independent QA ของ Lili P0 revision นี้ แม้มีคำว่า passed หรือ independent source review ในเอกสารเดิม

## Decision rule และผลปัจจุบัน

| Verdict | เกณฑ์ |
| --- | --- |
| PASS | ทั้ง 3 P0 ผ่านใน target เดียวกัน มี M-01 ถึง M-06 ครบ ไม่มี failure ที่ค้าง และตรวจ trace ตาม Lili flow ได้ |
| REVISE | พบ implementation/evidence ที่ขัดเกณฑ์ ให้ระบุจุดแก้และ case ที่ต้องตรวจใหม่; ยังไม่ verified |
| BLOCKED | target identity, manifest หรือ independent QA ที่จำเป็นยังขาดจนรับรองไม่ได้; ระบุ missing evidence และคง false |

หากมีทั้ง REVISE และ BLOCKED ให้ผลรวมเป็น **BLOCKED** พร้อมคงรายการแก้ไขไว้ ไม่มี PASS จากการทำเอกสารเสร็จ และ PASS ของ gate นี้ในอนาคตก็ไม่ใช่คำสั่ง deploy หรือสร้าง Lead จริง

| รายการ | Verdict ปัจจุบัน | Missing evidence / งานที่ต้องแก้ |
| --- | --- | --- |
| P0-1 Owner Inbox authorization | BLOCKED | M-01, M-02, M-06; route/authority/deny/handoff QA |
| P0-2 Readable/operable consent | BLOCKED; REVISE หาก reuse public form เดิม | M-01, M-03, M-06; Notice/Consent flow และ usability/bypass/error-recovery QA; source พบปุ่มปิดค้างเมื่อ validation ไม่ผ่าน |
| P0-3 Staged image persistence ≤4 | BLOCKED; REVISE หาก reuse agent route เดิม | M-01, M-04, M-06; target cap/reload/failure/access QA; route เดิมรับ 6 |
| OA verification prerequisite (ไม่ใช่ P0 เพิ่ม) | BLOCKED | M-01, M-05, M-06; Owner input ถูกบันทึกแล้วแต่ implementation ยังไม่ verified |

**Overall: BLOCKED — missing evidence M-01 ถึง M-06. `implementation_verified: false`.** งานที่ส่งมอบรอบนี้คือเอกสารเกณฑ์และหลักฐาน source เท่านั้น
