import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Lilith Homes | Multilingual Thailand Real Estate Agent",
  description:
    "Seven-language Thailand real estate agent desk for English, Vietnamese, Thai, Korean, Japanese, Chinese and Russian clients. Capture rental, buyer and partner referral briefs with SEO-ready on-page content.",
  keywords: [
    "Thailand real estate agent",
    "Bangkok property agent",
    "Bangkok condo rent",
    "Vietnamese real estate agent Thailand",
    "Korean real estate agent Thailand",
    "Japanese real estate agent Thailand",
    "Chinese real estate agent Thailand",
    "Russian property clients Thailand",
  ],
};

const languages = [
  {
    code: "EN",
    locale: "en",
    title: "English",
    heading: "Thailand property desk for expats and overseas buyers",
    body: "Collect qualified briefs for long-stay rentals, condo purchases, owner listings and partner referrals.",
  },
  {
    code: "VI",
    locale: "vi",
    title: "Tiếng Việt",
    heading: "Dịch vụ bất động sản Thái Lan cho khách Việt",
    body: "Tiếp nhận nhu cầu thuê, mua, ký gửi và giới thiệu đối tác bằng thông tin rõ ràng để đội ngũ theo sát nhanh.",
  },
  {
    code: "TH",
    locale: "th",
    title: "ไทย",
    heading: "หาบ้าน คอนโด และลูกค้าอสังหาแบบมีข้อมูลพร้อมปิด",
    body: "รับโจทย์เช่า ซื้อ ขาย และ referral จากพาร์ตเนอร์ แล้วจัดข้อมูลให้ทีมตามต่อได้ทันที",
  },
  {
    code: "KO",
    locale: "ko",
    title: "한국어",
    heading: "태국 부동산 상담 및 렌트 브리프 접수",
    body: "방콕 렌트, 콘도 구매, 매물 등록, 파트너 추천 정보를 정리해 빠르게 후속 연락합니다.",
  },
  {
    code: "JA",
    locale: "ja",
    title: "日本語",
    heading: "タイ不動産の賃貸・購入相談デスク",
    body: "長期賃貸、コンドミニアム購入、売却相談、紹介案件を整理し、チームが迅速に対応します。",
  },
  {
    code: "ZH",
    locale: "zh",
    title: "中文",
    heading: "泰国房产咨询与客户转介",
    body: "支持中国客户、微信联系、预算、区域、入住日期与中介公司资料，方便快速跟进。",
  },
  {
    code: "RU",
    locale: "ru",
    title: "Русский",
    heading: "Недвижимость в Таиланде для русскоязычных клиентов",
    body: "Заявки по аренде, покупке и партнерским рекомендациям с понятным статусом для команды.",
  },
];

const countryOptions = [
  "Thailand",
  "Vietnam",
  "South Korea",
  "Japan",
  "China",
  "Russia",
  "United States",
  "Other",
];

const languageOptions = [
  "English",
  "Vietnamese",
  "Thai",
  "Korean",
  "Japanese",
  "Chinese",
  "Russian",
  "Chinese / English",
  "Thai / English",
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "Lilith Homes",
  url: "https://lilith-renter-leads.yacht369.chatgpt.site",
  areaServed: [
    "Bangkok",
    "Thailand",
    "Vietnam",
    "South Korea",
    "Japan",
    "China",
    "United States",
    "Russia",
  ],
  availableLanguage: [
    "English",
    "Vietnamese",
    "Thai",
    "Korean",
    "Japanese",
    "Chinese",
    "Russian",
  ],
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
          <a href="#languages" data-i18n="navLanguages">
            7 languages
          </a>
          <a href="#capabilities" data-i18n="navCapabilities">
            Capabilities
          </a>
          <a href="#asia-agent" data-i18n="navAgent">
            Asia agent desk
          </a>
          <a href="#seo-api" data-i18n="navSeo">
            SEO + API
          </a>
        </div>
      </nav>

      <section className="public-hero global-hero" id="top">
        <article className="public-copy global-copy">
          <div>
            <p className="label" data-i18n="heroLabel">
              International real estate agent · Thailand
            </p>
            <h1 data-i18n="heroTitle">
              Seven-language Thailand property desk for rentals, buyers and agent referrals
            </h1>
            <p className="public-intro" data-i18n="heroIntro">
              Lilith Homes captures rental, buyer, owner-listing and partner-referral briefs,
              then gives the team the details needed to shortlist homes, call back and book viewings.
            </p>
            <p className="public-english" data-i18n="heroSubcopy">
              Built for English, Vietnamese, Thai, Korean, Japanese, Chinese and Russian clients.
            </p>
          </div>

          <div className="language-switcher" aria-label="Choose language">
            {languages.map((language) => (
              <button
                type="button"
                className="language-pill"
                data-lang-option={language.locale}
                key={language.locale}
              >
                {language.code}
              </button>
            ))}
          </div>

          <div className="public-stats" aria-label="Service scope">
            <span data-i18n="statService">Rent · Buy · List · Refer</span>
            <span data-i18n="statLanguages">EN · VI · TH · KO · JA · ZH · RU</span>
            <span data-i18n="statApi">CSV / JSON import API</span>
          </div>

          <div className="public-focus" aria-label="Target client segments">
            <strong data-i18n="focusTitle">Prime Bangkok and Thailand property desk</strong>
            <p data-i18n="focusBody">
              Bangkok CBD · Riverside · Sukhumvit · Sathorn · Pattaya · Phuket · expat
              relocation · overseas agency referral
            </p>
          </div>
        </article>

        <form className="public-form" id="publicLeadForm">
          <div className="form-heading">
            <p className="label" data-i18n="formLabel">
              Qualified property brief
            </p>
            <h2 data-i18n="formTitle">Send your property brief</h2>
            <p data-i18n="formIntro">
              This information helps Lilith Homes shortlist properties and contact you back.
            </p>
          </div>

          <div className="form-grid">
            <label>
              <span data-i18n="dealIntentLabel">Request type</span>
              <select id="publicDealIntent" name="dealIntent" defaultValue="Rent 12-month">
                <option value="Rent 12-month" data-i18n="intentRent">
                  Rent 12-month
                </option>
                <option value="Buy condo" data-i18n="intentBuy">
                  Buy condo
                </option>
                <option value="Sell/List property" data-i18n="intentSell">
                  Sell/List property
                </option>
                <option value="China agent referral" data-i18n="intentReferral">
                  Agent referral
                </option>
              </select>
            </label>
            <label>
              <span data-i18n="countryLabel">Customer country</span>
              <select id="publicCustomerCountry" name="customerCountry" defaultValue="Thailand">
                {countryOptions.map((country) => (
                  <option value={country} key={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span data-i18n="nameLabel">Customer / Agent name</span>
              <input
                id="publicName"
                name="name"
                autoComplete="name"
                data-i18n-placeholder="namePlaceholder"
                placeholder="e.g. Ms. Li / Mr. Nguyen / Agent Ivan"
                required
              />
            </label>
            <label>
              <span data-i18n="contactLabel">Phone / Email / LINE</span>
              <input
                id="publicContact"
                name="contact"
                autoComplete="tel"
                data-i18n-placeholder="contactPlaceholder"
                placeholder="Best contact channel for reply"
                required
              />
            </label>
            <label>
              <span data-i18n="wechatLabel">WeChat / Kakao / Zalo</span>
              <input
                id="publicWechat"
                name="wechat"
                data-i18n-placeholder="wechatPlaceholder"
                placeholder="Messaging ID if available"
              />
            </label>
            <label>
              <span data-i18n="languageLabel">Preferred language</span>
              <select id="publicLanguage" name="preferredLanguage" defaultValue="English">
                {languageOptions.map((language) => (
                  <option value={language} key={language}>
                    {language}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span data-i18n="budgetPeriodLabel">Budget type</span>
              <select id="publicBudgetPeriod" name="budgetPeriod" defaultValue="Monthly rent">
                <option value="Monthly rent" data-i18n="budgetMonthly">
                  Monthly rent
                </option>
                <option value="Purchase budget" data-i18n="budgetPurchase">
                  Purchase budget
                </option>
                <option value="Listing value" data-i18n="budgetListing">
                  Listing value
                </option>
              </select>
            </label>
            <label>
              <span data-i18n="budgetLabel">Budget THB</span>
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
              <span data-i18n="areaLabel">Preferred area</span>
              <input
                id="publicArea"
                name="area"
                data-i18n-placeholder="areaPlaceholder"
                placeholder="e.g. Phrom Phong, Sathorn, Pattaya, Phuket"
                required
              />
            </label>
            <label>
              <span data-i18n="propertyTypeLabel">Property type</span>
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
              <span data-i18n="bedroomsLabel">Bedrooms</span>
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
              <span data-i18n="moveDateLabel">Move-in / available date</span>
              <input id="publicMoveDate" name="moveDate" type="date" />
            </label>
            <label>
              <span data-i18n="viewingLabel">Viewing window</span>
              <select id="publicViewingWindow" name="viewingWindow">
                <option value="This evening" data-i18n="viewingTodayEvening">
                  This evening
                </option>
                <option value="Tomorrow morning" data-i18n="viewingTomorrowMorning">
                  Tomorrow morning
                </option>
                <option value="Tomorrow evening" data-i18n="viewingTomorrowEvening">
                  Tomorrow evening
                </option>
                <option value="Weekday" data-i18n="viewingWeekday">
                  Weekday
                </option>
                <option value="Weekend" data-i18n="viewingWeekend">
                  Weekend
                </option>
                <option value="Video viewing first" data-i18n="viewingVideo">
                  Video viewing first
                </option>
              </select>
            </label>
            <label>
              <span data-i18n="contractLabel">Contract term</span>
              <select id="publicContractTerm" name="contractTerm" defaultValue="12 months">
                <option>12 months</option>
                <option>Not applicable</option>
              </select>
            </label>
            <label>
              <span data-i18n="partnerAgencyLabel">Partner company</span>
              <input
                id="publicPartnerAgency"
                name="partnerAgency"
                data-i18n-placeholder="partnerAgencyPlaceholder"
                placeholder="e.g. Seoul relocation desk"
              />
            </label>
            <label>
              <span data-i18n="partnerAgentLabel">Partner agent name</span>
              <input
                id="publicPartnerAgent"
                name="partnerAgent"
                data-i18n-placeholder="partnerAgentPlaceholder"
                placeholder="Name of referring agent"
              />
            </label>
            <label className="form-wide">
              <span data-i18n="partnerContactLabel">Partner contact</span>
              <input
                id="publicPartnerContact"
                name="partnerContact"
                data-i18n-placeholder="partnerContactPlaceholder"
                placeholder="WeChat / Kakao / Zalo / Email / Phone"
              />
            </label>
            <label className="form-wide">
              <span data-i18n="requirementsLabel">Key requirements</span>
              <textarea
                id="publicRequirements"
                name="requirements"
                rows={3}
                data-i18n-placeholder="requirementsPlaceholder"
                placeholder="e.g. near BTS, foreign quota, pet-friendly, school, invoice support, preferred projects"
              />
            </label>
          </div>

          <label className="trap-field" aria-hidden="true">
            Website
            <input id="publicWebsite" tabIndex={-1} autoComplete="off" />
          </label>
          <label className="consent-row">
            <input id="publicConsent" type="checkbox" required />
            <span data-i18n="consentText">
              I confirm Lilith Homes may contact me or my client about this property request.
            </span>
          </label>
          <button className="primary-action" type="submit" data-i18n="submitButton">
            Send brief to Lilith
          </button>
          <p className="public-status" id="publicStatus" role="status" aria-live="polite" data-status-ready="true">
            Supports English, Vietnamese, Thai, Korean, Japanese, Chinese and Russian clients · Public form keeps lead details private
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
          <strong data-i18n="workflowCaptureTitle">01 · Capture</strong>
          <span data-i18n="workflowCaptureBody">Receive leads from the public form, partner agents, CSV or JSON API</span>
        </article>
        <article>
          <strong data-i18n="workflowQualifyTitle">02 · Qualify</strong>
          <span data-i18n="workflowQualifyBody">Check budget, area, property type, language, country and contact channel</span>
        </article>
        <article>
          <strong data-i18n="workflowMatchTitle">03 · Match</strong>
          <span data-i18n="workflowMatchBody">Prioritize property shortlists and follow-up tasks for the team</span>
        </article>
        <article>
          <strong data-i18n="workflowCloseTitle">04 · Close</strong>
          <span data-i18n="workflowCloseBody">Send shortlist, book viewings, prepare offers and coordinate referrals</span>
        </article>
      </section>

      <section className="capability-section" id="capabilities" aria-label="Lead capture capabilities">
        <article className="capability-lead">
          <p className="label" data-i18n="capabilityLabel">
            Live capability demonstration
          </p>
          <h2 data-i18n="capabilityTitle">
            Show the client what Lilith can do before the first call
          </h2>
          <p data-i18n="capabilityIntro">
            The page does more than collect a name. It turns each request into a
            workable rental, buyer or partner brief so the team can qualify,
            shortlist and book the next step faster.
          </p>
          <a className="capability-link" href="#publicLeadForm" data-i18n="capabilityCta">
            Test the brief flow
          </a>
        </article>

        <div className="capability-grid">
          <article>
            <span>01</span>
            <h3 data-i18n="capabilityOneTitle">Budget-fit screening</h3>
            <p data-i18n="capabilityOneBody">
              Separates monthly rental, purchase and listing budgets so weak-fit
              inquiries do not enter the same queue as serious clients.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3 data-i18n="capabilityTwoTitle">Area and lifestyle matching</h3>
            <p data-i18n="capabilityTwoBody">
              Captures BTS, school, pet, invoice and preferred-project details
              that make the first shortlist more relevant.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3 data-i18n="capabilityThreeTitle">Partner-ready handoff</h3>
            <p data-i18n="capabilityThreeBody">
              Keeps overseas agent, WeChat, Kakao, Zalo and referral fields in
              the same structured lead record.
            </p>
          </article>
          <article>
            <span>04</span>
            <h3 data-i18n="capabilityFourTitle">Private owner dashboard</h3>
            <p data-i18n="capabilityFourBody">
              Public visitors can submit briefs while lead review, stage updates
              and import tools remain protected for the team.
            </p>
          </article>
        </div>

        <aside className="capability-metrics" aria-label="Example operating signals">
          <strong data-i18n="metricsTitle">Operating signals the team can act on</strong>
          <div>
            <span data-i18n="metricResponse">Same-day callback priority</span>
            <b>12M</b>
          </div>
          <div>
            <span data-i18n="metricSegments">Client segments covered</span>
            <b>7</b>
          </div>
          <div>
            <span data-i18n="metricInputs">Lead sources accepted</span>
            <b>Form + API</b>
          </div>
        </aside>
      </section>

      <section className="seo-api-section" id="seo-api" aria-label="SEO and API readiness">
        <article>
          <p className="label" data-i18n="seoLabel">On-page SEO</p>
          <h2 data-i18n="seoTitle">Ready for seven-language search intent</h2>
          <p data-i18n="seoBody">
            Includes title, description, keyword intent, heading hierarchy, language content,
            internal anchors, Open Graph and real estate agent structured data.
          </p>
        </article>
        <article id="asia-agent">
          <p className="label" data-i18n="agentLabel">Asia agent desk</p>
          <h2 data-i18n="agentTitle">Accept briefs from overseas agents</h2>
          <p data-i18n="agentBody">
            Partners can send CSV from Excel or JSON through `/api/import` after an import
            token is configured. Those leads enter the same dashboard queue.
          </p>
        </article>
      </section>

      <footer className="public-footer">
        <strong>Lilith Homes</strong>
        <span data-i18n="footerText">International Thailand real estate lead desk · Rent · Buy · List · Refer</span>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Script src="/capture.js" strategy="afterInteractive" />
    </main>
  );
}
