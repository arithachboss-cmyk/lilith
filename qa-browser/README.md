# qa-browser — เทสต์เบราว์เซอร์ของ **ต้นแบบ** AMI

## อ่านก่อน: เทสต์ชุดนี้พิสูจน์อะไร และไม่พิสูจน์อะไร

> **เทสต์ที่นี่กั้นต้นแบบใน `hr-screens/` เท่านั้น
> มันไม่ได้ทำให้เกณฑ์ `AC-13` `AC-14` `AC-15` ผ่าน**

เกณฑ์สามข้อนั้นใน `hr-screens/codex/contract/acceptance.json` ผูกกับงาน `AMI-006`
ซึ่งเป็นหน้าจอใน `apps/web` — และ `apps/web/src/app/api` **ยังไม่ถูกสร้าง**
เทสต์สีเขียวที่นี่จึงไม่ใช่หลักฐานว่าตัวผลิตภัณฑ์ทำได้

`docs/GROK-QA-ROLE-PACK.md` §0.3 เตือนกับดักนี้ไว้ตรง ๆ: ต้นแบบ **ดูเหมือนแอปที่ใช้งานได้เพราะมันเป็น**
แต่มันสร้างจากข้อมูลสมมติใน `hr-screens/data.js` การทดสอบมันไม่ได้บอกอะไรเกี่ยวกับ `apps/web`

**แล้วทำไมยังคุ้มเขียน** — ต้นแบบคือ **เอกสารกำหนดสเปก** ของหน้าจอเหล่านั้น การกันไม่ให้มันถอยหลัง
จึงมีค่าจริง และเมื่อ `AMI-006` ถูกสร้าง เทสต์ชุดนี้ชี้ไปที่ของจริงได้โดยแก้แค่ `baseURL`

## ทำไมอยู่ที่นี่ ไม่ใช่ใน hr-screens/ หรือ packages/

`hr-screens/codex/WORKING-AGREEMENT.md` ระบุกรรมสิทธิ์ไฟล์ไว้ — `hr-screens/` (นอก `codex/`)
ฝั่งเราอ่านอย่างเดียว ส่วน `apps/` และ `packages/` เป็นของงาน implement ที่กำลังทำอยู่
ไดเรกทอรีนี้จึงอยู่นอกทั้งสองที่ และอยู่นอก glob `apps/*` `packages/*` ของ workspace
เหมือนที่ `acs-seo/` กับ `hr-screens/` ทำ

## รัน

```sh
pnpm test:prototype
```

`playwright.config.ts` จะสั่ง `node hr-screens/serve.mjs` ขึ้นมาเอง แล้วปิดให้เมื่อจบ

### ในคอนเทนเนอร์คลาวด์ของ Claude Code

Chromium ที่ติดตั้งมาให้เป็น revision **1194** แต่ `@playwright/test` 1.63.0 มองหา **1243**
และการดาวน์โหลดถูกบล็อกที่ขาออก จึงต้องชี้ไปที่ตัวที่มีอยู่

```sh
PW_CHROMIUM_PATH=/opt/pw-browsers/chromium pnpm test:prototype
```

ทดสอบแล้วว่า driver 1.63 ขับ Chromium 1194 ได้ **แต่ต้องรู้ตัวว่ามันคนละ build กับที่ CI ใช้**
ผลในเครื่องจึงยังไม่ใช่ผล CI ตามที่ `AGENTS.md` กำหนดให้รายงานแยกกัน

ใน CI ไม่ต้องตั้งตัวแปรนี้ — workflow รัน `npx playwright install` ให้ได้ revision ที่ตรงกับ driver

## เทสต์แต่ละไฟล์ตรงกับเกณฑ์ข้อไหน

| ไฟล์ | อ้างอิงเนื้อหาของ | ตรวจอะไร |
|---|---|---|
| `tests/prototype-keyboard.spec.ts` | `AC-13` | แถบบทบาทเป็น `role="tablist"` · ลูกศรสี่ทิศ Home End ใช้ได้ · โฟกัสมองเห็น |
| `tests/prototype-no-overflow.spec.ts` | `AC-14` | ไม่ล้นแนวนอนที่ 360 · 768 · 1024 · 1440 px |
| `tests/prototype-reduced-motion.spec.ts` | `AC-15` | เคารพ `prefers-reduced-motion: reduce` |

**"อ้างอิงเนื้อหาของ" ไม่ใช่ "ทำให้ผ่าน"** — ดูย่อหน้าแรกของไฟล์นี้อีกครั้งถ้าไม่แน่ใจ
