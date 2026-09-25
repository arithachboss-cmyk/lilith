/**
 * Deterministic Thai/English slot extraction.
 *
 * This is the BASE layer, not a fallback of last resort: it runs in every mode, and
 * in `model` mode its output is merged with the model's and wins on any field where
 * both are confident. A regex that found "25,000 บาท" is more trustworthy than a
 * model paraphrase of the same sentence, and it costs nothing.
 */

const TH_MONTHS = {
  "ม.ค": 1, มกราคม: 1, "ก.พ": 2, กุมภาพันธ์: 2, "มี.ค": 3, มีนาคม: 3, "เม.ย": 4, เมษายน: 4,
  "พ.ค": 5, พฤษภาคม: 5, "มิ.ย": 6, มิถุนายน: 6, "ก.ค": 7, กรกฎาคม: 7, "ส.ค": 8, สิงหาคม: 8,
  "ก.ย": 9, กันยายน: 9, "ต.ค": 10, ตุลาคม: 10, "พ.ย": 11, พฤศจิกายน: 11, "ธ.ค": 12, ธันวาคม: 12,
};
const EN_MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const CITIES = [
  { re: /กรุงเทพ|กทม|bangkok|bkk/i, value: "Bangkok" },
  { re: /เชียงใหม่|chiang\s?mai/i, value: "Chiang Mai" },
  { re: /ภูเก็ต|phuket/i, value: "Phuket" },
  { re: /พัทยา|pattaya/i, value: "Pattaya" },
  { re: /ชลบุรี|chonburi/i, value: "Chonburi" },
  { re: /หัวหิน|hua\s?hin/i, value: "Hua Hin" },
  { re: /สมุย|samui/i, value: "Koh Samui" },
];

/** Areas that unambiguously sit in one city. Used to infer `city` so Lili does not
 *  ask a question the user has effectively already answered. Inferred fields are
 *  reported separately so the review card can show them as editable guesses. */
const AREA_CITY = {
  Asoke: "Bangkok", "Thong Lo": "Bangkok", "Phrom Phong": "Bangkok", Ekkamai: "Bangkok",
  Sukhumvit: "Bangkok", Sathorn: "Bangkok", Silom: "Bangkok", Ari: "Bangkok",
  "Phaya Thai": "Bangkok", Ratchada: "Bangkok", "On Nut": "Bangkok", "Rama 9": "Bangkok",
};

const AREAS = [
  { re: /อโศก|asoke|asok/i, value: "Asoke" },
  { re: /ทองหล่อ|thong\s?lor?/i, value: "Thong Lo" },
  { re: /พร้อมพงษ์|phrom\s?phong/i, value: "Phrom Phong" },
  { re: /เอกมัย|ekkamai|ekamai/i, value: "Ekkamai" },
  { re: /สุขุมวิท|sukhumvit/i, value: "Sukhumvit" },
  { re: /สาทร|sathorn|sathon/i, value: "Sathorn" },
  { re: /สีลม|silom/i, value: "Silom" },
  { re: /อารีย์|ari\b/i, value: "Ari" },
  { re: /พญาไท|phaya\s?thai/i, value: "Phaya Thai" },
  { re: /รัชดา|ratchada/i, value: "Ratchada" },
  { re: /อ่อนนุช|on\s?nut/i, value: "On Nut" },
  { re: /พระราม\s?9|rama\s?9/i, value: "Rama 9" },
];

const PROPERTY_TYPES = [
  { re: /คอนโด|condo/i, value: "condo" },
  { re: /ทาวน์\s?เฮ?า?ส์|town\s?house|townhome/i, value: "townhouse" },
  { re: /อพาร์ต?เมน?ท?์|apartment|apt\b/i, value: "apartment" },
  { re: /บ้านเดี่ยว|บ้าน(?!เลข)|house|villa/i, value: "house" },
];

function extractBudget(text) {
  // "25,000 บาท" · "ไม่เกิน 30000" · "25k" · "THB 40000" · "budget 35,000"
  const kMatch = text.match(/(?:งบ|budget|ไม่เกิน|under|max(?:imum)?|around|ประมาณ|thb|บาท)?\s*([0-9][0-9,\.]*)\s*(k|พัน|หมื่น)?\s*(?:บาท|thb|baht|\/\s*(?:เดือน|month|mo))?/i);
  if (!kMatch) return undefined;
  const raw = kMatch[1].replace(/[,\s]/g, "");
  let n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  const unit = (kMatch[2] || "").toLowerCase();
  if (unit === "k" || unit === "พัน") n *= 1000;
  if (unit === "หมื่น") n *= 10000;
  // A monthly rent below 1,000 is almost certainly not a budget figure (it is a
  // bedroom count or a date fragment); require a plausible magnitude.
  if (n < 1000 || n > 100_000_000) return undefined;
  return Math.round(n);
}

function extractBedrooms(text) {
  if (/สตูดิโอ|studio/i.test(text)) return 0;
  const m = text.match(/(\d+)\s*(?:ห้องนอน|bed\s?rooms?|bedrooms?|br\b|bed\b)/i)
    || text.match(/(?:ห้องนอน|bedrooms?)\s*(\d+)/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isInteger(n) && n >= 0 && n <= 20 ? n : undefined;
}

function extractOccupants(text) {
  const m = text.match(/(?:อยู่|พัก|เข้าอยู่|มีกัน|for)\s*(\d+)\s*(?:คน|people|persons?|pax|adults?)/i)
    || text.match(/(\d+)\s*(?:คน|people|persons?|pax)/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isInteger(n) && n >= 1 && n <= 30 ? n : undefined;
}

function extractLeaseTerm(text) {
  if (/1\s*ปี|หนึ่งปี|one\s*year|1\s*year|12\s*(?:เดือน|months?)/i.test(text)) return 12;
  if (/2\s*ปี|two\s*years?|24\s*(?:เดือน|months?)/i.test(text)) return 24;
  const m = text.match(/(\d{1,2})\s*(?:เดือน|months?)/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isInteger(n) && n >= 1 && n <= 120 ? n : undefined;
}

function extractPets(text) {
  if (/ไม่มีสัตว์|ไม่เลี้ยง|no\s*pets?|without\s*pets?/i.test(text)) return "none";
  if (/แมว|cat\b/i.test(text)) return "cat";
  if (/หมา|สุนัข|dog\b/i.test(text)) return "dog";
  if (/สัตว์เลี้ยง|pets?\b/i.test(text)) return "other";
  return undefined;
}

function pad(n) { return String(n).padStart(2, "0"); }

function extractMoveInDate(text, now = new Date()) {
  const iso = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) return `${iso[1]}-${pad(Number(iso[2]))}-${pad(Number(iso[3]))}`;

  const dmy = text.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);
  if (dmy) return `${dmy[3]}-${pad(Number(dmy[2]))}-${pad(Number(dmy[1]))}`;

  for (const [name, month] of Object.entries(TH_MONTHS)) {
    const re = new RegExp(`(\\d{1,2})\\s*${name.replace(/\./g, "\\.?")}\\.?\\s*(\\d{4})?`);
    const m = text.match(re);
    if (m) {
      let year = m[2] ? Number(m[2]) : now.getUTCFullYear();
      if (year > 2500) year -= 543; // Buddhist Era
      if (!m[2] && month < now.getUTCMonth() + 1) year += 1;
      return `${year}-${pad(month)}-${pad(Number(m[1]))}`;
    }
  }
  const en = text.match(/\b(\d{1,2})?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{1,2})?,?\s*(20\d{2})?/i);
  if (en && (en[1] || en[3])) {
    const month = EN_MONTHS[en[2].toLowerCase()];
    const day = Number(en[1] || en[3]);
    let year = en[4] ? Number(en[4]) : now.getUTCFullYear();
    if (!en[4] && month < now.getUTCMonth() + 1) year += 1;
    if (day >= 1 && day <= 31) return `${year}-${pad(month)}-${pad(day)}`;
  }
  return undefined;
}

function first(list, text) {
  for (const item of list) if (item.re.test(text)) return item.value;
  return undefined;
}

/**
 * Returns "th", "en", or null when the text carries no language signal at all —
 * an email address, a phone number or a bare figure. Returning null lets the caller
 * keep the language already in use instead of flipping to English because someone
 * typed "agent@example.com".
 */
export function detectLanguage(text) {
  if (/[\u0E00-\u0E7F]/.test(text)) return "th";
  const withoutContacts = text.replace(/\S+@\S+/g, " ").replace(/[+\d][\d\s()-]{5,}/g, " ");
  const words = withoutContacts.match(/[A-Za-z]{2,}/g) ?? [];
  return words.length >= 2 ? "en" : null;
}

/**
 * Returns `{ slots, inferred }`. `slots` holds only what this turn actually mentions;
 * an absent slot means "not mentioned", never "cleared". `inferred` names slots that
 * were derived rather than stated, so the UI can mark them for the user to confirm.
 */
export function extract(text, now = new Date()) {
  const out = {};
  const city = first(CITIES, text);
  const area = first(AREAS, text);
  const propertyType = first(PROPERTY_TYPES, text);
  const bedrooms = extractBedrooms(text);
  const occupants = extractOccupants(text);
  const leaseTermMonths = extractLeaseTerm(text);
  const pets = extractPets(text);
  const moveInDate = extractMoveInDate(text, now);

  // Budget last: strip fragments already consumed by other slots so "2 ห้องนอน
  // งบ 30000" does not read the bedroom count as a budget.
  const consumed = text
    .replace(/\d+\s*(?:ห้องนอน|bed\s?rooms?|bedrooms?|br\b)/gi, " ")
    .replace(/\d+\s*(?:คน|people|persons?|pax)/gi, " ")
    .replace(/\d{1,2}\s*(?:เดือน|months?)/gi, " ")
    .replace(/\b20\d{2}-\d{1,2}-\d{1,2}\b/g, " ")
    .replace(/\b\d{1,2}\/\d{1,2}\/20\d{2}\b/g, " ");
  const budgetMonthlyTHB = extractBudget(consumed);

  if (city) out.city = city;
  if (area) out.area = area;
  if (propertyType) out.propertyType = propertyType;
  if (bedrooms !== undefined) out.bedrooms = bedrooms;
  if (occupants !== undefined) out.occupants = occupants;
  if (leaseTermMonths !== undefined) out.leaseTermMonths = leaseTermMonths;
  if (pets !== undefined) out.pets = pets;
  if (moveInDate) out.moveInDate = moveInDate;
  if (budgetMonthlyTHB !== undefined) out.budgetMonthlyTHB = budgetMonthlyTHB;

  const inferred = [];
  if (!out.city && out.area && AREA_CITY[out.area]) {
    out.city = AREA_CITY[out.area];
    inferred.push("city");
  }
  return { slots: out, inferred };
}
