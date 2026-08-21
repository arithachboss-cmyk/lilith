const targetBriefs = [
  {
    title: "Executive residence",
    area: "Phrom Phong / Thong Lo / Ekkamai",
    price: 85000,
    details: "2 bedrooms · 70-110 sqm · work-from-home space · 12-month lease",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=82",
    meta: ["BTS access", "Move-in ready", "Bilingual contract support"],
  },
  {
    title: "Family home",
    area: "Sathorn / Rama 3 / school corridors",
    price: 150000,
    details: "3-4 bedrooms · family layout · parking · school-run friendly",
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=900&q=82",
    meta: ["International school access", "Pet options", "Maid room"],
  },
  {
    title: "Prime luxury condo",
    area: "Langsuan / Wireless / Chidlom",
    price: 250000,
    details: "3 bedrooms or penthouse · concierge standard · private viewing",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=82",
    meta: ["CBD", "Premium facilities", "Corporate lease ready"],
  },
  {
    title: "Riverside residence",
    area: "Charoen Nakhon / Riverside / Sathorn",
    price: 120000,
    details: "2-3 bedrooms · river or skyline view · generous living area",
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=82",
    meta: ["Family layout", "Parking", "Coordinated viewing route"],
  },
];

const formatter = new Intl.NumberFormat("th-TH");
const listingList = document.querySelector("#listingList");
const matchCount = document.querySelector("#matchCount");
const filters = document.querySelector("#filters");
const budgetInput = document.querySelector("#budgetInput");
const areaInput = document.querySelector("#areaInput");
const generateLeadPlan = document.querySelector("#generateLeadPlan");
const leadConsole = document.querySelector("#leadConsole");
const leadForm = document.querySelector("#leadForm");
const leadTable = document.querySelector("#leadTable");
const hotLeadCount = document.querySelector("#hotLeadCount");
const loadSeedLeads = document.querySelector("#loadSeedLeads");
const clearLeads = document.querySelector("#clearLeads");
const exportLeads = document.querySelector("#exportLeads");
const scriptBox = document.querySelector("#scriptBox");
const buildCampaign = document.querySelector("#buildCampaign");
const campaignChannel = document.querySelector("#campaignChannel");
const renterPersona = document.querySelector("#renterPersona");
const campaignOffer = document.querySelector("#campaignOffer");
const campaignOutput = document.querySelector("#campaignOutput");
const leadStages = [
  "New inquiry",
  "Qualified",
  "Shortlist sent",
  "Viewing booked",
  "Offer submitted",
  "Deposit pending",
  "Won",
  "Lost",
];

const seedLeads = [
  {
    name: "Ms. Maya",
    contact: "maya@example.com",
    source: "Corporate HR / relocation",
    budget: 120000,
    area: "Phrom Phong",
    propertyType: "Condo",
    bedrooms: 2,
    moveDate: "2026-09-15",
    viewingWindow: "วันธรรมดา",
    contractTerm: "12 months",
    preferredLanguage: "English",
    pets: "ไม่มี",
    requirements: "Walkable to BTS, quiet unit, home office",
    stage: "Qualified",
    example: true,
  },
  {
    name: "คุณภัทร",
    contact: "@sample-line",
    source: "Referral partner",
    budget: 200000,
    area: "Sathorn",
    propertyType: "House",
    bedrooms: 4,
    moveDate: "2026-10-01",
    viewingWindow: "เสาร์-อาทิตย์",
    contractTerm: "12 months",
    preferredLanguage: "ไทย",
    pets: "มีสุนัข",
    requirements: "ใกล้โรงเรียนนานาชาติ มีสนามและที่จอดรถ 2 คัน",
    stage: "Viewing booked",
    example: true,
  },
];

let leads = JSON.parse(localStorage.getItem("lilithPremiumLeads") || "[]");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function saveLeads() {
  localStorage.setItem("lilithPremiumLeads", JSON.stringify(leads));
}

function inTargetRange(lead) {
  const budget = Number(lead.budget);
  return budget >= 50000 && budget <= 250000;
}

function targetLeads() {
  return leads.filter(inTargetRange);
}

async function loadServerLeads() {
  try {
    const response = await fetch("/api/leads", { headers: { Accept: "application/json" } });
    if (!response.ok) return;
    const payload = await response.json();
    if (!Array.isArray(payload.leads)) return;
    const examples = leads.filter((lead) => lead.example);
    leads = [...payload.leads, ...examples];
    saveLeads();
    renderLeads();
  } catch {
    return;
  }
}

async function addLead(lead) {
  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(lead),
    });
    if (!response.ok) throw new Error("Lead save failed");
    await loadServerLeads();
    return true;
  } catch {
    leadConsole.innerHTML = `
      <strong>ยังบันทึก lead ไม่สำเร็จ</strong>
      <span>ตรวจการเชื่อมต่อแล้วลองอีกครั้ง ข้อมูลยังคงอยู่ในฟอร์มเพื่อให้ส่งใหม่ได้</span>
    `;
    return false;
  }
}

function urgencyScore(lead) {
  const stageScore = {
    "Deposit pending": 46,
    "Offer submitted": 40,
    "Viewing booked": 34,
    "Shortlist sent": 27,
    Qualified: 22,
    "New inquiry": 12,
    Won: 0,
    Lost: -20,
  };
  const budgetScore = Math.min(Math.round(Number(lead.budget) / 10000), 25);
  const completenessScore =
    [lead.contact, lead.propertyType, lead.bedrooms, lead.moveDate, lead.viewingWindow].filter(Boolean)
      .length * 3;
  const daysUntilMove = lead.moveDate
    ? Math.ceil((new Date(lead.moveDate) - new Date()) / 86400000)
    : 30;
  const moveScore = daysUntilMove <= 14 ? 20 : daysUntilMove <= 30 ? 14 : 7;
  const followUpTime = lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).getTime() : null;
  const followUpScore = followUpTime && followUpTime <= Date.now() ? 12 : 0;
  return (stageScore[lead.stage] ?? 10) + budgetScore + completenessScore + moveScore + followUpScore;
}

function viewingWindowText(lead) {
  return lead.viewingWindow || "ยังไม่ระบุเวลานัดชม";
}

function nextAction(lead) {
  const viewingCue = lead.viewingWindow ? ` (${lead.viewingWindow})` : "";
  if (lead.stage === "Won") return "ยืนยันสัญญา วันเข้าอยู่ และเอกสารรับมอบ";
  if (lead.stage === "Lost") return "บันทึกเหตุผลที่ไม่ปิดดีล แล้วหยุด follow-up";
  if (lead.stage === "Deposit pending") return "ส่งยอดจอง เอกสาร และกำหนดเวลามัดจำ";
  if (lead.stage === "Offer submitted") return "ตามผลข้อเสนอและเตรียมเอกสารสัญญา 12 เดือน";
  if (lead.stage === "Viewing booked") return `ยืนยันนัด${viewingCue} ส่ง route รูป และค่าแรกเข้า`;
  if (lead.stage === "Shortlist sent") return `ถาม feedback แล้วปิดเวลานัดชม${viewingCue}`;
  if (lead.stage === "Qualified") return "ส่ง Private Shortlist 3-5 ตัวเลือกที่ต่างกันชัดเจน";
  return "โทรหรือ LINE ภายใน 15 นาทีเพื่อยืนยันโจทย์และสัญญา 1 ปี";
}

function stageOptions(selectedStage) {
  return leadStages
    .map(
      (stage) =>
        `<option${stage === selectedStage ? " selected" : ""}>${escapeHtml(stage)}</option>`,
    )
    .join("");
}

function dateTimeLocalValue(value) {
  if (!value) return "";
  return String(value).slice(0, 16).replace(" ", "T");
}

function primarySource(source) {
  return String(source || "Unknown").split("/")[0].trim();
}

function countBy(items, mapper) {
  return items.reduce((counts, item) => {
    const key = mapper(item);
    counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map());
}

function topEntries(counts) {
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
}

function summaryPills(entries) {
  if (!entries.length) return "<span>No qualified data yet</span>";
  return entries.map(([label, count]) => `<span>${escapeHtml(label)} · ${count}</span>`).join("");
}

function renderAcquisitionSummary(ranked) {
  let summary = document.querySelector("#sourceSummary");
  if (!summary) {
    summary = document.createElement("section");
    summary.id = "sourceSummary";
    summary.className = "source-summary";
    leadTable.after(summary);
  }

  const sourceEntries = topEntries(countBy(ranked, (lead) => primarySource(lead.source)));
  const areaEntries = topEntries(countBy(ranked, (lead) => lead.area || "Unknown"));
  const topSource = sourceEntries[0]?.[0] || "ช่องทางแรก";
  const topArea = areaEntries[0]?.[0] || "ทำเลเป้าหมาย";

  summary.innerHTML = `
    <div>
      <strong>Top sources</strong>
      <div class="summary-pills">${summaryPills(sourceEntries)}</div>
    </div>
    <div>
      <strong>Top demand areas</strong>
      <div class="summary-pills">${summaryPills(areaEntries)}</div>
    </div>
    <p>Next push: ยิงซ้ำ ${escapeHtml(topSource)} ด้วยข้อเสนอสำหรับ ${escapeHtml(topArea)} และสัญญา 12 เดือน</p>
  `;
}

function csvValue(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv() {
  const exportable = targetLeads().filter((lead) => !lead.example);
  if (!exportable.length) return;
  const headers = [
    "name",
    "contact",
    "source",
    "budget",
    "area",
    "propertyType",
    "bedrooms",
    "moveDate",
    "viewingWindow",
    "contractTerm",
    "preferredLanguage",
    "pets",
    "requirements",
    "stage",
    "nextFollowUpAt",
    "updatedAt",
    "createdAt",
    "priorityScore",
    "nextAction",
  ];
  const rows = exportable.map((lead) =>
    [
      lead.name,
      lead.contact,
      lead.source,
      lead.budget,
      lead.area,
      lead.propertyType,
      lead.bedrooms,
      lead.moveDate,
      lead.viewingWindow,
      lead.contractTerm,
      lead.preferredLanguage,
      lead.pets,
      lead.requirements,
      lead.stage,
      lead.nextFollowUpAt,
      lead.updatedAt,
      lead.createdAt,
      urgencyScore(lead),
      nextAction(lead),
    ]
      .map(csvValue)
      .join(","),
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lilith-premium-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function renderLeads() {
  const ranked = targetLeads().sort((a, b) => urgencyScore(b) - urgencyScore(a));
  const hotLeads = ranked.filter(
    (lead) => urgencyScore(lead) >= 70 && !lead.example && !["Won", "Lost"].includes(lead.stage),
  );
  hotLeadCount.textContent = String(hotLeads.length);
  exportLeads.disabled = !ranked.some((lead) => !lead.example);

  if (!ranked.length) {
    leadTable.innerHTML = `
      <div class="empty-state">
        <strong>ยังไม่มีลูกค้างบ ฿50K–฿250K</strong>
        <span>เปิด public form หรือสร้าง campaign ด้านล่าง แล้วตอบ brief แรกภายใน 15 นาที</span>
      </div>
    `;
    renderAcquisitionSummary([]);
    return;
  }

  leadTable.innerHTML = ranked
    .map(
      (lead, index) => `
        <article class="lead-row${lead.example ? " example-lead" : ""}">
          <div>
            <strong>${escapeHtml(lead.name)}${lead.example ? " · EXAMPLE" : ""}</strong>
            <span>${escapeHtml(lead.contact || "No contact")} · ${escapeHtml(lead.source)}</span>
            <span>${escapeHtml(lead.area)} · ${escapeHtml(lead.propertyType || "Property")} · ${escapeHtml(lead.bedrooms || "?")} bed · ฿${formatter.format(Number(lead.budget))}</span>
            <span>${escapeHtml(viewingWindowText(lead))} · ${escapeHtml(lead.contractTerm || "Contract unconfirmed")} · ${escapeHtml(lead.pets || "Pets not stated")}</span>
          </div>
          <div>
            <span class="stage-pill">${escapeHtml(lead.stage)}</span>
            <span class="score-pill">${urgencyScore(lead)} priority</span>
          </div>
          ${lead.requirements ? `<p>${escapeHtml(lead.requirements)}</p>` : ""}
          <p>${escapeHtml(nextAction(lead))}</p>
          <div class="lead-actions">
            <button type="button" data-script-index="${index}">Build reply</button>
            ${
              lead.example || !lead.id
                ? ""
                : `
                  <label>
                    Stage
                    <select data-stage-id="${lead.id}" aria-label="Stage for ${escapeHtml(lead.name)}">
                      ${stageOptions(lead.stage)}
                    </select>
                  </label>
                  <label>
                    Next follow-up
                    <input data-follow-up-id="${lead.id}" type="datetime-local" value="${escapeHtml(dateTimeLocalValue(lead.nextFollowUpAt))}" aria-label="Next follow-up for ${escapeHtml(lead.name)}" />
                  </label>
                  <button type="button" data-save-id="${lead.id}">Save progress</button>
                `
            }
          </div>
        </article>
      `,
    )
    .join("");
  renderAcquisitionSummary(ranked.filter((lead) => !lead.example));
}

function renderListings() {
  const budget = Number(budgetInput.value);
  const areaTerms = areaInput.value
    .toLowerCase()
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean);

  const affordable = targetBriefs.filter((brief) => brief.price <= budget);
  const areaMatches = affordable.filter((brief) => {
    const searchable = `${brief.title} ${brief.area}`.toLowerCase();
    return areaTerms.some((term) => searchable.includes(term));
  });
  const visible = areaMatches.length ? areaMatches : affordable;

  listingList.innerHTML = visible
    .map(
      (brief) => `
        <article class="listing-card">
          <div class="listing-photo">
            <img src="${brief.image}" alt="${escapeHtml(brief.title)} interior reference" />
            <span class="badge">Campaign brief</span>
          </div>
          <div class="listing-body">
            <div class="listing-title">
              <div>
                <h4>${escapeHtml(brief.title)}</h4>
                <p>${escapeHtml(brief.area)}</p>
              </div>
              <div class="price">to ฿${formatter.format(brief.price)}</div>
            </div>
            <p>${escapeHtml(brief.details)}</p>
            <div class="listing-meta">
              ${brief.meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
            </div>
          </div>
        </article>
      `,
    )
    .join("");

  matchCount.textContent = String(visible.length);
}

function campaignTemplate() {
  const budget = formatter.format(Number(budgetInput.value));
  const anchors = areaInput.value || "prime Bangkok areas";
  const channel = campaignChannel.value;
  const persona = renterPersona.value;
  const offer = campaignOffer.value || "private shortlist and coordinated viewing route";
  const leadTarget = document.querySelector("#leadGoal").value;
  const channelConfig = {
    "Expat community post": {
      source: "expat_community",
      content: "executive_long_stay",
      copy: `Relocating to Bangkok? Lilith Homes curates condos and houses in ${anchors} for ${persona}. Monthly budget ฿50,000-฿${budget}, 12-month lease. Share your brief to receive a ${offer}.`,
      actions: [
        "Post in one relevant expat or neighborhood community with a clear area and budget",
        "Answer in English and confirm employer, move date, bedrooms and lease term",
        "Send 3-5 meaningfully different options before asking for a viewing slot",
      ],
    },
    "Corporate HR / relocation outreach": {
      source: "corporate_relocation",
      content: "hr_partner",
      copy: `Lilith Homes supports Bangkok relocation briefs for ${persona}. We coordinate 12-month residences in ${anchors} from ฿50,000 to ฿${budget} per month, with curated comparisons, viewing routes and contract support. Submit the employee brief here:`,
      actions: [
        "Send to HR, mobility and relocation contacts with one concrete service promise",
        "Ask for policy budget, family size, office or school anchor and target move date",
        "Provide one consolidated comparison instead of forwarding raw listing links",
      ],
    },
    "Facebook premium rental group": {
      source: "facebook_premium_group",
      content: "premium_12m",
      copy: `กำลังหา ${persona} เช่าโซน ${anchors} อยู่ไหมคะ? งบ ฿50,000–฿${budget}/เดือน สัญญา 1 ปี ทีม Lilith ช่วยทำ ${offer} พร้อมเทียบค่าแรกเข้าและจัดนัดชมให้เป็นชุด ส่งโจทย์ได้ที่:`,
      actions: [
        "ใช้ภาพทรัพย์จริงและระบุทำเล จำนวนห้องนอน งบ และสัญญา 1 ปีในบรรทัดแรก",
        "โพสต์เฉพาะกลุ่มที่อนุญาต agent หรือ service post",
        "ตอบคอมเมนต์ด้วยลิงก์ที่ติด UTM และตามต่อภายใน 15 นาที",
      ],
    },
    "Property portal refresh": {
      source: "property_portal",
      content: "premium_listing",
      copy: `Premium Bangkok residence for a 12-month lease in ${anchors}. Suitable for ${persona}, with a monthly budget up to ฿${budget}. Request a private comparison and coordinated viewing route:`,
      actions: [
        "Refresh only verified available inventory with current price and minimum term",
        "Lead with project, bedrooms, usable area, exact rent and nearest anchor",
        "Route every inquiry into the same qualification form before building a shortlist",
      ],
    },
    "Referral partner push": {
      source: "referral_partner",
      content: "premium_tenant_referral",
      copy: `มีลูกค้ามองหาบ้านหรือคอนโดกรุงเทพ งบ ฿50,000–฿${budget}/เดือน สัญญา 1 ปี โซน ${anchors} ฝาก brief ให้ Lilith ช่วยคัด ${offer} และประสานนัดชมได้ที่:`,
      actions: [
        "ส่งให้ agent, owner representative และ relocation partner ที่เคยร่วมงาน",
        "ตกลงขอบเขตการแบ่งงานหรือค่าตอบแทนก่อนส่งข้อมูลลูกค้า",
        "อัปเดตสถานะ shortlist, viewing และ offer ให้ผู้แนะนำทราบตามสมควร",
      ],
    },
  };
  const config = channelConfig[channel];
  const link = `${window.location.origin}/?utm_source=${config.source}&utm_campaign=premium_12m&utm_content=${config.content}`;

  return {
    post: `${config.copy}\n${link}`,
    actions: config.actions,
    target: `${channel} · ${leadTarget}`,
    link,
  };
}

function renderCampaign() {
  const campaign = campaignTemplate();
  campaignOutput.innerHTML = `
    <section>
      <h4>Post copy</h4>
      <p>${escapeHtml(campaign.post)}</p>
      <button class="secondary-action" type="button" id="copyCampaign">Copy campaign</button>
    </section>
    <section>
      <h4>Daily actions</h4>
      <ul>
        ${campaign.actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}
      </ul>
      <span>${escapeHtml(campaign.target)}</span>
    </section>
  `;
}

filters.addEventListener("submit", (event) => {
  event.preventDefault();
  renderListings();
});

budgetInput.addEventListener("change", renderListings);
areaInput.addEventListener("input", renderListings);

generateLeadPlan.addEventListener("click", () => {
  const qualified = targetLeads().filter((lead) => !lead.example);
  const newLeads = qualified.filter((lead) => lead.stage === "New inquiry").length;
  const viewingReady = qualified.filter((lead) =>
    ["Shortlist sent", "Viewing booked"].includes(lead.stage),
  ).length;
  const campaign = campaignTemplate();
  leadConsole.innerHTML = `
    <strong>Today's premium lead plan</strong>
    <span>1) ตอบ new inquiry ${newLeads} รายภายใน 15 นาที 2) ดัน ${viewingReady} รายให้เลือกเวลานัดชม 3) ปล่อย ${escapeHtml(campaign.target)} ด้วยลิงก์ที่ติดตาม source แล้ว 4) ทุกคนต้องยืนยันงบ ฿50K–฿250K และสัญญา 12 เดือนก่อนส่ง shortlist</span>
  `;
});

leadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = leadForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Saving...";

  const saved = await addLead({
    name: document.querySelector("#leadName").value.trim(),
    contact: document.querySelector("#leadContact").value.trim(),
    source: document.querySelector("#leadSource").value,
    budget: Number(document.querySelector("#leadBudget").value),
    area: document.querySelector("#leadArea").value.trim(),
    propertyType: document.querySelector("#leadPropertyType").value,
    bedrooms: Number(document.querySelector("#leadBedrooms").value),
    moveDate: document.querySelector("#moveDate").value,
    viewingWindow: document.querySelector("#leadViewingWindow").value,
    contractTerm: "12 months",
    preferredLanguage: document.querySelector("#leadLanguage").value,
    pets: document.querySelector("#leadPets").value,
    requirements: document.querySelector("#leadRequirements").value.trim(),
    consent: true,
    stage: document.querySelector("#leadStage").value,
  });

  if (saved) {
    leadForm.reset();
    document.querySelector("#leadBudget").value = "100000";
    document.querySelector("#leadArea").value = "Phrom Phong";
    document.querySelector("#leadPropertyType").value = "Condo";
    document.querySelector("#leadBedrooms").value = "2";
    leadConsole.innerHTML = `
      <strong>Lead saved</strong>
      <span>ข้อมูลเข้าคิวแล้ว ขั้นต่อไปคือยืนยันโจทย์และส่ง Private Shortlist ภายในเวลาที่ตกลงกับลูกค้า</span>
    `;
  }

  submitButton.disabled = false;
  submitButton.textContent = "Add qualified lead";
});

leadTable.addEventListener("click", async (event) => {
  const saveButton = event.target.closest("[data-save-id]");
  if (saveButton) {
    const id = Number(saveButton.dataset.saveId);
    const stage = leadTable.querySelector(`[data-stage-id="${id}"]`).value;
    const nextFollowUpAt = leadTable.querySelector(`[data-follow-up-id="${id}"]`).value || null;
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
      const response = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id, stage, nextFollowUpAt }),
      });
      if (!response.ok) throw new Error("Progress update failed");
      await loadServerLeads();
      leadConsole.innerHTML = `
        <strong>Progress saved</strong>
        <span>Lead #${id} เปลี่ยนเป็น ${escapeHtml(stage)} และบันทึกเวลาติดตามครั้งถัดไปแล้ว</span>
      `;
    } catch {
      saveButton.disabled = false;
      saveButton.textContent = "Save progress";
      leadConsole.innerHTML = `
        <strong>ยังบันทึก progress ไม่สำเร็จ</strong>
        <span>ข้อมูลเดิมยังอยู่ครบ กรุณาตรวจการเชื่อมต่อแล้วลองอีกครั้ง</span>
      `;
    }
    return;
  }

  const scriptButton = event.target.closest("[data-script-index]");
  if (!scriptButton) return;
  const ranked = targetLeads().sort((a, b) => urgencyScore(b) - urgencyScore(a));
  const lead = ranked[Number(scriptButton.dataset.scriptIndex)];
  const details = `${lead.propertyType || "home"}, ${lead.bedrooms || "?"} bedroom(s), ${lead.area}, up to ฿${formatter.format(Number(lead.budget))}/month`;
  const english = String(lead.preferredLanguage).includes("English");
  const reply = english
    ? `Hi ${lead.name}, thank you for your 12-month Bangkok rental brief. I have ${details}. Before I prepare your private shortlist, may I confirm your move-in date, must-have requirements and whether ${viewingWindowText(lead)} still works for a viewing?`
    : `สวัสดีค่ะ ${lead.name} ทีมได้รับโจทย์เช่าสัญญา 1 ปีแล้วนะคะ: ${details} ก่อนคัด Private Shortlist ขอขอยืนยันวันเข้าอยู่ เงื่อนไขที่ต้องมี และยังสะดวกนัดชม ${viewingWindowText(lead)} อยู่ไหมคะ`;
  scriptBox.innerHTML = `
    <strong>Reply for ${escapeHtml(lead.name)}</strong>
    <p>${escapeHtml(reply)}</p>
  `;
});

exportLeads.addEventListener("click", downloadCsv);

loadSeedLeads.addEventListener("click", () => {
  leads = [...leads.filter((lead) => !lead.example), ...seedLeads];
  saveLeads();
  renderLeads();
});

clearLeads.addEventListener("click", async () => {
  leads = leads.filter((lead) => !lead.example);
  saveLeads();
  renderLeads();
  clearLeads.disabled = true;
  clearLeads.textContent = "Cleaning...";
  try {
    const response = await fetch("/api/leads?scope=tests", { method: "DELETE" });
    if (!response.ok) throw new Error("Cleanup failed");
    const payload = await response.json();
    await loadServerLeads();
    leadConsole.innerHTML = `
      <strong>Test data cleaned</strong>
      <span>ลบข้อมูลทดสอบจากฐานข้อมูล ${Number(payload.deleted || 0)} รายการ โดยไม่แตะลูกค้าจริง</span>
    `;
  } catch {
    leadConsole.innerHTML = `
      <strong>ลบตัวอย่างในเครื่องแล้ว</strong>
      <span>ยังล้าง test lead บน server ไม่สำเร็จ กรุณาลองใหม่หลังเชื่อมต่อ dashboard</span>
    `;
  } finally {
    clearLeads.disabled = false;
    clearLeads.textContent = "Remove tests/examples";
  }
});

buildCampaign.addEventListener("click", renderCampaign);

campaignOutput.addEventListener("click", async (event) => {
  if (event.target.id !== "copyCampaign") return;
  const campaign = campaignTemplate();
  try {
    await navigator.clipboard.writeText(campaign.post);
    event.target.textContent = "Copied";
  } catch {
    event.target.textContent = "Select text above";
  }
});

renderListings();
renderLeads();
loadServerLeads();
