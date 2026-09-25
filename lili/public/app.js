/**
 * Lili prototype UI.
 *
 * Presentation only: it renders what the server says and never decides permission.
 * The submit button reflects `readiness.canSubmit` from the server; the server
 * re-checks anyway, so a tampered button changes nothing.
 */

const UI = {
  th: {
    tagline: "ผู้ช่วย AI สำหรับผู้เช่าและโคเอเจนต์",
    tabTenant: "ผู้เช่า", tabCoagent: "โคเอเจนต์", tabTeam: "คิวทีม",
    chatTitle: "คุยกับ Lili", summaryTitle: "ใบสรุปความต้องการ", statusLabel: "สถานะ",
    reviewLabel: "ยืนยันว่าข้อมูลถูกต้องแล้ว", submit: "ส่งให้ทีม", send: "ส่ง",
    queueTitle: "คิวทีมประสานงาน",
    queueSub: "ทุกแถวคือ “คำขอ” ที่รอทีมตรวจ ไม่ใช่การนัดหมายที่ยืนยันแล้ว",
    thRef: "อ้างอิง", thFlow: "ที่มา", thSummary: "สรุป", thStatus: "สถานะ", thAction: "การทำงาน",
    placeholder: "พิมพ์ความต้องการหรือคำถามของคุณ…",
    missing: "ยังขาดข้อมูล", blockers: "ติดเงื่อนไข", flags: "ต้องให้ทีมตรวจ",
    consent: "ยืนยันว่าฉันมีสิทธิ์หรือได้รับความยินยอมจากลูกค้าในการส่งข้อมูลนี้",
    states: { INCOMPLETE: "ข้อมูลยังไม่ครบ", READY_FOR_TEAM_REVIEW: "พร้อมให้ทีมตรวจ", NEEDS_TEAM_HELP: "ต้องให้ทีมช่วย" },
    demoAccounts: "บัญชีสาธิต",
    foot: "ต้นแบบสำหรับทดลองเท่านั้น · ไม่มีข้อมูลห้องว่าง ราคา หรือผลงานจริงในระบบนี้ · ไม่ส่งข้อความหาลูกค้าจริง · ไม่เชื่อมเว็บไซต์หรือฐานข้อมูล production",
    draftTitle: "ร่างข้อความติดตาม (ให้ทีมส่งเอง)",
    copy: "คัดลอก", advance: "เปลี่ยนสถานะ",
  },
  en: {
    tagline: "AI assistant for tenants and co-agents",
    tabTenant: "Tenant", tabCoagent: "Co-agent", tabTeam: "Team queue",
    chatTitle: "Chat with Lili", summaryTitle: "Requirement summary", statusLabel: "Status",
    reviewLabel: "Confirm these details are correct", submit: "Send to team", send: "Send",
    queueTitle: "Coordination team queue",
    queueSub: "Every row is a request awaiting the team — not a confirmed appointment.",
    thRef: "Ref", thFlow: "Source", thSummary: "Summary", thStatus: "Status", thAction: "Actions",
    placeholder: "Type what you're looking for, or ask a question…",
    missing: "Still missing", blockers: "Blocked by", flags: "Needs a team check",
    consent: "I confirm I have the client's permission to share these details",
    states: { INCOMPLETE: "Incomplete", READY_FOR_TEAM_REVIEW: "Ready for team review", NEEDS_TEAM_HELP: "Needs team help" },
    demoAccounts: "Demo accounts",
    foot: "Prototype for testing only · No real availability, pricing or track-record data in this system · Sends nothing to real customers · Not connected to the production site or database",
    draftTitle: "Follow-up draft (for the team to send manually)",
    copy: "Copy", advance: "Change status",
  },
};

const FIELDS = {
  city: { th: "เมือง", en: "City", type: "text" },
  area: { th: "ทำเล", en: "Area", type: "text" },
  propertyType: { th: "ประเภทที่พัก", en: "Property type", type: "select", options: ["condo", "apartment", "house", "townhouse", "other"] },
  bedrooms: { th: "ห้องนอน", en: "Bedrooms", type: "number" },
  budgetMonthlyTHB: { th: "งบต่อเดือน (บาท)", en: "Monthly budget (THB)", type: "number" },
  moveInDate: { th: "วันย้ายเข้า", en: "Move-in date", type: "date" },
  leaseTermMonths: { th: "ระยะเช่า (เดือน)", en: "Lease term (months)", type: "number" },
  occupants: { th: "จำนวนผู้พัก", en: "Occupants", type: "number" },
  pets: { th: "สัตว์เลี้ยง", en: "Pets", type: "select", options: ["none", "cat", "dog", "other"] },
};

const TOKENS = {
  tenant: [["demo-tenant", "Tenant"]],
  coagent: [["demo-agent-active", "active"], ["demo-agent-pending", "pending"], ["demo-agent-suspended", "suspended"], ["demo-agent-rejected", "rejected"]],
  team: [["demo-team", "Team"]],
};

const state = { lang: "th", tab: "tenant", token: "demo-tenant", user: null, convo: null, status: null };
const $ = (id) => document.getElementById(id);
const T = () => UI[state.lang];

async function api(path, { method = "GET", body, token = state.token, headers = {} } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function applyStaticText() {
  for (const el of document.querySelectorAll("[data-i18n]")) {
    const v = T()[el.dataset.i18n];
    if (v) el.textContent = v;
  }
  $("chatInput").placeholder = T().placeholder;
  $("footNote").textContent = T().foot;
  $("langToggle").textContent = state.lang === "th" ? "EN" : "ไทย";
  document.documentElement.lang = state.lang;
}

function renderMode() {
  const s = state.status;
  if (!s) return;
  const badge = $("modeBadge");
  badge.textContent = s.modeLabel[state.lang];
  badge.className = `badge mode-${s.mode}`;
  $("disclosureBadge").textContent = s.disclosure[state.lang];
  $("demoNotice").innerHTML =
    `<b>${T().demoAccounts}:</b> ` +
    Object.entries(TOKENS).map(([role, list]) =>
      list.map(([tok, label]) =>
        `<button class="ghost" data-token="${tok}" data-role="${role}" style="margin:3px 4px 0 0">${role}/${label}</button>`).join("")).join("") +
    `<div style="margin-top:8px">${state.lang === "th" ? "ยังไม่เปิดใช้งาน" : "Not live"}: ${s.notLive[state.lang].join(" · ")}</div>`;

  for (const b of $("demoNotice").querySelectorAll("button[data-token]")) {
    b.onclick = async () => {
      state.token = b.dataset.token;
      state.tab = b.dataset.role;
      state.convo = null;
      await login();
      selectTab(state.tab);
    };
  }
}

function renderChat() {
  const log = $("chatLog");
  log.innerHTML = "";
  for (const m of state.convo?.messages ?? []) {
    const div = document.createElement("div");
    div.className = `msg ${m.role}`;
    const who = document.createElement("span");
    who.className = "who";
    who.textContent = m.role === "lili" ? "Lili (AI)" : state.user?.name ?? "You";
    div.append(who, document.createTextNode(m.text));
    log.append(div);
  }
  log.scrollTop = log.scrollHeight;
}

function renderSummary() {
  const c = state.convo;
  const list = $("summaryList");
  list.innerHTML = "";
  if (!c) return;

  for (const [key, meta] of Object.entries(FIELDS)) {
    const dt = document.createElement("dt");
    dt.textContent = meta[state.lang];
    const dd = document.createElement("dd");

    let input;
    if (meta.type === "select") {
      input = document.createElement("select");
      input.append(new Option("—", ""));
      for (const o of meta.options) input.append(new Option(o, o));
    } else {
      input = document.createElement("input");
      input.type = meta.type;
    }
    input.value = c.requirement[key] ?? "";
    input.onchange = async () => {
      const raw = input.value === "" ? null : input.value;
      const value = meta.type === "number" && raw !== null ? Number(raw) : raw;
      const r = await api(`/conversations/${c.id}/requirement`, { method: "PATCH", body: { [key]: value } });
      if (r.ok) { state.convo = r.data.conversation; render(); }
    };
    dd.append(input);
    if (c.inferredFields?.includes(key)) {
      const tag = document.createElement("span");
      tag.className = "inferred";
      tag.textContent = state.lang === "th" ? "(เดาจากทำเล — แก้ได้)" : "(inferred — editable)";
      dd.append(tag);
    }
    list.append(dt, dd);
  }

  const r = c.readiness;
  const chip = $("stateChip");
  chip.textContent = T().states[r.state] ?? r.state;
  chip.className = `state ${r.state}`;

  const gaps = [];
  if (r.missing.length) gaps.push(`<div class="notice warn"><b>${T().missing}</b><ul>${r.missing.map((m) => `<li>${m.label}</li>`).join("")}</ul></div>`);
  if (r.blockers.length) gaps.push(`<div class="notice stop"><b>${T().blockers}</b><ul>${r.blockers.map((b) => `<li>${b.reason}</li>`).join("")}</ul></div>`);
  if (r.flags.length) gaps.push(`<div class="notice warn"><b>${T().flags}</b><ul>${r.flags.map((f) => `<li>${f.reason}</li>`).join("")}</ul></div>`);
  $("gapBlock").innerHTML = gaps.join("");

  $("reviewedBox").checked = Boolean(r.reviewed);
  $("submitBtn").disabled = !r.canSubmit;

  const consent = $("consentBlock");
  if (c.flow === "coagent") {
    consent.classList.remove("hidden");
    consent.innerHTML = `<label class="check"><input type="checkbox" id="consentBox" ${c.consent?.attested ? "checked" : ""}><span>${T().consent}</span></label>`;
    $("consentBox").onchange = async (e) => {
      const r2 = await api(`/conversations/${c.id}/consent`, { method: "POST", body: { attested: e.target.checked, statement: T().consent } });
      if (r2.ok) { state.convo = r2.data; render(); }
    };
  } else {
    consent.classList.add("hidden");
  }
}

async function renderQueue() {
  const r = await api("/submissions");
  const body = $("queueBody");
  body.innerHTML = "";
  for (const s of r.data.submissions ?? []) {
    const tr = document.createElement("tr");
    const req = s.requirement;
    tr.innerHTML = `
      <td><code class="ref">${s.ref}</code></td>
      <td>${s.flow}${s.agentProfile ? `<br><small>${s.agentProfile.agencyName ?? ""}</small>` : ""}<br><small>${s.submitterAccountStatus}</small></td>
      <td>${[req.city, req.area, req.propertyType, req.bedrooms !== undefined ? `${req.bedrooms} br` : null, req.budgetMonthlyTHB ? `${req.budgetMonthlyTHB.toLocaleString("en-US")} THB` : null, req.moveInDate].filter(Boolean).join(" · ")}
          ${s.flags?.length ? `<br><small style="color:#8a6d1f">⚑ ${s.flags.length}</small>` : ""}</td>
      <td>${s.status}</td>
      <td></td>`;
    const cell = tr.lastElementChild;

    if (state.user?.role === "team") {
      const sel = document.createElement("select");
      for (const st of ["REQUESTED", "IN_REVIEW", "CONTACTED", "CONFIRMED", "CLOSED"]) sel.append(new Option(st, st));
      sel.value = s.status;
      sel.onchange = async () => { await api(`/submissions/${s.id}/status`, { method: "POST", body: { status: sel.value } }); renderQueue(); };
      cell.append(sel);
    }
    const btn = document.createElement("button");
    btn.className = "ghost";
    btn.textContent = T().draftTitle;
    btn.onclick = async () => {
      const d = await api(`/submissions/${s.id}/followup?lang=${state.lang}`);
      $("followupBlock").innerHTML = `<h2 style="margin-top:18px">${T().draftTitle}</h2><div class="notice warn">${d.data.deliveryNote}</div><pre class="draft"></pre>`;
      $("followupBlock").querySelector("pre").textContent = d.data.text;
    };
    cell.append(btn);
    body.append(tr);
  }
}

function render() {
  applyStaticText();
  renderMode();
  renderChat();
  renderSummary();
  $("chatSub").textContent = state.user ? `${state.user.name} · ${state.user.role} · ${state.user.status}` : "";
}

async function login() {
  const r = await api("/session", { method: "POST", body: { token: state.token }, token: null });
  state.user = r.ok ? r.data.user : null;
}

async function ensureConversation() {
  if (state.convo || !state.user || state.user.role === "team") return;
  const r = await api("/conversations", { method: "POST", body: { flow: state.tab === "coagent" ? "coagent" : "tenant", lang: state.lang } });
  if (r.ok) state.convo = r.data;
}

async function selectTab(tab) {
  state.tab = tab;
  for (const b of document.querySelectorAll('[role="tab"]')) b.setAttribute("aria-selected", String(b.id === `tab-${tab}`));

  const wantToken = tab === "team" ? "demo-team" : tab === "coagent" ? "demo-agent-active" : "demo-tenant";
  const currentRole = state.user?.role;
  if ((tab === "team" && currentRole !== "team") || (tab === "coagent" && currentRole !== "coagent") || (tab === "tenant" && currentRole !== "tenant")) {
    state.token = wantToken;
    state.convo = null;
    await login();
  }

  $("view-chat").classList.toggle("hidden", tab === "team");
  $("view-team").classList.toggle("hidden", tab !== "team");

  if (tab === "team") { render(); await renderQueue(); }
  else { await ensureConversation(); render(); }
}

async function boot() {
  state.status = (await api("/status", { token: null })).data;
  await login();
  document.querySelectorAll('[role="tab"]').forEach((b) => { b.onclick = () => selectTab(b.id.replace("tab-", "")); });

  $("langToggle").onclick = () => { state.lang = state.lang === "th" ? "en" : "th"; state.tab === "team" ? (render(), renderQueue()) : render(); };

  $("composer").onsubmit = async (e) => {
    e.preventDefault();
    const text = $("chatInput").value.trim();
    if (!text || !state.convo) return;
    $("chatInput").value = "";
    const r = await api(`/conversations/${state.convo.id}/messages`, { method: "POST", body: { text } });
    if (r.ok) { state.convo = r.data.conversation; render(); }
  };

  $("reviewedBox").onchange = async (e) => {
    const r = await api(`/conversations/${state.convo.id}/review`, { method: "POST", body: { reviewed: e.target.checked } });
    if (r.ok) { state.convo = r.data; render(); }
  };

  $("submitBtn").onclick = async () => {
    const r = await api(`/conversations/${state.convo.id}/submit`, { method: "POST" });
    const box = $("submitResult");
    if (r.ok) {
      const s = r.data.submission;
      box.innerHTML = `<div class="notice ${r.data.duplicate ? "warn" : "info"}"><b>${s.ref}</b> · ${s.status}<br>${
        r.data.duplicate
          ? (state.lang === "th" ? "ส่งไปแล้วก่อนหน้านี้ — ไม่ส่งซ้ำ" : "Already submitted — no duplicate created")
          : (state.lang === "th" ? "เป็นคำขอที่รอทีมตรวจ ยังไม่ใช่นัดหมายที่ยืนยันแล้ว" : "A request awaiting the team — not a confirmed appointment")
      }</div>`;
      state.convo = r.data.conversation;
      render();
    } else {
      box.innerHTML = `<div class="notice stop">${r.data.error}${r.data.reason ? ` · ${r.data.reason}` : ""}</div>`;
    }
  };

  await selectTab("tenant");
}

boot();
