import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Lilith Homes | บ้านและคอนโดเช่าพรีเมียม กรุงเทพ",
  description:
    "บริการคัดบ้าน คอนโด และเพนต์เฮาส์เช่าในกรุงเทพ งบ 50,000-250,000 บาทต่อเดือน สำหรับสัญญา 1 ปี",
};

export default function Home() {
  return (
    <main className="public-page">
      <nav className="public-nav" aria-label="Lilith Homes">
        <a href="#top" className="public-brand">
          <span aria-hidden="true">LH</span>
          <strong>Lilith Homes</strong>
        </a>
        <span>Bangkok · 12-month lease</span>
      </nav>

      <section className="public-hero" id="top">
        <article className="public-copy">
          <div>
            <p className="label">Private rental search · Bangkok</p>
            <h1>บ้านและคอนโดเช่าระดับพรีเมียม งบ 50,000–250,000 บาท</h1>
            <p className="public-intro">
              บอกโจทย์ครั้งเดียว แล้ว Lilith คัดตัวเลือกสำหรับสัญญา 1 ปี
              พร้อมเทียบห้อง ค่าแรกเข้า เงื่อนไข และจัดเส้นทางนัดชมให้เป็นชุด
            </p>
            <p className="public-english">
              Curated Bangkok homes for executives, expats and families seeking a
              12-month lease.
            </p>
          </div>

          <div className="public-stats" aria-label="Service scope">
            <span>฿50K–฿250K / month</span>
            <span>12-month contract</span>
            <span>Condo · House · Penthouse</span>
          </div>

          <div className="public-focus" aria-label="Popular search areas">
            <strong>Prime search areas</strong>
            <p>
              Phrom Phong · Thong Lo · Ekkamai · Asoke · Langsuan · Wireless ·
              Sathorn · Riverside
            </p>
          </div>
        </article>

        <form className="public-form" id="publicLeadForm">
          <div className="form-heading">
            <p className="label">Private brief</p>
            <h2>รับ Private Shortlist</h2>
            <p>ทีมใช้ข้อมูลนี้คัดทรัพย์และติดต่อกลับเพื่อยืนยันโจทย์</p>
          </div>

          <div className="form-grid">
            <label>
              ชื่อผู้เช่า
              <input
                id="publicName"
                name="name"
                autoComplete="name"
                placeholder="ชื่อที่ใช้ติดต่อ"
                required
              />
            </label>
            <label>
              LINE / โทรศัพท์ / Email
              <input
                id="publicContact"
                name="contact"
                autoComplete="tel"
                placeholder="เช่น @lineid หรือ 08x-xxx-xxxx"
                required
              />
            </label>
            <label>
              งบต่อเดือน
              <select id="publicBudget" name="budget" defaultValue="100000">
                <option value="50000">ไม่เกิน ฿50,000</option>
                <option value="75000">ไม่เกิน ฿75,000</option>
                <option value="100000">ไม่เกิน ฿100,000</option>
                <option value="150000">ไม่เกิน ฿150,000</option>
                <option value="200000">ไม่เกิน ฿200,000</option>
                <option value="250000">ไม่เกิน ฿250,000</option>
              </select>
            </label>
            <label>
              ประเภทที่พัก
              <select id="publicPropertyType" name="propertyType" defaultValue="Condo">
                <option>Condo</option>
                <option>House</option>
                <option>Apartment</option>
                <option>Penthouse</option>
                <option>Townhome</option>
              </select>
            </label>
            <label>
              จำนวนห้องนอน
              <select id="publicBedrooms" name="bedrooms" defaultValue="2">
                <option value="1">1 bedroom</option>
                <option value="2">2 bedrooms</option>
                <option value="3">3 bedrooms</option>
                <option value="4">4 bedrooms</option>
                <option value="5">5+ bedrooms</option>
              </select>
            </label>
            <label>
              ทำเลที่ต้องการ
              <input
                id="publicArea"
                name="area"
                placeholder="เช่น Phrom Phong, Sathorn, ใกล้ ISB"
                required
              />
            </label>
            <label>
              วันเข้าอยู่
              <input id="publicMoveDate" name="moveDate" type="date" required />
            </label>
            <label>
              เวลาสะดวกนัดชม
              <select id="publicViewingWindow" name="viewingWindow">
                <option>วันนี้ช่วงเย็น</option>
                <option>พรุ่งนี้ช่วงเช้า</option>
                <option>พรุ่งนี้ช่วงเย็น</option>
                <option>วันธรรมดา</option>
                <option>เสาร์-อาทิตย์</option>
                <option>Video viewing first</option>
              </select>
            </label>
            <details className="optional-brief form-wide">
              <summary>เพิ่มภาษา สัตว์เลี้ยง และสิ่งที่ต้องมี</summary>
              <div className="optional-grid">
                <label>
                  ภาษาที่สะดวก
                  <select id="publicLanguage" name="preferredLanguage">
                    <option>ไทย</option>
                    <option>English</option>
                    <option>ไทย / English</option>
                  </select>
                </label>
                <label>
                  สัตว์เลี้ยง
                  <select id="publicPets" name="pets">
                    <option>ไม่มี</option>
                    <option>มีสุนัข</option>
                    <option>มีแมว</option>
                    <option>มีสัตว์เลี้ยงอื่น</option>
                  </select>
                </label>
                <label className="form-wide">
                  สิ่งที่ต้องมี
                  <textarea
                    id="publicRequirements"
                    name="requirements"
                    rows={3}
                    placeholder="เช่น pet-friendly, 3 ห้องนอน, ใกล้โรงเรียนนานาชาติ, มีห้องแม่บ้าน"
                  />
                </label>
              </div>
            </details>
          </div>

          <input id="publicContractTerm" type="hidden" value="12 months" />
          <label className="trap-field" aria-hidden="true">
            Website
            <input id="publicWebsite" tabIndex={-1} autoComplete="off" />
          </label>
          <label className="consent-row">
            <input id="publicConsent" type="checkbox" required />
            <span>
              ต้องการเช่าสัญญา 1 ปี และยินยอมให้ Lilith ติดต่อกลับตามข้อมูลที่ให้ไว้
            </span>
          </label>
          <button className="primary-action" type="submit">
            ขอรับ Private Shortlist
          </button>
          <p className="public-status" id="publicStatus" role="status" aria-live="polite">
            ไม่มีค่าใช้จ่ายสำหรับการส่งโจทย์ · ข้อมูลใช้เพื่อประสานการเช่าเท่านั้น
          </p>
        </form>
      </section>

      <section className="public-proof" aria-label="Private rental process">
        <article>
          <strong>01 · Confirm the brief</strong>
          <span>ยืนยันงบ ทำเล จำนวนห้องนอน วันเข้าอยู่ และเงื่อนไขสำคัญ</span>
        </article>
        <article>
          <strong>02 · Curated shortlist</strong>
          <span>คัดตัวเลือกที่ตรงโจทย์ พร้อมรูป ค่าแรกเข้า และข้อแตกต่างของแต่ละห้อง</span>
        </article>
        <article>
          <strong>03 · Viewing route</strong>
          <span>จัดนัดชมหลายห้องในเส้นทางเดียว และยืนยันสถานะก่อนออกเดินทาง</span>
        </article>
        <article>
          <strong>04 · Contract support</strong>
          <span>ช่วยประสานข้อเสนอ เอกสาร สัญญา 1 ปี และรายละเอียดก่อนเข้าอยู่</span>
        </article>
      </section>

      <footer className="public-footer">
        <strong>Lilith Homes</strong>
        <span>Private Bangkok rental search · ฿50,000–฿250,000 / month</span>
      </footer>

      <Script src="/capture.js" strategy="afterInteractive" />
    </main>
  );
}
