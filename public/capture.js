const publicLeadForm = document.querySelector("#publicLeadForm");
const publicStatus = document.querySelector("#publicStatus");
const publicSubmit = publicLeadForm.querySelector('button[type="submit"]');
const params = new URLSearchParams(window.location.search);
const publicDealIntent = document.querySelector("#publicDealIntent");
const publicBudgetPeriod = document.querySelector("#publicBudgetPeriod");
const publicBudget = document.querySelector("#publicBudget");
const publicContractTerm = document.querySelector("#publicContractTerm");

function leadSource() {
  const source = params.get("utm_source") || "public";
  const campaign = params.get("utm_campaign") || "international_property";
  const content = params.get("utm_content");
  return [source, campaign, content].filter(Boolean).join(" / ");
}

function syncBudgetMode() {
  const intent = publicDealIntent.value;

  if (intent === "Buy condo") {
    publicBudgetPeriod.value = "Purchase budget";
    publicBudget.min = "1000000";
    publicBudget.max = "250000000";
    publicBudget.step = "100000";
    if (Number(publicBudget.value) < 1000000) publicBudget.value = "8000000";
    publicContractTerm.value = "Not applicable";
    return;
  }

  if (intent === "Sell/List property") {
    publicBudgetPeriod.value = "Listing value";
    publicBudget.min = "1000000";
    publicBudget.max = "500000000";
    publicBudget.step = "100000";
    if (Number(publicBudget.value) < 1000000) publicBudget.value = "12000000";
    publicContractTerm.value = "Not applicable";
    return;
  }

  publicBudgetPeriod.value = "Monthly rent";
  publicBudget.min = "30000";
  publicBudget.max = "250000";
  publicBudget.step = "5000";
  if (Number(publicBudget.value) > 250000 || Number(publicBudget.value) < 30000) {
    publicBudget.value = "120000";
  }
  publicContractTerm.value = "12 months";
}

publicDealIntent.addEventListener("change", syncBudgetMode);

publicLeadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  publicSubmit.disabled = true;
  publicSubmit.textContent = "กำลังส่งโจทย์...";
  publicStatus.textContent = "กำลังส่งข้อมูลให้ทีม Lilith เพื่อตรวจโจทย์อสังหา...";

  const lead = {
    name: document.querySelector("#publicName").value.trim(),
    contact: document.querySelector("#publicContact").value.trim(),
    source: leadSource(),
    budget: Number(publicBudget.value),
    budgetPeriod: publicBudgetPeriod.value,
    area: document.querySelector("#publicArea").value.trim(),
    propertyType: document.querySelector("#publicPropertyType").value,
    bedrooms: Number(document.querySelector("#publicBedrooms").value),
    moveDate: document.querySelector("#publicMoveDate").value,
    viewingWindow: document.querySelector("#publicViewingWindow").value,
    contractTerm: publicContractTerm.value,
    preferredLanguage: document.querySelector("#publicLanguage").value,
    customerCountry: document.querySelector("#publicCustomerCountry").value,
    dealIntent: publicDealIntent.value,
    wechat: document.querySelector("#publicWechat").value.trim(),
    partnerAgency: document.querySelector("#publicPartnerAgency").value.trim(),
    partnerAgent: document.querySelector("#publicPartnerAgent").value.trim(),
    partnerContact: document.querySelector("#publicPartnerContact").value.trim(),
    requirements: document.querySelector("#publicRequirements").value.trim(),
    consent: document.querySelector("#publicConsent").checked,
    website: document.querySelector("#publicWebsite").value,
  };

  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(lead),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Lead submission failed");
    }

    publicLeadForm.reset();
    publicDealIntent.value = "Rent 12-month";
    document.querySelector("#publicCustomerCountry").value = "China";
    document.querySelector("#publicLanguage").value = "中文 / English";
    document.querySelector("#publicPropertyType").value = "Condo";
    document.querySelector("#publicBedrooms").value = "2";
    syncBudgetMode();
    publicStatus.textContent =
      "ส่งโจทย์เรียบร้อยแล้ว ทีม Lilith จะติดต่อกลับเพื่อยืนยัน brief และจัดคิวประสานงาน";
  } catch (error) {
    publicStatus.textContent =
      error instanceof Error && error.message.includes("Rental leads")
        ? "กรุณาตรวจงบเช่า 30,000-250,000 บาท หรือเลือกประเภทงบซื้อ/ขายให้ถูกต้อง"
        : "ส่งไม่สำเร็จ กรุณาลองอีกครั้ง และตรวจชื่อ ช่องทางติดต่อ งบ ทำเล และสิทธิ์ในการส่งข้อมูล";
  } finally {
    publicSubmit.disabled = false;
    publicSubmit.textContent = "ส่งโจทย์ให้ทีม Lilith";
  }
});

syncBudgetMode();
