import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Lilith Homes | International Thailand Real Estate Agent",
  description:
    "Multilingual Thailand real estate agent desk for Thai, Chinese, English-speaking and Russian clients. Capture rental, buyer and partner referral briefs with SEO-ready on-page content.",
  keywords: [
    "Thailand real estate agent",
    "Bangkok property agent",
    "Chinese real estate agent Thailand",
    "Bangkok condo rent",
    "Thailand property buyers",
    "Russian property clients Thailand",
  ],
};

const languages = [
  {
    code: "TH",
    title: "ไทย",
    heading: "หาบ้าน คอนโด และลูกค้าอสังหาแบบมีข้อมูลพร้อมปิด",
    body: "รับโจทย์เช่า ซื้อ ขาย และ referral จากพาร์ตเนอร์ แล้วจัดข้อมูลให้ทีมตามต่อได้ทันที",
  },
  {
    code: "CN",
    title: "中文",
    heading: "泰国房产咨询与客户转介",
    body: "支持中国客户、微信联系、预算、区域、入住日期与中介公司资料，方便快速跟进。",
  },
  {
    code: "US",
    title: "English",
    heading: "Thailand property desk for expats and overseas buyers",
    body: "Collect qualified briefs for long-stay rentals, condo purchases, owner listings and partner referrals.",
  },
  {
    code: "RU",
    title: "Русский",
    heading: "Недвижимость в Таиланде для русскоязычных клиентов",
    body: "Заявки по аренде, покупке и партнерским рекомендациям с понятным статусом для команды.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "Lilith Homes",
  url: "https://lilith-renter-leads.yacht369.chatgpt.site",
  areaServed: ["Bangkok", "Thailand", "China", "United States", "Russia"],
  availableLanguage: ["Thai", "Chinese", "English", "Russian"],
  serviceType: [
    "12-month rental search",
    "Condominium buyer representation",
    "Owner listing intake",
    "Cross-border agent referral",
  ],
  priceRange: "THB 30,000-250,000 monthly rent; THB 1,000,000+ purchase briefs",
};

export default function Home() {
  return (
    <main className="public-page international-page">
      <nav className="public-nav" aria-label="Lilith Homes">
        <a href="#top" className="public-brand">
          <span aria-hidden="true">LH</span>
          <strong>Lilith Homes</strong>
        </a>
        <div className="public-nav-links" aria-label="Page sections">
          <a href="#languages">4 languages</a>
          <a href="#china-agent">China agent desk</a>
          <a href="#seo-api">SEO + API</a>
        </div>
      </nav>

      <section className="public-hero global-hero" id="top">
        <article className="public-copy global-copy">
          <div>
            <p className="label">International real estate agent · Thailand</p>
            <h1>เว็บแอปเอเจนต์อสังหา 4 ภาษา สำหรับ lead ไทย จีน อเมริกัน และรัสเซีย</h1>
            <p className="public-intro">
              Lilith Homes รับโจทย์เช่า ซื้อ ขาย และ referral จากเอเจนต์ต่างประเทศ
              แล้วจัดข้อมูลสำคัญให้ทีมคัดทรัพย์ ติดต่อกลับ และปิดนัดชมได้เร็วขึ้น
            </p>
            <p className="public-english">
              SEO-ready Thailand property intake for Chinese brokers, expat tenants,
              overseas buyers and Russian-speaking clients.
            </p>
          </div>

          <div className="public-stats" aria-label="Service scope">
            <span>Rent · Buy · List · Refer</span>
            <span>Thai · 中文 · English · Русский</span>
            <span>CSV / JSON import API</span>
          </div>

          <div className="public-focus" aria-label="Target client segments">
            <strong>Prime Bangkok and Thailand property desk</strong>
            <p>
              Bangkok CBD · Riverside · Sukhumvit · Sathorn · Pattaya · Phuket ·
              Chinese agency referral · overseas relocation
            </p>
          </div>
        </article>

        <form className="public-form" id="publicLeadForm">
          <div className="form-heading">
            <p className="label">Qualified property brief</p>
            <h2>ส่งโจทย์ลูกค้า / Agent Lead</h2>
            <p>ข้อมูลนี้ใช้คัดทรัพย์และติดต่อกลับผ่านทีม Lilith Homes</p>
          </div>

          <div className="form-grid">
            <label>
              ประเภทโจทย์
              <select id="publicDealIntent" name="dealIntent" defaultValue="Rent 12-month">
                <option>Rent 12-month</option>
                <option>Buy condo</option>
                <option>Sell/List property</option>
                <option>China agent referral</option>
              </select>
            </label>
            <label>
              ประเทศลูกค้า
              <select id="publicCustomerCountry" name="customerCountry" defaultValue="China">
                <option>Thailand</option>
                <option>China</option>
                <option>United States</option>
                <option>Russia</option>
                <option>Other</option>
              </select>
            </label>
            <label>
              ชื่อลูกค้า / Agent
              <input
                id="publicName"
                name="name"
                autoComplete="name"
                placeholder="เช่น Ms. Li / คุณภัทร / Agent Ivan"
                required
              />
            </label>
            <label>
              โทร / Email / LINE
              <input
                id="publicContact"
                name="contact"
                autoComplete="tel"
                placeholder="ข้อมูลติดต่อที่ตอบกลับได้"
                required
              />
            </label>
            <label>
              WeChat / 微信
              <input id="publicWechat" name="wechat" placeholder="WeChat ID ถ้ามี" />
            </label>
            <label>
              ภาษาที่สะดวก
              <select id="publicLanguage" name="preferredLanguage" defaultValue="中文 / English">
                <option>ไทย</option>
                <option>中文</option>
                <option>English</option>
                <option>Русский</option>
                <option>中文 / English</option>
                <option>ไทย / English</option>
              </select>
            </label>
            <label>
              ประเภทงบ
              <select id="publicBudgetPeriod" name="budgetPeriod" defaultValue="Monthly rent">
                <option>Monthly rent</option>
                <option>Purchase budget</option>
                <option>Listing value</option>
              </select>
            </label>
            <label>
              งบประมาณ THB
              <input
                id="publicBudget"
                name="budget"
                type="number"
                inputMode="numeric"
                min="30000"
                max="250000"
                step="5000"
                defaultValue="120000"
                required
              />
            </label>
            <label>
              ทำเลที่ต้องการ
              <input
                id="publicArea"
                name="area"
                placeholder="เช่น Phrom Phong, Sathorn, Pattaya, Phuket"
                required
              />
            </label>
            <label>
              ประเภททรัพย์
              <select id="publicPropertyType" name="propertyType" defaultValue="Condo">
                <option>Condo</option>
                <option>House</option>
                <option>Villa</option>
                <option>Apartment</option>
                <option>Penthouse</option>
                <option>Townhome</option>
                <option>Land</option>
              </select>
            </label>
            <label>
              ห้องนอน
              <select id="publicBedrooms" name="bedrooms" defaultValue="2">
                <option value="0">Studio / N/A</option>
                <option value="1">1 bedroom</option>
                <option value="2">2 bedrooms</option>
                <option value="3">3 bedrooms</option>
                <option value="4">4 bedrooms</option>
                <option value="5">5 bedrooms</option>
                <option value="6">6+ bedrooms</option>
              </select>
            </label>
            <label>
              วันเข้าอยู่ / วันพร้อมขาย
              <input id="publicMoveDate" name="moveDate" type="date" />
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
            <label>
              ระยะสัญญา
              <select id="publicContractTerm" name="contractTerm" defaultValue="12 months">
                <option>12 months</option>
                <option>Not applicable</option>
              </select>
            </label>
            <label>
              บริษัทพาร์ตเนอร์
              <input id="publicPartnerAgency" name="partnerAgency" placeholder="เช่น Shanghai relocation desk" />
            </label>
            <label>
              ชื่อเอเจนต์พาร์ตเนอร์
              <input id="publicPartnerAgent" name="partnerAgent" placeholder="ชื่อผู้ส่ง lead" />
            </label>
            <label className="form-wide">
              ติดต่อพาร์ตเนอร์
              <input id="publicPartnerContact" name="partnerContact" placeholder="WeChat / Email / Phone ของ agent" />
            </label>
            <label className="form-wide">
              เงื่อนไขสำคัญ
              <textarea
                id="publicRequirements"
                name="requirements"
                rows={3}
                placeholder="เช่น near BTS, foreign quota, pet-friendly, school, invoice support, preferred projects"
              />
            </label>
          </div>

          <label className="trap-field" aria-hidden="true">
            Website
            <input id="publicWebsite" tabIndex={-1} autoComplete="off" />
          </label>
          <label className="consent-row">
            <input id="publicConsent" type="checkbox" required />
            <span>
              ยืนยันว่ามีสิทธิ์ส่งข้อมูลนี้ให้ Lilith Homes ติดต่อกลับและประสานงานอสังหา
            </span>
          </label>
          <button className="primary-action" type="submit">
            ส่งโจทย์ให้ทีม Lilith
          </button>
          <p className="public-status" id="publicStatus" role="status" aria-live="polite">
            รองรับลูกค้าไทย จีน อังกฤษ และรัสเซีย · ฟอร์ม public ไม่เปิดเผยรายชื่อ lead
          </p>
        </form>
      </section>

      <section className="language-section" id="languages" aria-label="Multilingual real estate intake">
        {languages.map((language) => (
          <article className="language-card" key={language.code}>
            <span>{language.code}</span>
            <h2>{language.title}</h2>
            <h3>{language.heading}</h3>
            <p>{language.body}</p>
          </article>
        ))}
      </section>

      <section className="public-proof" aria-label="Agent workflow">
        <article>
          <strong>01 · Capture</strong>
          <span>รับ lead จาก public form, agent partner, CSV หรือ JSON API</span>
        </article>
        <article>
          <strong>02 · Qualify</strong>
          <span>ตรวจงบ ทำเล ประเภททรัพย์ ภาษา ประเทศ และช่องทางติดต่อ</span>
        </article>
        <article>
          <strong>03 · Match</strong>
          <span>คัดทรัพย์และจัดลำดับงานให้ทีมตอบกลับหรือนัดชม</span>
        </article>
        <article>
          <strong>04 · Close</strong>
          <span>ส่ง shortlist, นัดชม, ทำข้อเสนอ และประสาน partner referral</span>
        </article>
      </section>

      <section className="seo-api-section" id="seo-api" aria-label="SEO and API readiness">
        <article>
          <p className="label">On-page SEO</p>
          <h2>พร้อมทำ SEO ตั้งแต่หน้าแรก</h2>
          <p>
            มี title, description, keyword intent, heading hierarchy, language content,
            internal anchors, Open Graph และ structured data สำหรับ real estate agent
          </p>
        </article>
        <article id="china-agent">
          <p className="label">China agent desk</p>
          <h2>รับข้อมูลจากเอเจนต์จีน</h2>
          <p>
            Partner สามารถส่ง CSV จาก Excel หรือ JSON ผ่าน `/api/import` หลังตั้งค่า
            import token แล้ว ข้อมูลจะเข้าคิวเดียวกับ dashboard
          </p>
        </article>
      </section>

      <footer className="public-footer">
        <strong>Lilith Homes</strong>
        <span>International Thailand real estate lead desk · Rent · Buy · List · Refer</span>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Script src="/capture.js" strategy="afterInteractive" />
    </main>
  );
}
