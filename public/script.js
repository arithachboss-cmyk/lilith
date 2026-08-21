const listings = [
  {
    title: "Muniq Sukhumvit 23",
    area: "Asoke / Sukhumvit",
    price: 33000,
    details: "1 bed · 42 sqm · high floor · fully furnished",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=82",
    score: "96 match",
    meta: ["6 min MRT", "Owner verified", "No duplicate risk", "View today"],
  },
  {
    title: "Noble Around 33",
    area: "Phrom Phong",
    price: 30000,
    details: "1 bed · 35 sqm · quiet side · pet-friendly option",
    image: "https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=900&q=82",
    score: "94 match",
    meta: ["9 min BTS", "Below median", "Fast reply", "Deposit checked"],
  },
  {
    title: "The Lofts Ekkamai",
    area: "Thong Lo / Ekkamai",
    price: 42000,
    details: "1 bed loft · 48 sqm · city view · work desk ready",
    image: "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=900&q=82",
    score: "91 match",
    meta: ["4 min BTS", "Fresh listing", "Video tour", "Flexible term"],
  },
  {
    title: "Rhythm Sukhumvit 36",
    area: "Thong Lo",
    price: 28000,
    details: "1 bed · 33 sqm · renovated · morning light",
    image: "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=900&q=82",
    score: "89 match",
    meta: ["11 min BTS", "Great value", "Agent verified", "Route bundled"],
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
const renterForm = document.querySelector("#renterForm");
const renterName = document.querySelector("#renterName");
const renterBudget = document.querySelector("#renterBudget");
const renterArea = document.querySelector("#renterArea");
const renterMoveDate = document.querySelector("#renterMoveDate");
const copyCapturePost = document.querySelector("#copyCapturePost");
const sharePack = document.querySelector("#sharePack");

const seedLeads = [
  {
    name: "คุณเมย์",
    source: "LINE OA",
    budget: 18000,
    area: "Asoke",
    moveDate: "2026-08-24",
    stage: "Qualified",
  },
  {
    name: "Mr. Chen",
    source: "Property portal",
    budget: 32000,
    area: "Phrom Phong",
    moveDate: "2026-08-28",
    stage: "Viewing booked",
  },
  {
    name: "คุณฟ้า",
    source: "Facebook Marketplace",
    budget: 12000,
    area: "On Nut",
    moveDate: "2026-09-01",
    stage: "New inquiry",
  },
];

let leads = JSON.parse(localStorage.getItem("lilithLeads") || "[]");
let serverBackedLeads = false;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function saveLeads() {
  localStorage.setItem("lilithLeads", JSON.stringify(leads));
}

async function loadServerLeads() {
  try {
    const response = await fetch("/api/leads", { headers: { Accept: "application/json" } });
    if (!response.ok) return;
    const payload = await response.json();
    if (!Array.isArray(payload.leads)) return;
    serverBackedLeads = true;
    leads = payload.leads;
    saveLeads();
    renderLeads();
  } catch {
    serverBackedLeads = false;
  }
}

async function addLead(lead) {
  leads.push(lead);
  saveLeads();
  renderLeads();

  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(lead),
    });
    if (!response.ok) return;
    serverBackedLeads = true;
    await loadServerLeads();
  } catch {
    serverBackedLeads = false;
  }
}

function urgencyScore(lead) {
  const stageScore = {
    "Deposit pending": 40,
    "Viewing booked": 32,
    Qualified: 24,
    "New inquiry": 12,
  };
  const budgetScore = Math.min(Math.round(Number(lead.budget) / 1000), 35);
  const daysUntilMove = lead.moveDate
    ? Math.ceil((new Date(lead.moveDate) - new Date()) / 86400000)
    : 14;
  const moveScore = daysUntilMove <= 3 ? 25 : daysUntilMove <= 10 ? 16 : 8;
  return (stageScore[lead.stage] || 10) + budgetScore + moveScore;
}

function nextAction(lead) {
  if (lead.stage === "Deposit pending") return "ส่งยอดจอง เอกสาร และ deadline มัดจำ";
  if (lead.stage === "Viewing booked") return "ยืนยันเวลานัด ส่งแผนที่ รูป และค่าแรกเข้า";
  if (lead.stage === "Qualified") return "เสนอ 2-3 ห้องที่ตรงงบ แล้วปิดเวลานัดดู";
  return "ถามงบ ทำเล วันเข้าอยู่ และส่ง shortlist ภายใน 15 นาที";
}

function csvValue(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv() {
  if (!leads.length) return;
  const headers = ["name", "source", "budget", "area", "moveDate", "stage", "heat", "nextAction"];
  const rows = leads.map((lead) =>
    [
      lead.name,
      lead.source,
      lead.budget,
      lead.area,
      lead.moveDate,
      lead.stage,
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
  link.download = `lilith-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function renderLeads() {
  const ranked = [...leads].sort((a, b) => urgencyScore(b) - urgencyScore(a));
  const hotLeads = ranked.filter((lead) => urgencyScore(lead) >= 65);
  hotLeadCount.textContent = String(hotLeads.length);
  exportLeads.disabled = !ranked.length;

  if (!ranked.length) {
    leadTable.innerHTML = `
      <div class="empty-state">
        <strong>ยังไม่มี lead</strong>
        <span>เพิ่มลูกค้าจากฟอร์ม หรือกด Load sample leads เพื่อเริ่มระบบวันนี้</span>
      </div>
    `;
    return;
  }

  leadTable.innerHTML = ranked
    .map(
      (lead, index) => `
        <article class="lead-row">
          <div>
            <strong>${escapeHtml(lead.name)}</strong>
            <span>${escapeHtml(lead.source)} · ${escapeHtml(lead.area)} · ฿${formatter.format(Number(lead.budget))}</span>
          </div>
          <div>
            <span class="stage-pill">${escapeHtml(lead.stage)}</span>
            <span class="score-pill">${urgencyScore(lead)} heat</span>
          </div>
          <p>${nextAction(lead)}</p>
          <button type="button" data-script-index="${index}">LINE script</button>
        </article>
      `,
    )
    .join("");
}

function renderListings() {
  const budget = Number(budgetInput.value);
  const areaTerms = areaInput.value
    .toLowerCase()
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean);

  const visible = listings.filter((listing) => {
    const isAffordable = listing.price <= budget;
    const searchableText = `${listing.title} ${listing.area}`.toLowerCase();
    const matchesArea =
      areaTerms.length === 0 || areaTerms.some((term) => searchableText.includes(term));
    return isAffordable && matchesArea;
  });

  listingList.innerHTML = "";
  const fallback = visible.length ? visible : listings.filter((listing) => listing.price <= budget);

  for (const listing of fallback) {
    const card = document.createElement("article");
    card.className = "listing-card";
    card.innerHTML = `
      <div class="listing-photo">
        <img src="${listing.image}" alt="${listing.title} interior" />
        <span class="badge">${listing.score}</span>
      </div>
      <div class="listing-body">
        <div class="listing-title">
          <div>
            <h4>${listing.title}</h4>
            <p>${listing.area}</p>
          </div>
          <div class="price">฿${formatter.format(listing.price)}</div>
        </div>
        <p>${listing.details}</p>
        <div class="listing-meta">
          ${listing.meta.map((item) => `<span>${item}</span>`).join("")}
        </div>
        <div class="listing-actions">
          <button type="button">Book viewing</button>
          <button type="button">Compare</button>
          <button type="button">LINE script</button>
        </div>
      </div>
    `;
    listingList.append(card);
  }

  matchCount.textContent = String(Math.max(fallback.length * 11 - (budget < 40000 ? 2 : 0), 8));
}

filters.addEventListener("submit", (event) => {
  event.preventDefault();
  renderListings();
});

budgetInput.addEventListener("change", renderListings);
areaInput.addEventListener("input", renderListings);

generateLeadPlan.addEventListener("click", () => {
  const budget = formatter.format(Number(budgetInput.value));
  const anchors = areaInput.value || "BTS/MRT";
  const totalLeads = leads.length;
  const hotLeads = leads.filter((lead) => urgencyScore(lead) >= 65).length;
  leadConsole.innerHTML = `
    <strong>Lead plan ready</strong>
    <span>Publish refreshed listings near ${anchors}, prioritize rooms under ฿${budget}, reply to ${totalLeads || "new"} leads within 15 minutes, push ${hotLeads || "hot"} prospects toward viewing, and bundle qualified renters into same-day routes.</span>
  `;
});

function campaignTemplate() {
  const budget = formatter.format(Number(budgetInput.value));
  const anchors = areaInput.value || "BTS/MRT";
  const channel = campaignChannel.value;
  const persona = renterPersona.value;
  const offer = campaignOffer.value || "ห้องพร้อมเข้าอยู่";
  const leadTarget = document.querySelector("#leadGoal").value;
  const roomCount = listingList.children.length;
  const channelActions = {
    "LINE OA broadcast": [
      "ส่ง broadcast รอบ 11:30 และ 18:30 พร้อมปุ่มนัดดูห้อง",
      "แยกคนกดสนใจเข้าฟอร์ม lead แล้วโทร/LINE กลับใน 15 นาที",
      "ปิดด้วย 2 ตัวเลือกเวลา: วันนี้เย็น หรือพรุ่งนี้เช้า",
    ],
    "Facebook Marketplace post": [
      "ลงโพสต์ 3 เวอร์ชัน: ใกล้รถไฟฟ้า, พร้อมเข้าอยู่, คุ้มกว่าราคาเฉลี่ย",
      "ตอบคอมเมนต์ด้วยคำถามคัดกรองงบและวันเข้าอยู่",
      "ดันโพสต์ช่วง 19:00-22:00 เมื่อคนหาห้องหลังเลิกงาน",
    ],
    "Property portal refresh": [
      "refresh ห้องที่ตรงงบก่อน 10:00 และ 17:00",
      "ใส่ keyword สถานี ถนน ห้าง และโรงพยาบาลในหัวประกาศ",
      "ซื้อ top slot เฉพาะห้องที่พร้อมดูภายใน 24 ชั่วโมง",
    ],
    "TikTok short script": [
      "ถ่ายคลิป 20 วินาที: ประตูเข้า, วิว, โต๊ะทำงาน, ห้องน้ำ, ระยะไป BTS/MRT",
      "เปิดคลิปด้วยราคา ทำเล และค่าแรกเข้าใน 3 วินาทีแรก",
      "ปิดท้ายให้ทัก LINE พร้อมคำว่า 'ขอห้องโซนนี้'",
    ],
    "Referral push": [
      "ส่งข้อความให้ tenant/agent เดิมพร้อมค่าขอบคุณเมื่อปิดดีล",
      "แนบรูปห้อง ราคา และวันพร้อมเข้าอยู่แบบส่งต่อได้",
      "ตาม referral ภายในวันเดียวพร้อมสถานะห้องล่าสุด",
    ],
  };

  return {
    post: `หา${persona} งบไม่เกิน ฿${budget} โซน ${anchors} — ${offer} มี ${roomCount || "หลาย"} ห้องคัดแล้ว พร้อมส่งรูป ค่าแรกเข้า และนัดดูห้องวันนี้ ทัก LINE พร้อมบอกงบ/วันเข้าอยู่ได้เลยค่ะ`,
    actions: channelActions[channel],
    target: `${channel} · เป้าหมาย ${leadTarget}`,
  };
}

function capturePostTemplate() {
  const budget = formatter.format(Number(renterBudget.value));
  const area = renterArea.value || "BTS/MRT";
  return `หาห้องเช่าโซน ${area} งบไม่เกิน ฿${budget} พร้อมเข้าอยู่ไหมคะ? ส่งชื่อ/LINE งบ ทำเล และวันเข้าอยู่มาได้เลย เดี๋ยว Lilith คัดห้องพร้อมรูป ค่าแรกเข้า และเวลานัดดูให้ภายในวันนี้`;
}

function renderSharePack(status = "Share copy ready") {
  sharePack.innerHTML = `
    <strong>${escapeHtml(status)}</strong>
    <p>${escapeHtml(capturePostTemplate())}</p>
  `;
}

function renderCampaign() {
  const campaign = campaignTemplate();
  campaignOutput.innerHTML = `
    <section>
      <h4>Post copy</h4>
      <p>${escapeHtml(campaign.post)}</p>
      <button class="secondary-action" type="button" id="copyCampaign">Copy copy</button>
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

leadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await addLead({
    name: document.querySelector("#leadName").value.trim(),
    source: document.querySelector("#leadSource").value,
    budget: Number(document.querySelector("#leadBudget").value),
    area: document.querySelector("#leadArea").value.trim(),
    moveDate: document.querySelector("#moveDate").value,
    stage: document.querySelector("#leadStage").value,
  });
  leadForm.reset();
  document.querySelector("#leadBudget").value = 18000;
  document.querySelector("#leadArea").value = "Asoke";
});

leadTable.addEventListener("click", (event) => {
  const scriptButton = event.target.closest("[data-script-index]");
  if (!scriptButton) return;
  const ranked = [...leads].sort((a, b) => urgencyScore(b) - urgencyScore(a));
  const lead = ranked[Number(scriptButton.dataset.scriptIndex)];
  scriptBox.innerHTML = `
    <strong>LINE closing script for ${escapeHtml(lead.name)}</strong>
    <p>สวัสดีค่ะ ${escapeHtml(lead.name)} ห้องโซน ${escapeHtml(lead.area)} งบไม่เกิน ฿${formatter.format(Number(lead.budget))} ยังสนใจอยู่ไหมคะ ตอนนี้มีห้องที่ตรงงบให้เลือกดูได้วันนี้/พรุ่งนี้ ขอเวลาที่สะดวก 2 ช่วง เดี๋ยวส่งรูป ค่าแรกเข้า และแผนที่ให้ครบค่ะ</p>
  `;
});

exportLeads.addEventListener("click", downloadCsv);

renterForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await addLead({
    name: renterName.value.trim(),
    source: serverBackedLeads ? "Public capture URL" : "Public capture",
    budget: Number(renterBudget.value),
    area: renterArea.value.trim(),
    moveDate: renterMoveDate.value,
    stage: "New inquiry",
  });
  renderSharePack("Inquiry added to pipeline");
  renterForm.reset();
  renterBudget.value = "18000";
  renterArea.value = "BTS/MRT";
});

copyCapturePost.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(capturePostTemplate());
    renderSharePack("Copied renter post");
  } catch {
    renderSharePack("Select and copy this post");
  }
});

renterBudget.addEventListener("change", () => renderSharePack());
renterArea.addEventListener("input", () => renderSharePack());

loadSeedLeads.addEventListener("click", () => {
  leads = [...seedLeads];
  saveLeads();
  renderLeads();
});

clearLeads.addEventListener("click", async () => {
  leads = [];
  saveLeads();
  renderLeads();
  if (!serverBackedLeads) return;
  try {
    await fetch("/api/leads", { method: "DELETE" });
    await loadServerLeads();
  } catch {
    serverBackedLeads = false;
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
renderSharePack();
loadServerLeads();
