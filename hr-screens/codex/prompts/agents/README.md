# Prompt ประจำตัวเอเจนต์ 100 ตัว

GENERATED จาก `hr-screens/office-data.js` และ `hr-screens/office-facts.js` ผ่าน `hr-screens/office-prompt.js` โดย `hr-screens/codex/build-contract.mjs`
ห้ามแก้ไฟล์ในโฟลเดอร์นี้ด้วยมือ · แก้ที่ต้นทางแล้วรัน build ใหม่ · `check-contract.mjs` จะ fail ถ้าไฟล์หลุดจากต้นทาง

## แนวคิด

หนึ่งเอเจนต์คือหนึ่งแชต วาง prompt ของเอเจนต์นั้นเป็นคำสั่งของแชต (Project instructions,
custom instructions หรือ system prompt แล้วแต่แอป) เมื่อทำงานเสร็จ แชตจะจบคำตอบด้วยบล็อก
`=== HANDOFF ===` คุณคัดลอกบล็อกนั้นไปวางในแชตของเอเจนต์ที่ระบุใน `to:`
งานจะเดินต่อจนถึงหัวหน้าทีม แล้วหัวหน้าทีมสรุปให้คนที่รับผิดชอบตัดสิน

คนเป็นตัวกลางทุกขั้น จึงไม่มีการเชื่อมต่อระบบและไม่มี API key ทะเบียนเอเจนต์ยังอยู่ที่
`DEFINED_NOT_CONNECTED` เหมือนเดิม prompt ทำงานได้กับแชต AI ทั่วไป ไม่ผูกกับเจ้าใดเจ้าหนึ่ง

## เริ่มอย่างไร

1. อย่าเปิดทั้ง 100 แชตพร้อมกัน เลือกเส้นทางเดียวจากรายการด้านล่าง แล้วเปิดเฉพาะแชตบนเส้นทางนั้น
2. สร้างแชตหรือ Project หนึ่งอันต่อเอเจนต์ ตั้งชื่อตามรหัสและ call sign เช่น `AGT-037 SEO-WRITER`
3. วางเนื้อหาไฟล์ของเอเจนต์นั้นทั้งไฟล์เป็นคำสั่งของแชต
4. เริ่มที่เอเจนต์ต้นทาง ให้ข้อมูลหรือคำสั่ง และวางข้อความต้นฉบับที่งานต้องอ้างแบบคำต่อคำ
   เช่น ส่วนของคู่มือหรือข้อมูลทรัพย์ เอเจนต์จะเก็บไว้ในช่อง `sources:` และส่งต่อโดยไม่แก้
   ถ้าไม่มีต้นฉบับ ขั้นตรวจข้อเท็จจริงจะไม่ผ่าน แล้วคัดลอก HANDOFF ไปวางในแชตถัดไป
5. คัดลอกบล็อก HANDOFF ทั้งบล็อก ตัวงานเต็มอยู่ในช่อง `work:` เพราะแชตถัดไปไม่เห็นแชตก่อนหน้า
   และอ่านก่อนวางทุกครั้ง ถ้ามีเบอร์โทร อีเมล ไอดีไลน์ หรือเลขบัตรลูกค้าหลุดมา ให้ลบออกก่อน
6. ปลายทางของทุกเส้นคือคน งานยังเป็นร่างจนกว่าคนจะอนุมัติและกดส่งเอง
7. คำตอบของเจ้าของที่ใช้ได้ทุกงาน เช่น คำเรียกหรือช่องทางของบริษัท ให้เพิ่มที่ `hr-screens/office-facts.js`
   พร้อมวันที่และคำตอบของเจ้าของ แล้วรัน build ใหม่ ทุก prompt จะแนบไปให้เอง ข้อมูลเฉพาะงานยังวางใน `sources:`

## เส้นทางเริ่มต้นที่แนะนำ

- **เนื้อหาการตลาด** — ร่างบทความ ตรวจข้อกล่าวอ้าง ตรวจข้อเท็จจริง ตรวจน้ำเสียงแบรนด์ แล้วรอคนอนุมัติก่อนเผยแพร่
  `SEO-WRITER → CLAIM-REGISTER → FACT-CHECK → BRAND-VOICE → PUBLISH-GATE → GOVERNANCE → HR-01 Director`
- **ลูกค้าใหม่** — ข้อความเข้า รับความต้องการ ถามให้ชัด คัดกรอง แล้วเตรียมรายการทรัพย์ให้ Matchmaker
  `INBOX-TRIAGE → LEAD-INTAKE → REQUIREMENT-CLARIFIER → LEAD-QUALIFIER → CLIENT-PROFILE → MATCH-EXPLAINER → SHORTLIST → CONNECTOR → HR-05 Matchmaker`
- **ทรัพย์ใหม่** — ชวนเจ้าของลงประกาศ รับข้อมูล ตรวจความครบและเอกสาร แล้วให้คนตรวจกรรมสิทธิ์
  `OWNER-OUTREACH → LISTING-INTAKE → LISTING-COMPLETENESS → DOCUMENT-CHECK → OWNERSHIP-PREP → VERIFIER → HR-04 Intelligence / Research`

## ค่าใช้จ่าย

ใช้แชตในบัญชี AI ที่มีอยู่แล้ว ไม่ต้องเปิด API จึงไม่มีค่าใช้จ่ายระบบเพิ่ม แต่ทุกแชตกินโควตาการใช้งาน
ของบัญชี การเปิดเฉพาะเส้นทางที่ใช้จริงจึงทั้งถูกกว่าและตามงานง่ายกว่าการเปิดครบทุกตัว

## รายชื่อทั้งหมด

| เอเจนต์ | ทีม | ชื่อ | ส่งต่อให้ | prompt |
|---|---|---|---|---|
| `GROK-10` ORCHESTRATOR | T01 | หัวหน้าสำนักบัญชาการ | HR-01 Director | [GROK-10-ORCHESTRATOR.md](GROK-10-ORCHESTRATOR.md) |
| `AGT-001` DAILY-BRIEF | T01 | ผู้ร่างบรีฟประจำวัน | ORCHESTRATOR | [AGT-001-DAILY-BRIEF.md](AGT-001-DAILY-BRIEF.md) |
| `AGT-002` KPI-BOARD | T01 | ผู้ดูแลกระดานตัวชี้วัด | DAILY-BRIEF | [AGT-002-KPI-BOARD.md](AGT-002-KPI-BOARD.md) |
| `AGT-003` DECISION-QUEUE | T01 | ผู้ดูแลคิวเรื่องรอตัดสิน | ORCHESTRATOR | [AGT-003-DECISION-QUEUE.md](AGT-003-DECISION-QUEUE.md) |
| `AGT-004` ESCALATION-ROUTER | T01 | ผู้จัดเส้นทางยกระดับ | DECISION-QUEUE | [AGT-004-ESCALATION-ROUTER.md](AGT-004-ESCALATION-ROUTER.md) |
| `AGT-005` PRIORITY-PLANNER | T01 | ผู้วางลำดับความสำคัญ | DAILY-BRIEF | [AGT-005-PRIORITY-PLANNER.md](AGT-005-PRIORITY-PLANNER.md) |
| `AGT-006` CAPACITY-PLANNER | T01 | ผู้วางแผนกำลังงาน | PRIORITY-PLANNER | [AGT-006-CAPACITY-PLANNER.md](AGT-006-CAPACITY-PLANNER.md) |
| `AGT-007` MEETING-SCRIBE | T01 | ผู้บันทึกการประชุม | DECISION-QUEUE | [AGT-007-MEETING-SCRIBE.md](AGT-007-MEETING-SCRIBE.md) |
| `AGT-008` REVENUE-OUTLOOK | T01 | ผู้ร่างภาพรวมรายได้ | ORCHESTRATOR | [AGT-008-REVENUE-OUTLOOK.md](AGT-008-REVENUE-OUTLOOK.md) |
| `GROK-01` PEOPLE | T02 | หัวหน้าทีมคนและคู่ค้า | HR-02 Human Resources | [GROK-01-PEOPLE.md](GROK-01-PEOPLE.md) |
| `AGT-009` ONBOARDING-PLANNER | T02 | ผู้วางแผนต้อนรับ | PEOPLE | [AGT-009-ONBOARDING-PLANNER.md](AGT-009-ONBOARDING-PLANNER.md) |
| `AGT-010` ROLE-CLARITY | T02 | ผู้ตรวจความชัดเจนของบทบาท | PEOPLE | [AGT-010-ROLE-CLARITY.md](AGT-010-ROLE-CLARITY.md) |
| `AGT-011` PARTNER-RECRUIT | T02 | ผู้ร่างคำเชิญนายหน้าคู่ค้า | PARTNER-ONBOARD | [AGT-011-PARTNER-RECRUIT.md](AGT-011-PARTNER-RECRUIT.md) |
| `AGT-012` PARTNER-ONBOARD | T02 | ผู้ดูแลการรับคู่ค้าเข้าระบบ | PEOPLE | [AGT-012-PARTNER-ONBOARD.md](AGT-012-PARTNER-ONBOARD.md) |
| `AGT-013` TRAINING-DESIGNER | T02 | ผู้ออกแบบบทเรียน | KNOWLEDGE-BASE | [AGT-013-TRAINING-DESIGNER.md](AGT-013-TRAINING-DESIGNER.md) |
| `AGT-014` KNOWLEDGE-BASE | T02 | ผู้ดูแลคลังความรู้ | PEOPLE | [AGT-014-KNOWLEDGE-BASE.md](AGT-014-KNOWLEDGE-BASE.md) |
| `AGT-015` SHIFT-ROSTER | T02 | ผู้จัดตารางเวร | PEOPLE | [AGT-015-SHIFT-ROSTER.md](AGT-015-SHIFT-ROSTER.md) |
| `GROK-08` WATCHTOWER | T03 | หัวหน้าทีมปฏิบัติการ | HR-03 Operations | [GROK-08-WATCHTOWER.md](GROK-08-WATCHTOWER.md) |
| `AGT-016` PIPELINE-WATCH | T03 | ผู้เฝ้าสายงาน | WATCHTOWER | [AGT-016-PIPELINE-WATCH.md](AGT-016-PIPELINE-WATCH.md) |
| `AGT-017` HANDOFF-QUEUE | T03 | ผู้ดูแลคิวส่งต่อ | PIPELINE-WATCH | [AGT-017-HANDOFF-QUEUE.md](AGT-017-HANDOFF-QUEUE.md) |
| `AGT-018` SLA-MONITOR | T03 | ผู้เฝ้าเวลาตอบกลับ | WATCHTOWER | [AGT-018-SLA-MONITOR.md](AGT-018-SLA-MONITOR.md) |
| `AGT-019` INBOX-TRIAGE | T03 | ผู้คัดแยกข้อความเข้า | LEAD-INTAKE | [AGT-019-INBOX-TRIAGE.md](AGT-019-INBOX-TRIAGE.md) |
| `AGT-020` VIEWING-SCHEDULER | T03 | ผู้จัดคิวนัดชม | VIEWING-REMINDER | [AGT-020-VIEWING-SCHEDULER.md](AGT-020-VIEWING-SCHEDULER.md) |
| `AGT-021` VIEWING-REMINDER | T03 | ผู้ร่างข้อความเตือนนัด | VIEWING-FEEDBACK | [AGT-021-VIEWING-REMINDER.md](AGT-021-VIEWING-REMINDER.md) |
| `AGT-022` VIEWING-FEEDBACK | T03 | ผู้รวบรวมความเห็นหลังชม | CONNECTOR | [AGT-022-VIEWING-FEEDBACK.md](AGT-022-VIEWING-FEEDBACK.md) |
| `AGT-023` TASK-ROUTER | T03 | ผู้กระจายงาน | PIPELINE-WATCH | [AGT-023-TASK-ROUTER.md](AGT-023-TASK-ROUTER.md) |
| `AGT-024` INCIDENT-LOG | T03 | ผู้บันทึกเหตุขัดข้อง | WATCHTOWER | [AGT-024-INCIDENT-LOG.md](AGT-024-INCIDENT-LOG.md) |
| `GROK-02` ANALYST | T04 | หัวหน้าทีมข่าวกรองตลาด | HR-04 Intelligence / Research | [GROK-02-ANALYST.md](GROK-02-ANALYST.md) |
| `AGT-025` AREA-RESEARCH | T04 | ผู้วิจัยทำเล | BRIEF-WRITER | [AGT-025-AREA-RESEARCH.md](AGT-025-AREA-RESEARCH.md) |
| `AGT-026` PROJECT-RESEARCH | T04 | ผู้วิจัยโครงการ | BRIEF-WRITER | [AGT-026-PROJECT-RESEARCH.md](AGT-026-PROJECT-RESEARCH.md) |
| `AGT-027` PRICE-EVIDENCE | T04 | ผู้รวบรวมหลักฐานราคา | DATA-QUALITY | [AGT-027-PRICE-EVIDENCE.md](AGT-027-PRICE-EVIDENCE.md) |
| `AGT-028` SUPPLY-TRACKER | T04 | ผู้ติดตามอุปทาน | BRIEF-WRITER | [AGT-028-SUPPLY-TRACKER.md](AGT-028-SUPPLY-TRACKER.md) |
| `AGT-029` DEMAND-TREND | T04 | ผู้ติดตามแนวโน้มความต้องการ | BRIEF-WRITER | [AGT-029-DEMAND-TREND.md](AGT-029-DEMAND-TREND.md) |
| `AGT-030` COMPETITOR-WATCH | T04 | ผู้เฝ้าคู่แข่ง | BRIEF-WRITER | [AGT-030-COMPETITOR-WATCH.md](AGT-030-COMPETITOR-WATCH.md) |
| `AGT-031` REGULATION-WATCH | T04 | ผู้เฝ้ากฎระเบียบ | RISK | [AGT-031-REGULATION-WATCH.md](AGT-031-REGULATION-WATCH.md) |
| `AGT-032` BRIEF-WRITER | T04 | ผู้ร่างบรีฟวิจัย | DATA-QUALITY | [AGT-032-BRIEF-WRITER.md](AGT-032-BRIEF-WRITER.md) |
| `AGT-033` DATA-QUALITY | T04 | ผู้ตรวจคุณภาพข้อมูล | ANALYST | [AGT-033-DATA-QUALITY.md](AGT-033-DATA-QUALITY.md) |
| `GROK-04` CONNECTOR | T05 | หัวหน้าทีมเติบโตและลูกค้า | HR-05 Matchmaker | [GROK-04-CONNECTOR.md](GROK-04-CONNECTOR.md) |
| `AGT-034` LISTING-COPY | T05 | ผู้เขียนคำบรรยายประกาศ | FACT-CHECK | [AGT-034-LISTING-COPY.md](AGT-034-LISTING-COPY.md) |
| `AGT-035` SOCIAL-PLANNER | T05 | ผู้วางแผนโพสต์โซเชียล | BRAND-VOICE | [AGT-035-SOCIAL-PLANNER.md](AGT-035-SOCIAL-PLANNER.md) |
| `AGT-036` VIDEO-SCRIPT | T05 | ผู้เขียนสคริปต์วิดีโอสั้น | BRAND-VOICE | [AGT-036-VIDEO-SCRIPT.md](AGT-036-VIDEO-SCRIPT.md) |
| `AGT-037` SEO-WRITER | T05 | ผู้เขียนบทความค้นหา | CLAIM-REGISTER | [AGT-037-SEO-WRITER.md](AGT-037-SEO-WRITER.md) |
| `AGT-038` LINE-BROADCAST | T05 | ผู้ร่างข้อความ LINE | PUBLISH-GATE | [AGT-038-LINE-BROADCAST.md](AGT-038-LINE-BROADCAST.md) |
| `AGT-039` ADS-PLANNER | T05 | ผู้วางแผนโฆษณา | CLAIM-REGISTER | [AGT-039-ADS-PLANNER.md](AGT-039-ADS-PLANNER.md) |
| `AGT-040` REPUTATION-WATCH | T05 | ผู้เฝ้ารีวิว | BRAND-VOICE | [AGT-040-REPUTATION-WATCH.md](AGT-040-REPUTATION-WATCH.md) |
| `AGT-041` OWNER-OUTREACH | T05 | ผู้ร่างข้อความหาเจ้าของทรัพย์ | LISTING-INTAKE | [AGT-041-OWNER-OUTREACH.md](AGT-041-OWNER-OUTREACH.md) |
| `AGT-042` LEAD-INTAKE | T05 | ผู้รับความต้องการใหม่ | REQUIREMENT-CLARIFIER | [AGT-042-LEAD-INTAKE.md](AGT-042-LEAD-INTAKE.md) |
| `AGT-043` REQUIREMENT-CLARIFIER | T05 | ผู้ถามความต้องการให้ชัด | LEAD-QUALIFIER | [AGT-043-REQUIREMENT-CLARIFIER.md](AGT-043-REQUIREMENT-CLARIFIER.md) |
| `AGT-044` LEAD-QUALIFIER | T05 | ผู้คัดกรองความต้องการ | CLIENT-PROFILE | [AGT-044-LEAD-QUALIFIER.md](AGT-044-LEAD-QUALIFIER.md) |
| `AGT-045` CLIENT-PROFILE | T05 | ผู้สรุปโปรไฟล์ลูกค้า | MATCH-EXPLAINER | [AGT-045-CLIENT-PROFILE.md](AGT-045-CLIENT-PROFILE.md) |
| `AGT-046` MATCH-EXPLAINER | T05 | ผู้อธิบายผลจับคู่ | SHORTLIST | [AGT-046-MATCH-EXPLAINER.md](AGT-046-MATCH-EXPLAINER.md) |
| `AGT-047` SHORTLIST | T05 | ผู้เตรียมรายการทรัพย์ที่เหมาะ | CONNECTOR | [AGT-047-SHORTLIST.md](AGT-047-SHORTLIST.md) |
| `AGT-048` FOLLOW-UP | T05 | ผู้ร่างข้อความติดตามลูกค้า | CONNECTOR | [AGT-048-FOLLOW-UP.md](AGT-048-FOLLOW-UP.md) |
| `GROK-07` ECOSYSTEM | T06 | หัวหน้าทีม AI และแพลตฟอร์ม | HR-06 AI Coordinator | [GROK-07-ECOSYSTEM.md](GROK-07-ECOSYSTEM.md) |
| `AGT-049` AGENT-REGISTRY | T06 | ผู้ดูแลทะเบียนเอเจนต์ | ECOSYSTEM | [AGT-049-AGENT-REGISTRY.md](AGT-049-AGENT-REGISTRY.md) |
| `AGT-050` EVAL-DESIGNER | T06 | ผู้ออกแบบชุดทดสอบเอเจนต์ | ACTIVATION-REQUEST | [AGT-050-EVAL-DESIGNER.md](AGT-050-EVAL-DESIGNER.md) |
| `AGT-051` PROMPT-VERSIONS | T06 | ผู้ดูแลเวอร์ชันคำสั่ง | AGENT-REGISTRY | [AGT-051-PROMPT-VERSIONS.md](AGT-051-PROMPT-VERSIONS.md) |
| `AGT-052` COST-GUARD | T06 | ผู้เฝ้าค่าใช้จ่าย AI | ACTIVATION-REQUEST | [AGT-052-COST-GUARD.md](AGT-052-COST-GUARD.md) |
| `AGT-053` ACTIVATION-REQUEST | T06 | ผู้เตรียมคำขอเปิดใช้งาน | ECOSYSTEM | [AGT-053-ACTIVATION-REQUEST.md](AGT-053-ACTIVATION-REQUEST.md) |
| `AGT-054` CHANNEL-READINESS | T06 | ผู้ตรวจความพร้อมช่องทาง | ECOSYSTEM | [AGT-054-CHANNEL-READINESS.md](AGT-054-CHANNEL-READINESS.md) |
| `AGT-055` LILI-LIAISON | T06 | ผู้ประสานผู้ช่วยขาย Lili | KNOWLEDGE-BASE | [AGT-055-LILI-LIAISON.md](AGT-055-LILI-LIAISON.md) |
| `AGT-056` DATA-MAP | T06 | ผู้ทำแผนที่เส้นทางข้อมูล | CONSENT-GUARD | [AGT-056-DATA-MAP.md](AGT-056-DATA-MAP.md) |
| `GROK-03` VERIFIER | T07 | หัวหน้าทีมตรวจสอบ | HR-04 Intelligence / Research | [GROK-03-VERIFIER.md](GROK-03-VERIFIER.md) |
| `AGT-057` LISTING-INTAKE | T07 | ผู้รับข้อมูลทรัพย์ใหม่ | LISTING-COMPLETENESS | [AGT-057-LISTING-INTAKE.md](AGT-057-LISTING-INTAKE.md) |
| `AGT-058` LISTING-COMPLETENESS | T07 | ผู้ตรวจความครบของประกาศ | DOCUMENT-CHECK | [AGT-058-LISTING-COMPLETENESS.md](AGT-058-LISTING-COMPLETENESS.md) |
| `AGT-059` DOCUMENT-CHECK | T07 | ผู้ตรวจรายการเอกสาร | OWNERSHIP-PREP | [AGT-059-DOCUMENT-CHECK.md](AGT-059-DOCUMENT-CHECK.md) |
| `AGT-060` OWNERSHIP-PREP | T07 | ผู้เตรียมการตรวจกรรมสิทธิ์ | VERIFIER | [AGT-060-OWNERSHIP-PREP.md](AGT-060-OWNERSHIP-PREP.md) |
| `AGT-061` PHOTO-QUALITY | T07 | ผู้ตรวจคุณภาพภาพถ่าย | LISTING-COMPLETENESS | [AGT-061-PHOTO-QUALITY.md](AGT-061-PHOTO-QUALITY.md) |
| `AGT-062` DUPLICATE-FINDER | T07 | ผู้ค้นประกาศซ้ำ | VERIFIER | [AGT-062-DUPLICATE-FINDER.md](AGT-062-DUPLICATE-FINDER.md) |
| `AGT-063` GEO-CHECK | T07 | ผู้ตรวจตำแหน่งที่ตั้ง | LISTING-COMPLETENESS | [AGT-063-GEO-CHECK.md](AGT-063-GEO-CHECK.md) |
| `AGT-064` FACT-CHECK | T07 | ผู้ตรวจข้อเท็จจริงในเนื้อหา | BRAND-VOICE | [AGT-064-FACT-CHECK.md](AGT-064-FACT-CHECK.md) |
| `AGT-065` STALE-LISTING | T07 | ผู้เฝ้าประกาศค้างนาน | VERIFIER | [AGT-065-STALE-LISTING.md](AGT-065-STALE-LISTING.md) |
| `GROK-05` NEGOTIATION | T08 | หัวหน้าทีมดีลและการปิดการขาย | HR-05 Matchmaker | [GROK-05-NEGOTIATION.md](GROK-05-NEGOTIATION.md) |
| `AGT-066` OFFER-PREP | T08 | ผู้เตรียมข้อเสนอ | TERMS-COMPARE | [AGT-066-OFFER-PREP.md](AGT-066-OFFER-PREP.md) |
| `AGT-067` COUNTER-OPTIONS | T08 | ผู้เตรียมทางเลือกต่อรอง | TERMS-COMPARE | [AGT-067-COUNTER-OPTIONS.md](AGT-067-COUNTER-OPTIONS.md) |
| `AGT-068` TERMS-COMPARE | T08 | ผู้เทียบเงื่อนไข | NEGOTIATION | [AGT-068-TERMS-COMPARE.md](AGT-068-TERMS-COMPARE.md) |
| `AGT-069` CLOSING-CHECKLIST | T08 | ผู้ดูแลรายการปิดดีล | TRANSFER-DAY | [AGT-069-CLOSING-CHECKLIST.md](AGT-069-CLOSING-CHECKLIST.md) |
| `AGT-070` LOAN-DOCS | T08 | ผู้เตรียมรายการเอกสารสินเชื่อ | CLOSING-CHECKLIST | [AGT-070-LOAN-DOCS.md](AGT-070-LOAN-DOCS.md) |
| `AGT-071` TRANSFER-DAY | T08 | ผู้ประสานวันโอน | NEGOTIATION | [AGT-071-TRANSFER-DAY.md](AGT-071-TRANSFER-DAY.md) |
| `AGT-072` MILESTONE-TRACKER | T08 | ผู้ติดตามขั้นของดีล | NEGOTIATION | [AGT-072-MILESTONE-TRACKER.md](AGT-072-MILESTONE-TRACKER.md) |
| `AGT-073` FEE-INVOICE | T08 | ผู้เตรียมใบแจ้งค่าธรรมเนียม | ORCHESTRATOR | [AGT-073-FEE-INVOICE.md](AGT-073-FEE-INVOICE.md) |
| `AGT-074` AFTER-SALE | T08 | ผู้ดูแลหลังการขาย | FOLLOW-UP | [AGT-074-AFTER-SALE.md](AGT-074-AFTER-SALE.md) |
| `GROK-06` RISK | T09 | หัวหน้าทีมความเสี่ยง | HR-01 Director | [GROK-06-RISK.md](GROK-06-RISK.md) |
| `AGT-075` FRAUD-SIGNAL | T09 | ผู้จับสัญญาณทุจริต | RISK | [AGT-075-FRAUD-SIGNAL.md](AGT-075-FRAUD-SIGNAL.md) |
| `AGT-076` CONSENT-GUARD | T09 | ผู้ตรวจความยินยอม | RISK | [AGT-076-CONSENT-GUARD.md](AGT-076-CONSENT-GUARD.md) |
| `AGT-077` CONTACT-SHIELD | T09 | ผู้กันข้อมูลติดต่อรั่ว | RISK | [AGT-077-CONTACT-SHIELD.md](AGT-077-CONTACT-SHIELD.md) |
| `AGT-078` SCAM-LISTING | T09 | ผู้ตรวจประกาศหลอกลวง | FRAUD-SIGNAL | [AGT-078-SCAM-LISTING.md](AGT-078-SCAM-LISTING.md) |
| `AGT-079` CONTRACT-FLAGS | T09 | ผู้ชี้ข้อสัญญาที่ต้องระวัง | LEGAL-QUEUE | [AGT-079-CONTRACT-FLAGS.md](AGT-079-CONTRACT-FLAGS.md) |
| `AGT-080` KYC-PREP | T09 | ผู้เตรียมการยืนยันตัวตน | RISK | [AGT-080-KYC-PREP.md](AGT-080-KYC-PREP.md) |
| `AGT-081` DISPUTE-WATCH | T09 | ผู้เฝ้าสัญญาณข้อพิพาท | RISK | [AGT-081-DISPUTE-WATCH.md](AGT-081-DISPUTE-WATCH.md) |
| `AGT-082` RISK-REGISTER | T09 | ผู้ดูแลทะเบียนความเสี่ยง | RISK | [AGT-082-RISK-REGISTER.md](AGT-082-RISK-REGISTER.md) |
| `GROK-09` GOVERNANCE | T10 | หัวหน้าทีมธรรมาภิบาล | HR-01 Director | [GROK-09-GOVERNANCE.md](GROK-09-GOVERNANCE.md) |
| `AGT-083` DECISION-RECORD | T10 | ผู้บันทึกการตัดสินใจ | APPROVAL-LEDGER | [AGT-083-DECISION-RECORD.md](AGT-083-DECISION-RECORD.md) |
| `AGT-084` AUDIT-REVIEW | T10 | ผู้ทบทวนร่องรอยการตรวจสอบ | GOVERNANCE | [AGT-084-AUDIT-REVIEW.md](AGT-084-AUDIT-REVIEW.md) |
| `AGT-085` POLICY-LIBRARY | T10 | ผู้ดูแลคลังนโยบาย | GOVERNANCE | [AGT-085-POLICY-LIBRARY.md](AGT-085-POLICY-LIBRARY.md) |
| `AGT-086` CLAIM-REGISTER | T10 | ผู้ดูแลทะเบียนข้อกล่าวอ้าง | FACT-CHECK | [AGT-086-CLAIM-REGISTER.md](AGT-086-CLAIM-REGISTER.md) |
| `AGT-087` BRAND-VOICE | T10 | ผู้ตรวจน้ำเสียงแบรนด์ | PUBLISH-GATE | [AGT-087-BRAND-VOICE.md](AGT-087-BRAND-VOICE.md) |
| `AGT-088` PUBLISH-GATE | T10 | ผู้เฝ้าประตูก่อนเผยแพร่ | GOVERNANCE | [AGT-088-PUBLISH-GATE.md](AGT-088-PUBLISH-GATE.md) |
| `AGT-089` LEGAL-QUEUE | T10 | ผู้ดูแลคิวทบทวนกฎหมาย | GOVERNANCE | [AGT-089-LEGAL-QUEUE.md](AGT-089-LEGAL-QUEUE.md) |
| `AGT-090` APPROVAL-LEDGER | T10 | ผู้ดูแลบัญชีการอนุมัติ | GOVERNANCE | [AGT-090-APPROVAL-LEDGER.md](AGT-090-APPROVAL-LEDGER.md) |
