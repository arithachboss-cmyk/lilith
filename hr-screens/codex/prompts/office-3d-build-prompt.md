# Prompt: AMI Office — isometric 3D office for the 100-agent roster

Paste everything below the line into an AI app builder (Lovable, v0, Claude, Bolt …)
and attach `hr-screens/codex/contract/agent-roster.json` as the data file.
Visual reference: an isometric "AI office" with team rooms around a central hub.
Source of truth for agents: the roster file, never the reference video.

---

Build a single-page web app called **AMI Office** — an isometric 3D office where a
real-estate company's 100 AI agents sit in 10 team rooms around a central hub.
UI language is **Thai first**, with English as a smaller secondary line.

## Data (use only this — invent nothing)

Load the attached `agent-roster.json`. It has `teams[]` (10) and `agents[]` (100).
Per agent: `agent_id`, `call_sign`, `kind` (`lead` | `member`), `team_id`,
`owner_role_id`, `title_th`, `title_en`, `duty_th`, `duty_en`, `handoff_to`,
`escalate_to`, `route_to_human[]`, `blocked_by`, `connection_state`.
Per team: `team_id`, `lead_id`, `lead_call_sign`, `owner_role_id`, `owner_title`,
`pool`, `name_th`, `name_en`, `mission_th`, `size`.
Human roles: HR-01 Director, HR-02 Human Resources, HR-03 Operations,
HR-04 Intelligence / Research, HR-05 Matchmaker, HR-06 AI Coordinator.

| Room | Team (th / en) | Lead | Owner | Seats | Colour |
|---|---|---|---|---|---|
| T01 | สำนักบัญชาการ / Command Office | GROK-10 ORCHESTRATOR | HR-01 | 9 | gold #e3c88f |
| T02 | ทีมคนและเครือข่ายคู่ค้า / People and Partner Network | GROK-01 PEOPLE | HR-02 | 8 | violet #b49bf0 |
| T03 | ทีมปฏิบัติการและบริการ / Operations and Service | GROK-08 WATCHTOWER | HR-03 | 10 | cyan #4fd6e8 |
| T04 | ทีมข่าวกรองตลาด / Market Intelligence | GROK-02 ANALYST | HR-04 | 10 | indigo #8c9bf2 |
| T05 | ทีมเติบโตและลูกค้าสัมพันธ์ / Growth and Client Connection | GROK-04 CONNECTOR | HR-05 | 16 | coral #f4a071 |
| T06 | ทีม AI และแพลตฟอร์ม / AI and Platform | GROK-07 ECOSYSTEM | HR-06 | 9 | mint #6fdcb8 |
| T07 | ทีมประกาศและการตรวจสอบ / Listings and Verification | GROK-03 VERIFIER | HR-04 (steward) | 10 | sky #7cc4f5 |
| T08 | ทีมดีลและการปิดการขาย / Deals and Closing | GROK-05 NEGOTIATION | HR-05 (steward) | 10 | amber #f2b35e |
| T09 | ทีมความเสี่ยงและการปฏิบัติตาม / Risk and Compliance | GROK-06 RISK | HR-01 (steward) | 9 | rose #ef8b83 |
| T10 | ทีมธรรมาภิบาลและการอนุมัติ / Governance and Approvals | GROK-09 GOVERNANCE | HR-01 (steward) | 9 | slate #9fb0c8 |

Seats per room must equal the number of agents with that `team_id` (total 100).
If the file and this table disagree, the file wins.

## The honesty rule (most important)

Every agent is `DEFINED_NOT_CONNECTED`. Nothing is running. The reference video
shows live numbers; this app must not imitate them.

- Never show "running", task counts, turnaround times, activity feeds,
  "connected · MCP" tools, schedules or costs. Where the reference has a live
  metric, show `—` with the label **ยังไม่มีข้อมูล · ยังไม่เปิดใช้**.
- Top bar status reads **100 เอเจนต์ · เชื่อมต่อจริง 0**, never "N running".
- No tool logos as "connected" (no Google Drive, CapCut, Canva, Slack …).
- No chat box that pretends an agent answers. Replace "Ask any agent…" with a
  search box: **ค้นหาเอเจนต์ call sign ชื่อ หรือหน้าที่**.
- No network calls, no API keys, no login, no backend. Static data only.
- Agents with `blocked_by` show a red chip **รอคำตัดสิน** and the reason
  "รอเจ้าของยืนยันฐานค่าธรรมเนียมและผู้จ่าย".
- Show a permanent "DEMO · การตั้งค่าเท่านั้น ยังไม่มีเอเจนต์ตัวใดเชื่อมต่อจริง" strip at the top.

## Scene

- Dark navy space background (#04060c → #0c1322), soft grid, ivory text (#f2eee6).
- Orthographic isometric camera. 10 room platforms on a ring around the hub,
  T01 at 12 o'clock, then clockwise T02 … T10.
- Each room: low walls in its colour, a floor sign with
  `T05 · ทีมเติบโตและลูกค้าสัมพันธ์`, one desk per seat with a small low-poly
  figure and monitor. The lead's desk is larger, at the front, with a badge
  "หัวหน้าทีม". Plants and lamps are decoration only.
- Floating room label: team name, `16 เอเจนต์ · ตั้งค่าแล้ว · ยังไม่เชื่อมต่อ`,
  owner role (e.g. `ผู้รับผิดชอบ HR-05 Matchmaker`). Shared-pool rooms add
  `Shared pool · ทุกตำแหน่งขอใช้ได้ผ่าน AMI`.
- Central hub: a round platform labelled **AMI · คุมสิทธิ์** with an outer ring
  **THE KEEPER · คุมการเปิดเผย**. It is a gate, not a "brain"; no memory counter.
- Roads connect rooms. Draw one road segment for every cross-team handoff
  (an agent whose `handoff_to` is in another team). Same-team handoffs stay
  inside the room.
- Motion: slow ambient light only. Any travelling dot along roads must be
  labelled "ตัวอย่างเส้นทาง" and stop when `prefers-reduced-motion: reduce`.

## Interaction

- Hover a room: outline glow in its colour. Click a room: open the right panel.
- **Room panel**: name th/en, mission, lead, owner, pool, seat count, then the
  list of agents (call sign, title_th, duty_th, chips). Metrics row
  (งานวันนี้ / กำลังทำ / เวลาเฉลี่ย) shows `—` · ยังไม่มีข้อมูล.
- Click a seat or a list row: **Agent panel** with duty th + en, team, owner,
  escalates to, status chips **ตั้งค่าแล้ว** + **ยังไม่เชื่อมต่อ**, and the full
  handoff route from `route_to_human` as numbered steps ending in the human
  role (gold text). Note under it: "งานทุกชิ้นจบที่คนที่รับผิดชอบ และผ่านหัวหน้าทีมก่อนถึงคนเสมอ".
  Add: "ยังเปิดใช้ไม่ได้ · ต้องผ่าน ACTIVATION-REQUEST พร้อมผลทดสอบ ค่าใช้จ่ายที่ประเมินแล้ว และการอนุมัติของเจ้าของ ทีละตัว".
- While an agent is selected, highlight its route: the rooms and roads it passes.
- Tabs in the top bar: **สำนักงาน** (the scene), **เส้นทางส่งต่อ** (table of
  all 100 routes), **ผู้รับผิดชอบ** (agents grouped by the six human roles),
  **คำขอเปิดใช้** (empty state: "ยังไม่มีคำขอ · ยังไม่มีเอเจนต์ตัวใดเปิดใช้").
- Filters: team, owner, "เฉพาะที่รอคำตัดสิน", and search. Show
  "แสดง N จาก 100 เอเจนต์". Deep link `#agent=AGT-019` opens that agent.
- Mini-map bottom right with the 10 rooms as coloured squares; click to pan.
- Zoom and pan with mouse, trackpad and touch; a "จัดกึ่งกลาง" reset button.

## Layout and accessibility

- Desktop: scene left, panel right (360 px). Below 768 px: replace the 3D scene
  with a 2D grid of room cards (same data, same panels), because 3D on phones
  is slow and hard to tap. No horizontal scroll from 360 to 1440 px.
- Everything in the canvas is also reachable from the DOM list: keyboard Tab
  order follows T01 → T10, Enter opens, Esc closes, visible 2 px cyan focus ring.
- Thai-capable system font stack (Noto Sans Thai, Sarabun, Leelawadee UI,
  system-ui); no external font or image requests. Text ≥ 15 px on mobile.
- Colour is never the only signal: every room has its code and name as text.

## Tech

React + TypeScript + Tailwind. 3D with three.js via @react-three/fiber and
@react-three/drei (orthographic camera, simple box geometry, no imported
models). If the platform cannot run three.js, build the isometric rooms with CSS
3D transforms instead. Keep the roster JSON in `src/data/agent-roster.json` and
type it; do not copy agent text into components.

## Done when

1. Exactly 10 rooms and 100 seats render; each room's seats equal its `size`.
2. Clicking any of the 100 agents shows a route that ends at an HR role.
3. Top bar says 0 connected; no screen shows running work, tool connections,
   task counts, costs or an agent chat.
4. The two fee agents (AGT-008 REVENUE-OUTLOOK, AGT-073 FEE-INVOICE) show **รอคำตัดสิน**.
5. Works by keyboard, respects reduced motion, and the mobile grid has no
   horizontal scroll at 360 px.
6. The page makes no network request other than loading its own bundle.
