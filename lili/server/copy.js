/** All user-facing strings. Thai and English are both hand-written, never machine-guessed. */
export const T = {
  greetTenant: {
    th: "สวัสดีครับ ผมชื่อ Lili เป็นผู้ช่วย AI ของ The Middle Property (ไม่ใช่มนุษย์นะครับ) ผมช่วยเก็บความต้องการเช่าของคุณแล้วส่งให้ทีมงานจริงดูแลต่อได้ครับ — เริ่มจากอยากเช่าที่เมืองไหนดีครับ",
    en: "Hello, I'm Lili — an AI assistant for The Middle Property, not a human. I can capture what you're looking for and pass it to the real team. To start: which city are you looking to rent in?",
  },
  greetCoagent: {
    th: "สวัสดีครับ ผมชื่อ Lili เป็นผู้ช่วย AI ของ The Middle Property ครับ\n\nเรารับโคเอเจนต์จากทั่วโลก ทั้งเอเจนต์อิสระและจากทุกบริษัท สมัครและส่งความต้องการลูกค้าได้ฟรี ขั้นตอนคือ: บอกข้อมูลของคุณ → ยืนยันสิทธิ์ในการส่งข้อมูลลูกค้า → กรอกความต้องการของลูกค้า → ทีมตรวจและติดต่อกลับ\n\nSuccess fee ตกลงเป็นรายดีลก่อนเกิดข้อผูกพัน ผมระบุอัตราแทนทีมไม่ได้ครับ\n\nเริ่มจากชื่อบริษัทหรือทีมของคุณครับ",
    en: "Hello, I'm Lili — an AI assistant for The Middle Property.\n\nWe work with co-agents worldwide, independent or from any company, and signing up and submitting client requirements is free. The flow is: your details → confirm you're permitted to share the client's information → the client's requirements → the team reviews and gets back to you.\n\nThe success fee is agreed per deal before any obligation; I can't quote a rate on the team's behalf.\n\nTo start: what's your agency or team name?",
  },
  ask: {
    city: { th: "สนใจเช่าที่เมืองไหนครับ", en: "Which city are you looking at?" },
    area: { th: "มีทำเลหรือย่านที่อยากได้เป็นพิเศษไหมครับ", en: "Any particular area or neighbourhood?" },
    propertyType: { th: "อยากได้ที่พักแบบไหนครับ — คอนโด อพาร์ตเมนต์ บ้าน หรือทาวน์เฮาส์", en: "What type of place — condo, apartment, house or townhouse?" },
    bedrooms: { th: "ต้องการกี่ห้องนอนครับ (สตูดิโอก็บอกได้)", en: "How many bedrooms do you need? (Studio is fine too.)" },
    budgetMonthlyTHB: { th: "งบต่อเดือนประมาณเท่าไหร่ครับ", en: "What's your monthly budget?" },
    moveInDate: { th: "อยากย้ายเข้าวันไหนครับ", en: "When would you like to move in?" },
    occupants: { th: "จะเข้าอยู่กี่คนครับ", en: "How many people will be living there?" },
    leaseTermMonths: { th: "สัญญามาตรฐานของเราคือ 12 เดือน ระยะนี้โอเคไหมครับ", en: "Our standard lease is 12 months — does that work for you?" },
    pets: { th: "มีสัตว์เลี้ยงไหมครับ", en: "Do you have any pets?" },
    agencyName: { th: "ชื่อบริษัทหรือทีมของคุณคืออะไรครับ", en: "What's your agency or team name?" },
    country: { th: "คุณทำงานอยู่ประเทศไหนครับ", en: "Which country do you operate from?" },
    agentType: { th: "คุณเป็นเอเจนต์อิสระ หรือสังกัดบริษัทครับ", en: "Are you an independent agent or with a company?" },
    contactChannel: { th: "สะดวกให้ทีมติดต่อกลับทางไหนครับ — อีเมล โทรศัพท์ LINE หรือ WhatsApp", en: "How should the team reach you — email, phone, LINE or WhatsApp?" },
    contactValue: { th: "ขอข้อมูลติดต่อตามช่องทางนั้นครับ", en: "What's the contact detail for that channel?" },
  },
  consentPrompt: {
    th: "ก่อนกรอกข้อมูลลูกค้า ขอให้ยืนยันก่อนนะครับว่า คุณมีสิทธิ์หรือได้รับความยินยอมจากลูกค้าในการส่งข้อมูลนี้ให้เรา — กดยืนยันที่ใบสรุปด้านข้างได้เลยครับ",
    en: "Before we record the client's details, please confirm that you have the client's permission to share this information with us — you can tick that on the summary card.",
  },
  consentOk: {
    th: "ขอบคุณครับ บันทึกการยืนยันสิทธิ์แล้ว ทีนี้มาที่ความต้องการของลูกค้ากันครับ",
    en: "Thank you — the permission confirmation is recorded. Now let's cover the client's requirements.",
  },
  reviewReady: {
    th: "ข้อมูลครบแล้วครับ รบกวนตรวจใบสรุปทางขวา ถ้าถูกต้องกด “ยืนยันข้อมูลถูกต้อง” ได้เลย แก้ตรงไหนก็บอกผมได้ครับ",
    en: "That's everything I need. Please check the summary on the right — if it looks right, tick \"Confirm details are correct\". Tell me if anything needs changing.",
  },
  reviewedNext: {
    th: "ขอบคุณที่ตรวจสอบครับ พร้อมส่งให้ทีมประสานงานแล้ว กด “ส่งให้ทีม” ได้เลยครับ",
    en: "Thanks for checking. This is ready for the coordination team — press \"Send to team\" whenever you're ready.",
  },
  reviewReadyShort: {
    th: "ใบสรุปทางขวายังรอให้คุณยืนยันอยู่นะครับ",
    en: "The summary on the right is still waiting for your confirmation.",
  },
  updated: { th: "อัปเดตให้แล้วครับ", en: "Updated." },
  submitted: {
    th: "ส่งให้ทีมแล้วครับ นี่เป็น “คำขอ” ที่รอทีมตรวจและติดต่อกลับ ยังไม่ใช่การนัดหมายที่ยืนยันแล้ว — ผมยืนยันนัดแทนทีมไม่ได้ครับ",
    en: "Sent to the team. This is a request awaiting their review and reply — it is not a confirmed appointment; I can't confirm one on their behalf.",
  },
  duplicate: {
    th: "รายการนี้ถูกส่งไปแล้วก่อนหน้านี้ครับ ผมจึงไม่ส่งซ้ำ — ใช้เลขอ้างอิงเดิมได้เลย",
    en: "This was already submitted, so I haven't sent a duplicate — the original reference still applies.",
  },
  blockedSuspended: {
    th: "บัญชีของคุณอยู่ในสถานะที่ส่งงานเพิ่มไม่ได้ครับ ผมจึงส่งรายการนี้ให้ไม่ได้ กรุณาติดต่อทีมเพื่อตรวจสอบสถานะบัญชี",
    en: "Your account is in a state that can't submit further items, so I can't send this. Please contact the team about your account status.",
  },
  pendingNotice: {
    th: "หมายเหตุ: บัญชีของคุณยังอยู่ระหว่างตรวจสอบ (pending) — ส่งความต้องการได้ตามปกติครับ",
    en: "Note: your account is still pending review — you can still submit requirements as normal.",
  },
  dontKnow: {
    th: "เรื่องนี้ผมไม่มีข้อมูลที่ตรวจสอบแล้วครับ จึงขอไม่เดา ผมบันทึกคำถามไว้ให้ทีมตอบกลับแล้วนะครับ",
    en: "I don't have verified information on that, so I won't guess. I've noted the question for the team to answer.",
  },
  modelFallback: {
    th: "(ตอนนี้ระบบช่วยอ่านข้อความขัดข้องชั่วคราว ผมยังบันทึกข้อมูลของคุณไว้ครบนะครับ)",
    en: "(The language helper is temporarily unavailable. Your details are still saved.)",
  },
};

export function t(node, lang = "th") {
  return node?.[lang] ?? node?.th ?? "";
}
