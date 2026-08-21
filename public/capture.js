const publicLeadForm = document.querySelector("#publicLeadForm");
const publicStatus = document.querySelector("#publicStatus");
const params = new URLSearchParams(window.location.search);

function leadSource() {
  const source = params.get("utm_source") || "public";
  const campaign = params.get("utm_campaign") || "launch";
  const content = params.get("utm_content");
  return [source, campaign, content].filter(Boolean).join(" / ");
}

publicLeadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  publicStatus.textContent = "กำลังส่งข้อมูลให้ทีม Lilith...";

  const lead = {
    name: document.querySelector("#publicName").value.trim(),
    source: leadSource(),
    budget: Number(document.querySelector("#publicBudget").value),
    area: document.querySelector("#publicArea").value.trim(),
    moveDate: document.querySelector("#publicMoveDate").value,
    stage: "New inquiry",
  };

  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(lead),
    });

    if (!response.ok) throw new Error("Lead submission failed");

    publicLeadForm.reset();
    document.querySelector("#publicBudget").value = "28000";
    publicStatus.textContent =
      "ส่งข้อมูลแล้วค่ะ ทีม Lilith จะคัดห้องและติดต่อกลับพร้อมรูป ค่าแรกเข้า และเวลานัดดูห้อง";
  } catch {
    publicStatus.textContent =
      "ส่งไม่สำเร็จ กรุณาลองอีกครั้ง หรือทัก LINE/โทรหาทีมพร้อมงบ ทำเล และวันเข้าอยู่";
  }
});
