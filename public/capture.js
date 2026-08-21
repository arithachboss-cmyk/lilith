const publicLeadForm = document.querySelector("#publicLeadForm");
const publicStatus = document.querySelector("#publicStatus");
const publicSubmit = publicLeadForm.querySelector('button[type="submit"]');
const params = new URLSearchParams(window.location.search);

function leadSource() {
  const source = params.get("utm_source") || "public";
  const campaign = params.get("utm_campaign") || "launch";
  const content = params.get("utm_content");
  return [source, campaign, content].filter(Boolean).join(" / ");
}

publicLeadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  publicSubmit.disabled = true;
  publicSubmit.textContent = "กำลังส่งโจทย์...";
  publicStatus.textContent = "กำลังส่งข้อมูลให้ทีม Lilith เพื่อตรวจโจทย์การเช่า...";

  const lead = {
    name: document.querySelector("#publicName").value.trim(),
    contact: document.querySelector("#publicContact").value.trim(),
    source: leadSource(),
    budget: Number(document.querySelector("#publicBudget").value),
    area: document.querySelector("#publicArea").value.trim(),
    propertyType: document.querySelector("#publicPropertyType").value,
    bedrooms: Number(document.querySelector("#publicBedrooms").value),
    moveDate: document.querySelector("#publicMoveDate").value,
    viewingWindow: document.querySelector("#publicViewingWindow").value,
    contractTerm: document.querySelector("#publicContractTerm").value,
    preferredLanguage: document.querySelector("#publicLanguage").value,
    pets: document.querySelector("#publicPets").value,
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
    document.querySelector("#publicBudget").value = "100000";
    document.querySelector("#publicPropertyType").value = "Condo";
    document.querySelector("#publicBedrooms").value = "2";
    publicStatus.textContent =
      "ส่งโจทย์เรียบร้อยแล้วค่ะ ทีม Lilith จะติดต่อกลับเพื่อยืนยันรายละเอียดและเริ่มคัด Private Shortlist";
  } catch (error) {
    publicStatus.textContent =
      error instanceof Error && error.message.includes("12-month")
        ? "กรุณาตรวจว่างบอยู่ระหว่าง 30,000–250,000 บาท และยืนยันสัญญา 1 ปี"
        : "ส่งไม่สำเร็จ กรุณาลองอีกครั้ง และตรวจข้อมูลติดต่อ งบ ทำเล และวันเข้าอยู่";
  } finally {
    publicSubmit.disabled = false;
    publicSubmit.textContent = "ขอรับ Private Shortlist";
  }
});
