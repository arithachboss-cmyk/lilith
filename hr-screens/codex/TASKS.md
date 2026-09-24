# AMI — HUMAN + AI COMMAND · Codex Implementation Handoff

หน้าจอส่วนบุคคลหลังเข้าสู่ระบบ 6 ตำแหน่งของ HR + AI / Middle Property
ส่งต่อจาก prototype ใน `hr-screens/` เพื่อพัฒนาเป็นของจริง

## สถานะของเอกสารนี้

**งานชุดนี้อยู่นอกลำดับ Blueprint** ไม่มี TASK-ID ใน `IMPLEMENTATION_ORDER.md`
หรือ `docs/07-codex-handoff.md` ที่ครอบคลุม จึงไม่ได้ตั้ง TASK-ID ปลอมขึ้นมา
และไม่ได้แก้เอกสาร Blueprint ซึ่ง ADR-0013 กำหนดให้นำเข้าโดยไม่แก้เนื้อหา

ใช้ prefix `AMI-` ซึ่งไม่ชนกับ prefix ที่ §30 ใช้อยู่
(`ARCH DB AUTH API MATCH AI DEAL FEE UI SEC OPS QA ADMIN`)
รูปแบบการ์ดงานเหมือน §30 ทุกประการ เพื่อให้อ่านด้วยกระบวนการเดิมได้

**กติกาของ §30.0 ใช้กับงานชุดนี้ทั้งหมด** — หนึ่งงานหนึ่ง branch หนึ่ง PR,
งานเสร็จเมื่อเกณฑ์รับงานเป็นจริงและพิสูจน์ได้ใน CI ไม่ใช่แค่เขียนเสร็จ,
ห้ามลดทอน constraint หรือ authz check เพื่อให้ผ่าน, และปิด PR ด้วย
`STATUS / EVIDENCE / RISKS / BLOCKERS / NEXT / OWNER APPROVAL`

## ชุดข้อมูลที่แนบมา

| ไฟล์ | เนื้อหา | แก้ด้วยมือได้ไหม |
|---|---|---|
| `contract/role-registry.json` | 6 ตำแหน่ง role_id / grok_id / call sign / space / accent + specialist pool | **ไม่ได้** generate จาก `hr-screens/data.js` |
| `contract/screens.json` | หมายเลขจอ เส้นทางที่เสนอ panel_kind และบล็อกที่ทุกจอต้องมี | **ไม่ได้** generate เช่นกัน |
| `contract/enums.json` | ค่าคงที่ทุกตัวที่หน้าจอใช้ พร้อมกติกาการแสดงผลของแต่ละค่า | ได้ |
| `contract/server-contract.json` | endpoint ช่องข้อมูล แหล่งที่มา และกฎที่ห้ามละเมิด 5 ข้อ | ได้ |
| `contract/panel-payloads.schema.json` | JSON Schema ของ payload ทั้ง 6 panel_kind | ได้ |
| `contract/ui-strings.json` | ข้อความ 59 รายการ ครบทั้ง th และ en | ได้ |
| `contract/acceptance.json` | เกณฑ์รับงาน 15 ข้อ ผูกกับ task และระบุวิธีตรวจ | ได้ |

```bash
node hr-screens/codex/build-contract.mjs   # สร้างไฟล์ที่ generate ใหม่จาก data.js
node hr-screens/codex/check-contract.mjs   # ด่านตรวจ ต้องผ่านก่อนส่งงาน
```

**อ่าน `WORKING-AGREEMENT.md` ก่อนเริ่ม** — ระบุว่าใครเป็นเจ้าของไฟล์ไหน
ต้องรันอะไรก่อน push และทำอย่างไรเมื่อสัญญาไม่พอใช้

`check-contract.mjs` ฝังตารางจากบรีฟไว้ในตัวเอง **ไม่ได้อ่านจาก `data.js`**
เพราะถ้าอ่านจากแหล่งเดียวกับที่ตรวจ การตรวจก็ไม่ได้ตรวจอะไรเลย

---

## PHASE A — สัญญาและโครง

### AMI-001 — Role registry + contract package
- **Goal:** ทะเบียนบทบาทและสัญญาข้อมูลเป็นแหล่งเดียว ใช้ได้ทั้งฝั่ง server และ UI
- **Files:** `packages/contracts/src/ami/{roles.ts,enums.ts,panels.ts}`, นำค่าจาก `hr-screens/codex/contract/*.json`
- **Dependencies:** ARCH-003
- **Acceptance:** `role_id`, `grok_id`, `call_sign` ของทั้ง 6 ตำแหน่งตรงกับตารางในบรีฟทุกช่อง · `GROK-01` ถึง `GROK-10` ถูกกำหนดครบ ไม่ซ้ำและไม่หาย · ไฟล์ที่ generate ตรงกับ `hr-screens/data.js` · การเพิ่มบทบาทที่ไม่มีใน registry เป็น TypeScript error
- **Tests:** `node hr-screens/codex/check-contract.mjs` ใน CI + schema round-trip ของ enum ทุกตัว

### AMI-002 — สตริงสองภาษา
- **Goal:** ข้อความที่ผู้ใช้เห็นทุกจุดมีทั้ง th และ en ตาม definition of done ของรีโป
- **Files:** `packages/i18n/src/ami/{th.ts,en.ts}` จาก `contract/ui-strings.json`
- **Dependencies:** AMI-001
- **Acceptance:** ทุก key มีทั้งสองภาษาและไม่มีค่าว่าง · key ที่ขาดภาษาใดภาษาหนึ่งทำให้ build ล้ม · call sign ชื่อ mission role_id และ grok_id ไม่ถูกแปล
- **Tests:** test ที่ enumerate ทุก key แล้วยืนยันว่ามีครบสองภาษา
- **หมายเหตุ:** ฉบับ en ในชุดข้อมูลเป็น `DRAFT_NEEDS_REVIEW` ต้องให้คนทบทวนก่อนขึ้นจริง

---

## PHASE B — สิทธิ์และข้อมูล

### AMI-003 — Session, role resolution และสองชั้นสิทธิ์
- **Goal:** ตัวตนและบทบาทมาจาก session ฝั่ง server และสิทธิ์ต่อแผงผ่านทั้ง AMI permission แล้วจึง Keeper disclosure
- **Files:** `apps/web/src/app/api/ami/me/route.ts`, `packages/core/ami/{resolve.ts,access.ts}`
- **Dependencies:** AUTH-002, AMI-001
- **Acceptance:** ผู้ใช้ที่ไม่ได้ลงชื่อเข้าใช้ไม่ได้รับเนื้อหาหรือชื่อแผงใด ๆ · การส่ง `active_role` ที่ผู้ใช้ไม่ได้ถือไม่ทำให้เห็นข้อมูลของบทบาทนั้น เพราะ server re-derive จาก `user_roles` เสมอ · เมื่อสิทธิ์ยังไม่ทราบ ตอบ `PENDING_CHECK` ไม่ใช่เดาว่าเข้าถึงได้ · ไม่มี endpoint ใดรับ `role_id` จาก client เป็นฐานการตัดสิน
- **Tests:** integration test ทั้งสามกรณี — ไม่มี session, `active_role` ปลอม, และสิทธิ์ที่ยังไม่ทราบ

### AMI-004 — Panel payload endpoints
- **Goal:** ข้อมูลของแผงทั้ง 6 แบบ กรองตามสิทธิ์ฝั่ง server แล้วก่อนส่ง
- **Files:** `apps/web/src/app/api/ami/panel/[kind]/route.ts`, `packages/core/ami/panels/*.ts`
- **Dependencies:** AMI-003
- **Acceptance:** payload ทุก `panel_kind` ผ่าน `panel-payloads.schema.json` · `lanes` ของ `ops` ส่งครบห้าขั้นเสมอ ขั้นที่ว่างเป็นอาร์เรย์ว่างไม่ใช่ถูกตัดออก · statement ที่ไม่มี `source_ref` ไม่ถูกส่งเป็น `FACT` · `evidence.source` และ `evidence.date` ที่ไม่มีข้อมูลส่งเป็น `null` ไม่ใช่ค่าที่แต่งขึ้น · server ไม่ส่งของที่ต้องซ่อนมาให้ client ซ่อนเอง
- **Tests:** contract test ทั้งหกแบบกับ JSON Schema + กรณีขั้นงานว่าง + กรณี statement ไม่มีแหล่งอ้างอิง

### AMI-005 — เส้นแบ่งอำนาจที่บังคับด้วยโค้ด
- **Goal:** ข้อห้ามในบรีฟกลายเป็นสิ่งที่ละเมิดไม่ได้ ไม่ใช่ข้อความเตือนบนหน้าจอ
- **Files:** `packages/core/ami/guards.ts`, เทสต์ใน `packages/core/__tests__/ami-*.test.ts`
- **Dependencies:** AMI-004
- **Acceptance:** ไม่มี endpoint ของ AMI ที่เขียนหรือรับคะแนนการจับคู่ · ไม่มีหน้าจอใดมีปุ่มหรือเส้นทางที่ override Keeper หรือเลือกเปิดข้อมูลลับทั้งหมด · response ของทุก endpoint ไม่มีช่องที่มีคำว่า key token secret หรือ credential · การเป็น AI Coordinator ไม่ให้สิทธิ์สร้าง credentials หรืออนุมัติ integration
- **Tests:** AST check บน route ของ AMI + contract test สแกน response ทุกแบบ + unit test ว่า component ไม่มี control ที่แก้คะแนน

---

## PHASE C — หน้าจอ

### AMI-006 — App shell, 6 หน้าจอ และสถานะทั้งห้า
- **Goal:** หน้าจอจริงที่ใช้ component ร่วมกันตามที่ prototype วางไว้
- **Files:** `apps/web/src/app/(ami)/**`, `packages/ui/src/ami/*`
- **Dependencies:** AMI-002, AMI-004
- **Acceptance:** ทุกจอมีครบเก้าบล็อกตาม `screens.json` · สถานะ loading empty error และรอตรวจสิทธิ์แสดงถูกต้องทั้งหกจอ · กล่องรอตรวจสิทธิ์ไม่แสดงเนื้อหาบางส่วนและไม่บอกจำนวนรายการที่ถูกกั้น · แถบบทบาทใช้คีย์บอร์ดได้ครบ ลูกศรสี่ทิศ Home และ End · โฟกัสเห็นชัดทุกองค์ประกอบ · ไม่ล้นแนวนอนที่ 360 ถึง 1440 px · เคารพ `prefers-reduced-motion` และไม่มีเสียงหรือแอนิเมชันที่เล่นเอง
- **Tests:** unit test ของทุกสถานะ · a11y test ด้วยคีย์บอร์ด · visual test ยืนยัน `scrollWidth === clientWidth` ทุก breakpoint
- **หมายเหตุ:** ตัวสลับ "ดูตัวอย่างบทบาท" ของ prototype **ต้องไม่มีในของจริง** เป็นเครื่องมือออกแบบเท่านั้น

### AMI-007 — ร่างคำขอผู้เชี่ยวชาญ
- **Goal:** เตรียมร่างคำขอได้จริง โดยยังไม่มีการส่งและไม่มีการเปิดเผยข้อมูลเพิ่ม
- **Files:** `apps/web/src/app/api/ami/specialist-request/draft/route.ts`, `packages/core/ami/specialist.ts`
- **Dependencies:** AMI-003
- **Acceptance:** สถานะที่ระบบยอมรับในเฟสนี้มีเฉพาะ `DRAFT` · การสร้างร่างไม่ทำให้ผู้ขอเห็นข้อมูลเพิ่มแม้แต่รายการเดียว · ข้อความขอบเขตข้อมูลมาจาก server ไม่ใช่ประกอบขึ้นที่ client · ไม่มีจุดใดในระบบแสดงว่าส่งคำขอสำเร็จ เรียก AI สำเร็จ หรืออนุมัติสิทธิ์แล้ว
- **Tests:** test ว่าสถานะอื่นถูกปฏิเสธ + test ว่าชุดข้อมูลที่ผู้ขอเห็นก่อนและหลังสร้างร่างเท่ากันทุกประการ

---

## เรื่องที่ต้องให้เจ้าของระบบตัดสินก่อน

| ลำดับ | เรื่อง | ทำไมถึงบล็อก |
|---|---|---|
| ก่อน AMI-003 | **วิธีเข้าสู่ระบบ** บรีฟระบุอีเมลองค์กรเป็น username และต้องเปลี่ยนรหัสเริ่มต้น แต่ `docs/03-security-events-admin.md` ระบุว่า **No passwords in V1** ใช้ OTP ทางโทรศัพท์เป็นหลัก | สองแบบนี้ไปด้วยกันไม่ได้ และ AMI-003 ต้องต่อกับวิธีใดวิธีหนึ่ง |
| ก่อน AMI-003 | **Keeper อยู่ตรงไหนในสถาปัตยกรรม** ชุดข้อมูลนี้เสนอให้เป็นชั้นที่ประเมินฝั่ง server หลังสิทธิ์ผ่านแล้ว เทียบเคียงกับ L2/L3 และ RLS ที่มีอยู่ | ถ้า Keeper ถูกวางไว้ผิดชั้น การกั้นจะกลายเป็นเรื่องของ UI ซึ่งข้ามได้ |
| ก่อน AMI-006 | **เส้นทางจริงของหน้าจอ** `screens.json` เสนอ `/ami/<slug>` ซึ่งเป็นข้อเสนอ ไม่ใช่การตัดสิน | กระทบ routing, sitemap และการกันไม่ให้ index |
| ก่อน AMI-002 ขึ้นจริง | **ทบทวนฉบับภาษาอังกฤษ** ปัจจุบันเป็น `DRAFT_NEEDS_REVIEW` | เป็นข้อความที่ผู้ใช้เห็น |

## สิ่งที่อยู่นอกขอบเขตของงานชุดนี้

การเชื่อมต่อ xAI, AMI Core หรือ THE KEEPER จริง · การส่งคำขอผู้เชี่ยวชาญจริง ·
การสร้าง แก้ไข หรือรีเซ็ตบัญชี · การแก้ระบบ matching หรือ permission ที่มีอยู่ ·
การ deploy
