const targetBriefs = [
  {
    title: "Executive rental residence",
    area: "Phrom Phong / Thong Lo / Ekkamai",
    price: 85000,
    budgetPeriod: "Monthly rent",
    details: "2 bedrooms · 70-110 sqm · work-from-home space · 12-month lease",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=82",
    meta: ["BTS access", "Move-in ready", "Bilingual contract support"],
  },
  {
    title: "China buyer condo brief",
    area: "Sukhumvit / Rama 9 / Riverside",
    price: 8000000,
    budgetPeriod: "Purchase budget",
    details: "Foreign quota · rental yield story · bank transfer document support",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=82",
    meta: ["Chinese copy", "WeChat handoff", "Foreign quota check"],
  },
  {
    title: "Family home",
    area: "Sathorn / Rama 3 / school corridors",
    price: 150000,
    budgetPeriod: "Monthly rent",
    details: "3-4 bedrooms · family layout · parking · school-run friendly",
    image:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=900&q=82",
    meta: ["International school access", "Pet options", "Maid room"],
  },
  {
    title: "Russian-speaking relocation brief",
    area: "Pattaya / Phuket / Bangkok Riverside",
    price: 12000000,
    budgetPeriod: "Purchase budget",
    details: "Condo or villa search · family relocation · language-sensitive follow-up",
    image:
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=82",
    meta: ["Русский intake", "Lifestyle filters", "Partner referral"],
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
const flowReceivedCount = document.querySelector("#flowReceivedCount");
const flowQualifiedCount = document.querySelector("#flowQualifiedCount");
const flowFilteredRows = document.querySelector("#flowFilteredRows");
const loadSeedLeads = document.querySelector("#loadSeedLeads");
const clearLeads = document.querySelector("#clearLeads");
const exportLeads = document.querySelector("#exportLeads");
const scriptBox = document.querySelector("#scriptBox");
const buildCampaign = document.querySelector("#buildCampaign");
const campaignChannel = document.querySelector("#campaignChannel");
const renterPersona = document.querySelector("#renterPersona");
const campaignOffer = document.querySelector("#campaignOffer");
const campaignOutput = document.querySelector("#campaignOutput");
const leadDealIntent = document.querySelector("#leadDealIntent");
const leadBudgetPeriod = document.querySelector("#leadBudgetPeriod");
const leadBudget = document.querySelector("#leadBudget");
const leadCustomerCountry = document.querySelector("#leadCustomerCountry");
const leadLanguage = document.querySelector("#leadLanguage");
const importCsvFile = document.querySelector("#importCsvFile");
const importPayload = document.querySelector("#importPayload");
const importStatus = document.querySelector("#importStatus");
const sendImport = document.querySelector("#sendImport");
const loadImportSample = document.querySelector("#loadImportSample");

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

const importSample = `[
  {
    "name": "Ms. Li",
    "contact": "li@example.cn",
    "wechat": "li-bkk-home",
    "budget": 120000,
    "budgetPeriod": "Monthly rent",
    "dealIntent": "Rent 12-month",
    "customerCountry": "China",
    "preferredLanguage": "中文 / English",
    "area": "Phrom Phong",
    "propertyType": "Condo",
    "bedrooms": 2,
    "moveDate": "2026-10-01",
    "requirements": "Near BTS, quiet building, invoice support",
    "partnerAgency": "Shanghai Relocation Desk",
    "partnerAgent": "Agent Chen",
    "partnerContact": "chen-wechat",
    "externalId": "CN-001"
  }
]`;

const seedLeads = [
  {
    name: "Ms. Maya",
    contact: "maya@example.com",
    source: "Corporate HR / relocation",
    budget: 120000,
    budgetPeriod: "Monthly rent",
    area: "Phrom Phong",
    propertyType: "Condo",
    bedrooms: 2,
    moveDate: "2026-09-15",
    viewingWindow: "วันธรรมดา",
    contractTerm: "12 months",
    preferredLanguage: "English",
    customerCountry: "United States",
    dealIntent: "Rent 12-month",
    wechat: "",
    partnerAgency: "",
    partnerAgent: "",
    partnerContact: "",
    pets: "ไม่มี",
    requirements: "Walkable to BTS, quiet unit, home office",
    stage: "Qualified",
    example: true,
  },
  {
    name: "Ms. Li",
    contact: "li@example.cn",
    source: "China broker / WeChat",
    budget: 8000000,
    budgetPeriod: "Purchase budget",
    area: "Rama 9",
    propertyType: "Condo",
    bedrooms: 1,
    moveDate: "",
    viewingWindow: "Video viewing first",
    contractTerm: "Not applicable",
    preferredLanguage: "中文 / English",
    customerCountry: "China",
    dealIntent: "Buy condo",
    wechat: "li-bkk-home",
    partnerAgency: "Shanghai Relocation Desk",
    partnerAgent: "Agent Chen",
    partnerContact: "chen-wechat",
    pets: "ไม่มี",
    requirements: "Foreign quota, easy rental management, close to MRT",
    stage: "Shortlist sent",
    example: true,
  },
  {
    name: "Ivan Petrov",
    contact: "ivan@example.ru",
    source: "Referral partner",
    budget: 12000000,
    budgetPeriod: "Purchase budget",
    area: "Pattaya / Phuket",
    propertyType: "Villa",
    bedrooms: 3,
    moveDate: "2026-11-01",
    viewingWindow: "Video viewing first",
    contractTerm: "Not applicable",
    preferredLanguage: "Русский",
    customerCountry: "Russia",
    dealIntent: "Buy condo",
    wechat: "",
    partnerAgency: "RU relocation partner",
    partnerAgent: "Anna",
    partnerContact: "anna@example.ru",
    pets: "มีสุนัข",
    requirements: "Family relocation, school access, sunny unit",
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

function isMonthlyLead(lead) {
  return (lead.budgetPeriod || "Monthly rent") === "Monthly rent";
}

function inTargetRange(lead) {
  const budget = Number(lead.budget);
  if ((lead.budgetPeriod || "Monthly rent") === "Purchase budget") {
    return budget >= 1000000 && budget <= 250000000;
  }
  if (lead.budgetPeriod === "Listing value") {
    return budget >= 1000000 && budget <= 500000000;
  }
  return budget >= 30000 && budget <= 250000;
}

function targetLeads() {
  return leads.filter(inTargetRange);
}

function budgetLabel(lead) {
  const value = `฿${formatter.format(Number(lead.budget || 0))}`;
  if (lead.budgetPeriod === "Purchase budget") return `${value} purchase`;
  if (lead.budgetPeriod === "Listing value") return `${value} listing`;
  return `${value}/month`;
}

function syncDashboardBudgetMode() {
  const intent = leadDealIntent.value;
  if (intent === "Buy condo") {
    leadBudgetPeriod.value = "Purchase budget";
    leadBudget.min = "1000000";
    leadBudget.max = "250000000";
    leadBudget.step = "100000";
    if (Number(leadBudget.value) < 1000000) leadBudget.value = "8000000";
    return;
  }
  if (intent === "Sell/List property") {
    leadBudgetPeriod.value = "Listing value";
    leadBudget.min = "1000000";
    leadBudget.max = "500000000";
    leadBudget.step = "100000";
    if (Number(leadBudget.value) < 1000000) leadBudget.value = "12000000";
    return;
  }
  leadBudgetPeriod.value = "Monthly rent";
  leadBudget.min = "30000";
  leadBudget.max = "250000";
  leadBudget.step = "5000";
  if (Number(leadBudget.value) < 30000 || Number(leadBudget.value) > 250000) {
    leadBudget.value = "100000";
  }
}

leadDealIntent.addEventListener("change", () => {
  if (leadDealIntent.value === "China agent referral") {
    leadCustomerCountry.value = "China";
    leadLanguage.value = "中文 / English";
  }
  syncDashboardBudgetMode();
});

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
  const budgetScore = isMonthlyLead(lead)
    ? Math.min(Math.round(Number(lead.budget) / 10000), 25)
    : Math.min(Math.round(Number(lead.budget) / 1000000), 25);
  const completenessScore =
    [
      lead.contact,
      lead.propertyType,
      lead.budgetPeriod,
      lead.dealIntent,
      lead.customerCountry,
      lead.preferredLanguage,
      lead.wechat || lead.partnerContact,
    ].filter(Boolean).length * 3;
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
  if (lead.stage === "Won") return "ยืนยันเอกสาร ปิดรายการ และบันทึก partner/referral source";
  if (lead.stage === "Lost") return "บันทึกเหตุผลที่ไม่ปิดดีล แล้วหยุด follow-up";
  if (lead.stage === "Deposit pending") return "ส่งยอดจอง เอกสาร และกำหนดเวลามัดจำ";
  if (lead.stage === "Offer submitted") return "ตามผลข้อเสนอและเตรียมเอกสารสัญญาหรือโอนกรรมสิทธิ์";
  if (lead.stage === "Viewing booked") return `ยืนยันนัด${viewingCue} ส่ง route รูป และค่าแรกเข้า`;
  if (lead.stage === "Shortlist sent") return `ถาม feedback แล้วปิดเวลานัดชม${viewingCue}`;
  if (lead.dealIntent === "Buy condo") return "ยืนยัน foreign quota, payment route, purpose และ timeline ก่อนส่ง shortlist";
  if (lead.dealIntent === "Sell/List property") return "ตรวจเอกสารเจ้าของ รูปทรัพย์ ราคา และขอบเขต listing agreement";
  if (lead.dealIntent === "China agent referral") return "ยืนยันสิทธิ์ส่งข้อมูลลูกค้า, WeChat, fee split และ brief ภาษาจีน";
  if (lead.stage === "Qualified") return "ส่ง Private Shortlist 3-5 ตัวเลือกที่ต่างกันชัดเจน";
  return "โทรหรือ LINE ภายใน 15 นาทีเพื่อยืนยันโจทย์ งบ ภาษา และ action ถัดไป";
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

function renderDataFlow(ranked) {
  if (!flowReceivedCount || !flowQualifiedCount || !flowFilteredRows) return;

  flowReceivedCount.textContent = String(leads.length);
  flowQualifiedCount.textContent = String(ranked.length);

  if (!ranked.length) {
    flowFilteredRows.innerHTML = `
      <span>ยังไม่มีข้อมูลที่ผ่านเงื่อนไขใน queue</span>
    `;
    return;
  }

  flowFilteredRows.innerHTML = ranked
    .slice(0, 3)
    .map(
      (lead) => `
        <article>
          <strong>${escapeHtml(lead.name)} · ${escapeHtml(budgetLabel(lead))}</strong>
          <span>${escapeHtml(lead.area || "Area not set")} · ${escapeHtml(lead.preferredLanguage || "Language not set")} · ${urgencyScore(lead)} priority</span>
          <p>${escapeHtml(nextAction(lead))}</p>
        </article>
      `,
    )
    .join("");
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
  const countryEntries = topEntries(countBy(ranked, (lead) => lead.customerCountry || "Unknown"));
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
    <div>
      <strong>Top countries</strong>
      <div class="summary-pills">${summaryPills(countryEntries)}</div>
    </div>
    <p>Next push: ยิงซ้ำ ${escapeHtml(topSource)} ด้วยข้อเสนอสำหรับ ${escapeHtml(topArea)} และ follow-up ภาษาที่ลูกค้าตอบกลับได้</p>
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
    "wechat",
    "source",
    "customerCountry",
    "preferredLanguage",
    "dealIntent",
    "budget",
    "budgetPeriod",
    "area",
    "propertyType",
    "bedrooms",
    "moveDate",
    "viewingWindow",
    "contractTerm",
    "pets",
    "requirements",
    "partnerAgency",
    "partnerAgent",
    "partnerContact",
    "externalId",
    "importBatch",
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
      lead.wechat,
      lead.source,
      lead.customerCountry,
      lead.preferredLanguage,
      lead.dealIntent,
      lead.budget,
      lead.budgetPeriod,
      lead.area,
      lead.propertyType,
      lead.bedrooms,
      lead.moveDate,
      lead.viewingWindow,
      lead.contractTerm,
      lead.pets,
      lead.requirements,
      lead.partnerAgency,
      lead.partnerAgent,
      lead.partnerContact,
      lead.externalId,
      lead.importBatch,
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
  link.download = `lilith-property-leads-${new Date().toISOString().slice(0, 10)}.csv`;
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
  renderDataFlow(ranked);

  if (!ranked.length) {
    leadTable.innerHTML = `
      <div class="empty-state">
        <strong>ยังไม่มี lead อสังหาที่พร้อมตามต่อ</strong>
        <span>เปิด public form, import CSV จาก Excel หรือสร้าง campaign แล้วตอบ brief แรกภายใน 15 นาที</span>
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
            <span>${escapeHtml(lead.contact || "No contact")} ${lead.wechat ? `· WeChat ${escapeHtml(lead.wechat)}` : ""}</span>
            <span>${escapeHtml(lead.customerCountry || "Unknown country")} · ${escapeHtml(lead.preferredLanguage || "Language not set")} · ${escapeHtml(lead.dealIntent || "Brief")}</span>
            <span>${escapeHtml(lead.area)} · ${escapeHtml(lead.propertyType || "Property")} · ${escapeHtml(lead.bedrooms ?? "?")} bed · ${escapeHtml(budgetLabel(lead))}</span>
            <span>${escapeHtml(viewingWindowText(lead))} · ${escapeHtml(lead.contractTerm || "Contract unconfirmed")} · ${escapeHtml(lead.pets || "Pets not stated")}</span>
            ${
              lead.partnerAgency || lead.partnerAgent || lead.partnerContact
                ? `<span>Partner: ${escapeHtml([lead.partnerAgency, lead.partnerAgent, lead.partnerContact].filter(Boolean).join(" · "))}</span>`
                : ""
            }
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

  const affordable = targetBriefs.filter((brief) => {
    if (brief.budgetPeriod === "Monthly rent") return brief.price <= budget;
    return brief.price <= Math.max(budget, 10000000);
  });
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
              <div class="price">${brief.budgetPeriod === "Monthly rent" ? "to " : ""}฿${formatter.format(brief.price)}</div>
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
    "China broker / WeChat push": {
      source: "china_broker_wechat",
      content: "partner_referral_cn",
      copy: `Lilith Homes 泰国房产团队可接收 ${persona} 的租赁、购买和转介需求。重点区域：${anchors}。请通过表单提交客户预算、微信、语言和看房时间，我们会准备 ${offer}:`,
      actions: [
        "Ask the partner to confirm client consent before sharing personal data",
        "Collect WeChat, country, budget period, target area and purchase or rental intent",
        "Reply with Chinese-friendly shortlist notes and one English/Thai operations summary",
      ],
    },
    "Little Red Book / Xiaohongshu post": {
      source: "xiaohongshu",
      content: "thai_property_cn",
      copy: `想在泰国找房吗？Lilith Homes 支持中文/英文沟通，覆盖 ${anchors}，可处理长租、买房和中介转介。提交需求后我们会准备 ${offer}:`,
      actions: [
        "Use real project photos and avoid exaggerated ROI language",
        "Lead with area, budget, foreign quota or lease term and contact method",
        "Move serious inquiries to the form so consent, source and follow-up are recorded",
      ],
    },
    "Russian relocation partner": {
      source: "russian_relocation",
      content: "ru_family_property",
      copy: `Lilith Homes помогает русскоязычным клиентам подобрать недвижимость в Таиланде: ${anchors}. Отправьте запрос, бюджет и сроки, чтобы получить ${offer}:`,
      actions: [
        "Confirm city, family size, school needs, payment readiness and viewing format",
        "Keep claims conservative and route legal questions to a qualified advisor",
        "Follow up in Russian first, then maintain an English operation note for the team",
      ],
    },
    "Expat community post": {
      source: "expat_community",
      content: "executive_long_stay",
      copy: `Relocating to Thailand? Lilith Homes curates rentals and purchase briefs in ${anchors} for ${persona}. Share your brief to receive a ${offer}.`,
      actions: [
        "Post in one relevant expat or neighborhood community with a clear area and budget",
        "Answer in English and confirm country, move date, bedrooms and lease or purchase intent",
        "Send 3-5 meaningfully different options before asking for a viewing slot",
      ],
    },
    "Corporate HR / relocation outreach": {
      source: "corporate_relocation",
      content: "hr_partner",
      copy: `Lilith Homes supports Thailand relocation briefs for ${persona}. We coordinate residences in ${anchors} with curated comparisons, viewing routes and contract support. Submit the employee brief here:`,
      actions: [
        "Send to HR, mobility and relocation contacts with one concrete service promise",
        "Ask for policy budget, family size, office or school anchor and target move date",
        "Provide one consolidated comparison instead of forwarding raw listing links",
      ],
    },
    "Facebook premium rental group": {
      source: "facebook_premium_group",
      content: "premium_12m",
      copy: `กำลังหา ${persona} เช่าโซน ${anchors} อยู่ไหมคะ? งบ ฿30,000–฿${budget}/เดือน สัญญา 1 ปี ทีม Lilith ช่วยทำ ${offer} พร้อมเทียบค่าแรกเข้าและจัดนัดชมให้เป็นชุด ส่งโจทย์ได้ที่:`,
      actions: [
        "ใช้ภาพทรัพย์จริงและระบุทำเล จำนวนห้องนอน งบ และสัญญา 1 ปีในบรรทัดแรก",
        "โพสต์เฉพาะกลุ่มที่อนุญาต agent หรือ service post",
        "ตอบคอมเมนต์ด้วยลิงก์ที่ติด UTM และตามต่อภายใน 15 นาที",
      ],
    },
    "Property portal refresh": {
      source: "property_portal",
      content: "premium_listing",
      copy: `Premium Thailand residence in ${anchors}. Suitable for ${persona}, with rental and purchase briefs routed to one multilingual desk. Request a private comparison here:`,
      actions: [
        "Refresh only verified available inventory with current price and minimum term",
        "Lead with project, bedrooms, usable area, exact rent or asking price and nearest anchor",
        "Route every inquiry into the same qualification form before building a shortlist",
      ],
    },
    "Referral partner push": {
      source: "referral_partner",
      content: "premium_tenant_referral",
      copy: `มีลูกค้ามองหาอสังหาไทย โซน ${anchors} ฝาก brief ให้ Lilith ช่วยคัด ${offer} และประสานนัดชมได้ที่:`,
      actions: [
        "ส่งให้ agent, owner representative และ relocation partner ที่เคยร่วมงาน",
        "ตกลงขอบเขตการแบ่งงานหรือค่าตอบแทนก่อนส่งข้อมูลลูกค้า",
        "อัปเดตสถานะ shortlist, viewing และ offer ให้ผู้แนะนำทราบตามสมควร",
      ],
    },
  };
  const config = channelConfig[channel];
  const link = `${window.location.origin}/?utm_source=${config.source}&utm_campaign=international_property&utm_content=${config.content}`;

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

async function sendImportPayload() {
  sendImport.disabled = true;
  sendImport.textContent = "Importing...";
  importStatus.textContent = "กำลังตรวจและนำเข้า lead...";

  try {
    let body;
    let headers = { Accept: "application/json" };

    if (importCsvFile.files?.[0]) {
      body = new FormData();
      body.append("file", importCsvFile.files[0]);
    } else {
      const text = importPayload.value.trim();
      if (text.startsWith("[") || text.startsWith("{")) {
        body = text;
        headers = { ...headers, "Content-Type": "application/json" };
      } else {
        body = text;
        headers = { ...headers, "Content-Type": "text/csv;charset=utf-8" };
      }
    }

    const response = await fetch("/api/import", {
      method: "POST",
      headers,
      body,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Import failed");
    await loadServerLeads();
    importStatus.textContent = `นำเข้าแล้ว ${payload.acceptedCount || 0} รายการ, ไม่ผ่าน ${payload.rejectedCount || 0} รายการ`;
  } catch (error) {
    importStatus.textContent =
      error instanceof Error && error.message.includes("token")
        ? "ยัง import ไม่ได้: ต้องเปิด dashboard ด้วย sign-in หรือกำหนด LEAD_IMPORT_TOKEN สำหรับ partner"
        : "นำเข้าไม่สำเร็จ กรุณาตรวจ header/field: name, contact หรือ WeChat, budget, area, propertyType";
  } finally {
    sendImport.disabled = false;
    sendImport.textContent = "Import leads";
  }
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
  const chinaLeads = qualified.filter((lead) => lead.customerCountry === "China").length;
  const campaign = campaignTemplate();
  leadConsole.innerHTML = `
    <strong>Today's international lead plan</strong>
    <span>1) ตอบ new inquiry ${newLeads} รายภายใน 15 นาที 2) ดัน ${viewingReady} รายให้เลือกเวลานัดชม 3) เช็ก China/WeChat lead ${chinaLeads} รายเรื่องสิทธิ์ส่งข้อมูล 4) ปล่อย ${escapeHtml(campaign.target)} ด้วยลิงก์ UTM แล้วตามต่อด้วยภาษาที่ลูกค้าตอบกลับได้</span>
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
    budget: Number(leadBudget.value),
    budgetPeriod: leadBudgetPeriod.value,
    area: document.querySelector("#leadArea").value.trim(),
    propertyType: document.querySelector("#leadPropertyType").value,
    bedrooms: Number(document.querySelector("#leadBedrooms").value),
    moveDate: document.querySelector("#moveDate").value,
    viewingWindow: document.querySelector("#leadViewingWindow").value,
    contractTerm: isMonthlyLead({ budgetPeriod: leadBudgetPeriod.value }) ? "12 months" : "Not applicable",
    preferredLanguage: leadLanguage.value,
    customerCountry: leadCustomerCountry.value,
    dealIntent: leadDealIntent.value,
    wechat: document.querySelector("#leadWechat").value.trim(),
    partnerAgency: document.querySelector("#leadPartnerAgency").value.trim(),
    partnerContact: document.querySelector("#leadPartnerContact").value.trim(),
    pets: document.querySelector("#leadPets").value,
    requirements: document.querySelector("#leadRequirements").value.trim(),
    consent: true,
    stage: document.querySelector("#leadStage").value,
  });

  if (saved) {
    leadForm.reset();
    leadDealIntent.value = "Rent 12-month";
    leadCustomerCountry.value = "China";
    leadLanguage.value = "中文 / English";
    leadBudget.value = "100000";
    document.querySelector("#leadArea").value = "Phrom Phong";
    document.querySelector("#leadPropertyType").value = "Condo";
    document.querySelector("#leadBedrooms").value = "2";
    syncDashboardBudgetMode();
    leadConsole.innerHTML = `
      <strong>Lead saved</strong>
      <span>ข้อมูลเข้าคิวแล้ว ขั้นต่อไปคือยืนยันโจทย์ ภาษา ช่องทางติดต่อ และ action ถัดไป</span>
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
  const details = `${lead.propertyType || "home"}, ${lead.bedrooms ?? "?"} bedroom(s), ${lead.area}, ${budgetLabel(lead)}`;
  const language = String(lead.preferredLanguage || "");
  const reply = language.includes("中文")
    ? `您好 ${lead.name}，我们已收到您的泰国房产需求：${details}。为了准备合适的房源清单，请确认预算、区域、付款/入住时间，以及是否方便通过微信继续沟通。`
    : language.includes("Русский")
      ? `Здравствуйте, ${lead.name}. Мы получили ваш запрос по недвижимости в Таиланде: ${details}. Пожалуйста, подтвердите бюджет, район, срок и удобное время для просмотра.`
      : language.includes("English")
        ? `Hi ${lead.name}, thank you for your Thailand property brief. I have ${details}. Before I prepare the shortlist, may I confirm your timing, must-have requirements and preferred viewing window?`
        : `สวัสดีค่ะ ${lead.name} ทีมได้รับโจทย์อสังหาแล้วนะคะ: ${details} ก่อนคัด shortlist ขอขอยืนยันงบ ทำเล เงื่อนไขที่ต้องมี และยังสะดวกนัดชม ${viewingWindowText(lead)} อยู่ไหมคะ`;
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
sendImport.addEventListener("click", sendImportPayload);
loadImportSample.addEventListener("click", () => {
  importCsvFile.value = "";
  importPayload.value = importSample;
  importStatus.textContent = "ใส่ JSON sample แล้ว กด Import leads เพื่อทดสอบผ่าน dashboard sign-in";
});

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
syncDashboardBudgetMode();
loadServerLeads();
