/**
 * Readiness assessment — criteria, not a score.
 *
 * The owner's instruction is explicit: show what is missing and why, never invent a
 * readiness score. So this returns a state, the list of missing required fields, and
 * the list of reasons a human needs to look at it. There is no number anywhere.
 */

export const REQUIRED_TENANT = ["city", "budgetMonthlyTHB", "propertyType", "bedrooms", "moveInDate", "occupants"];
export const REQUIRED_COAGENT_CLIENT = REQUIRED_TENANT;
export const REQUIRED_AGENT_PROFILE = ["agencyName", "country", "contactChannel", "contactValue", "agentType"];

export const STATES = {
  INCOMPLETE: "INCOMPLETE",
  READY_FOR_TEAM_REVIEW: "READY_FOR_TEAM_REVIEW",
  NEEDS_TEAM_HELP: "NEEDS_TEAM_HELP",
};

const LABELS = {
  city: { th: "เมือง", en: "City" },
  area: { th: "ทำเล", en: "Area" },
  budgetMonthlyTHB: { th: "งบต่อเดือน", en: "Monthly budget" },
  propertyType: { th: "ประเภทที่พัก", en: "Property type" },
  bedrooms: { th: "จำนวนห้องนอน", en: "Bedrooms" },
  moveInDate: { th: "วันย้ายเข้า", en: "Move-in date" },
  leaseTermMonths: { th: "ระยะเช่า", en: "Lease term" },
  occupants: { th: "จำนวนผู้พัก", en: "Occupants" },
  pets: { th: "สัตว์เลี้ยง", en: "Pets" },
  agencyName: { th: "ชื่อบริษัท/ทีม", en: "Agency or team name" },
  country: { th: "ประเทศ", en: "Country" },
  contactChannel: { th: "ช่องทางติดต่อ", en: "Contact channel" },
  contactValue: { th: "ข้อมูลติดต่อ", en: "Contact details" },
  agentType: { th: "ประเภทเอเจนต์", en: "Agent type" },
};

export function label(field, lang = "th") {
  return LABELS[field]?.[lang] ?? field;
}

function missingFrom(obj, required) {
  return required.filter((f) => obj?.[f] === undefined || obj?.[f] === null || obj?.[f] === "");
}

/**
 * `flags` are reasons a human must look, each with a machine id and an explanation.
 * They never block capture — they route the record to NEEDS_TEAM_HELP instead of
 * silently passing it through as routine.
 */
function policyFlags(requirement, lang) {
  const flags = [];
  const term = requirement?.leaseTermMonths;
  if (term !== undefined && term !== 12) {
    flags.push({
      id: "non_standard_lease_term",
      th: `ขอสัญญา ${term} เดือน ซึ่งไม่ใช่สัญญามาตรฐาน 12 เดือน ต้องให้ทีมพิจารณาเป็นรายกรณี`,
      en: `Requested a ${term}-month term; the standard contract is 12 months, so the team must decide case by case.`,
    });
  }
  if (requirement?.pets && requirement.pets !== "none") {
    flags.push({
      id: "pets_need_property_check",
      th: "มีสัตว์เลี้ยง ต้องให้ทีมตรวจว่าทรัพย์แต่ละรายการอนุญาตหรือไม่ — ผมยืนยันแทนไม่ได้",
      en: "Pets are involved; the team must check each property's policy — I can't confirm that.",
    });
  }
  return flags.map((f) => ({ id: f.id, reason: f[lang] ?? f.th }));
}

export function assess({ flow, requirement, agentProfile, consent, reviewed, unansweredQuestions = [] }, lang = "th") {
  const missing = missingFrom(requirement, flow === "coagent" ? REQUIRED_COAGENT_CLIENT : REQUIRED_TENANT)
    .map((f) => ({ field: f, label: label(f, lang) }));

  const blockers = [];

  if (flow === "coagent") {
    for (const f of missingFrom(agentProfile, REQUIRED_AGENT_PROFILE)) {
      missing.push({ field: `agent.${f}`, label: label(f, lang) });
    }
    if (!consent?.attested) {
      blockers.push({
        id: "client_consent_not_attested",
        reason: lang === "en"
          ? "The submitting agent has not confirmed they have the client's permission to share these details."
          : "ผู้ส่งยังไม่ได้ยืนยันว่ามีสิทธิ์หรือได้รับความยินยอมจากลูกค้าในการส่งข้อมูลนี้",
      });
    }
  }

  const flags = policyFlags(requirement, lang);
  for (const q of unansweredQuestions) {
    flags.push({
      id: "question_outside_knowledge_base",
      reason: lang === "en"
        ? `A question was asked that has no verified answer in this system: "${q}"`
        : `มีคำถามที่ระบบนี้ไม่มีคำตอบที่ตรวจสอบแล้ว: "${q}"`,
    });
  }

  let state;
  if (missing.length > 0 || blockers.length > 0) state = STATES.INCOMPLETE;
  else if (flags.length > 0) state = STATES.NEEDS_TEAM_HELP;
  else if (!reviewed) state = STATES.INCOMPLETE;
  else state = STATES.READY_FOR_TEAM_REVIEW;

  return {
    state,
    missing,
    blockers,
    flags,
    reviewed: Boolean(reviewed),
    // Explicit, so the UI never has to guess why a submit button is disabled.
    canSubmit: missing.length === 0 && blockers.length === 0 && Boolean(reviewed),
  };
}
