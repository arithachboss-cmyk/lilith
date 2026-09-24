/*
 * AMI — HUMAN + AI COMMAND · ข้อมูลสังเคราะห์สำหรับ prototype เท่านั้น
 *
 * ทุกค่าในไฟล์นี้ถูกแต่งขึ้นเพื่อการออกแบบ ไม่มีอีเมลจริง ชื่อบุคลากรจริง
 * ข้อมูลลูกค้าจริง รหัสผ่าน key หรือ token ใด ๆ
 *
 * ในระบบจริง ช่องที่ทำเครื่องหมาย FROM_SERVER ต้องมาจาก session ฝั่ง server
 * (GET /api/me → identity + roles) ห้าม client เดาบทบาทจากอีเมลหรือจากตัวสลับใด ๆ
 */

export const BRAND = {
  system: 'AMI',
  systemFull: 'AMI — HUMAN + AI COMMAND',
  org: 'HR + AI',
  product: 'Middle Property',
};

/* ลำดับงานธุรกิจของ Middle Property — ใช้อ้างอิงร่วมกันทุกหน้าจอ */
export const FUNNEL = [
  { id: 'demand', label: 'Demand', th: 'ความต้องการเข้ามา' },
  { id: 'qualification', label: 'Qualification', th: 'คัดกรอง' },
  { id: 'matching', label: 'Property Matching', th: 'จับคู่ทรัพย์' },
  { id: 'viewing', label: 'Viewing', th: 'เข้าชม' },
  { id: 'closed', label: 'Closed Deal', th: 'ปิดดีล' },
];

/* Shared Specialist pool — ไม่ผูกกับพนักงานคนใดคนหนึ่ง */
export const SPECIALISTS = [
  { id: 'GROK-03', callSign: 'VERIFIER', th: 'ตรวจสอบข้อเท็จจริงและหลักฐาน' },
  { id: 'GROK-05', callSign: 'NEGOTIATION', th: 'เตรียมทางเลือกและร่างการเจรจา' },
  { id: 'GROK-06', callSign: 'RISK', th: 'ประเมินความเสี่ยงและข้อควบคุม' },
  { id: 'GROK-09', callSign: 'GOVERNANCE', th: 'ทบทวนแนวปฏิบัติและบันทึกการตัดสินใจ' },
];

export const PRINCIPLES = [
  { en: 'Human owns accountability.', th: 'คนเป็นเจ้าของความรับผิดชอบ' },
  { en: 'Grok supplies intelligence.', th: 'Grok ให้ข้อมูลและความเข้าใจ' },
  { en: 'AMI controls authority.', th: 'AMI คุมสิทธิ์' },
  { en: 'The Keeper controls disclosure.', th: 'The Keeper คุมการเปิดเผย' },
];

/* ตราภารกิจ — วาดด้วย SVG ภายในไฟล์ ไม่มีการเรียกไฟล์ภาพจากภายนอก */
const EMBLEM = {
  bridge: '<circle cx="32" cy="32" r="19"/><path d="M13 32h38M32 13v38"/><circle cx="32" cy="32" r="6"/>',
  people: '<circle cx="24" cy="26" r="7"/><circle cx="42" cy="26" r="7"/><path d="M14 47c0-7 5-11 10-11s10 4 10 11M34 47c0-7 4-11 8-11s8 4 8 11"/>',
  watch: '<path d="M32 12l20 11v18L32 52 12 41V23z"/><circle cx="32" cy="32" r="7"/><path d="M32 12v11M32 41v11"/>',
  observatory: '<path d="M14 48h36"/><path d="M20 48V30l24-12v18z"/><circle cx="44" cy="22" r="5"/>',
  nexus: '<circle cx="18" cy="24" r="5"/><circle cx="46" cy="24" r="5"/><circle cx="32" cy="46" r="5"/><path d="M22 27l6 15M42 27l-6 15M23 24h18"/>',
  dock: '<rect x="14" y="20" width="36" height="24" rx="4"/><path d="M22 20v-6M42 20v-6M22 44v6M42 44v6"/><circle cx="32" cy="32" r="5"/>',
};

/*
 * รายการบทบาท — role_id, Grok และ call sign ตรงตามตารางในบรีฟ
 * call sign อ่านจากรูปแบบ "GROK-xx / CALLSIGN" ที่บรีฟกำหนด
 */
export const ROLES = [
  {
    screen: '01',
    roleId: 'HR-01',                       // FROM_SERVER
    title: 'Director',
    titleNote: 'ผู้เชื่อมภารกิจข้ามตำแหน่ง',
    grokId: 'GROK-10',
    callSign: 'ORCHESTRATOR',
    space: 'THE COMMAND BRIDGE',
    welcome: 'คุณคือผู้เชื่อมทุกภารกิจ ให้ทีมเดินหน้าไปในทิศทางเดียวกัน',
    accent: 'gold',
    accentName: 'champagne gold',
    emblem: EMBLEM.bridge,
    displayName: 'ปวีณา',                  // FROM_SERVER · ตัวอย่างสังเคราะห์
    primaryAction: 'เตรียมบรีฟทีม',
    missionToday: {
      headline: 'วันนี้มี 3 เรื่องที่รอการตัดสินใจจากคุณ',
      detail: 'ทั้งสามเรื่องค้างอยู่ระหว่างตำแหน่ง ไม่ได้ค้างที่คนใดคนหนึ่ง',
    },
    nextActions: [
      { text: 'อ่านสรุปสถานการณ์ทีมของวันนี้', meta: 'ใช้เวลา ~4 นาที' },
      { text: 'ตัดสินเรื่องที่ค้างระหว่าง Operations กับ Matchmaker', meta: 'ค้างมา 2 วัน' },
      { text: 'ยืนยันลำดับความสำคัญของสัปดาห์ให้ทีมเห็นตรงกัน', meta: 'ก่อนบรีฟรอบถัดไป' },
    ],
    aiScope: 'สรุปสถานะภารกิจข้ามตำแหน่งที่คุณมีสิทธิ์เห็น และช่วยร่างบรีฟ',
    boundary:
      'Director เห็นสรุปเท่าที่ได้รับอนุญาต ไม่ได้เห็นข้อมูลลับของทุกคน และไม่ข้าม Keeper ด้วยตำแหน่ง',
    panels: {
      kind: 'director',
      missionMap: [
        { id: 'M-01', name: 'ขยายฐานความต้องการใหม่', stage: 'demand', owner: 'Operations', health: 'on-track', note: 'เดินตามแผน' },
        { id: 'M-02', name: 'ยกคุณภาพการคัดกรอง', stage: 'qualification', owner: 'Intelligence', health: 'attention', note: 'รอหลักฐานเพิ่ม' },
        { id: 'M-03', name: 'รอบจับคู่ทรัพย์ประจำสัปดาห์', stage: 'matching', owner: 'Matchmaker', health: 'on-track', note: 'เดินตามแผน' },
        { id: 'M-04', name: 'ลดการรอคิวนัดเข้าชม', stage: 'viewing', owner: 'Operations', health: 'blocked', note: 'ติดการส่งต่อ' },
        { id: 'M-05', name: 'เตรียมเชื่อมระบบ AI', stage: 'closed', owner: 'AI Coordinator', health: 'attention', note: 'ยังไม่เชื่อมจริง' },
      ],
      decisions: [
        { title: 'ลำดับความสำคัญของรอบจับคู่ถัดไป', waiting: 'รอคุณตัดสิน', age: '2 วัน', from: 'Matchmaker' },
        { title: 'ขอบเขตข้อมูลที่ใช้ในบรีฟวิจัย', waiting: 'รอคุณตัดสิน', age: '1 วัน', from: 'Intelligence' },
        { title: 'ผู้รับผิดชอบคิวส่งต่อที่ค้าง', waiting: 'รอคุณตัดสิน', age: '4 ชั่วโมง', from: 'Operations' },
      ],
      escalations: [
        { title: 'งานส่งต่อค้างเกินเกณฑ์ที่ตั้งไว้', level: 'สูง', route: 'Operations → Director' },
        { title: 'คำขอผู้เชี่ยวชาญรอสิทธิ์', level: 'กลาง', route: 'Intelligence → AMI' },
      ],
    },
  },

  {
    screen: '02',
    roleId: 'HR-02',
    title: 'Human Resources',
    titleNote: 'ดูแลการเริ่มงานและความชัดเจนของบทบาท',
    grokId: 'GROK-01',
    callSign: 'PEOPLE',
    space: 'THE PEOPLE CONSTELLATION',
    welcome: 'คุณทำให้ทุกคนค้นพบบทบาท และเติบโตไปพร้อมกับทีม',
    accent: 'violet',
    accentName: 'soft violet',
    emblem: EMBLEM.people,
    displayName: 'ศิริพร',
    primaryAction: 'เตรียมแผนต้อนรับสมาชิก',
    missionToday: {
      headline: 'มีสมาชิกใหม่ 2 คนที่รอแผนต้อนรับ',
      detail: 'ทั้งสองคนยังอยู่ขั้นก่อนเริ่มงาน ยังไม่มีการให้สิทธิ์ข้อมูลใด ๆ',
    },
    nextActions: [
      { text: 'ร่างแผนต้อนรับของสมาชิกที่กำลังจะเริ่มงาน', meta: 'ครบกำหนดสัปดาห์นี้' },
      { text: 'ตรวจทานคำอธิบายบทบาทที่รอยืนยัน', meta: '3 รายการ' },
      { text: 'ประสานเรื่องที่ต้องการความช่วยเหลือข้ามทีม', meta: '1 รายการ' },
    ],
    aiScope: 'ช่วยร่างแผนต้อนรับและตรวจความชัดเจนของคำอธิบายบทบาท',
    boundary:
      'การแก้ทะเบียนบทบาทไม่ใช่การให้สิทธิ์ข้อมูลโดยอัตโนมัติ และ prototype นี้ไม่แสดงข้อมูล HR ที่เป็นความลับ',
    panels: {
      kind: 'hr',
      journey: [
        { step: 'ก่อนเริ่มงาน', state: 'done', note: 'เตรียมอุปกรณ์และเอกสารต้อนรับ' },
        { step: 'วันแรก', state: 'active', note: 'แนะนำทีมและอธิบายบทบาท' },
        { step: 'สัปดาห์แรก', state: 'todo', note: 'จับคู่พี่เลี้ยงประจำตำแหน่ง' },
        { step: 'เดือนแรก', state: 'todo', note: 'ทบทวนความชัดเจนของบทบาทร่วมกัน' },
      ],
      people: [
        { alias: 'สมาชิกตัวอย่าง ก', roleId: 'HR-03', role: 'Operations', stage: 'วันแรก', status: 'กำลังดำเนินการ' },
        { alias: 'สมาชิกตัวอย่าง ข', roleId: 'HR-04', role: 'Intelligence / Research', stage: 'ก่อนเริ่มงาน', status: 'รอแผนต้อนรับ' },
        { alias: 'สมาชิกตัวอย่าง ค', roleId: 'HR-05', role: 'Matchmaker', stage: 'เดือนแรก', status: 'รอทบทวนบทบาท' },
      ],
      registry: [
        { roleId: 'HR-01', role: 'Director', clarity: 'ยืนยันแล้ว' },
        { roleId: 'HR-02', role: 'Human Resources', clarity: 'ยืนยันแล้ว' },
        { roleId: 'HR-03', role: 'Operations', clarity: 'รอตรวจทาน' },
        { roleId: 'HR-04', role: 'Intelligence / Research', clarity: 'รอตรวจทาน' },
        { roleId: 'HR-05', role: 'Matchmaker', clarity: 'ยืนยันแล้ว' },
        { roleId: 'HR-06', role: 'AI Coordinator', clarity: 'รอตรวจทาน' },
      ],
    },
  },

  {
    screen: '03',
    roleId: 'HR-03',
    title: 'Operations',
    titleNote: 'ทำให้แผนเดินหน้าและการส่งต่อถึงเป้าหมาย',
    grokId: 'GROK-08',
    callSign: 'WATCHTOWER',
    space: 'THE MISSION WATCH',
    welcome: 'คุณทำให้ทุกแผนเดินหน้า และทุกการส่งต่อไปถึงเป้าหมาย',
    accent: 'cyan',
    accentName: 'electric cyan',
    emblem: EMBLEM.watch,
    displayName: 'ธนวัฒน์',
    primaryAction: 'ทบทวนงานที่ติดขัด',
    missionToday: {
      headline: 'มีงานติดขัด 2 จุดในสายงานวันนี้',
      detail: 'จุดที่ช้าที่สุดอยู่ระหว่างการคัดกรองกับการจับคู่ทรัพย์',
    },
    nextActions: [
      { text: 'ดูงานที่ค้างนานที่สุดและระบุเจ้าของงาน', meta: 'ค้าง 3 วัน' },
      { text: 'เคลียร์คิวส่งต่อที่รอผู้รับช่วง', meta: '4 รายการ' },
      { text: 'ยืนยันคิวนัดเข้าชมของสัปดาห์นี้', meta: 'ก่อนสิ้นวัน' },
    ],
    aiScope: 'สรุปจุดติดขัดและลำดับงานที่ควรทำก่อน จากสถานะงานที่คุณมีสิทธิ์เห็น',
    boundary:
      'การเห็นสถานะงานไม่ให้สิทธิ์เปิดรายละเอียดลูกค้าหรือข้อมูลลับทั้งหมด',
    panels: {
      kind: 'ops',
      lanes: [
        { stage: 'demand', items: [ { id: 'W-118', title: 'ความต้องการใหม่รอรับเข้า', owner: 'Operations', age: '4 ชม.', flag: null } ] },
        { stage: 'qualification', items: [
          { id: 'W-112', title: 'รอข้อมูลคัดกรองเพิ่ม', owner: 'Operations', age: '3 วัน', flag: 'bottleneck' },
          { id: 'W-115', title: 'คัดกรองเสร็จ รอส่งต่อ', owner: 'Operations', age: '1 วัน', flag: 'handoff' },
        ] },
        { stage: 'matching', items: [ { id: 'W-109', title: 'รอบจับคู่รอผู้รับช่วง', owner: 'Matchmaker', age: '2 วัน', flag: 'handoff' } ] },
        { stage: 'viewing', items: [ { id: 'W-104', title: 'คิวนัดเข้าชมรอยืนยัน', owner: 'Operations', age: '6 ชม.', flag: null } ] },
        { stage: 'closed', items: [] },
      ],
      handoffs: [
        { from: 'Operations', to: 'Matchmaker', item: 'W-115', waiting: '1 วัน', state: 'รอรับช่วง' },
        { from: 'Matchmaker', to: 'Operations', item: 'W-109', waiting: '2 วัน', state: 'รอรับช่วง' },
      ],
    },
  },

  {
    screen: '04',
    roleId: 'HR-04',
    title: 'Intelligence / Research',
    titleNote: 'เปลี่ยนข้อมูลให้เป็นความเข้าใจที่ตรวจย้อนกลับได้',
    grokId: 'GROK-02',
    callSign: 'ANALYST',
    space: 'THE INTELLIGENCE OBSERVATORY',
    welcome: 'คุณเปลี่ยนข้อมูลให้เป็นความเข้าใจ และให้ทีมเห็นไกลขึ้น',
    accent: 'indigo',
    accentName: 'indigo blue',
    emblem: EMBLEM.observatory,
    displayName: 'กันตพงศ์',
    primaryAction: 'จัดทำบรีฟจากหลักฐาน',
    missionToday: {
      headline: 'บรีฟฉบับร่างรอหลักฐานอีก 2 ชิ้น',
      detail: 'ข้อความที่ยังไม่มีหลักฐานถูกกำกับว่าเป็นสมมติฐาน ไม่ใช่ข้อเท็จจริง',
    },
    nextActions: [
      { text: 'เติมแหล่งอ้างอิงให้ข้อความที่ยังไม่มีหลักฐาน', meta: '2 ข้อความ' },
      { text: 'ส่งประเด็นที่ยังไม่แน่ใจให้ VERIFIER ตรวจ', meta: 'ร่างคำขอได้' },
      { text: 'แยกข้อเท็จจริงกับสมมติฐานในบรีฟให้ชัด', meta: 'ก่อนส่งต่อ' },
    ],
    aiScope: 'ช่วยจัดเรียงหลักฐานและร่างบรีฟ โดยไม่เติมตัวเลขหรือแหล่งอ้างอิงเอง',
    boundary:
      'ไม่สร้างตัวเลขตลาด แหล่งอ้างอิง หรือระดับความมั่นใจที่ดูเป็นข้อมูลจริงขึ้นเอง ช่องที่ไม่มีหลักฐานจะแสดงว่ายังไม่มี',
    panels: {
      kind: 'intel',
      evidence: [
        { ref: 'EV-01', title: 'บันทึกการสัมภาษณ์ภายใน (ตัวอย่าง)', source: 'เอกสารภายใน', date: 'ยังไม่ระบุ', state: 'มีหลักฐาน' },
        { ref: 'EV-02', title: 'สรุปการคัดกรองรอบก่อน (ตัวอย่าง)', source: 'ระบบภายใน', date: 'ยังไม่ระบุ', state: 'มีหลักฐาน' },
        { ref: 'EV-03', title: 'ตัวเลขอ้างอิงภายนอก', source: 'ยังไม่มีแหล่ง', date: 'ยังไม่ระบุ', state: 'ยังไม่มีหลักฐาน' },
      ],
      statements: [
        { kind: 'fact', text: 'คำขอที่เข้ามาในรอบนี้ถูกบันทึกครบทุกรายการ', ref: 'EV-02' },
        { kind: 'hypothesis', text: 'ความต้องการกลุ่มนี้น่าจะตัดสินใจช้ากว่ากลุ่มอื่น', ref: null },
        { kind: 'check', text: 'ต้องตรวจว่าตัวเลขอ้างอิงภายนอกมาจากแหล่งใดและวันที่เท่าไร', ref: 'EV-03' },
      ],
    },
  },

  {
    screen: '05',
    roleId: 'HR-05',
    title: 'Matchmaker',
    titleNote: 'เชื่อมความต้องการกับโอกาสและส่งต่อให้ถึงมือ',
    grokId: 'GROK-04',
    callSign: 'CONNECTOR',
    space: 'THE CONNECTION NEXUS',
    welcome: 'คุณเชื่อมความต้องการกับโอกาส และพาความสัมพันธ์ไปต่อ',
    accent: 'coral',
    accentName: 'coral amber',
    emblem: EMBLEM.nexus,
    displayName: 'ณัฐริกา',
    primaryAction: 'เตรียมการส่งต่อโอกาส',
    missionToday: {
      headline: 'มีความต้องการที่ผ่านการคัดกรองแล้ว 1 รายการรอจับคู่',
      detail: 'ตัวเลือกที่แสดงมาจากคะแนนการจับคู่แบบ deterministic อ่านได้อย่างเดียว',
    },
    nextActions: [
      { text: 'ทบทวนเหตุผลของตัวเลือกที่คะแนนสูงสุด', meta: '3 ตัวเลือก' },
      { text: 'บันทึกข้อขัดแย้งที่พบก่อนส่งต่อ', meta: '1 ข้อ' },
      { text: 'ระบุผู้รับช่วงต่อและสิ่งที่ต้องส่งไปด้วย', meta: 'ก่อนส่งต่อ' },
    ],
    aiScope: 'ช่วยเรียบเรียงเหตุผลและร่างสรุปการส่งต่อ โดยไม่แตะคะแนนการจับคู่',
    boundary:
      'Matchmaker / GROK-04 ไม่ใช่ MATCHMAKER-1 / THE KEEPER · AI เปลี่ยนคะแนน deterministic matching ไม่ได้ และเปิดข้อมูลผู้เกี่ยวข้องเองไม่ได้',
    panels: {
      kind: 'match',
      brief: {
        ref: 'DM-2207',
        need: 'ต้องการพื้นที่ใช้สอยเพิ่มสำหรับครอบครัว ใกล้เส้นทางเดินทางหลัก',
        qualified: 'ผ่านการคัดกรองแล้ว',
        constraints: ['ช่วงเวลาเข้าชมจำกัดเฉพาะวันหยุด', 'ต้องการพื้นที่จอดรถอย่างน้อย 1 คัน'],
      },
      candidates: [
        { ref: 'SP-1043', score: 86, fit: ['ตรงพื้นที่ใช้สอย', 'ตรงเส้นทางเดินทาง'], conflict: null },
        { ref: 'SP-1077', score: 74, fit: ['ตรงงบประมาณ'], conflict: 'ช่วงเวลาเข้าชมไม่ตรงกับที่ระบุ' },
        { ref: 'SP-1090', score: 61, fit: ['ตรงพื้นที่จอดรถ'], conflict: 'ระยะทางไกลกว่าที่ระบุ' },
      ],
      receiver: { role: 'Operations', note: 'รับช่วงเพื่อจัดคิวเข้าชม' },
    },
  },

  {
    screen: '06',
    roleId: 'HR-06',
    title: 'AI Coordinator',
    titleNote: 'ประสานคน AI และระบบให้ทำงานร่วมกัน',
    grokId: 'GROK-07',
    callSign: 'ECOSYSTEM',
    space: 'THE ECOSYSTEM DOCK',
    welcome: 'คุณทำให้คน AI และระบบ ทำงานร่วมกันอย่างมีทิศทาง',
    accent: 'mint',
    accentName: 'mint teal',
    emblem: EMBLEM.dock,
    displayName: 'อรรถพล',
    primaryAction: 'เตรียมแผนเชื่อมต่อ',
    missionToday: {
      headline: 'ทุกบทบาท AI ถูกกำหนดแล้ว แต่ยังไม่มีการเชื่อมต่อจริง',
      detail: 'รายการด้านล่างแยก “ออกแบบแล้ว” ออกจาก “เชื่อมต่อจริง” อย่างชัดเจน',
    },
    nextActions: [
      { text: 'ทบทวนว่าบทบาทใดมีผู้รับผิดชอบครบแล้ว', meta: '10 บทบาท' },
      { text: 'ร่างลำดับการเชื่อมต่อที่ปลอดภัยที่สุด', meta: 'ยังไม่ลงมือ' },
      { text: 'ระบุสิ่งที่ต้องได้รับอนุมัติก่อนเชื่อมต่อ', meta: 'รอเจ้าของระบบ' },
    ],
    aiScope: 'ช่วยจัดลำดับแผนเชื่อมต่อและสรุปความพร้อม โดยไม่สร้างสิทธิ์หรือคีย์ใด ๆ',
    boundary:
      'การเป็น AI Coordinator ไม่ให้อำนาจสร้าง credentials อนุมัติ integration หรือเปิดข้อมูลลับโดยอัตโนมัติ · หน้าจอนี้ไม่แสดง key token หรือ secret ใด ๆ',
    panels: {
      kind: 'ai',
      agents: [
        { id: 'GROK-01', callSign: 'PEOPLE', owner: 'HR-02', design: true, connected: false },
        { id: 'GROK-02', callSign: 'ANALYST', owner: 'HR-04', design: true, connected: false },
        { id: 'GROK-03', callSign: 'VERIFIER', owner: 'shared', design: true, connected: false },
        { id: 'GROK-04', callSign: 'CONNECTOR', owner: 'HR-05', design: true, connected: false },
        { id: 'GROK-05', callSign: 'NEGOTIATION', owner: 'shared', design: true, connected: false },
        { id: 'GROK-06', callSign: 'RISK', owner: 'shared', design: true, connected: false },
        { id: 'GROK-07', callSign: 'ECOSYSTEM', owner: 'HR-06', design: true, connected: false },
        { id: 'GROK-08', callSign: 'WATCHTOWER', owner: 'HR-03', design: true, connected: false },
        { id: 'GROK-09', callSign: 'GOVERNANCE', owner: 'shared', design: true, connected: false },
        { id: 'GROK-10', callSign: 'ORCHESTRATOR', owner: 'HR-01', design: true, connected: false },
      ],
      readiness: [
        { item: 'กำหนดบทบาทและผู้รับผิดชอบ', state: 'ออกแบบแล้ว' },
        { item: 'ขอบเขตข้อมูลของแต่ละบทบาท', state: 'ออกแบบแล้ว' },
        { item: 'เส้นทางขอสิทธิ์ผ่าน AMI', state: 'ออกแบบแล้ว' },
        { item: 'การเปิดเผยข้อมูลผ่าน Keeper', state: 'ออกแบบแล้ว' },
        { item: 'การเชื่อมต่อ xAI', state: 'ยังไม่เชื่อมต่อ' },
        { item: 'การเชื่อมต่อ AMI Core', state: 'ยังไม่เชื่อมต่อ' },
        { item: 'การเชื่อมต่อ THE KEEPER', state: 'ยังไม่เชื่อมต่อ' },
      ],
    },
  },
];

export const ROLE_BY_ID = Object.fromEntries(ROLES.map((role) => [role.roleId, role]));
