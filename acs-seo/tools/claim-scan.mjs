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
 *   node claim-scan.mjs <path> --fix            redact BLOCKED figures in place
 *   node claim-scan.mjs <path> --json           machine-readable output
 *
 * Rules come from ../01_CLAIM_REGISTER.md. Adding a rule here without adding the CR row
 * there is a bug: the register is the source of truth.
 */
import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";

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
    id: "price",
    cr: "CR-03", cls: "OWNER_REQUIRED", redact: false,
    why: "ราคาต้องมาจากราคา ACS พร้อมวันที่มีผล (Owner decision Queue #16/#18)",
    re: /(?:฿\s*\d[\d,]*|\d[\d,]*\s*(?:บาท|THB|baht)|เริ่มต้นที่\s*\d[\d,]*|starting\s*(?:from|at)\s*[\d,]+)/gi,
  },
  {
    id: "ranking",
    cr: "CR-04", cls: "BLOCKED", redact: false,
    why: "ห้ามจัดอันดับยี่ห้อ ให้ใช้เกณฑ์ตัดสินใจแทน (Owner decision Queue #17)",
    re: /(?:ดีที่สุด|อันดับ\s*(?:1|หนึ่ง)|เบอร์หนึ่ง|ชั้นนำ|ถูกที่สุด|คุ้มที่สุด|แนะนำที่สุด|ยี่ห้อไหนดี|\bbest\b|\b#1\b|number\s+one|\bleading\b|\bcheapest\b|top\s*pick)/gi,
  },
  {
    id: "guarantee",
    cr: "CR-04", cls: "BLOCKED", redact: false,
    why: "คำรับประกันผลลัพธ์",
    re: /(?:รับประกันผล|การันตี|guarantee[sd]?|assured\s+results?)/gi,
  },
];

function collect(target, out = []) {
  const st = statSync(target);
  if (st.isDirectory()) {
    for (const entry of readdirSync(target)) collect(join(target, entry), out);
  } else if ([".md", ".markdown", ".txt", ".json", ".jsonld"].includes(extname(target))) {
    out.push(target);
  }
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
const targets = args.filter((a) => !a.startsWith("--"));

if (!targets.length) {
  console.error("usage: node claim-scan.mjs <file|dir> [...] [--fix] [--json]");
  process.exit(2);
}

const report = [];
for (const target of targets) {
  for (const file of collect(target)) {
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
  let blocked = 0, owner = 0;
  for (const { file, findings, redacted } of report) {
    if (!findings.length) { console.log(`ok    ${file}`); continue; }
    console.log(`\n${file}${redacted ? `  (redacted ${redacted})` : ""}`);
    for (const f of findings) {
      if (f.cls === "BLOCKED") blocked += 1; else owner += 1;
      const extraCrs = (f.alsoMatches ?? []).map((x) => x.cr).filter((cr, i, a) => cr !== f.cr && a.indexOf(cr) === i);
      const also = extraCrs.length ? ` (+${extraCrs.join(", ")})` : "";
      console.log(`  ${String(f.line).padStart(4)}:${String(f.column).padEnd(4)} ${f.cls.padEnd(15)} ${f.cr}${also}  ${JSON.stringify(f.match)}`);
      console.log(`       ${f.why}`);
    }
  }
  console.log(`\n${"-".repeat(60)}`);
  console.log(`BLOCKED ${blocked}   OWNER_REQUIRED ${owner}   files ${report.length}`);
  if (fix) console.log(`redacted ${report.reduce((a, r) => a + r.redacted, 0)} figure(s) — sentences still need a human rewrite`);
}

process.exit(report.some((r) => r.findings.some((f) => f.cls === "BLOCKED")) && !fix ? 1 : 0);
