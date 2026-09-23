#!/usr/bin/env node
/**
 * ACS claim scanner — mechanical check M-5/M-6 from 03_QA_CHECKLIST.md.
 *
 * Finds claims that the central Claim Register forbids or gates, in Thai and English,
 * and reports each one against its CR row. With --fix it redacts BLOCKED figures in
 * place, leaving a visible marker instead of silently deleting a sentence: the writer
 * still has to make the sentence read properly, which is a human job.
 *
 *   node claim-scan.mjs <file|dir> [...]        report only, exit 1 if anything BLOCKED
 *   node claim-scan.mjs <path> --strict         also fail on EVIDENCE_REQUIRED
 *   node claim-scan.mjs <path> --fix            redact BLOCKED figures in place
 *   node claim-scan.mjs <path> --json           machine-readable output
 *   node claim-scan.mjs <dir> --all             include governance files (normally skipped)
 *
 * Rules come from ../01_CLAIM_REGISTER.md. Adding a rule here without adding the CR row
 * there is a bug: the register is the source of truth.
 */
import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, extname, basename } from "node:path";

const MARKER = (cr) => `⟦ลบตัวเลข ${cr} — รอหลักฐาน⟧`;

/**
 * `redact: true`  → the matched span is removed by --fix (BLOCKED figures).
 * `redact: false` → reported for a human decision (OWNER_REQUIRED, ranking prose).
 */
const RULES = [
  {
    id: "pct-range-improvement",
    cr: "CR-02", cls: "BLOCKED", redact: true,
    why: "ตัวเลขการปรับปรุงแบบ ก่อน→หลัง (Owner decision Queue #21)",
    re: /\d{1,3}(?:[.,]\d+)?\s*(?:[-–—]\s*\d{1,3}(?:[.,]\d+)?)?\s*%?\s*(?:→|->|➜|ไปเป็น|เป็น|to)\s*\d{1,3}(?:[.,]\d+)?\s*%\+?/gi,
  },
  {
    id: "pct-any",
    cr: "CR-02", cls: "BLOCKED", redact: true,
    why: "เปอร์เซ็นต์ใด ๆ ที่ไม่มีแหล่งอ้างอิงผูกไว้",
    re: /\d{1,3}(?:[.,]\d+)?\s*(?:[-–—]\s*\d{1,3}(?:[.,]\d+)?\s*)?%\+?/g,
  },
  {
    id: "read-range",
    cr: "CR-02", cls: "BLOCKED", redact: true,
    why: "ระยะอ่าน ต้องมาจากดาต้าชีตของรุ่นนั้นเท่านั้น",
    re: /(?:ระยะอ่าน|ระยะสแกน|อ่านได้ไกล(?:ถึง)?|read\s*(?:range|distance)|scan(?:ning)?\s*distance)[^\n.·]{0,24}?\d+(?:[.,]\d+)?\s*(?:เมตร|เซนติเมตร|ซม\.?|นิ้ว|ฟุต|ม\.?|(?:m|cm|mm|in|ft)\b)/gi,
  },
  {
    id: "speed",
    cr: "CR-02", cls: "BLOCKED", redact: true,
    why: "ความเร็วพิมพ์/สแกน ต้องมาจากดาต้าชีต",
    re: /\d+(?:[.,]\d+)?\s*(?:มม\.?\/วินาที|นิ้ว\/วินาที|ครั้งต่อวินาที|(?:ips|mm\/s|scans?\s*\/\s*s|ppm)\b)/gi,
  },
  {
    id: "accuracy",
    cr: "CR-02", cls: "BLOCKED", redact: true,
    why: "ตัวเลขความแม่นยำ ต้องมีหลักฐาน",
    re: /(?:ความแม่นยำ|ความถูกต้อง|อัตราการอ่าน|accuracy|read\s*rate|first[-\s]?pass)[^\n.·]{0,24}?\d+(?:[.,]\d+)?\s*%?/gi,
  },
  {
    id: "time-saving",
    cr: "CR-09", cls: "BLOCKED", redact: true,
    why: "ตัวเลขประหยัดเวลา/ต้นทุน ต้องมีฐานการคำนวณที่อ้างอิงได้",
    re: /(?:ลดเวลา|ประหยัดเวลา|ประหยัด|ลดต้นทุน|ลดข้อผิดพลาด|save[sd]?|reduce[sd]?)[^\n.·]{0,24}?\d+(?:[.,]\d+)?\s*(?:%|เท่า|ชั่วโมง|วัน|นาที|(?:hours?|days?|minutes?)\b)/gi,
  },
  {
    id: "material-certainty",
    cr: "CR-01", cls: "EVIDENCE_REQUIRED", redact: false,
    why: "ฟันธงความทนทานของวัสดุ ต้องมีดาต้าชีตของสินค้าจริง (Owner decision Queue #4)",
    re: /(?:ทน(?:ต่อ)?\s*(?:ความร้อน|ความเย็น|สารเคมี|น้ำมัน|ตัวทำละลาย|การเสียดสี|รอยขีดข่วน|แสงแดด|UV|น้ำ|ความชื้น)[^\n.·]{0,12}?ได้|กัน(?:น้ำ|ฝุ่น|รอย|ความร้อน|สารเคมี|แดด|UV)(?!ได้หรือไม่)|ไม่(?:หลุด|ลอก|ซีด|จาง|เลือน|ละลาย)|resistant\s+to|withstands?|water\s*proof|weather\s*proof|chemical[-\s]resistant|scratch[-\s]resistant|fade[-\s]?proof|will\s+not\s+(?:fade|peel|smear|come\s+off))/gi,
  },
  {
    id: "environment-certainty",
    cr: "CR-01", cls: "EVIDENCE_REQUIRED", redact: false,
    why: "ฟันธงว่าใช้ได้ในสภาพแวดล้อมหนึ่ง ต้องมีดาต้าชีตระบุเงื่อนไขการวัด",
    re: /(?:ใช้(?:งาน)?(?:ได้)?\s*(?:กลางแจ้ง|ภายนอกอาคาร|ในห้องเย็น|ในห้องแช่แข็ง|ในที่เปียก|กับโลหะ|บนพื้นผิวมัน)[^\n.·]{0,10}?ได้|เหมาะ(?:สม)?(?:สำหรับ|กับ)\s*(?:ทุก|ทั้ง)|suitable\s+for\s+(?:outdoor|freezer|any|all)|works?\s+in\s+(?:any|all)\s+(?:environment|condition)|for\s+(?:any|all)\s+surfaces?)/gi,
  },
  {
    id: "absolute-scope",
    cr: "CR-01", cls: "EVIDENCE_REQUIRED", redact: false,
    why: "ขอบเขตแบบเหมารวม (ทุก/ทั้งหมด/เสมอ) ต้องแคบลงให้ตรงกับที่ดาต้าชีตระบุ",
    re: /(?:ทุกสภาพแวดล้อม|ทุกพื้นผิว|ทุกอุตสาหกรรม|ได้ทุกแบบ|ตลอดอายุการใช้งาน|ใช้ได้เสมอ|always\s+works|every\s+(?:surface|environment)|lifetime\s+durability)/gi,
  },
  {
    id: "partner-claim",
    cr: "CR-06", cls: "EVIDENCE_REQUIRED", redact: false,
    why: "อ้างความสัมพันธ์กับผู้ผลิต ต้องมีหนังสือรับรองจาก vendor พร้อมวันที่",
    re: /(?:เป็น)?(?:พาร์ท?เนอร์|ตัวแทน(?:จำหน่าย)?(?:อย่างเป็นทางการ)?|ผู้แทนจำหน่าย|distributor|authoris?ed\s+(?:dealer|distributor|reseller|partner)|official\s+partner|certified\s+partner|partner\s+of)/gi,
  },
  {
    id: "vendor-name",
    cr: "CR-06", cls: "EVIDENCE_REQUIRED", redact: false,
    why: "เอ่ยชื่อผู้ผลิต ต้องตรวจว่าบริบทเป็นการอ้างอิงสเปก ไม่ใช่การอ้างความสัมพันธ์",
    re: /\b(?:Honeywell|Brady|TSC|Zebra|Datalogic|SATO|GS1|Intermec|Godex)\b/gi,
  },
  {
    id: "customer-name",
    cr: "CR-08", cls: "OWNER_REQUIRED", redact: false,
    why: "เอ่ยชื่อลูกค้า ต้องมีความยินยอมเป็นลายลักษณ์อักษรจากลูกค้ารายนั้น ไม่ใช่แค่ ACS อนุมัติ",
    re: /\b(?:7-?\s?Eleven|เซเว่น|CP\s*All|ซีพี|Central|เซ็นทรัล|Lotus'?s?|โลตัส|Big\s*C|บิ๊กซี|Makro|แม็คโคร|ThaiBev|ไทยเบฟ|SCG|เอสซีจี|PTT|ปตท|Tesco)\b/gi,
  },
  {
    id: "customer-implied",
    cr: "CR-08", cls: "OWNER_REQUIRED", redact: false,
    why: "อ้างว่าดูแล/ให้บริการลูกค้ารายใด แม้ไม่เอ่ยชื่อ ก็ยังเป็นข้ออ้างเรื่องลูกค้า",
    re: /(?:ดูแล(?:ระบบ)?ให้(?:กับ)?|ให้บริการ(?:แก่|กับ)|ลูกค้าของเรา(?:ได้แก่|เช่น)?|เป็นผู้ดูแลระบบให้|ไว้วางใจโดย|trusted\s+by|clients?\s+include|serving)\s*[^\n.·]{0,40}/gi,
  },
  {
    id: "company-tenure",
    cr: "CR-10", cls: "OWNER_REQUIRED", redact: false,
    why: "อายุบริษัท/ประสบการณ์เป็นตัวเลข ต้องยืนยันด้วยหนังสือรับรองบริษัทหรือเอกสาร ACS",
    re: /(?:\d{1,3}\s*ปี(?:\s*(?:ใน|ที่|ของ)?\s*(?:วงการ|ประสบการณ์|ธุรกิจ|ตลาด|อุตสาหกรรม|ที่ผ่านมา|แล้ว))?|ก่อตั้ง(?:เมื่อ|ปี)?\s*(?:พ\.ศ\.|ค\.ศ\.)?\s*\d{4}|since\s+(?:19|20)\d{2}|\d{1,3}\+?\s*years?\s+(?:of\s+)?(?:experience|in\s+business)?)/gi,
  },
  {
    id: "availability",
    cr: "CR-15", cls: "OWNER_REQUIRED", redact: false,
    why: "สถานะสต็อก/ความพร้อมส่ง ต้องมาจากข้อมูลจริงของ ACS พร้อมวันที่ (Owner decision D-08)",
    re: /(?:มี(?:ของ|สต็อก|สินค้า)(?:พร้อม(?:ส่ง|จำหน่าย))?|พร้อมส่ง(?:ทันที)?|สต็อก(?:พร้อม|เหลือ)|สินค้าพร้อมจำหน่าย|หมดสต็อก|in\s*stock|ready\s+to\s+ship|available\s+now|out\s+of\s+stock)/gi,
  },
  {
    id: "lead-time",
    cr: "CR-15", cls: "OWNER_REQUIRED", redact: false,
    why: "ระยะเวลาส่งมอบ ต้องมาจาก ACS พร้อมวันที่ที่ข้อมูลนั้นเป็นจริง",
    re: /(?:ส่ง(?:ได้|ของ|มอบ)?\s*(?:ภายใน|ใน)\s*\d+\s*(?:วัน|ชั่วโมง|สัปดาห์)|ได้รับของ(?:ภายใน|ใน)\s*\d+|จัดส่ง(?:ภายใน|ใน)\s*\d+|lead\s*time[^\n.·]{0,16}?\d+|ships?\s+(?:in|within)\s+\d+|delivery\s+(?:in|within)\s+\d+|same[-\s]day\s+(?:delivery|dispatch)|next[-\s]day)/gi,
  },
  {
    id: "local-support",
    cr: "CR-16", cls: "OWNER_REQUIRED", redact: false,
    why: "ข้ออ้างเรื่องทีมงาน/บริการในพื้นที่ ต้องให้ ACS ยืนยันว่ามีจริงและครอบคลุมแค่ไหน",
    re: /(?:ทีม(?:งาน|ช่าง|ซัพพอร์ต)(?:ใน|ที่)?ไทย|บริการ(?:หลังการขาย)?ทั่วประเทศ|ศูนย์บริการ(?:ทั่วไทย|ทุกจังหวัด)?|ช่างถึงหน้างาน(?:ภายใน)?|on[-\s]site\s+(?:support|service|within)|local\s+(?:team|support|service)|nationwide\s+(?:service|support|coverage))/gi,
  },
  {
    id: "price-range",
    cr: "CR-03", cls: "OWNER_REQUIRED", redact: false,
    why: "ช่วงราคา ต้องมาจากราคา ACS พร้อมวันที่มีผล (Owner decision Queue #16/#18)",
    // An ISO date is shaped like a numeric range, so a bare "2026-09-23" was being
    // reported as a price. Require a currency marker on one side or the other.
    re: /(?:฿\s*\d[\d,]*\s*[-–—]\s*(?:฿\s*)?\d[\d,]*|\d[\d,]*\s*[-–—]\s*\d[\d,]*\s*(?:บาท|THB|baht|฿))/gi,
  },
  {
    id: "price",
    cr: "CR-03", cls: "OWNER_REQUIRED", redact: false,
    why: "ราคาต้องมาจากราคา ACS พร้อมวันที่มีผล (Owner decision Queue #16/#18)",
    re: /(?:฿\s*\d[\d,]*|\d[\d,]*\s*(?:บาท|THB|baht)|(?:ราคา)?เริ่มต้นที่\s*\d[\d,]*|starting\s*(?:from|at)\s*[\d,]+|prices?\s+from\s*(?:฿\s*)?[\d,]+)/gi,
  },
  {
    id: "price-relative",
    cr: "CR-03", cls: "OWNER_REQUIRED", redact: false,
    why: "ข้ออ้างราคาเชิงเปรียบเทียบ ต้องมีราคาทั้งสองฝั่งพร้อมวันที่ จึงจะพูดได้",
    re: /(?:ราคา(?:ถูก|ดี|ประหยัด)(?:กว่า)?|ถูกกว่า(?:คู่แข่ง|ท้องตลาด)?|คุ้มค่า(?:กว่า)?|ประหยัดกว่า|ราคาย่อมเยา|affordable|budget[-\s]friendly|cost[-\s]effective|value\s+for\s+money|competitive\s+pric(?:ing|es?)|pric(?:ing|es?)\s+(?:is|are)\s+competitive|cheaper\s+than)/gi,
  },
  {
    id: "price-in-words",
    cr: "CR-03", cls: "OWNER_REQUIRED", redact: false,
    why: "จำนวนเงินที่เขียนเป็นตัวหนังสือก็คือราคา ต้องมาจากราคา ACS พร้อมวันที่มีผล",
    re: /(?:หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ|ยี่|ร้อย|พัน|หมื่น|แสน|ล้าน)+\s*บาท/g,
  },
  {
    id: "price-promo",
    cr: "CR-03", cls: "OWNER_REQUIRED", redact: false,
    why: "ราคาโปรโมชัน/ส่วนลด/เงื่อนไขผ่อน ต้องมีเอกสารยืนยันพร้อมช่วงเวลาที่มีผล",
    re: /(?:ราคาพิเศษ|ลดราคา|ลดทันที|ส่วนลด|โปรโมชั่?น|ฟรีดาวน์|ผ่อน\s*\d+\s*%?[^\n.·]{0,16}|discount|special\s+offer|promotion|instal?lment)/gi,
  },
  {
    id: "price-scope",
    cr: "CR-03", cls: "OWNER_REQUIRED", redact: false,
    why: "ขอบเขตราคา (VAT / ค่าติดตั้ง / ค่าขนส่ง) เป็นส่วนหนึ่งของราคา ต้องมาจากเอกสารเดียวกัน",
    re: /(?:(?:ไม่)?รวม\s*(?:VAT|ภาษี|ค่าติดตั้ง|ค่าขนส่ง|ค่าจัดส่ง)|ex(?:cl)?\.?\s*VAT|incl?\.?\s*VAT|plus\s+VAT)/gi,
  },
  {
    id: "ranking",
    cr: "CR-04", cls: "BLOCKED", redact: false,
    why: "ห้ามจัดอันดับยี่ห้อ ให้ใช้เกณฑ์ตัดสินใจแทน (Owner decision Queue #17)",
    re: /(?:(?:ดี|ใหญ่|เร็ว|แรง|ถูก|ครบ|คุ้ม|แนะนำ|เยอะ|มาก)ที่สุด|อันดับ\s*(?:1|หนึ่ง)|เบอร์หนึ่ง|ชั้นนำ|รายใหญ่(?:ที่สุด)?|ยี่ห้อไหนดี|\bbest\b|\b#1\b|number\s+one|\bleading\b|\blargest\b|\bcheapest\b|top\s*pick)/gi,
  },
  {
    id: "guarantee",
    cr: "CR-04", cls: "BLOCKED", redact: false,
    why: "คำรับประกันผลลัพธ์",
    re: /(?:รับประกันผล|การันตี|guarantee[sd]?|assured\s+results?)/gi,
  },
];

/**
 * Governance files quote the claims they govern, so scanning them reports the register
 * against itself. They are skipped by name when a directory is scanned; pass a file
 * explicitly, or --all, to scan one anyway.
 */
const GOVERNANCE_FILES = new Set([
  "claim_register.md", "package_status.json", "audit.json", "brief.md",
  "REVISION_SPEC.md", "EXECUTION_RUNBOOK.md", "INTENT_MAP.md", "README.md",
]);
const GOVERNANCE_PATTERNS = [/evidence.*\.json$/i, /^\d\d_.*\.md$/];

function isGovernance(file) {
  const name = basename(file);
  return GOVERNANCE_FILES.has(name) || GOVERNANCE_PATTERNS.some((re) => re.test(name));
}

function collect(target, out = [], { explicit = false, all = false } = {}) {
  const st = statSync(target);
  if (st.isDirectory()) {
    for (const entry of readdirSync(target)) collect(join(target, entry), out, { all });
    return out;
  }
  if (![".md", ".markdown", ".txt", ".json", ".jsonld", ".html", ".htm"].includes(extname(target))) return out;
  if (!explicit && !all && isGovernance(target)) return out;
  out.push(target);
  return out;
}

function scanText(text) {
  const lines = text.split("\n");
  const findings = [];
  lines.forEach((line, i) => {
    // A line already redacted is not re-reported.
    if (line.includes("⟦ลบตัวเลข")) return;
    const raw = [];
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      for (const m of line.matchAll(rule.re)) {
        raw.push({
          line: i + 1, start: m.index, end: m.index + m[0].length, column: m.index + 1,
          match: m[0].trim(), rule: rule.id, cr: rule.cr, cls: rule.cls,
          redactable: rule.redact, why: rule.why, context: line.trim().slice(0, 160),
        });
      }
    }
    // One figure can trip several rules. Report the widest span once and carry the
    // other CR rows on it, so the writer sees every register row that applies.
    raw.sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.start - b.start);
    const kept = [];
    for (const f of raw) {
      const covering = kept.find((k) => f.start >= k.start && f.end <= k.end);
      if (covering) {
        if (!covering.alsoMatches.some((x) => x.rule === f.rule)) {
          covering.alsoMatches.push({ rule: f.rule, cr: f.cr, cls: f.cls });
        }
        if (f.cls === "BLOCKED") covering.cls = "BLOCKED";
        continue;
      }
      kept.push({ ...f, alsoMatches: [] });
    }
    kept.sort((a, b) => a.start - b.start);
    findings.push(...kept);
  });
  return findings;
}

function redact(text) {
  let changed = 0;
  const out = text.split("\n").map((line) => {
    if (line.includes("⟦ลบตัวเลข")) return line;
    let next = line;
    for (const rule of RULES) {
      if (!rule.redact) continue;
      rule.re.lastIndex = 0;
      next = next.replace(rule.re, () => { changed += 1; return MARKER(rule.cr); });
    }
    return next;
  }).join("\n");
  return { text: out, changed };
}

const args = process.argv.slice(2);
const fix = args.includes("--fix");
const asJson = args.includes("--json");
// Default CI gate is BLOCKED only. --strict also fails on EVIDENCE_REQUIRED, which is
// what a package claiming material or environment performance needs once its datasheet
// citations are supposed to be in place.
const strict = args.includes("--strict");
// Governance files are skipped when a directory is scanned; --all includes them.
const scanAll = args.includes("--all");
const targets = args.filter((a) => !a.startsWith("--"));

if (!targets.length) {
  console.error("usage: node claim-scan.mjs <file|dir> [...] [--fix] [--json]");
  process.exit(2);
}

const report = [];
for (const target of targets) {
  const explicit = statSync(target).isFile();
  for (const file of collect(target, [], { explicit, all: scanAll })) {
    const original = readFileSync(file, "utf8");
    const findings = scanText(original);
    if (fix) {
      const { text, changed } = redact(original);
      if (changed) writeFileSync(file, text, "utf8");
      report.push({ file, findings, redacted: changed });
    } else {
      report.push({ file, findings, redacted: 0 });
    }
  }
}

if (asJson) {
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), mode: fix ? "fix" : "report", files: report }, null, 2));
} else {
  const tally = { BLOCKED: 0, EVIDENCE_REQUIRED: 0, OWNER_REQUIRED: 0 };
  for (const { file, findings, redacted } of report) {
    if (!findings.length) { console.log(`ok    ${file}`); continue; }
    console.log(`\n${file}${redacted ? `  (redacted ${redacted})` : ""}`);
    for (const f of findings) {
      tally[f.cls] = (tally[f.cls] ?? 0) + 1;
      const extraCrs = (f.alsoMatches ?? []).map((x) => x.cr).filter((cr, i, a) => cr !== f.cr && a.indexOf(cr) === i);
      const also = extraCrs.length ? ` (+${extraCrs.join(", ")})` : "";
      console.log(`  ${String(f.line).padStart(4)}:${String(f.column).padEnd(4)} ${f.cls.padEnd(15)} ${f.cr}${also}  ${JSON.stringify(f.match)}`);
      console.log(`       ${f.why}`);
    }
  }
  console.log(`\n${"-".repeat(60)}`);
  console.log(
    `BLOCKED ${tally.BLOCKED}   EVIDENCE_REQUIRED ${tally.EVIDENCE_REQUIRED}   ` +
    `OWNER_REQUIRED ${tally.OWNER_REQUIRED}   files ${report.length}`,
  );
  if (fix) console.log(`redacted ${report.reduce((a, r) => a + r.redacted, 0)} figure(s) — sentences still need a human rewrite`);
}

const failOn = strict ? ["BLOCKED", "EVIDENCE_REQUIRED"] : ["BLOCKED"];
const shouldFail = report.some((r) => r.findings.some((f) => failOn.includes(f.cls)));
process.exit(shouldFail && !fix ? 1 : 0);
