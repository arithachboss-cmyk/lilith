import type { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";
import { requireChatGPTUser } from "../chatgpt-auth";

export const metadata: Metadata = {
  title: "Lilith Homes | Premium Rental Pipeline",
  description:
    "Private control room for Bangkok 12-month rental leads at ฿50,000-฿250,000 per month.",
};

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await requireChatGPTUser("/dashboard");

  return (
    <>
      <main className="app-shell">
        <aside className="rail" aria-label="Leasing navigation">
          <a className="mark" href="#top" aria-label="Lilith Homes">
            LH
          </a>
          <a href="#pipeline">Pipeline</a>
          <a href="#campaign">Campaign</a>
          <a href="#inventory">Briefs</a>
          <a href="#scripts">Scripts</a>
          <a href="/" target="_blank" rel="noreferrer">
            Public form
          </a>
        </aside>

        <section className="workspace" id="top">
          <header className="topbar">
            <div>
              <p className="eyebrow">Lilith Homes · Bangkok premium leasing</p>
              <h1>12-month rental pipeline</h1>
            </div>
            <div className="status-strip" aria-label="System status">
              <span className="status-dot" />
              <span>Accepting ฿50K–฿250K briefs</span>
            </div>
          </header>

          <section className="hero-board" aria-label="Premium rental command">
            <div className="hero-media">
              <Image
                src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=84"
                alt="Premium Bangkok residence interior"
                width={1400}
                height={900}
                priority
                unoptimized
              />
            </div>
            <article className="search-panel">
              <div className="search-copy">
                <p className="label">Demand command</p>
                <h2>หาผู้เช่าที่พร้อมเซ็นสัญญา 1 ปี</h2>
                <p>
                  คัดลีดตามงบ ทำเล จำนวนห้องนอน วันเข้าอยู่ และเงื่อนไขสำคัญ
                  แล้วจัดลำดับเพื่อปิด Private Shortlist และนัดชมให้เร็วที่สุด
                </p>
              </div>

              <form className="filters" id="filters">
                <label>
                  Prime areas
                  <input id="areaInput" defaultValue="Phrom Phong, Thong Lo, Sathorn" />
                </label>
                <label>
                  Max monthly rent
                  <select id="budgetInput" defaultValue="150000">
                    <option value="50000">฿50,000</option>
                    <option value="75000">฿75,000</option>
                    <option value="100000">฿100,000</option>
                    <option value="150000">฿150,000</option>
                    <option value="200000">฿200,000</option>
                    <option value="250000">฿250,000</option>
                  </select>
                </label>
                <label>
                  Qualified lead goal
                  <select id="leadGoal" defaultValue="10 qualified leads/week">
                    <option>5 qualified leads/week</option>
                    <option>10 qualified leads/week</option>
                    <option>20 qualified leads/week</option>
                  </select>
                </label>
                <button className="primary-action" type="submit">
                  Match target briefs
                </button>
              </form>
            </article>
          </section>

          <section className="insight-strip" aria-label="Leasing metrics">
            <div>
              <strong id="matchCount">0</strong>
              <span>target search briefs</span>
            </div>
            <div>
              <strong>15m</strong>
              <span>first response target</span>
            </div>
            <div>
              <strong>12 mo.</strong>
              <span>required lease term</span>
            </div>
            <div>
              <strong id="hotLeadCount">0</strong>
              <span>priority leads</span>
            </div>
          </section>

          <section className="lead-ops" id="pipeline" aria-label="Lead pipeline">
            <article className="results-panel">
              <div className="panel-heading">
                <div>
                  <p className="label">Qualified intake</p>
                  <h3>เพิ่มลูกค้าเช่าสัญญา 1 ปี</h3>
                </div>
                <button className="secondary-action" id="loadSeedLeads" type="button">
                  Load examples
                </button>
              </div>
              <form className="lead-form" id="leadForm">
                <label>
                  ชื่อลูกค้า
                  <input id="leadName" placeholder="เช่น Ms. Maya" required />
                </label>
                <label>
                  ข้อมูลติดต่อ
                  <input id="leadContact" placeholder="LINE / phone / email" required />
                </label>
                <label>
                  ช่องทาง
                  <select id="leadSource">
                    <option>Expat community</option>
                    <option>Corporate HR / relocation</option>
                    <option>Facebook group</option>
                    <option>Property portal</option>
                    <option>Referral partner</option>
                    <option>LINE OA</option>
                  </select>
                </label>
                <label>
                  งบสูงสุดต่อเดือน
                  <input
                    id="leadBudget"
                    type="number"
                    min="50000"
                    max="250000"
                    step="5000"
                    defaultValue="100000"
                    required
                  />
                </label>
                <label>
                  ทำเลที่ต้องการ
                  <input id="leadArea" defaultValue="Phrom Phong" required />
                </label>
                <label>
                  ประเภทที่พัก
                  <select id="leadPropertyType" defaultValue="Condo">
                    <option>Condo</option>
                    <option>House</option>
                    <option>Apartment</option>
                    <option>Penthouse</option>
                    <option>Townhome</option>
                  </select>
                </label>
                <label>
                  ห้องนอน
                  <select id="leadBedrooms" defaultValue="2">
                    <option value="1">1 bedroom</option>
                    <option value="2">2 bedrooms</option>
                    <option value="3">3 bedrooms</option>
                    <option value="4">4 bedrooms</option>
                    <option value="5">5+ bedrooms</option>
                  </select>
                </label>
                <label>
                  วันเข้าอยู่
                  <input id="moveDate" type="date" required />
                </label>
                <label>
                  เวลาสะดวกนัดชม
                  <select id="leadViewingWindow">
                    <option>วันนี้ช่วงเย็น</option>
                    <option>พรุ่งนี้ช่วงเช้า</option>
                    <option>พรุ่งนี้ช่วงเย็น</option>
                    <option>วันธรรมดา</option>
                    <option>เสาร์-อาทิตย์</option>
                    <option>Video viewing first</option>
                  </select>
                </label>
                <label>
                  ภาษา
                  <select id="leadLanguage">
                    <option>ไทย</option>
                    <option>English</option>
                    <option>ไทย / English</option>
                  </select>
                </label>
                <label>
                  สัตว์เลี้ยง
                  <select id="leadPets">
                    <option>ไม่มี</option>
                    <option>มีสุนัข</option>
                    <option>มีแมว</option>
                    <option>มีสัตว์เลี้ยงอื่น</option>
                  </select>
                </label>
                <label>
                  สถานะ
                  <select id="leadStage">
                    <option>New inquiry</option>
                    <option>Qualified</option>
                    <option>Shortlist sent</option>
                    <option>Viewing booked</option>
                    <option>Offer submitted</option>
                    <option>Deposit pending</option>
                  </select>
                </label>
                <label className="form-wide">
                  เงื่อนไขสำคัญ
                  <textarea id="leadRequirements" rows={3} placeholder="Pet-friendly, school, maid room, parking..." />
                </label>
                <button className="primary-action" type="submit">
                  Add qualified lead
                </button>
              </form>
            </article>

            <article className="results-panel">
              <div className="panel-heading">
                <div>
                  <p className="label">Priority queue</p>
                  <h3>งานที่ต้องทำเพื่อปิดนัดชม</h3>
                </div>
                <div className="button-row">
                  <button className="secondary-action" id="exportLeads" type="button">
                    Export CSV
                  </button>
                  <button className="secondary-action" id="clearLeads" type="button">
                    Remove examples
                  </button>
                </div>
              </div>
              <div className="lead-table" id="leadTable" />
            </article>
          </section>

          <section className="acquisition-launch" id="campaign" aria-label="Campaign builder">
            <article className="results-panel">
              <div className="panel-heading">
                <div>
                  <p className="label">Premium acquisition</p>
                  <h3>สร้างข้อความหาผู้เช่าที่ตรงกลุ่ม</h3>
                </div>
                <button className="primary-action compact-action" id="buildCampaign" type="button">
                  Build campaign
                </button>
              </div>
              <div className="campaign-controls">
                <label>
                  ช่องทางหลัก
                  <select id="campaignChannel">
                    <option>Expat community post</option>
                    <option>Corporate HR / relocation outreach</option>
                    <option>Facebook premium rental group</option>
                    <option>Property portal refresh</option>
                    <option>Referral partner push</option>
                  </select>
                </label>
                <label>
                  กลุ่มลูกค้า
                  <select id="renterPersona">
                    <option>expat executive relocating to Bangkok</option>
                    <option>family near an international school</option>
                    <option>diplomatic or international organization staff</option>
                    <option>Thai executive seeking a premium residence</option>
                  </select>
                </label>
                <label>
                  ข้อเสนอ
                  <input id="campaignOffer" defaultValue="private shortlist and coordinated viewing route" />
                </label>
              </div>
              <div className="campaign-output" id="campaignOutput">
                <section>
                  <h4>Post copy</h4>
                  <p>เลือกช่องทางและกด Build campaign เพื่อสร้างข้อความพร้อมลิงก์ติดตามผล</p>
                </section>
                <section>
                  <h4>Daily actions</h4>
                  <ul>
                    <li>เลือก persona เดียวต่อโพสต์</li>
                    <li>ตอบทุก brief ภายใน 15 นาที</li>
                    <li>ยืนยันงบ สัญญา 1 ปี และวันเข้าอยู่ก่อนส่ง shortlist</li>
                  </ul>
                </section>
              </div>
            </article>
          </section>

          <section className="content-grid" id="inventory" aria-label="Target inventory briefs">
            <article className="results-panel">
              <div className="panel-heading">
                <div>
                  <p className="label">Target inventory</p>
                  <h3>รูปแบบทรัพย์ที่ควรหาให้แคมเปญ</h3>
                </div>
                <span className="stage-pill">Planning briefs</span>
              </div>
              <div className="listing-list" id="listingList" />
            </article>

            <aside className="side-stack">
              <article className="service-panel">
                <p className="label">Qualification standard</p>
                <h3>Lead พร้อมคุยต่อเมื่อมีข้อมูลครบ</h3>
                <ul className="service-list">
                  <li>
                    <strong>Fit</strong>
                    <span>งบ ฿50K–฿250K, ทำเล, ประเภททรัพย์ และจำนวนห้องนอน</span>
                  </li>
                  <li>
                    <strong>Timing</strong>
                    <span>วันเข้าอยู่และช่วงเวลาที่สะดวกนัดชม</span>
                  </li>
                  <li>
                    <strong>Commitment</strong>
                    <span>ยืนยันสัญญา 12 เดือน พร้อมข้อมูลติดต่อที่ตอบกลับได้</span>
                  </li>
                  <li>
                    <strong>Constraints</strong>
                    <span>สัตว์เลี้ยง โรงเรียน ที่จอดรถ ห้องแม่บ้าน และเงื่อนไขบริษัท</span>
                  </li>
                </ul>
              </article>
            </aside>
          </section>

          <section className="leasing-command" id="scripts">
            <article className="results-panel">
              <div className="panel-heading">
                <div>
                  <p className="label">Closing desk</p>
                  <h3>สคริปต์ตอบกลับและแผนวันนี้</h3>
                </div>
                <button className="primary-action compact-action" id="generateLeadPlan" type="button">
                  Generate lead plan
                </button>
              </div>
              <div className="lead-console" id="leadConsole">
                <strong>Lead plan</strong>
                <span>เลือกทำเล งบ และช่องทางด้านบน แล้วสร้างแผนติดตามรายวัน</span>
              </div>
              <div className="script-box" id="scriptBox">
                <strong>LINE closing script</strong>
                <p>
                  สวัสดีค่ะ ขอบคุณที่ส่งโจทย์เช่า 1 ปีเข้ามา ทีมขอยืนยันงบ ทำเล
                  วันเข้าอยู่ และช่วงเวลานัดชมก่อนเริ่มคัด Private Shortlist ค่ะ
                </p>
              </div>
            </article>
          </section>
        </section>
      </main>
      <Script src="/script.js" strategy="afterInteractive" />
    </>
  );
}
