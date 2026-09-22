/**
 * Follow-up draft for the team.
 *
 * This produces TEXT FOR A HUMAN TO SEND. Nothing here sends anything: the prototype
 * has no messaging channel wired, and sending to a real customer needs an authorised
 * channel and the recipient's permission. The draft states only facts already in the
 * record — no price, no availability, no promise of a time.
 */
import { label } from "./readiness.js";

function fmtRequirement(r, lang) {
  const lines = [];
  const add = (k, v) => v !== undefined && v !== null && v !== "" && lines.push(`- ${label(k, lang)}: ${v}`);
  add("city", r.city);
  add("area", r.area);
  add("propertyType", r.propertyType);
  add("bedrooms", r.bedrooms === 0 ? (lang === "en" ? "Studio" : "สตูดิโอ") : r.bedrooms);
  add("budgetMonthlyTHB", r.budgetMonthlyTHB && `${r.budgetMonthlyTHB.toLocaleString("en-US")} THB`);
  add("moveInDate", r.moveInDate);
  add("leaseTermMonths", r.leaseTermMonths && `${r.leaseTermMonths} ${lang === "en" ? "months" : "เดือน"}`);
  add("occupants", r.occupants);
  add("pets", r.pets);
  return lines.join("\n");
}

export function draft(submission, lang = "th") {
  const r = submission.requirement;
  const isAgent = submission.flow === "coagent";

  const th = `เรียน ${isAgent ? "คุณเอเจนต์" : "ลูกค้า"}

ขอบคุณที่ส่งความต้องการเข้ามาครับ ทีมได้รับเรื่องแล้ว เลขอ้างอิง ${submission.ref}

สรุปสิ่งที่เราบันทึกไว้:
${fmtRequirement(r, "th")}

ขั้นตอนถัดไป: ทีมจะตรวจสอบและติดต่อกลับเพื่อยืนยันรายละเอียด ขณะนี้ถือเป็นคำขอที่รอการตรวจสอบ ยังไม่ใช่การนัดหมายที่ยืนยันแล้ว${
    submission.flags?.length ? `\n\nประเด็นที่ทีมต้องตรวจเพิ่ม:\n${submission.flags.map((f) => `- ${f.reason}`).join("\n")}` : ""
  }${
    submission.openQuestions?.length ? `\n\nคำถามที่ยังรอคำตอบจากทีม:\n${submission.openQuestions.map((q) => `- ${q}`).join("\n")}` : ""
  }

ขอบคุณครับ
The Middle Property`;

  const en = `Dear ${isAgent ? "partner" : "customer"},

Thank you for sending your requirements. The team has received them under reference ${submission.ref}.

What we recorded:
${fmtRequirement(r, "en")}

Next step: the team will review and contact you to confirm the details. At this stage this is a request awaiting review, not a confirmed appointment.${
    submission.flags?.length ? `\n\nPoints the team still needs to check:\n${submission.flags.map((f) => `- ${f.reason}`).join("\n")}` : ""
  }${
    submission.openQuestions?.length ? `\n\nQuestions still awaiting a team answer:\n${submission.openQuestions.map((q) => `- ${q}`).join("\n")}` : ""
  }

Kind regards,
The Middle Property`;

  return {
    lang,
    text: lang === "en" ? en : th,
    both: { th, en },
    delivery: "manual_only",
    deliveryNote:
      lang === "en"
        ? "Draft only. This prototype has no messaging channel connected and does not send to customers."
        : "เป็นฉบับร่างเท่านั้น ต้นแบบนี้ยังไม่ได้ต่อช่องทางส่งข้อความ และไม่ส่งหาลูกค้าจริง",
  };
}
