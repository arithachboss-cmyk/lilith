# Handoff สำหรับ Codex — หน้าจอส่วนบุคคล 6 ตำแหน่ง

## 1. ไฟล์

| ไฟล์ | หน้าที่ |
|---|---|
| `index.html` | โครงหน้า แถบบน ตัวสลับ DEMO และจุดวางหน้าจอ |
| `styles.css` | design tokens ทั้งหมด · สีเน้นต่อบทบาทอยู่ที่ `[data-accent='…']` |
| `data.js` | ข้อมูลสังเคราะห์ + ทะเบียนบทบาท (role_id / Grok / call sign) |
| `app.js` | การเรนเดอร์ สถานะ และการโต้ตอบ |
| `serve.mjs` | static server สำหรับเปิดดูในเครื่อง |

ไม่มี dependency ไม่มี build step และไม่แตะ `pnpm-lock.yaml`

## 2. Component ที่ใช้ร่วมกันทั้ง 6 หน้าจอ

| Component | หน้าที่ | จุดที่ต่างตามบทบาท |
|---|---|---|
| `TopBar` | แบรนด์ AMI / HR + AI, เมนูบัญชี, ออกจากระบบ | ไม่ต่าง |
| `RoleSwitcher` | ตัวสลับ DEMO (tablist) | ไม่ต่าง — **ไม่อยู่ในของจริง** |
| `MissionPassport` | คำต้อนรับ ตราภารกิจ ชื่อพื้นที่ role_id call sign Grok | ตรา สี ชื่อพื้นที่ คำต้อนรับ |
| `MissionToday` | ภารกิจสำคัญวันนี้ + next action + primary action | เนื้อหาและชื่อปุ่ม |
| `RolePanel` | แผงกลางเฉพาะบทบาท | **ต่างทั้งหมด** — 6 แบบ |
| `CopilotPanel` | Grok ประจำตำแหน่ง + สถานะ “รอเชื่อมต่อ” | grok_id, call sign, ขอบเขต |
| `SpecialistRequest` | เลือกผู้เชี่ยวชาญและเตรียมร่างคำขอ | ข้อความขอบเขตข้อมูล |
| `AuthorityPanel` | ขอบเขตอำนาจ + หลักสี่ข้อ | ข้อความขอบเขต |
| `StateBox` | loading / empty / error / unavailable | ไม่ต่าง |

แผงกลาง 6 แบบ: `director` (mission map + briefing + escalation) · `hr` (journey + people + registry) ·
`ops` (lanes + handoff queue) · `intel` (evidence ↔ statements) · `match` (brief ↔ candidates) ·
`ai` (agent registry + readiness)

## 3. ช่องที่ต้องรับจาก server

ห้าม client เดาบทบาทจากอีเมลหรือจากตัวสลับใด ๆ ทุกช่องด้านล่างต้องมาจาก session
ฝั่ง server และต้องตรวจสิทธิ์ใหม่ทุกคำขอ

| ช่อง | มาจาก | หมายเหตุ |
|---|---|---|
| `display_name` | session → user profile | ใช้ในคำต้อนรับ |
| `role_id` | session → user_roles | **ห้าม** derive จากอีเมล |
| `title` | role registry | ตำแหน่งจริง ไม่ใช่ยศตกแต่ง |
| `grok_id`, `call_sign`, `space`, `accent` | role registry | ข้อมูลแสดงผล |
| `mission_today`, `next_actions` | บริการของแต่ละโดเมน | ต้องกรองตามสิทธิ์แล้วจาก server |
| `panel_payload` | บริการของแต่ละโดเมน | รูปร่างต่างกันตาม `panels.kind` |
| `ai_status` | AMI | ตอนนี้คงที่ `DEFINED_NOT_CONNECTED` |
| `specialist_pool` | AMI | รายการที่บทบาทนี้ขอได้ |
| `access` ต่อแผง | AMI + Keeper | `granted` / `pending_check` / `denied` |

### จุดที่ต้องต่อกับของเดิมในรีโปนี้

สถาปัตยกรรมที่มีอยู่แล้วรองรับข้อกำหนดของบรีฟตรง ๆ และควรใช้ซ้ำแทนการสร้างใหม่

- `GET /api/me` คืน identity + roles + tier และเอกสารระบุไว้แล้วว่า client
  **ไม่เคย** derive permission จากมัน — ตรงกับกฎ “ห้ามเดาบทบาทจากอีเมล”
- `active_role` ถูกกำหนดไว้แล้วว่าเป็น **UI context switch ใน session ไม่ใช่การตัดสินใจ
  ด้านความปลอดภัย** — ตัวสลับ DEMO ในหน้านี้เทียบเท่าแนวคิดนั้น และของจริงต้อง
  re-derive สิทธิ์จาก `user_roles` + ownership ทุกครั้ง
- `ActorContext {userId, roles, orgId}` และ `authorize(ctx, policy, resource)`
  ที่ทุก route handler ต้องเรียก คือจุดที่ AMI permission ควรอยู่
- ชั้น **L1 ROLE / L2 OWNERSHIP / L3 TIER** และ Row Level Security ที่มีอยู่แล้ว
  คือที่ทางของ Keeper disclosure — Keeper ต้องเป็นชั้นที่ประเมินฝั่ง server
  **หลัง** สิทธิ์ผ่านแล้ว ไม่ใช่แนวคิดในฝั่ง UI
- กฎ “Match score is deterministic. Same inputs → same score, always.
  LLMs contribute inputs and explanations, never the number.” มีอยู่ในเอกสาร
  สถาปัตยกรรมอยู่แล้ว — หน้าจอ 05 แสดงคะแนนแบบอ่านอย่างเดียวตามกฎนี้

### ข้อขัดแย้งที่ต้องให้เจ้าของระบบตัดสิน

บรีฟระบุว่าเข้าสู่ระบบด้วย **อีเมลองค์กรเป็น username และต้องเปลี่ยนรหัสเริ่มต้น**
แต่เอกสารสถาปัตยกรรมของรีโปนี้ระบุว่า **“No passwords in V1”** โดยใช้ OTP ทางโทรศัพท์
เป็นวิธีหลักและ email magic link เป็นวิธีรอง

prototype นี้ไม่ได้แตะระบบบัญชีทั้งสองแบบ และรักษาลำดับที่บรีฟสั่งไว้ในข้อความเมนูบัญชี
แต่ก่อนต่อของจริงต้องตัดสินก่อนว่าจะใช้แบบใด เพราะสองแบบนี้ไปด้วยกันไม่ได้

## 4. รายการที่เป็นการจำลอง

ทุกข้อด้านล่างเป็นการจำลองล้วน ต้องแทนที่ก่อนใช้งานจริง

| สิ่งที่จำลอง | สภาพปัจจุบัน | ต้องแทนด้วย |
|---|---|---|
| ตัวตนและ role_id | ค่าคงที่ใน `data.js` | session ฝั่ง server |
| ตัวสลับ “ดูตัวอย่างบทบาท” | เปลี่ยนเฉพาะการแสดงผล | **ถอดออกทั้งหมด** ในของจริง |
| ข้อมูลทุกแผง | fixture สังเคราะห์ | บริการของแต่ละโดเมน กรองตามสิทธิ์แล้ว |
| “สถานะตัวอย่าง” | ตัวเลือกสำหรับสาธิต | สถานะจริงจาก request |
| ปุ่ม primary action | แสดงข้อความว่าเตรียมร่างแล้ว | การทำงานจริงของแต่ละโดเมน |
| ปุ่มเตรียมร่างคำขอ | สร้างข้อความร่างในหน้า | คิวคำขอจริงหลังได้สิทธิ์ |
| เมนูบัญชี / ออกจากระบบ | กล่องข้อความอธิบาย | flow เดิมของระบบบัญชี |
| ปุ่ม “ลองอีกครั้ง” | `setTimeout` 700ms | การเรียกข้อมูลจริง |
| ตราภารกิจและภาพวงโคจร | SVG และ CSS gradient ในไฟล์ | asset จริงถ้ามี |

## 5. สิ่งที่ prototype นี้ตั้งใจไม่ทำ

- ไม่มี network call ใด ๆ (ตรวจแล้ว: ไม่มี `http(s)://` หรือ `url()` ในทุกไฟล์)
- ไม่สร้าง ไม่รีเซ็ต ไม่แก้ไขบัญชี · ไม่ส่งอีเมล · ไม่ deploy
- ไม่แตะระบบ matching หรือ permission ที่มีอยู่
- ไม่แสดง key, token หรือ secret และไม่มีช่องกรอกรหัสผ่าน
- ไม่มีปุ่ม override Keeper และไม่มีตัวเลือก “เปิดข้อมูลลับทั้งหมด” ในหน้าจอใดเลย
- ไม่แสดงว่าส่งคำขอสำเร็จ เรียก AI สำเร็จ หรืออนุมัติสิทธิ์จริง

## 6. ตรวจก่อนส่งงาน

ตรงตามตารางในบรีฟทุกตำแหน่ง (ตรวจจาก `data.js` ซึ่งเป็นแหล่งเดียวของค่าเหล่านี้)

| # | role_id | Grok | call sign |
|---|---|---|---|
| 01 Director | `HR-01` | `GROK-10` | ORCHESTRATOR |
| 02 Human Resources | `HR-02` | `GROK-01` | PEOPLE |
| 03 Operations | `HR-03` | `GROK-08` | WATCHTOWER |
| 04 Intelligence / Research | `HR-04` | `GROK-02` | ANALYST |
| 05 Matchmaker | `HR-05` | `GROK-04` | CONNECTOR |
| 06 AI Coordinator | `HR-06` | `GROK-07` | ECOSYSTEM |

Shared Specialist: `GROK-03` VERIFIER · `GROK-05` NEGOTIATION · `GROK-06` RISK ·
`GROK-09` GOVERNANCE — เป็น pool ไม่ผูกกับพนักงานคนเดียว

**หมายเหตุการตีความ:** บรีฟเขียน Grok เป็นรูปแบบ `GROK-xx / CALLSIGN`
จึงอ่านว่าส่วนหน้าคือรหัส Grok และส่วนหลังคือ call sign ประจำตำแหน่ง
ถ้าตั้งใจให้ call sign เป็นคนละค่ากับชื่อ Grok ต้องส่งตารางเพิ่ม
