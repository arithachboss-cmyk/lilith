import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Lilith Homes | Export Command Display",
  description:
    "Always-on outbound dashboard for Lilith Homes international tenant and partner acquisition.",
};

const exportQueues = [
  {
    channel: "WeChat broker push",
    audience: "Chinese agents with Bangkok rental clients",
    payload: "Private shortlist link + fee split note + consent reminder",
    cadence: "09:30 / 14:30",
    status: "Ready",
  },
  {
    channel: "Relocation partners",
    audience: "HR, global mobility, visa and moving providers",
    payload: "Partner intro email + Sukhumvit / Sathorn sample brief",
    cadence: "10 partners/day",
    status: "Build list",
  },
  {
    channel: "Expat communities",
    audience: "Executive renters and international families",
    payload: "Helpful shortlist post + UTM form link",
    cadence: "2 posts/day",
    status: "Review group rules",
  },
  {
    channel: "Property portals",
    audience: "Foreign renters already searching Thailand",
    payload: "Verified listing refresh + English response script",
    cadence: "Daily refresh",
    status: "Ready",
  },
];

const partnerTargets = [
  "Relocation firms",
  "International schools",
  "Visa and immigration desks",
  "Pet relocation teams",
  "Serviced apartment operators",
  "Foreign broker networks",
];

const messageStack = [
  {
    title: "Partner opening",
    copy: "We support foreign tenants and buyers looking for verified Bangkok homes. If your clients need housing, send us the brief and we can work by referral or co-broker split after a successful lease.",
  },
  {
    title: "Tenant intake",
    copy: "Please confirm budget, move-in date, preferred station, bedrooms, pets, contract term, and whether you prefer LINE, WhatsApp, WeChat, or email for the shortlist.",
  },
  {
    title: "Daily close",
    copy: "Send shortlist, ask for viewing window, confirm deposit terms, and update the partner before the day ends.",
  },
];

export default function DisplayBoard() {
  const today = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeZone: "Asia/Bangkok",
  }).format(new Date());

  return (
    <>
      <main className="display-board">
        <section className="display-header">
          <div>
            <p className="label">Lilith Homes · always-on export board</p>
            <h1>สิ่งที่จะส่งออกไปวันนี้</h1>
          </div>
          <div className="display-clock" aria-label="Display date and time">
            <strong>{today}</strong>
            <span id="displayTime">Bangkok time loading...</span>
            <small id="wakeStatus">Display wake lock checking...</small>
          </div>
        </section>

        <section className="display-metrics" aria-label="Today targets">
          <article>
            <strong>40</strong>
            <span>partner touches</span>
          </article>
          <article>
            <strong>8</strong>
            <span>warm replies target</span>
          </article>
          <article>
            <strong>4</strong>
            <span>export channels</span>
          </article>
          <article>
            <strong>15m</strong>
            <span>reply SLA</span>
          </article>
        </section>

        <section className="display-grid">
          <article className="display-panel display-panel-main">
            <div className="panel-heading">
              <div>
                <p className="label">Outbound queue</p>
                <h2>ส่งอะไร ออกไปหาใคร</h2>
              </div>
              <span className="stage-pill" id="nextPushCountdown">
                Live routine
              </span>
            </div>
            <div className="export-list">
              {exportQueues.map((item) => (
                <section className="export-item" key={item.channel}>
                  <div>
                    <strong>{item.channel}</strong>
                    <span>{item.audience}</span>
                  </div>
                  <p>{item.payload}</p>
                  <div className="export-meta">
                    <span>{item.cadence}</span>
                    <span>{item.status}</span>
                  </div>
                </section>
              ))}
            </div>
          </article>

          <aside className="display-panel">
            <p className="label">Partner radar</p>
            <h2>คนที่ควรส่งลูกค้าให้เรา</h2>
            <div className="partner-radar">
              {partnerTargets.map((target) => (
                <span key={target}>{target}</span>
              ))}
            </div>
          </aside>

          <article className="display-panel">
            <p className="label">Message stack</p>
            <h2>ข้อความที่ต้องพร้อมส่ง</h2>
            <div className="message-stack">
              {messageStack.map((message) => (
                <section key={message.title}>
                  <strong>{message.title}</strong>
                  <p>{message.copy}</p>
                </section>
              ))}
            </div>
          </article>

          <article className="display-panel display-panel-dark">
            <p className="label">Today command</p>
            <h2>อย่าโพสต์มั่ว ให้ส่งแบบมีที่มา</h2>
            <ol>
              <li>เลือกกลุ่มเดียวต่อข้อความ</li>
              <li>แนบลิงก์ฟอร์มพร้อม UTM</li>
              <li>ตอบกลับใน 15 นาที</li>
              <li>บันทึก source, language, budget, move-in date</li>
            </ol>
          </article>
        </section>
      </main>
      <Script src="/display.js" strategy="afterInteractive" />
    </>
  );
}
