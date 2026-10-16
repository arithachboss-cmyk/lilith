/*
 * AMI — HUMAN + AI COMMAND · สำนักงาน 100 เอเจนต์ · ข้อมูลสังเคราะห์สำหรับ prototype
 *
 * ไฟล์นี้คือ "การตั้งค่า" ของเอเจนต์เท่านั้น ไม่ใช่การเปิดใช้งาน
 * ไม่มีโมเดล ปลายทาง คีย์ ตารางเวลา จำนวน instance หรืองบประมาณอยู่ในไฟล์นี้
 * และไม่มีเอเจนต์ตัวใดเชื่อมต่อจริง · การเปิดใช้จริงทำทีละตัวผ่านคำขอที่เจ้าของอนุมัติ
 * ดู docs/adr/ADR-0014-ami-agent-office-roster.md
 *
 * โครงสร้าง
 *   10 ทีม · แต่ละทีมมี Grok หนึ่งตัวเป็นหัวหน้า (GROK-01..10 ตามบรีฟ ไม่เพิ่มรหัส Grok ใหม่)
 *   90 เอเจนต์สมาชิก รหัส AGT-001..AGT-090
 *   ผู้รับผิดชอบที่เป็นคนมีเพียง 6 ตำแหน่งเดิม (HR-01..06) ไม่สร้างตำแหน่งใหม่
 *
 * เส้นทางส่งต่องาน (to)
 *   สมาชิกส่งต่อให้เอเจนต์ตัวอื่น อ้างด้วย call sign · หัวหน้าทีมส่งต่อให้คนที่รับผิดชอบทีม
 *   ทุกเส้นทางต้องจบที่คน ไม่วนซ้ำ · hr-screens/codex/check-contract.mjs ตรวจข้อนี้
 *
 * แก้ไฟล์นี้แล้วรัน node hr-screens/codex/build-contract.mjs เพื่อสร้าง agent-roster.json ใหม่
 */

/*
 * ทีม · owner คือคนที่รับผิดชอบผลงานของทีม
 * pool 'shared' คือทีมของ Shared Specialist ซึ่งทุกตำแหน่งขอใช้ได้ผ่าน AMI
 * แต่ยังต้องมีคนหนึ่งตำแหน่งเป็นผู้ดูแลทีม (steward) · เป็นการตีความใน ADR-0014 กลับทางได้
 */
export const TEAMS = [
  {
    id: 'T01', lead: 'GROK-10', owner: 'HR-01', pool: 'dedicated',
    nameTh: 'สำนักบัญชาการ', nameEn: 'Command Office',
    missionTh: 'รวมภาพข้ามทีม จัดลำดับเรื่องรอตัดสิน และดูแลภาพรวมรายได้',
    missionEn: 'Combines the cross-team picture, orders pending decisions and keeps the revenue outlook',
  },
  {
    id: 'T02', lead: 'GROK-01', owner: 'HR-02', pool: 'dedicated',
    nameTh: 'ทีมคนและเครือข่ายคู่ค้า', nameEn: 'People and Partner Network',
    missionTh: 'ดูแลการเริ่มงาน ความชัดเจนของบทบาท การฝึกอบรม และเครือข่ายนายหน้าคู่ค้า',
    missionEn: 'Looks after onboarding, role clarity, training and the partner broker network',
  },
  {
    id: 'T03', lead: 'GROK-08', owner: 'HR-03', pool: 'dedicated',
    nameTh: 'ทีมปฏิบัติการและบริการ', nameEn: 'Operations and Service',
    missionTh: 'ทำให้สายงานห้าขั้นเดินต่อ ตอบลูกค้าตรงเวลา และจัดคิวนัดชม',
    missionEn: 'Keeps the five-stage pipeline moving, answers clients on time and runs viewings',
  },
  {
    id: 'T04', lead: 'GROK-02', owner: 'HR-04', pool: 'dedicated',
    nameTh: 'ทีมข่าวกรองตลาด', nameEn: 'Market Intelligence',
    missionTh: 'เปลี่ยนข้อมูลตลาดเป็นบรีฟที่มีแหล่งและวันที่ ตรวจย้อนกลับได้',
    missionEn: 'Turns market data into briefs with a source and date that can be traced back',
  },
  {
    id: 'T05', lead: 'GROK-04', owner: 'HR-05', pool: 'dedicated',
    nameTh: 'ทีมเติบโตและลูกค้าสัมพันธ์', nameEn: 'Growth and Client Connection',
    missionTh: 'สร้างความต้องการและทรัพย์ใหม่ รับลูกค้า คัดกรอง และเตรียมการจับคู่',
    missionEn: 'Generates demand and new listings, takes in clients, qualifies them and prepares matches',
  },
  {
    id: 'T06', lead: 'GROK-07', owner: 'HR-06', pool: 'dedicated',
    nameTh: 'ทีม AI และแพลตฟอร์ม', nameEn: 'AI and Platform',
    missionTh: 'ดูแลทะเบียนเอเจนต์ ชุดทดสอบ ค่าใช้จ่าย และคำขอเปิดใช้ทีละตัว',
    missionEn: 'Keeps the agent registry, test sets, cost and one-at-a-time activation requests',
  },
  {
    id: 'T07', lead: 'GROK-03', owner: 'HR-04', pool: 'shared',
    nameTh: 'ทีมประกาศและการตรวจสอบ', nameEn: 'Listings and Verification',
    missionTh: 'รับข้อมูลทรัพย์ ตรวจความครบ เอกสาร ภาพ และข้อเท็จจริงก่อนเผยแพร่',
    missionEn: 'Takes in listings and checks completeness, documents, photos and facts before publication',
  },
  {
    id: 'T08', lead: 'GROK-05', owner: 'HR-05', pool: 'shared',
    nameTh: 'ทีมดีลและการปิดการขาย', nameEn: 'Deals and Closing',
    missionTh: 'เตรียมข้อเสนอ ทางเลือกการต่อรอง รายการปิดดีล และการดูแลหลังโอน',
    missionEn: 'Prepares offers, negotiation options, closing lists and post-transfer care',
  },
  {
    id: 'T09', lead: 'GROK-06', owner: 'HR-01', pool: 'shared',
    nameTh: 'ทีมความเสี่ยงและการปฏิบัติตาม', nameEn: 'Risk and Compliance',
    missionTh: 'จับสัญญาณทุจริต ตรวจความยินยอม กันข้อมูลติดต่อรั่ว และดูแลทะเบียนความเสี่ยง',
    missionEn: 'Spots fraud signals, checks consent, prevents contact leaks and keeps the risk register',
  },
  {
    id: 'T10', lead: 'GROK-09', owner: 'HR-01', pool: 'shared',
    nameTh: 'ทีมธรรมาภิบาลและการอนุมัติ', nameEn: 'Governance and Approvals',
    missionTh: 'บันทึกการตัดสินใจ ตรวจร่องรอย และเฝ้าประตูก่อนเผยแพร่ทุกชิ้น',
    missionEn: 'Records decisions, reviews audit trails and guards the gate before anything is published',
  },
];

/*
 * สิ่งที่ต้องได้คำตัดสินก่อนเอเจนต์บางตัวจะขอเปิดใช้ได้
 * AGENTS.md: ห้ามแต่งฐานค่าธรรมเนียม ผู้จ่าย หรือการอนุมัติทางกฎหมายขึ้นเอง
 */
export const BLOCKERS = {
  OWNER_DECISION_FEE_MODEL: {
    th: 'รอเจ้าของยืนยันฐานค่าธรรมเนียมและผู้จ่าย (ก่อน DB-008)',
    en: 'Waiting for the owner to confirm the fee basis and payer (before DB-008)',
  },
};

export const AGENTS = [
  /* ---------- T01 สำนักบัญชาการ ---------- */
  {
    id: 'GROK-10', callSign: 'ORCHESTRATOR', team: 'T01',
    titleTh: 'หัวหน้าสำนักบัญชาการ', titleEn: 'Command lead',
    dutyTh: 'รวมสถานะข้ามทีมที่ได้รับอนุญาต จัดลำดับเรื่องรอตัดสิน และส่งบรีฟให้ Director',
    dutyEn: 'Combines permitted cross-team status, orders pending decisions and briefs the Director',
    to: 'HR-01',
  },
  {
    id: 'AGT-001', callSign: 'DAILY-BRIEF', team: 'T01',
    titleTh: 'ผู้ร่างบรีฟประจำวัน', titleEn: 'Daily brief drafter',
    dutyTh: 'ร่างสรุปสถานการณ์ประจำวันจากรายงานของทุกทีม',
    dutyEn: 'Drafts the daily situation summary from every team report',
    to: 'ORCHESTRATOR',
  },
  {
    id: 'AGT-002', callSign: 'KPI-BOARD', team: 'T01',
    titleTh: 'ผู้ดูแลกระดานตัวชี้วัด', titleEn: 'KPI board keeper',
    dutyTh: 'รวบรวมตัวชี้วัดที่มีแหล่งข้อมูลจริง และแสดงช่องว่างเมื่อยังไม่มีข้อมูล',
    dutyEn: 'Collects KPIs that have a real data source and shows a gap where none exists',
    to: 'DAILY-BRIEF',
  },
  {
    id: 'AGT-003', callSign: 'DECISION-QUEUE', team: 'T01',
    titleTh: 'ผู้ดูแลคิวเรื่องรอตัดสิน', titleEn: 'Decision queue keeper',
    dutyTh: 'จัดเรียงเรื่องรอตัดสินตามอายุและผลกระทบ พร้อมทางเลือกที่ระบุที่มา',
    dutyEn: 'Orders pending decisions by age and impact, with options that cite their source',
    to: 'ORCHESTRATOR',
  },
  {
    id: 'AGT-004', callSign: 'ESCALATION-ROUTER', team: 'T01',
    titleTh: 'ผู้จัดเส้นทางยกระดับ', titleEn: 'Escalation router',
    dutyTh: 'จัดเรื่องที่เกินเกณฑ์ให้ถึงผู้ตัดสินที่ถูกต้องตามสายอำนาจ',
    dutyEn: 'Routes over-threshold issues to the right decision-maker along the line of authority',
    to: 'DECISION-QUEUE',
  },
  {
    id: 'AGT-005', callSign: 'PRIORITY-PLANNER', team: 'T01',
    titleTh: 'ผู้วางลำดับความสำคัญ', titleEn: 'Priority planner',
    dutyTh: 'ร่างลำดับความสำคัญรายสัปดาห์ให้ทุกทีมเห็นรายการเดียวกัน',
    dutyEn: 'Drafts the weekly priority order so every team sees the same list',
    to: 'DAILY-BRIEF',
  },
  {
    id: 'AGT-006', callSign: 'CAPACITY-PLANNER', team: 'T01',
    titleTh: 'ผู้วางแผนกำลังงาน', titleEn: 'Capacity planner',
    dutyTh: 'เทียบปริมาณงานกับกำลังคนและเอเจนต์ที่เปิดใช้จริง แล้วเสนอจุดที่ควรเสริม',
    dutyEn: 'Compares workload with people and agents actually in service and proposes where to add capacity',
    to: 'PRIORITY-PLANNER',
  },
  {
    id: 'AGT-007', callSign: 'MEETING-SCRIBE', team: 'T01',
    titleTh: 'ผู้บันทึกการประชุม', titleEn: 'Meeting scribe',
    dutyTh: 'ร่างบันทึกการประชุมและรายการงานที่ต้องตามต่อ พร้อมเจ้าของงานทุกข้อ',
    dutyEn: 'Drafts meeting notes and follow-up items, each with an owner',
    to: 'DECISION-QUEUE',
  },
  {
    id: 'AGT-008', callSign: 'REVENUE-OUTLOOK', team: 'T01',
    titleTh: 'ผู้ร่างภาพรวมรายได้', titleEn: 'Revenue outlook drafter',
    dutyTh: 'สรุปดีลตามขั้นสถานะเพื่อดูแนวโน้มรายได้ โดยไม่คำนวณค่าธรรมเนียมจนกว่าเจ้าของจะยืนยันโมเดล',
    dutyEn: 'Summarises deals by stage for a revenue outlook, without computing fees until the owner confirms the model',
    to: 'ORCHESTRATOR',
    blockedBy: 'OWNER_DECISION_FEE_MODEL',
  },

  /* ---------- T02 ทีมคนและเครือข่ายคู่ค้า ---------- */
  {
    id: 'GROK-01', callSign: 'PEOPLE', team: 'T02',
    titleTh: 'หัวหน้าทีมคนและคู่ค้า', titleEn: 'People lead',
    dutyTh: 'ดูแลการเริ่มงาน ความชัดเจนของบทบาท และเครือข่ายคู่ค้า แล้วส่งสรุปให้ Human Resources',
    dutyEn: 'Oversees onboarding, role clarity and the partner network, and reports to Human Resources',
    to: 'HR-02',
  },
  {
    id: 'AGT-009', callSign: 'ONBOARDING-PLANNER', team: 'T02',
    titleTh: 'ผู้วางแผนต้อนรับ', titleEn: 'Onboarding planner',
    dutyTh: 'ร่างแผนต้อนรับสมาชิกใหม่ตั้งแต่ก่อนเริ่มงานถึงเดือนแรก',
    dutyEn: 'Drafts a new member welcome plan from before day one to the end of month one',
    to: 'PEOPLE',
  },
  {
    id: 'AGT-010', callSign: 'ROLE-CLARITY', team: 'T02',
    titleTh: 'ผู้ตรวจความชัดเจนของบทบาท', titleEn: 'Role clarity reviewer',
    dutyTh: 'ตรวจคำอธิบายบทบาทว่าชัด ไม่ทับซ้อน และไม่สื่อถึงสิทธิ์ที่ตำแหน่งนั้นไม่มี',
    dutyEn: 'Checks role descriptions are clear, do not overlap and imply no permission the role lacks',
    to: 'PEOPLE',
  },
  {
    id: 'AGT-011', callSign: 'PARTNER-RECRUIT', team: 'T02',
    titleTh: 'ผู้ร่างคำเชิญนายหน้าคู่ค้า', titleEn: 'Partner broker recruiter',
    dutyTh: 'ร่างคำเชิญและเกณฑ์คัดเลือกนายหน้าคู่ค้า ให้คนตัดสินก่อนติดต่อจริง',
    dutyEn: 'Drafts invitations and selection criteria for partner brokers; a person decides before any contact',
    to: 'PARTNER-ONBOARD',
  },
  {
    id: 'AGT-012', callSign: 'PARTNER-ONBOARD', team: 'T02',
    titleTh: 'ผู้ดูแลการรับคู่ค้าเข้าระบบ', titleEn: 'Partner onboarding guide',
    dutyTh: 'เตรียมรายการเอกสารและขั้นตอนเริ่มต้นสำหรับคู่ค้าที่ได้รับอนุมัติแล้ว',
    dutyEn: 'Prepares the document list and first steps for partners who have been approved',
    to: 'PEOPLE',
  },
  {
    id: 'AGT-013', callSign: 'TRAINING-DESIGNER', team: 'T02',
    titleTh: 'ผู้ออกแบบบทเรียน', titleEn: 'Training designer',
    dutyTh: 'ร่างบทเรียนสั้นตามบทบาทจากคู่มือที่ได้รับอนุมัติแล้วเท่านั้น',
    dutyEn: 'Drafts short role-based lessons from approved playbooks only',
    to: 'KNOWLEDGE-BASE',
  },
  {
    id: 'AGT-014', callSign: 'KNOWLEDGE-BASE', team: 'T02',
    titleTh: 'ผู้ดูแลคลังความรู้', titleEn: 'Knowledge base keeper',
    dutyTh: 'จัดเก็บคำตอบมาตรฐานและคู่มือ พร้อมวันที่และผู้อนุมัติ',
    dutyEn: 'Files standard answers and playbooks with their date and approver',
    to: 'PEOPLE',
  },
  {
    id: 'AGT-015', callSign: 'SHIFT-ROSTER', team: 'T02',
    titleTh: 'ผู้จัดตารางเวร', titleEn: 'Shift roster planner',
    dutyTh: 'ร่างตารางเวรตอบลูกค้าและพาชมให้ครอบคลุมช่วงที่งานเข้ามาก',
    dutyEn: 'Drafts reply and viewing shifts that cover the busiest hours',
    to: 'PEOPLE',
  },

  /* ---------- T03 ทีมปฏิบัติการและบริการ ---------- */
  {
    id: 'GROK-08', callSign: 'WATCHTOWER', team: 'T03',
    titleTh: 'หัวหน้าทีมปฏิบัติการ', titleEn: 'Operations lead',
    dutyTh: 'เฝ้าสายงานทั้งห้าขั้น ชี้จุดติดขัด และส่งลำดับงานที่ควรทำก่อนให้ Operations',
    dutyEn: 'Watches all five pipeline stages, flags bottlenecks and sends Operations the do-first order',
    to: 'HR-03',
  },
  {
    id: 'AGT-016', callSign: 'PIPELINE-WATCH', team: 'T03',
    titleTh: 'ผู้เฝ้าสายงาน', titleEn: 'Pipeline watcher',
    dutyTh: 'หางานที่ค้างเกินเกณฑ์ในแต่ละขั้น ระบุเจ้าของงาน และร่างรายงานประจำสัปดาห์',
    dutyEn: 'Finds work past its threshold at each stage, names the owner and drafts the weekly report',
    to: 'WATCHTOWER',
  },
  {
    id: 'AGT-017', callSign: 'HANDOFF-QUEUE', team: 'T03',
    titleTh: 'ผู้ดูแลคิวส่งต่อ', titleEn: 'Handoff queue keeper',
    dutyTh: 'ติดตามงานที่รอผู้รับช่วงและเตือนก่อนเลยกำหนด',
    dutyEn: 'Tracks work waiting for a receiver and warns before it runs late',
    to: 'PIPELINE-WATCH',
  },
  {
    id: 'AGT-018', callSign: 'SLA-MONITOR', team: 'T03',
    titleTh: 'ผู้เฝ้าเวลาตอบกลับ', titleEn: 'Response time monitor',
    dutyTh: 'วัดเวลาตอบลูกค้าเทียบกับเป้าที่ตั้งไว้และรายงานทุกวัน',
    dutyEn: 'Measures client response time against the set target and reports daily',
    to: 'WATCHTOWER',
  },
  {
    id: 'AGT-019', callSign: 'INBOX-TRIAGE', team: 'T03',
    titleTh: 'ผู้คัดแยกข้อความเข้า', titleEn: 'Inbox triage',
    dutyTh: 'คัดแยกข้อความจากทุกช่องทางตามเรื่องและความเร่งด่วน แล้วส่งต่อทีมที่ถูกต้อง',
    dutyEn: 'Sorts incoming messages from every channel by topic and urgency and routes them to the right team',
    to: 'LEAD-INTAKE',
  },
  {
    id: 'AGT-020', callSign: 'VIEWING-SCHEDULER', team: 'T03',
    titleTh: 'ผู้จัดคิวนัดชม', titleEn: 'Viewing scheduler',
    dutyTh: 'เสนอช่วงเวลานัดชมที่ตรงกับทั้งสองฝ่าย ให้คนยืนยันก่อนแจ้งใคร',
    dutyEn: 'Proposes viewing slots that suit both sides; a person confirms before anyone is told',
    to: 'VIEWING-REMINDER',
  },
  {
    id: 'AGT-021', callSign: 'VIEWING-REMINDER', team: 'T03',
    titleTh: 'ผู้ร่างข้อความเตือนนัด', titleEn: 'Viewing reminder drafter',
    dutyTh: 'ร่างข้อความเตือนนัดชมล่วงหน้า โดยไม่ใส่ข้อมูลติดต่อของอีกฝ่าย',
    dutyEn: 'Drafts viewing reminders without the other party contact details',
    to: 'VIEWING-FEEDBACK',
  },
  {
    id: 'AGT-022', callSign: 'VIEWING-FEEDBACK', team: 'T03',
    titleTh: 'ผู้รวบรวมความเห็นหลังชม', titleEn: 'Viewing feedback collector',
    dutyTh: 'ร่างคำถามหลังชมและสรุปความเห็นให้ทีมจับคู่',
    dutyEn: 'Drafts post-viewing questions and summarises the answers for the matching team',
    to: 'CONNECTOR',
  },
  {
    id: 'AGT-023', callSign: 'TASK-ROUTER', team: 'T03',
    titleTh: 'ผู้กระจายงาน', titleEn: 'Task router',
    dutyTh: 'เสนอผู้รับงานตามภาระงานและทักษะ ให้คนยืนยันก่อนมอบหมาย',
    dutyEn: 'Proposes an assignee by workload and skill; a person confirms the assignment',
    to: 'PIPELINE-WATCH',
  },
  {
    id: 'AGT-024', callSign: 'INCIDENT-LOG', team: 'T03',
    titleTh: 'ผู้บันทึกเหตุขัดข้อง', titleEn: 'Incident logger',
    dutyTh: 'บันทึกเหตุขัดข้องในงานบริการพร้อมเวลา ผลกระทบ และผู้แก้ไข',
    dutyEn: 'Logs service incidents with the time, the impact and who fixed them',
    to: 'WATCHTOWER',
  },

  /* ---------- T04 ทีมข่าวกรองตลาด ---------- */
  {
    id: 'GROK-02', callSign: 'ANALYST', team: 'T04',
    titleTh: 'หัวหน้าทีมข่าวกรองตลาด', titleEn: 'Intelligence lead',
    dutyTh: 'แยกข้อเท็จจริง สมมติฐาน และสิ่งที่ต้องตรวจ แล้วส่งบรีฟพร้อมแหล่งและวันที่ให้ Intelligence',
    dutyEn: 'Separates fact, hypothesis and to-check items and sends Intelligence briefs with source and date',
    to: 'HR-04',
  },
  {
    id: 'AGT-025', callSign: 'AREA-RESEARCH', team: 'T04',
    titleTh: 'ผู้วิจัยทำเล', titleEn: 'Area researcher',
    dutyTh: 'รวบรวมข้อมูลทำเล การเดินทาง สถานศึกษา และโครงการคมนาคมที่ประกาศแล้ว จากแหล่งที่อ้างได้',
    dutyEn: 'Collects area, transit, school and announced transport project facts from citable sources',
    to: 'BRIEF-WRITER',
  },
  {
    id: 'AGT-026', callSign: 'PROJECT-RESEARCH', team: 'T04',
    titleTh: 'ผู้วิจัยโครงการ', titleEn: 'Project researcher',
    dutyTh: 'สรุปข้อมูลโครงการคอนโดและหมู่บ้านจากเอกสารที่ตรวจย้อนได้',
    dutyEn: 'Summarises condo and housing projects from documents that can be traced',
    to: 'BRIEF-WRITER',
  },
  {
    id: 'AGT-027', callSign: 'PRICE-EVIDENCE', team: 'T04',
    titleTh: 'ผู้รวบรวมหลักฐานราคา', titleEn: 'Price evidence collector',
    dutyTh: 'เก็บราคาประกาศและราคาซื้อขายที่มีแหล่งอ้างอิง ไม่ประมาณราคาเอง',
    dutyEn: 'Gathers asking and sold prices that have a source and never estimates a price itself',
    to: 'DATA-QUALITY',
  },
  {
    id: 'AGT-028', callSign: 'SUPPLY-TRACKER', team: 'T04',
    titleTh: 'ผู้ติดตามอุปทาน', titleEn: 'Supply tracker',
    dutyTh: 'ติดตามทรัพย์ที่ประกาศใหม่และที่ถอนออกในทำเลเป้าหมาย',
    dutyEn: 'Tracks new and withdrawn listings in the target areas',
    to: 'BRIEF-WRITER',
  },
  {
    id: 'AGT-029', callSign: 'DEMAND-TREND', team: 'T04',
    titleTh: 'ผู้ติดตามแนวโน้มความต้องการ', titleEn: 'Demand trend watcher',
    dutyTh: 'สรุปแนวโน้มความต้องการจากคำขอที่บันทึกในระบบเท่านั้น',
    dutyEn: 'Summarises demand trends only from requests recorded in the system',
    to: 'BRIEF-WRITER',
  },
  {
    id: 'AGT-030', callSign: 'COMPETITOR-WATCH', team: 'T04',
    titleTh: 'ผู้เฝ้าคู่แข่ง', titleEn: 'Competitor watcher',
    dutyTh: 'ติดตามบริการและข้อเสนอของคู่แข่งจากแหล่งสาธารณะ พร้อมวันที่พบ',
    dutyEn: 'Follows competitor services and offers from public sources, with the date seen',
    to: 'BRIEF-WRITER',
  },
  {
    id: 'AGT-031', callSign: 'REGULATION-WATCH', team: 'T04',
    titleTh: 'ผู้เฝ้ากฎระเบียบ', titleEn: 'Regulation watcher',
    dutyTh: 'แจ้งเมื่อมีประกาศกฎหมายหรือภาษีที่เกี่ยวกับอสังหา และส่งให้คนตีความ',
    dutyEn: 'Flags new property law or tax notices and passes them to a person to interpret',
    to: 'RISK',
  },
  {
    id: 'AGT-032', callSign: 'BRIEF-WRITER', team: 'T04',
    titleTh: 'ผู้ร่างบรีฟวิจัย', titleEn: 'Research brief writer',
    dutyTh: 'ร่างบรีฟวิจัยที่กำกับทุกข้อความว่าเป็นข้อเท็จจริง สมมติฐาน หรือต้องตรวจเพิ่ม',
    dutyEn: 'Drafts research briefs that label every statement fact, hypothesis or to-check',
    to: 'DATA-QUALITY',
  },
  {
    id: 'AGT-033', callSign: 'DATA-QUALITY', team: 'T04',
    titleTh: 'ผู้ตรวจคุณภาพข้อมูล', titleEn: 'Data quality checker',
    dutyTh: 'ตรวจว่าข้อมูลมีแหล่งและวันที่ครบ และไม่มีตัวเลขที่ไม่มีที่มา',
    dutyEn: 'Checks that data has a source and date and that no number lacks an origin',
    to: 'ANALYST',
  },

  /* ---------- T05 ทีมเติบโตและลูกค้าสัมพันธ์ ---------- */
  {
    id: 'GROK-04', callSign: 'CONNECTOR', team: 'T05',
    titleTh: 'หัวหน้าทีมเติบโตและลูกค้า', titleEn: 'Growth and clients lead',
    dutyTh: 'เชื่อมความต้องการกับโอกาส และทบทวนงานของทีมก่อนส่งให้ Matchmaker ตัดสิน',
    dutyEn: 'Connects demand with opportunity and reviews team work before the Matchmaker decides',
    to: 'HR-05',
  },
  {
    id: 'AGT-034', callSign: 'LISTING-COPY', team: 'T05',
    titleTh: 'ผู้เขียนคำบรรยายประกาศ', titleEn: 'Listing copywriter',
    dutyTh: 'ร่างคำบรรยายประกาศจากข้อมูลทรัพย์ที่ตรวจแล้ว ไม่เติมคุณสมบัติที่ไม่มีหลักฐาน',
    dutyEn: 'Drafts listing descriptions from verified property data and adds no unproven feature',
    to: 'FACT-CHECK',
  },
  {
    id: 'AGT-035', callSign: 'SOCIAL-PLANNER', team: 'T05',
    titleTh: 'ผู้วางแผนโพสต์โซเชียล', titleEn: 'Social content planner',
    dutyTh: 'ร่างปฏิทินโพสต์และข้อความโซเชียลจากทรัพย์ที่อนุมัติให้โปรโมตแล้ว',
    dutyEn: 'Drafts a social post calendar and copy from listings approved for promotion',
    to: 'BRAND-VOICE',
  },
  {
    id: 'AGT-036', callSign: 'VIDEO-SCRIPT', team: 'T05',
    titleTh: 'ผู้เขียนสคริปต์วิดีโอสั้น', titleEn: 'Short video scriptwriter',
    dutyTh: 'ร่างสคริปต์วิดีโอสั้นพาชมทรัพย์จากข้อมูลที่ตรวจแล้ว',
    dutyEn: 'Drafts short property walk-through video scripts from verified data',
    to: 'BRAND-VOICE',
  },
  {
    id: 'AGT-037', callSign: 'SEO-WRITER', team: 'T05',
    titleTh: 'ผู้เขียนบทความค้นหา', titleEn: 'Search article writer',
    dutyTh: 'จัดกลุ่มคำค้นตามทำเลและประเภททรัพย์ แล้วร่างบทความตอบคำถามผู้ซื้อและผู้เช่า',
    dutyEn: 'Groups search terms by area and property type and drafts guides that answer buyers and renters',
    to: 'CLAIM-REGISTER',
  },
  {
    id: 'AGT-038', callSign: 'LINE-BROADCAST', team: 'T05',
    titleTh: 'ผู้ร่างข้อความ LINE', titleEn: 'LINE message drafter',
    dutyTh: 'ร่างข้อความบรอดแคสต์ถึงผู้ที่ยินยอมรับข่าวสารเท่านั้น',
    dutyEn: 'Drafts broadcasts only for people who consented to receive them',
    to: 'PUBLISH-GATE',
  },
  {
    id: 'AGT-039', callSign: 'ADS-PLANNER', team: 'T05',
    titleTh: 'ผู้วางแผนโฆษณา', titleEn: 'Ads planner',
    dutyTh: 'ร่างแผนและข้อความโฆษณา ไม่ตั้งงบและไม่เปิดแคมเปญเอง',
    dutyEn: 'Drafts ad plans and copy and never sets a budget or launches a campaign',
    to: 'CLAIM-REGISTER',
  },
  {
    id: 'AGT-040', callSign: 'REPUTATION-WATCH', team: 'T05',
    titleTh: 'ผู้เฝ้ารีวิว', titleEn: 'Review watcher',
    dutyTh: 'สรุปรีวิวและความเห็นสาธารณะ แล้วร่างคำตอบให้คนอนุมัติ',
    dutyEn: 'Summarises public reviews and comments and drafts replies for a person to approve',
    to: 'BRAND-VOICE',
  },
  {
    id: 'AGT-041', callSign: 'OWNER-OUTREACH', team: 'T05',
    titleTh: 'ผู้ร่างข้อความหาเจ้าของทรัพย์', titleEn: 'Owner outreach drafter',
    dutyTh: 'ร่างข้อความชวนเจ้าของทรัพย์ลงประกาศ ส่งได้เมื่อคนอนุมัติแล้วเท่านั้น',
    dutyEn: 'Drafts invitations for owners to list, sent only after a person approves',
    to: 'LISTING-INTAKE',
  },
  {
    id: 'AGT-042', callSign: 'LEAD-INTAKE', team: 'T05',
    titleTh: 'ผู้รับความต้องการใหม่', titleEn: 'Lead intake',
    dutyTh: 'บันทึกความต้องการใหม่จากทุกช่องทางเป็นรูปแบบเดียวกัน',
    dutyEn: 'Records new demand from every channel in one format',
    to: 'REQUIREMENT-CLARIFIER',
  },
  {
    id: 'AGT-043', callSign: 'REQUIREMENT-CLARIFIER', team: 'T05',
    titleTh: 'ผู้ถามความต้องการให้ชัด', titleEn: 'Requirement clarifier',
    dutyTh: 'ร่างคำถามที่ยังขาดเพื่อให้ความต้องการครบพอจะจับคู่ได้',
    dutyEn: 'Drafts the missing questions so a requirement is complete enough to match',
    to: 'LEAD-QUALIFIER',
  },
  {
    id: 'AGT-044', callSign: 'LEAD-QUALIFIER', team: 'T05',
    titleTh: 'ผู้คัดกรองความต้องการ', titleEn: 'Lead qualifier',
    dutyTh: 'ตรวจความต้องการกับเกณฑ์คัดกรองที่ตั้งไว้ และระบุข้อที่ยังไม่ผ่าน',
    dutyEn: 'Checks a requirement against the set qualification criteria and names what is still missing',
    to: 'CLIENT-PROFILE',
  },
  {
    id: 'AGT-045', callSign: 'CLIENT-PROFILE', team: 'T05',
    titleTh: 'ผู้สรุปโปรไฟล์ลูกค้า', titleEn: 'Client profile builder',
    dutyTh: 'สรุปความต้องการและความชอบของผู้ซื้อ ผู้เช่า หรือนักลงทุนเป็นบรีฟเดียว เท่าที่ลูกค้ายินยอมให้เก็บ',
    dutyEn: 'Summarises a buyer, renter or investor need and preferences into one brief, as far as the client consented',
    to: 'MATCH-EXPLAINER',
  },
  {
    id: 'AGT-046', callSign: 'MATCH-EXPLAINER', team: 'T05',
    titleTh: 'ผู้อธิบายผลจับคู่', titleEn: 'Match explainer',
    dutyTh: 'อธิบายเหตุผลของคะแนนจับคู่ซึ่งอ่านได้อย่างเดียว และไม่เปลี่ยนคะแนน',
    dutyEn: 'Explains the reasons behind the read-only match score and never changes the score',
    to: 'SHORTLIST',
  },
  {
    id: 'AGT-047', callSign: 'SHORTLIST', team: 'T05',
    titleTh: 'ผู้เตรียมรายการทรัพย์ที่เหมาะ', titleEn: 'Shortlist preparer',
    dutyTh: 'เตรียมรายการตัวเลือกพร้อมข้อขัดแย้งที่พบ ให้ Matchmaker ทบทวน',
    dutyEn: 'Prepares a shortlist with any conflicts found, for the Matchmaker to review',
    to: 'CONNECTOR',
  },
  {
    id: 'AGT-048', callSign: 'FOLLOW-UP', team: 'T05',
    titleTh: 'ผู้ร่างข้อความติดตามลูกค้า', titleEn: 'Client follow-up drafter',
    dutyTh: 'ร่างข้อความติดตามตามรอบที่ลูกค้าเลือก และชวนลูกค้าเดิมที่ยินยอมเมื่อมีทรัพย์ใหม่ตรงความต้องการ',
    dutyEn: 'Drafts follow-ups on the client chosen schedule and re-contacts consenting past clients when a new listing fits',
    to: 'CONNECTOR',
  },

  /* ---------- T06 ทีม AI และแพลตฟอร์ม ---------- */
  {
    id: 'GROK-07', callSign: 'ECOSYSTEM', team: 'T06',
    titleTh: 'หัวหน้าทีม AI และแพลตฟอร์ม', titleEn: 'AI and platform lead',
    dutyTh: 'รวมความพร้อมของเอเจนต์ทุกตัว แยกออกแบบแล้วจากเชื่อมต่อจริง และส่งแผนให้ AI Coordinator',
    dutyEn: 'Combines every agent readiness, keeps designed apart from connected and sends plans to the AI Coordinator',
    to: 'HR-06',
  },
  {
    id: 'AGT-049', callSign: 'AGENT-REGISTRY', team: 'T06',
    titleTh: 'ผู้ดูแลทะเบียนเอเจนต์', titleEn: 'Agent registry keeper',
    dutyTh: 'ตรวจว่าเอเจนต์ทุกตัวมีหน้าที่ ทีม ผู้รับผิดชอบ และเส้นทางส่งต่อครบ',
    dutyEn: 'Checks every agent has a duty, a team, an owner and a handoff route',
    to: 'ECOSYSTEM',
  },
  {
    id: 'AGT-050', callSign: 'EVAL-DESIGNER', team: 'T06',
    titleTh: 'ผู้ออกแบบชุดทดสอบเอเจนต์', titleEn: 'Agent eval designer',
    dutyTh: 'ร่างชุดทดสอบที่เอเจนต์ต้องผ่านก่อนขอเปิดใช้จริง',
    dutyEn: 'Drafts the test set an agent must pass before activation is requested',
    to: 'ACTIVATION-REQUEST',
  },
  {
    id: 'AGT-051', callSign: 'PROMPT-VERSIONS', team: 'T06',
    titleTh: 'ผู้ดูแลเวอร์ชันคำสั่ง', titleEn: 'Prompt version keeper',
    dutyTh: 'บันทึกเวอร์ชันคำสั่งของเอเจนต์แต่ละตัวพร้อมเหตุผลที่เปลี่ยน',
    dutyEn: 'Records each agent prompt version and why it changed',
    to: 'AGENT-REGISTRY',
  },
  {
    id: 'AGT-052', callSign: 'COST-GUARD', team: 'T06',
    titleTh: 'ผู้เฝ้าค่าใช้จ่าย AI', titleEn: 'AI cost guard',
    dutyTh: 'ประเมินค่าใช้จ่ายก่อนเปิดใช้เอเจนต์แต่ละตัว ตอนนี้ยังไม่มีตัวใดเปิดใช้ ค่าใช้จ่ายที่เพิ่มจึงเป็นศูนย์',
    dutyEn: 'Estimates cost before any single agent is activated; none is active, so added cost is zero',
    to: 'ACTIVATION-REQUEST',
  },
  {
    id: 'AGT-053', callSign: 'ACTIVATION-REQUEST', team: 'T06',
    titleTh: 'ผู้เตรียมคำขอเปิดใช้งาน', titleEn: 'Activation request preparer',
    dutyTh: 'รวมผลทดสอบ ค่าใช้จ่าย และขอบเขตสิทธิ์เป็นคำขอเปิดใช้ทีละตัว ให้เจ้าของอนุมัติ',
    dutyEn: 'Bundles test results, cost and permission scope into a one-agent activation request for owner approval',
    to: 'ECOSYSTEM',
  },
  {
    id: 'AGT-054', callSign: 'CHANNEL-READINESS', team: 'T06',
    titleTh: 'ผู้ตรวจความพร้อมช่องทาง', titleEn: 'Channel readiness checker',
    dutyTh: 'ตรวจความพร้อมของเว็บไซต์ LINE และเพจ โดยไม่สร้างหรือเก็บคีย์ใด ๆ',
    dutyEn: 'Checks website, LINE and page readiness without creating or holding any key',
    to: 'ECOSYSTEM',
  },
  {
    id: 'AGT-055', callSign: 'LILI-LIAISON', team: 'T06',
    titleTh: 'ผู้ประสานผู้ช่วยขาย Lili', titleEn: 'Lili assistant liaison',
    dutyTh: 'สรุปบทสนทนาที่ผู้ช่วยขาย Lili ส่งต่อให้คน และเสนอคำตอบมาตรฐานใหม่',
    dutyEn: 'Summarises chats the Lili sales assistant handed to people and proposes new standard answers',
    to: 'KNOWLEDGE-BASE',
  },
  {
    id: 'AGT-056', callSign: 'DATA-MAP', team: 'T06',
    titleTh: 'ผู้ทำแผนที่เส้นทางข้อมูล', titleEn: 'Data flow mapper',
    dutyTh: 'ระบุว่าข้อมูลชุดใดไหลจากที่ใดไปที่ใด และใครเป็นผู้อนุมัติ',
    dutyEn: 'Maps which data flows from where to where and who approved it',
    to: 'CONSENT-GUARD',
  },

  /* ---------- T07 ทีมประกาศและการตรวจสอบ ---------- */
  {
    id: 'GROK-03', callSign: 'VERIFIER', team: 'T07',
    titleTh: 'หัวหน้าทีมตรวจสอบ', titleEn: 'Verification lead',
    dutyTh: 'ตรวจข้อเท็จจริงและหลักฐานของประกาศก่อนเผยแพร่ แล้วส่งผลให้ผู้ดูแลทีม',
    dutyEn: 'Checks listing facts and evidence before publication and reports to the team steward',
    to: 'HR-04',
  },
  {
    id: 'AGT-057', callSign: 'LISTING-INTAKE', team: 'T07',
    titleTh: 'ผู้รับข้อมูลทรัพย์ใหม่', titleEn: 'Listing intake',
    dutyTh: 'บันทึกข้อมูลทรัพย์ที่เจ้าของให้มาเป็นแบบฟอร์มเดียวกัน',
    dutyEn: 'Records owner-supplied property data in one form',
    to: 'LISTING-COMPLETENESS',
  },
  {
    id: 'AGT-058', callSign: 'LISTING-COMPLETENESS', team: 'T07',
    titleTh: 'ผู้ตรวจความครบของประกาศ', titleEn: 'Listing completeness checker',
    dutyTh: 'ตรวจช่องที่ต้องมีก่อนเผยแพร่และบอกว่ายังขาดอะไร',
    dutyEn: 'Checks the required fields before publishing and says what is still missing',
    to: 'DOCUMENT-CHECK',
  },
  {
    id: 'AGT-059', callSign: 'DOCUMENT-CHECK', team: 'T07',
    titleTh: 'ผู้ตรวจรายการเอกสาร', titleEn: 'Document checklist checker',
    dutyTh: 'ตรวจว่าเอกสารที่ต้องใช้ตามประเภททรัพย์ถูกแนบครบ',
    dutyEn: 'Checks the documents required for the property type are all attached',
    to: 'OWNERSHIP-PREP',
  },
  {
    id: 'AGT-060', callSign: 'OWNERSHIP-PREP', team: 'T07',
    titleTh: 'ผู้เตรียมการตรวจกรรมสิทธิ์', titleEn: 'Ownership check preparer',
    dutyTh: 'เตรียมรายการที่คนต้องตรวจกับโฉนดหรือหนังสือกรรมสิทธิ์ ไม่ยืนยันกรรมสิทธิ์เอง',
    dutyEn: 'Prepares what a person must verify against the title deed and never confirms ownership itself',
    to: 'VERIFIER',
  },
  {
    id: 'AGT-061', callSign: 'PHOTO-QUALITY', team: 'T07',
    titleTh: 'ผู้ตรวจคุณภาพภาพถ่าย', titleEn: 'Photo quality checker',
    dutyTh: 'ตรวจความชัด แสง และความครบของภาพ และเตือนเมื่อพบข้อมูลตำแหน่งฝังในไฟล์',
    dutyEn: 'Checks photo sharpness, light and coverage and warns when location data is embedded in a file',
    to: 'LISTING-COMPLETENESS',
  },
  {
    id: 'AGT-062', callSign: 'DUPLICATE-FINDER', team: 'T07',
    titleTh: 'ผู้ค้นประกาศซ้ำ', titleEn: 'Duplicate finder',
    dutyTh: 'หาประกาศที่น่าจะเป็นทรัพย์เดียวกัน แล้วส่งให้คนตัดสิน',
    dutyEn: 'Finds listings that look like the same property and sends them to a person to decide',
    to: 'VERIFIER',
  },
  {
    id: 'AGT-063', callSign: 'GEO-CHECK', team: 'T07',
    titleTh: 'ผู้ตรวจตำแหน่งที่ตั้ง', titleEn: 'Location checker',
    dutyTh: 'ตรวจว่าที่อยู่ เขต และหมุดแผนที่สอดคล้องกัน',
    dutyEn: 'Checks that the address, district and map pin agree',
    to: 'LISTING-COMPLETENESS',
  },
  {
    id: 'AGT-064', callSign: 'FACT-CHECK', team: 'T07',
    titleTh: 'ผู้ตรวจข้อเท็จจริงในเนื้อหา', titleEn: 'Content fact-checker',
    dutyTh: 'ตรวจข้อความในประกาศ บทความ และโฆษณาเทียบกับหลักฐานในทะเบียนข้อกล่าวอ้าง',
    dutyEn: 'Checks listing, article and ad statements against the evidence in the claim register',
    to: 'BRAND-VOICE',
  },
  {
    id: 'AGT-065', callSign: 'STALE-LISTING', team: 'T07',
    titleTh: 'ผู้เฝ้าประกาศค้างนาน', titleEn: 'Stale listing watcher',
    dutyTh: 'เตือนเมื่อประกาศไม่ได้ยืนยันสถานะกับเจ้าของนานเกินเกณฑ์',
    dutyEn: 'Warns when a listing has not been reconfirmed with its owner for longer than the threshold',
    to: 'VERIFIER',
  },

  /* ---------- T08 ทีมดีลและการปิดการขาย ---------- */
  {
    id: 'GROK-05', callSign: 'NEGOTIATION', team: 'T08',
    titleTh: 'หัวหน้าทีมดีลและการปิดการขาย', titleEn: 'Deals and closing lead',
    dutyTh: 'เตรียมทางเลือกการเจรจาและรายการปิดดีล แล้วส่งให้ผู้ดูแลทีมตัดสิน',
    dutyEn: 'Prepares negotiation options and closing lists for the team steward to decide',
    to: 'HR-05',
  },
  {
    id: 'AGT-066', callSign: 'OFFER-PREP', team: 'T08',
    titleTh: 'ผู้เตรียมข้อเสนอ', titleEn: 'Offer preparer',
    dutyTh: 'ร่างข้อเสนอซื้อหรือเช่าจากเงื่อนไขที่ลูกค้ายืนยันแล้ว',
    dutyEn: 'Drafts purchase or rental offers from terms the client confirmed',
    to: 'TERMS-COMPARE',
  },
  {
    id: 'AGT-067', callSign: 'COUNTER-OPTIONS', team: 'T08',
    titleTh: 'ผู้เตรียมทางเลือกต่อรอง', titleEn: 'Counter-offer options',
    dutyTh: 'ร่างทางเลือกเมื่อมีข้อเสนอโต้กลับ พร้อมข้อดีข้อเสียของแต่ละทาง',
    dutyEn: 'Drafts options when a counter-offer arrives, with the trade-offs of each',
    to: 'TERMS-COMPARE',
  },
  {
    id: 'AGT-068', callSign: 'TERMS-COMPARE', team: 'T08',
    titleTh: 'ผู้เทียบเงื่อนไข', titleEn: 'Terms comparer',
    dutyTh: 'วางเงื่อนไขของทั้งสองฝ่ายเป็นตารางเดียวและชี้จุดที่ยังไม่ตรงกัน',
    dutyEn: 'Lays both sides terms in one table and points out where they still differ',
    to: 'NEGOTIATION',
  },
  {
    id: 'AGT-069', callSign: 'CLOSING-CHECKLIST', team: 'T08',
    titleTh: 'ผู้ดูแลรายการปิดดีล', titleEn: 'Closing checklist keeper',
    dutyTh: 'ติดตามรายการที่ต้องเสร็จก่อนวันโอน',
    dutyEn: 'Tracks what must be done before transfer day',
    to: 'TRANSFER-DAY',
  },
  {
    id: 'AGT-070', callSign: 'LOAN-DOCS', team: 'T08',
    titleTh: 'ผู้เตรียมรายการเอกสารสินเชื่อ', titleEn: 'Mortgage document checklist',
    dutyTh: 'เตรียมรายการเอกสารที่ธนาคารมักขอ ให้ลูกค้ายืนยันกับธนาคารเอง',
    dutyEn: 'Prepares the documents banks usually ask for; the client confirms with the bank',
    to: 'CLOSING-CHECKLIST',
  },
  {
    id: 'AGT-071', callSign: 'TRANSFER-DAY', team: 'T08',
    titleTh: 'ผู้ประสานวันโอน', titleEn: 'Transfer day coordinator',
    dutyTh: 'ร่างกำหนดการวันโอนและรายการสิ่งที่แต่ละฝ่ายต้องนำมา',
    dutyEn: 'Drafts the transfer-day schedule and what each party must bring',
    to: 'NEGOTIATION',
  },
  {
    id: 'AGT-072', callSign: 'MILESTONE-TRACKER', team: 'T08',
    titleTh: 'ผู้ติดตามขั้นของดีล', titleEn: 'Deal milestone tracker',
    dutyTh: 'ติดตามขั้นของดีลตามสถานะที่บันทึกในระบบ และไม่เปลี่ยนสถานะเอง',
    dutyEn: 'Follows deal stages as recorded in the system and never changes a status itself',
    to: 'NEGOTIATION',
  },
  {
    id: 'AGT-073', callSign: 'FEE-INVOICE', team: 'T08',
    titleTh: 'ผู้เตรียมใบแจ้งค่าธรรมเนียม', titleEn: 'Fee invoice preparer',
    dutyTh: 'เตรียมใบแจ้งค่าธรรมเนียมหลังปิดดีล โดยรอเจ้าของยืนยันฐานค่าธรรมเนียมและผู้จ่ายก่อน',
    dutyEn: 'Prepares the fee invoice after a close, waiting for the owner to confirm the fee basis and payer first',
    to: 'ORCHESTRATOR',
    blockedBy: 'OWNER_DECISION_FEE_MODEL',
  },
  {
    id: 'AGT-074', callSign: 'AFTER-SALE', team: 'T08',
    titleTh: 'ผู้ดูแลหลังการขาย', titleEn: 'After-sale care',
    dutyTh: 'ร่างข้อความดูแลหลังโอน เช่น การส่งมอบและการย้ายเข้า',
    dutyEn: 'Drafts post-transfer care messages such as handover and move-in',
    to: 'FOLLOW-UP',
  },

  /* ---------- T09 ทีมความเสี่ยงและการปฏิบัติตาม ---------- */
  {
    id: 'GROK-06', callSign: 'RISK', team: 'T09',
    titleTh: 'หัวหน้าทีมความเสี่ยง', titleEn: 'Risk lead',
    dutyTh: 'ประเมินความเสี่ยงและข้อควบคุม แล้วส่งเรื่องที่ต้องตัดสินให้ผู้ดูแลทีม',
    dutyEn: 'Assesses risks and controls and sends what needs deciding to the team steward',
    to: 'HR-01',
  },
  {
    id: 'AGT-075', callSign: 'FRAUD-SIGNAL', team: 'T09',
    titleTh: 'ผู้จับสัญญาณทุจริต', titleEn: 'Fraud signal spotter',
    dutyTh: 'ชี้รูปแบบที่น่าสงสัย เช่น ราคาต่ำผิดปกติหรือขอมัดจำก่อนชม แล้วส่งให้คนตรวจ',
    dutyEn: 'Flags suspicious patterns such as abnormally low prices or deposits asked before viewing, for a person to review',
    to: 'RISK',
  },
  {
    id: 'AGT-076', callSign: 'CONSENT-GUARD', team: 'T09',
    titleTh: 'ผู้ตรวจความยินยอม', titleEn: 'Consent checker',
    dutyTh: 'ตรวจว่ามีความยินยอมตาม PDPA ก่อนเก็บข้อมูลหรือส่งข้อความหาใคร',
    dutyEn: 'Checks PDPA consent exists before anyone data is stored or anyone is messaged',
    to: 'RISK',
  },
  {
    id: 'AGT-077', callSign: 'CONTACT-SHIELD', team: 'T09',
    titleTh: 'ผู้กันข้อมูลติดต่อรั่ว', titleEn: 'Contact leak shield',
    dutyTh: 'ตรวจข้อความและเอกสารว่าไม่มีเบอร์ อีเมล หรือไอดีไลน์หลุดก่อนห้องดีลเปิด',
    dutyEn: 'Checks messages and files carry no phone, email or LINE ID before the deal room opens',
    to: 'RISK',
  },
  {
    id: 'AGT-078', callSign: 'SCAM-LISTING', team: 'T09',
    titleTh: 'ผู้ตรวจประกาศหลอกลวง', titleEn: 'Scam listing checker',
    dutyTh: 'ชี้ประกาศที่ภาพหรือข้อความซ้ำกับแหล่งอื่นอย่างน่าสงสัย',
    dutyEn: 'Flags listings whose photos or text suspiciously copy other sources',
    to: 'FRAUD-SIGNAL',
  },
  {
    id: 'AGT-079', callSign: 'CONTRACT-FLAGS', team: 'T09',
    titleTh: 'ผู้ชี้ข้อสัญญาที่ต้องระวัง', titleEn: 'Contract clause flagger',
    dutyTh: 'ชี้ข้อสัญญาที่ควรให้นักกฎหมายอ่าน และไม่ให้ความเห็นทางกฎหมายเอง',
    dutyEn: 'Points out clauses a lawyer should read and gives no legal opinion itself',
    to: 'LEGAL-QUEUE',
  },
  {
    id: 'AGT-080', callSign: 'KYC-PREP', team: 'T09',
    titleTh: 'ผู้เตรียมการยืนยันตัวตน', titleEn: 'Identity check preparer',
    dutyTh: 'เตรียมรายการยืนยันตัวตนที่คนต้องตรวจ และไม่เก็บสำเนาบัตรไว้ในข้อความ',
    dutyEn: 'Prepares the identity checks a person must do and keeps no ID copies in messages',
    to: 'RISK',
  },
  {
    id: 'AGT-081', callSign: 'DISPUTE-WATCH', team: 'T09',
    titleTh: 'ผู้เฝ้าสัญญาณข้อพิพาท', titleEn: 'Dispute early warning',
    dutyTh: 'เตือนเมื่อบทสนทนาหรือดีลมีสัญญาณขัดแย้งที่ควรให้คนเข้าดู',
    dutyEn: 'Warns when a conversation or deal shows signs of conflict a person should look at',
    to: 'RISK',
  },
  {
    id: 'AGT-082', callSign: 'RISK-REGISTER', team: 'T09',
    titleTh: 'ผู้ดูแลทะเบียนความเสี่ยง', titleEn: 'Risk register keeper',
    dutyTh: 'บันทึกความเสี่ยง เจ้าของ ข้อควบคุมที่ใช้ และวันทบทวน',
    dutyEn: 'Records each risk with its owner, its controls and its review date',
    to: 'RISK',
  },

  /* ---------- T10 ทีมธรรมาภิบาลและการอนุมัติ ---------- */
  {
    id: 'GROK-09', callSign: 'GOVERNANCE', team: 'T10',
    titleTh: 'หัวหน้าทีมธรรมาภิบาล', titleEn: 'Governance lead',
    dutyTh: 'ทบทวนแนวปฏิบัติและบันทึกการตัดสินใจ แล้วส่งเรื่องที่ต้องอนุมัติให้ผู้ดูแลทีม',
    dutyEn: 'Reviews practice and decision records and sends what needs approval to the team steward',
    to: 'HR-01',
  },
  {
    id: 'AGT-083', callSign: 'DECISION-RECORD', team: 'T10',
    titleTh: 'ผู้บันทึกการตัดสินใจ', titleEn: 'Decision recorder',
    dutyTh: 'ร่างบันทึกการตัดสินใจพร้อมที่มา เหตุผล และว่ากลับทางได้หรือไม่',
    dutyEn: 'Drafts decision records with provenance, reasons and whether they can be reversed',
    to: 'APPROVAL-LEDGER',
  },
  {
    id: 'AGT-084', callSign: 'AUDIT-REVIEW', team: 'T10',
    titleTh: 'ผู้ทบทวนร่องรอยการตรวจสอบ', titleEn: 'Audit trail reviewer',
    dutyTh: 'ตรวจว่าการกระทำสำคัญทุกครั้งมีผู้กระทำ เหตุผล และเวลาบันทึกไว้',
    dutyEn: 'Checks every important action has an actor, a reason and a time on record',
    to: 'GOVERNANCE',
  },
  {
    id: 'AGT-085', callSign: 'POLICY-LIBRARY', team: 'T10',
    titleTh: 'ผู้ดูแลคลังนโยบาย', titleEn: 'Policy librarian',
    dutyTh: 'จัดเก็บนโยบายฉบับล่าสุดและแจ้งทีมที่ได้รับผลเมื่อมีการเปลี่ยน',
    dutyEn: 'Keeps the current policies and tells affected teams when one changes',
    to: 'GOVERNANCE',
  },
  {
    id: 'AGT-086', callSign: 'CLAIM-REGISTER', team: 'T10',
    titleTh: 'ผู้ดูแลทะเบียนข้อกล่าวอ้าง', titleEn: 'Claim register keeper',
    dutyTh: 'ตรวจว่าข้อกล่าวอ้างทางการตลาดทุกข้อมีหลักฐานและสถานะการอนุมัติ',
    dutyEn: 'Checks every marketing claim has evidence and an approval status',
    to: 'FACT-CHECK',
  },
  {
    id: 'AGT-087', callSign: 'BRAND-VOICE', team: 'T10',
    titleTh: 'ผู้ตรวจน้ำเสียงแบรนด์', titleEn: 'Brand voice checker',
    dutyTh: 'ตรวจเนื้อหาว่าตรงน้ำเสียงแบรนด์ และไม่สัญญาสิ่งที่บริษัทไม่ได้ให้',
    dutyEn: 'Checks content matches the brand voice and promises nothing the company does not offer',
    to: 'PUBLISH-GATE',
  },
  {
    id: 'AGT-088', callSign: 'PUBLISH-GATE', team: 'T10',
    titleTh: 'ผู้เฝ้าประตูก่อนเผยแพร่', titleEn: 'Publish gate',
    dutyTh: 'รวมผลตรวจข้อเท็จจริง ความยินยอม และน้ำเสียง แล้วส่งให้คนอนุมัติก่อนเผยแพร่ทุกชิ้น',
    dutyEn: 'Combines fact, consent and voice checks and sends every item to a person for approval before it is published',
    to: 'GOVERNANCE',
  },
  {
    id: 'AGT-089', callSign: 'LEGAL-QUEUE', team: 'T10',
    titleTh: 'ผู้ดูแลคิวทบทวนกฎหมาย', titleEn: 'Legal review queue keeper',
    dutyTh: 'จัดคิวเรื่องที่ต้องให้นักกฎหมายไทยทบทวน และไม่ถือว่าอนุมัติจนกว่านักกฎหมายจะตอบจริง',
    dutyEn: 'Queues items for Thai counsel and treats nothing as approved until counsel actually answers',
    to: 'GOVERNANCE',
  },
  {
    id: 'AGT-090', callSign: 'APPROVAL-LEDGER', team: 'T10',
    titleTh: 'ผู้ดูแลบัญชีการอนุมัติ', titleEn: 'Approval ledger keeper',
    dutyTh: 'บันทึกว่าใครอนุมัติอะไร เมื่อไร และอ้างหลักฐานใด',
    dutyEn: 'Records who approved what, when and on which evidence',
    to: 'GOVERNANCE',
  },
];
