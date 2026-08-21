import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Lilith Homes | หาห้องเช่ากรุงเทพ",
  description:
    "ส่งงบ ทำเล และวันเข้าอยู่ ให้ Lilith คัดห้องเช่ากรุงเทพพร้อมรูป ค่าแรกเข้า และเวลานัดดูห้อง",
};

export default function Home() {
  return (
    <>
      <main className="public-page">
        <section className="public-hero">
          <div className="public-copy">
            <p className="label">Lilith Homes</p>
            <h1>หาห้องเช่ากรุงเทพที่ตรงงบ โดยไม่ต้องไล่ทักหลายประกาศ</h1>
            <p>
              ส่งชื่อ/LINE งบ ทำเล และวันเข้าอยู่ เดี๋ยว Lilith คัดห้องพร้อมรูป
              ค่าแรกเข้า และเวลานัดดูห้องให้ภายในวันนี้
            </p>
            <div className="public-stats" aria-label="Service highlights">
              <span>ใกล้ BTS/MRT</span>
              <span>งบ 12k-50k</span>
              <span>นัดดูได้เร็ว</span>
            </div>
          </div>
          <form className="public-form" id="publicLeadForm">
            <div>
              <p className="label">Inquiry</p>
              <h2>ให้เราคัดห้องให้</h2>
            </div>
            <label>
              ชื่อ / LINE
              <input id="publicName" placeholder="เช่น May / @lineid" required />
            </label>
            <label>
              งบประมาณ
              <select id="publicBudget">
                <option value="12000">ไม่เกิน ฿12,000</option>
                <option value="18000">ไม่เกิน ฿18,000</option>
                <option value="28000" selected>
                  ไม่เกิน ฿28,000
                </option>
                <option value="35000">ไม่เกิน ฿35,000</option>
                <option value="50000">ไม่เกิน ฿50,000</option>
              </select>
            </label>
            <label>
              ทำเลที่อยากได้
              <input id="publicArea" placeholder="เช่น Asoke, Phrom Phong, BTS/MRT" required />
            </label>
            <label>
              วันเข้าอยู่
              <input id="publicMoveDate" type="date" />
            </label>
            <label>
              เวลาสะดวกดูห้อง
              <select id="publicViewingWindow">
                <option>วันนี้ช่วงเย็น</option>
                <option>พรุ่งนี้ช่วงเช้า</option>
                <option>พรุ่งนี้ช่วงเย็น</option>
                <option>เสาร์-อาทิตย์</option>
              </select>
            </label>
            <label className="trap-field" aria-hidden="true">
              Website
              <input id="publicWebsite" tabIndex={-1} autoComplete="off" />
            </label>
            <button className="primary-action" type="submit">
              ส่งข้อมูลให้ Lilith
            </button>
            <p className="public-status" id="publicStatus">
              ทีมจะติดต่อกลับพร้อม shortlist ห้องที่ตรงงบและทำเลของคุณ
            </p>
          </form>
        </section>
        <section className="public-proof" aria-label="How it works">
          <article>
            <strong>1. บอกโจทย์</strong>
            <span>งบ ทำเล วันเข้าอยู่ และเวลาที่สะดวกดูห้อง</span>
          </article>
          <article>
            <strong>2. รับ shortlist</strong>
            <span>ทีมคัดห้องพร้อมรูป ค่าแรกเข้า แผนที่ และจุดเด่น</span>
          </article>
          <article>
            <strong>3. นัดดูห้อง</strong>
            <span>เลือกเวลา แล้วทีมช่วยยืนยันห้องและรายละเอียดก่อนเข้าไปดู</span>
          </article>
        </section>
      </main>
      <Script src="/capture.js" strategy="afterInteractive" />
    </>
  );
}
