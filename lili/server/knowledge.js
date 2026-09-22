/**
 * Verifiable knowledge base.
 *
 * EVERY entry below traces to a fact the business owner stated. There is no entry
 * for availability, prices, discounts, commission rates, track record or guarantees,
 * because no verified source for those was provided. An unmatched question returns
 * null and Lili says it does not know — it never improvises an answer.
 */

export const KB = [
  {
    id: "kb-service",
    source: "owner-stated: current service",
    match: [/บริการ|ทำอะไร|คืออะไร/i, /service|what do you (do|offer)|about/i],
    th: "The Middle Property ให้บริการเช่าอสังหาริมทรัพย์ในประเทศไทย โดยสัญญาเช่ามาตรฐานคือ 12 เดือนครับ",
    en: "The Middle Property handles property rentals in Thailand. The standard lease is a 12-month contract.",
  },
  {
    id: "kb-lease-term",
    source: "owner-stated: 12-month contract",
    match: [/สัญญา|กี่เดือน|ระยะเช่า|รายเดือน|สั้น/i, /lease|contract length|how many months|short.?term|monthly/i],
    th: "สัญญาเช่ามาตรฐานของเราคือ 12 เดือนครับ ถ้าต้องการระยะอื่น ผมบันทึกไว้ให้ทีมพิจารณาเป็นรายกรณีได้ แต่ยืนยันแทนทีมไม่ได้ครับ",
    en: "Our standard lease is 12 months. If you need a different term I can note it for the team to consider case by case, but I can't confirm it on their behalf.",
  },
  {
    id: "kb-coagent-open",
    source: "owner-stated: accepts co-agents worldwide, independent or from any company",
    match: [/โคเอเจนต์|co-?agent|พาร์ทเนอร์|เอเจนต์/i, /co-?agent|partner|agency|broker/i],
    th: "เรารับโคเอเจนต์จากทั่วโลกครับ ทั้งเอเจนต์อิสระและเอเจนต์จากบริษัทใดก็ได้ สมัครและส่งความต้องการลูกค้าได้ฟรี",
    en: "We work with co-agents worldwide — independent agents and agents from any company. Signing up and submitting client requirements is free.",
  },
  {
    id: "kb-coagent-free",
    source: "owner-stated: signup and submission are free",
    match: [/ค่าสมัคร|ฟรี|เสียเงิน|ค่าธรรมเนียม/i, /free|fee to join|cost to (sign|register)/i],
    th: "การสมัครเป็นโคเอเจนต์และการส่งความต้องการลูกค้าไม่มีค่าใช้จ่ายครับ",
    en: "Signing up as a co-agent and submitting client requirements is free of charge.",
  },
  {
    id: "kb-success-fee",
    source: "owner-stated: success fee agreed per deal before any obligation; no self-set rate",
    match: [/ค่าคอม|คอมมิช|ส่วนแบ่ง|success fee|ได้เท่าไห?ร่|เปอร์เซ็น/i, /commission|success fee|split|how much do i (get|earn)|percentage/i],
    th: "Success fee ตกลงกันเป็นรายดีลก่อนจะเกิดข้อผูกพันใด ๆ ครับ ผมไม่สามารถระบุอัตราหรือเปอร์เซ็นต์ให้ได้ เพราะไม่ใช่ตัวเลขที่ตั้งไว้ล่วงหน้า — ทีมจะคุยกับคุณโดยตรงก่อนเริ่มงาน",
    en: "The success fee is agreed per deal, before any obligation arises. I can't quote a rate or percentage because there isn't a preset one — the team agrees it with you directly before any commitment.",
  },
  {
    id: "kb-matching-not-live",
    source: "owner-stated: private listing submission and full matching are NOT live",
    match: [/ลงประกาศ|ส่งทรัพย์|จับคู่|matching|ระบบ/i, /submit (a )?(property|listing)|matching system|inventory/i],
    th: "ตอนนี้ระบบส่งทรัพย์ส่วนตัวและระบบจับคู่ครบวงจรยังไม่เปิดใช้งานครับ ผมจะไม่อ้างว่ามีแล้ว — สิ่งที่ทำได้ตอนนี้คือรับความต้องการและส่งให้ทีมประสานงานดูแลต่อ",
    en: "The private property submission and the full end-to-end matching system are not live yet. I won't claim otherwise — what I can do now is capture the requirement and pass it to the coordination team.",
  },
  {
    id: "kb-coverage",
    source: "owner-stated: rentals in Thailand; tenants from anywhere",
    match: [/ต่างชาติ|ต่างประเทศ|อยู่เมืองนอก|ที่ไหน|พื้นที่/i, /foreigner|overseas|from abroad|where do you (cover|operate)|coverage/i],
    th: "เรารับผู้เช่าจากทั่วโลกครับ ส่วนทรัพย์ที่ดูแลอยู่ในประเทศไทย",
    en: "We take tenants from anywhere in the world. The properties we handle are in Thailand.",
  },
  {
    id: "kb-what-is-lili",
    source: "product definition",
    match: [/คุณคือใคร|เป็นคนจริง|เป็นบอท|เป็น ?ai|หุ่นยนต์/i, /who are you|are you (a )?(human|bot|real)|is this ai/i],
    th: "ผมคือ Lili ผู้ช่วย AI ของ The Middle Property ครับ ไม่ใช่มนุษย์ ผมช่วยเก็บความต้องการและประสานส่งต่อให้ทีมงานจริงดูแลต่อ",
    en: "I'm Lili, an AI assistant for The Middle Property — not a human. I help capture your requirements and hand them to the real team.",
  },
];

/** Topics we are explicitly asked never to answer from imagination. */
export const NO_DATA_TOPICS = [
  { id: "availability", match: [/ห้องว่าง|มีห้อง|ว่างไหม|ยูนิต/i, /available|vacancy|any units|listings? available/i],
    th: "ผมไม่มีข้อมูลห้องว่างที่ตรวจสอบแล้วในระบบนี้ครับ จึงไม่ขอเดา — ถ้าคุณให้ความต้องการไว้ ทีมจะตรวจสอบของจริงแล้วติดต่อกลับ",
    en: "I don't have verified availability data in this system, so I won't guess. If you leave your requirements, the team will check the real inventory and come back to you." },
  { id: "price", match: [/ราคาเท่าไห?ร่|ค่าเช่าเท่าไห?ร่|ลดได้|ส่วนลด|ต่อรอง/i, /how much (is|does)|rent price|discount|negotiate/i],
    th: "ผมไม่มีราคาหรือส่วนลดที่ยืนยันแล้วให้อ้างอิงครับ ราคาจริงขึ้นกับทรัพย์แต่ละรายการและต้องให้ทีมยืนยัน",
    en: "I don't have confirmed prices or discounts to quote. Actual figures depend on the specific property and must be confirmed by the team." },
  { id: "guarantee", match: [/รับประกัน|การันตี|แน่นอนไหม|ได้แน่/i, /guarantee|assured|promise|for sure/i],
    th: "ผมให้คำรับประกันผลไม่ได้ครับ สิ่งที่ผมทำได้คือบันทึกความต้องการให้ครบและส่งให้ทีมดูแลต่ออย่างตรวจสอบได้",
    en: "I can't give guarantees. What I can do is record the requirement accurately and hand it to the team in a traceable way." },
  { id: "track-record", match: [/ผลงาน|เคยทำ|ลูกค้ากี่|รีวิว|สถิติ/i, /track record|how many clients|reviews|statistics|case stud/i],
    th: "ผมไม่มีตัวเลขผลงานหรือรีวิวที่ตรวจสอบแล้วให้อ้างอิงครับ จึงขอไม่ระบุ",
    en: "I don't have verified performance figures or reviews to cite, so I won't state any." },
];

export function answer(text, lang = "th") {
  const idx = lang === "en" ? 1 : 0;

  for (const topic of NO_DATA_TOPICS) {
    if (topic.match.some((re) => re.test(text))) {
      return { kind: "no_verified_data", id: topic.id, text: topic[lang] ?? topic.th, source: "policy: no unverified claims" };
    }
  }
  for (const entry of KB) {
    if (entry.match[idx]?.test(text) || entry.match.some((re) => re.test(text))) {
      return { kind: "kb", id: entry.id, text: entry[lang] ?? entry.th, source: entry.source };
    }
  }
  return null;
}
