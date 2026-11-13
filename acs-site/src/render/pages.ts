import { SITE } from '../config/site';
import {
  FEATURE_LABEL, FEATURE_NOTE, STATUS_LABEL, statusConfig, systemBadgeText,
  type FeatureKey, type Status, type StatusConfig,
} from '../config/status';
import { ABOUT_APPROVAL, parseAbout } from '../content/about';
import {
  categories, categoryById, categoryPath, productPath, products, productsIn, referenceLink,
  type Category, type Product,
} from '../data/catalog';
import { splitFeatures, type EvidenceRecord } from '../rules/evidence';
import { COUNTRIES, INDUSTRIES, INTERESTS, LABELS, MESSAGE_MAX, SCALES } from '../rules/enquiry';
import { esc } from './html';
import { layout } from './layout';
import {
  breadcrumbJsonLd, categoryBreadcrumbJsonLd, categoryListJsonLd, organizationJsonLd, productJsonLd,
  type JsonLd,
} from './structured';

const KIND_LABEL: Record<Product['kind'], string> = {
  model: 'รุ่นผลิตภัณฑ์',
  family: 'ตระกูลผลิตภัณฑ์ — ครอบคลุมมากกว่าหนึ่งรุ่น',
  solution: 'โซลูชัน',
  supplies: 'วัสดุสิ้นเปลือง',
};

function statusChip(status: Status): string {
  return `<span class="chip chip-${status}">${esc(STATUS_LABEL[status])}</span>`;
}

function pending(label: string, feature: FeatureKey, config: StatusConfig): string {
  return `<div class="pending"><dt>${esc(label)}</dt><dd>รอเจ้าของกำหนด ${statusChip(config.features[feature])}<span class="pending-note">${esc(FEATURE_NOTE[feature])}</span></dd></div>`;
}

function imagePlaceholder(): string {
  return `<div class="img-placeholder" role="img" aria-label="ยังไม่มีรูปสินค้า"><span aria-hidden="true">รอรูปสินค้า</span></div>`;
}

function productCard(p: Product): string {
  const category = categoryById(p.category);
  return `<li class="card" data-product-card data-id="${esc(p.id)}" data-category="${esc(p.category)}">
  ${imagePlaceholder()}
  <p class="card-brand">${esc(p.brand)}</p>
  <h3 class="card-title"><a href="${productPath(p.id)}">${esc(p.thaiTitle)}</a></h3>
  <p class="card-name">${esc(p.name)}</p>
  <p class="card-desc">${esc(p.thaiDescription)}</p>
  <p class="card-cat">${esc(category?.thai ?? p.category)}</p>
</li>`;
}

function categoryLink(c: Category): string {
  return `<li><a class="cat-link" href="${categoryPath(c.id)}">${esc(c.thai)}<span lang="en">${esc(c.title)}</span></a></li>`;
}

export function homePage(config: StatusConfig = statusConfig): string {
  const cats = categories
    .map(categoryLink)
    .join('');
  const featured = products.filter((p) => p.featured).map(productCard).join('\n');
  const main = `
<section class="hero">
  <div class="wrap">
    <p class="eyebrow">ACS · ASIAN CODING SYSTEMS</p>
    <h1>บาร์โค้ด RFID และอุปกรณ์ระบุข้อมูลสำหรับงานธุรกิจ</h1>
    <p class="lead">ดูรายการสินค้า เลือกรุ่นที่สนใจ แล้วส่งรายการให้ทีม ACS ยืนยันรุ่น ราคา และการจัดส่งกลับไป</p>
    <p class="actions"><a class="button button-primary" href="/products/">ดูสินค้าทั้งหมด</a> <a class="button button-outline" href="/enquiry/">ขอราคา / ติดต่อ</a></p>
  </div>
</section>
<section class="wrap section" aria-labelledby="cats-heading">
  <h2 id="cats-heading">หมวดสินค้า</h2>
  <ul class="cat-grid">${cats}</ul>
</section>
<section class="wrap section" aria-labelledby="featured-heading">
  <h2 id="featured-heading">สินค้าแนะนำ</h2>
  <ul class="card-grid">
${featured}
  </ul>
</section>`;
  return layout(
    { path: '/', title: `${SITE.shortName} | บาร์โค้ด RFID และอุปกรณ์ระบุข้อมูล`, description: 'รายการสินค้าบาร์โค้ด เครื่องพิมพ์ฉลาก ริบบอน RFID และโมบายคอมพิวเตอร์ จาก Asian Coding Systems' },
    main, config,
  );
}

export function cataloguePage(config: StatusConfig = statusConfig): string {
  const filters = [`<button type="button" class="filter" data-filter="all" aria-pressed="true">ทั้งหมด</button>`]
    .concat(categories.map((c) => `<button type="button" class="filter" data-filter="${c.id}" aria-pressed="false">${esc(c.thai)}</button>`))
    .join('');
  const main = `
<div class="wrap section">
  <nav class="breadcrumbs" aria-label="เส้นทาง"><a href="/">หน้าแรก</a> <span aria-hidden="true">/</span> <span aria-current="page">สินค้า</span></nav>
  <h1>รายการสินค้า ACS</h1>
  <p class="lead">สินค้าและโซลูชันบาร์โค้ด RFID และ Enterprise Mobility ${products.length} รายการ</p>
  <div class="catalogue-tools" data-catalogue-tools hidden>
    <div class="search-row">
      <label for="catalogue-search">ค้นหาสินค้า</label>
      <input id="catalogue-search" type="search" autocomplete="off" placeholder="เช่น TE200 หรือ เครื่องสแกนบาร์โค้ด">
    </div>
    <div class="filter-row" role="group" aria-label="กรองตามหมวดสินค้า">${filters}</div>
  </div>
  <p id="catalogue-count" class="count" role="status" aria-live="polite">แสดง ${products.length} รายการ</p>
  <ul class="card-grid" id="catalogue-grid">
${products.map(productCard).join('\n')}
  </ul>
  <p id="catalogue-empty" class="empty" hidden>ไม่พบสินค้าที่ตรงกับคำค้นหรือหมวดที่เลือก ลองค้นด้วยชื่อรุ่น เช่น TE200</p>
  <section aria-labelledby="by-category-heading">
    <h2 id="by-category-heading">ดูตามหมวด</h2>
    <ul class="cat-grid">${categories.map(categoryLink).join('')}</ul>
  </section>
</div>`;
  return layout(
    { path: '/products/', title: `รายการสินค้า | ${SITE.shortName}`, description: 'รายการสินค้า ACS: เครื่องสแกนบาร์โค้ด เครื่องพิมพ์ฉลาก ฉลาก ริบบอน RFID และโมบายคอมพิวเตอร์', nav: 'products', script: true },
    main, config,
  );
}

export function productPage(
  p: Product,
  records: readonly EvidenceRecord[],
  asOf: string,
  config: StatusConfig = statusConfig,
): string {
  const category = categoryById(p.category);
  const { shown, omitted } = splitFeatures(p.id, p.features, records, asOf);
  const ref = referenceLink(p);
  // A manufacturer link is a source only for the figures an approved record ties to it.
  const sources = records.filter((r) => r.status === 'active' && r.subject.productId === p.id && shown.includes(r.subject.feature));
  const sourced = ref !== null && sources.length > 0 && sources.every((r) => r.sourceUrl === ref);
  const checkedOn = sources.map((r) => r.retrievedOn).sort().at(-1) ?? '';
  const product = productJsonLd(p);
  const jsonLd: JsonLd[] = [...(product ? [product] : []), breadcrumbJsonLd(p)];
  const features = shown.length
    ? `<ul class="feature-list">${shown.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`
    : `<p class="muted">ยังไม่มีรายละเอียดที่แสดงได้</p>`;
  const held = omitted.length
    ? `<p class="held" data-omitted-figures="${omitted.length}">ตัวเลขสเปก ${omitted.length} รายการของสินค้านี้ยังไม่แสดง เพราะยังไม่มี datasheet จากผู้ผลิตยืนยัน ${statusChip(config.features.specFigures)}</p>`
    : '';
  const main = `
<div class="wrap section product">
  <nav class="breadcrumbs" aria-label="เส้นทาง"><a href="/">หน้าแรก</a> <span aria-hidden="true">/</span> <a href="/products/">สินค้า</a> <span aria-hidden="true">/</span> <a href="${categoryPath(p.category)}">${esc(category?.thai ?? p.category)}</a></nav>
  <div class="product-grid">
    <div>${imagePlaceholder()}</div>
    <div>
      <p class="card-brand">${esc(p.brand)}</p>
      <h1>${esc(p.thaiTitle)}</h1>
      <p class="product-name">${esc(p.name)}</p>
      <p class="kind">${esc(KIND_LABEL[p.kind])}</p>
      ${p.kind === 'family' ? `<p class="family-note" data-family-note>หน้านี้เป็นข้อมูลระดับตระกูล (${esc(p.name)}) ไม่ใช่รุ่นใดรุ่นหนึ่ง รุ่นย่อยที่ ACS จำหน่ายและสเปกของแต่ละรุ่นต้องยืนยันกับ ACS</p>` : ''}
      <p class="lead">${esc(p.thaiDescription)}</p>
      <p class="muted" lang="en">${esc(p.description)}</p>
      <h2>รายละเอียด</h2>
      ${features}
      ${held}
      <dl class="pending-list">
        ${pending('ราคา', 'prices', config)}
        ${pending('สต็อกและระยะเวลาส่งมอบ', 'stock', config)}
      </dl>
      <p class="actions">
        <button type="button" class="button button-primary" data-add-to-basket="${esc(p.id)}" hidden>เพิ่มในรายการขอราคา</button>
        <a class="button button-outline" href="/enquiry/">ขอราคา / ติดต่อ ACS</a>
      </p>
      <p id="basket-feedback" class="count" role="status" aria-live="polite"></p>
      ${ref ? `<p class="ref"><a href="${esc(ref)}" rel="noopener noreferrer external">${esc(p.referenceLabel)}<span class="sr-only"> (เปิดเว็บไซต์ภายนอก)</span></a> <span class="muted"${sourced ? ` data-figure-source="${sources.length}"` : ''}>${sourced ? `— แหล่งที่มาของตัวเลขสเปกในหน้านี้ ตรวจสอบเมื่อ ${esc(checkedOn)} รุ่นย่อยและอุปกรณ์เสริมยืนยันกับ ACS` : '— ลิงก์อ้างอิงของผู้ผลิต ไม่ใช่หลักฐานยืนยันสเปกของสินค้าที่ ACS จำหน่าย'}</span></p>` : ''}
    </div>
  </div>
</div>`;
  return layout(
    { path: productPath(p.id), title: `${p.thaiTitle} — ${p.name} | ${SITE.shortName}`, description: `${p.thaiDescription} (${p.brand} ${p.name})`, nav: 'products', script: true, jsonLd },
    main, config,
  );
}

export function basketPage(config: StatusConfig = statusConfig): string {
  const main = `
<div class="wrap section narrow">
  <h1>รายการขอราคา</h1>
  <p class="notice notice-${config.features.basket}">${statusChip(config.features.basket)} รายการนี้เก็บเฉพาะรหัสสินค้าไว้ในเบราว์เซอร์นี้ ยังไม่ได้ส่งถึง ACS และไม่มีการเรียกเก็บเงิน</p>
  <noscript><p class="notice">หน้านี้ต้องใช้ JavaScript เพื่อแสดงรายการที่เลือก หากต้องการติดต่อ ACS กรุณาโทร ${esc(SITE.phoneDisplay)}</p></noscript>
  <div id="basket-root" data-basket-root>
    <p id="basket-empty">รายการขอราคายังว่างอยู่ <a href="/products/">เลือกสินค้า</a></p>
    <ul id="basket-list" class="basket-list" hidden></ul>
    <p class="actions" id="basket-actions" hidden><a class="button button-primary" href="/enquiry/">กรอกข้อมูลเพื่อขอราคา</a> <a class="button button-outline" href="/products/">เลือกสินค้าเพิ่ม</a></p>
  </div>
</div>`;
  return layout(
    { path: '/basket/', title: `รายการขอราคา | ${SITE.shortName}`, description: 'รายการสินค้าที่เลือกไว้เพื่อขอราคาจาก ACS', nav: 'basket', script: true, index: false },
    main, config,
  );
}

function field(id: string, label: string, control: string, hint = ''): string {
  return `<div class="field">
  <label for="f-${id}">${label}</label>
  ${control}
  ${hint ? `<p class="hint" id="hint-${id}">${hint}</p>` : ''}
  <p class="field-error" id="err-${id}" role="alert" hidden></p>
</div>`;
}

const options = (values: readonly string[], placeholder?: string) =>
  (placeholder ? `<option value="">${esc(placeholder)}</option>` : '') +
  values.map((v) => `<option value="${esc(v)}">${esc(LABELS[v] ?? v)}</option>`).join('');

export function enquiryPage(config: StatusConfig = statusConfig): string {
  const interests = INTERESTS.map((id) => {
    const c = categoryById(id);
    return `<label class="check"><input type="checkbox" name="interests" value="${esc(id)}"> <span>${esc(c?.thai ?? id)}</span></label>`;
  }).join('');
  const main = `
<div class="wrap section narrow">
  <h1>ขอราคา / ติดต่อ ACS</h1>
  <p class="notice notice-${config.features.enquiry}">${statusChip(config.features.enquiry)} แบบฟอร์มนี้อยู่ในโหมดสาธิต กรอกและตรวจข้อมูลได้ แต่ <strong>ยังไม่ส่งและไม่บันทึกข้อมูลไปที่ใด</strong> หากต้องการติดต่อ ACS ตอนนี้ กรุณาโทร <a href="${SITE.phoneHref}">${esc(SITE.phoneDisplay)}</a></p>
  <noscript><p class="notice">แบบฟอร์มนี้ต้องใช้ JavaScript กรุณาโทร ${esc(SITE.phoneDisplay)} หรืออีเมล ${esc(SITE.salesEmail)}</p></noscript>
  <div id="enquiry-result" class="result" role="alert" tabindex="-1" hidden></div>
  <form id="enquiry-form" novalidate hidden>
    <ol class="steps" aria-label="ขั้นตอนของแบบฟอร์ม">
      <li data-progress="1" aria-current="step">1 ผู้ติดต่อ</li>
      <li data-progress="2">2 องค์กร</li>
      <li data-progress="3">3 รายละเอียดและยืนยัน</li>
    </ol>
    <p id="step-count" class="count" role="status" aria-live="polite">ขั้นตอน 1 จาก 3</p>
    <div id="basket-summary" class="basket-summary" hidden></div>

    <fieldset data-step="1">
      <legend><h2 id="step-1-title" tabindex="-1">ข้อมูลผู้ติดต่อ</h2></legend>
      ${field('name', 'ชื่อผู้ติดต่อ <span aria-hidden="true">*</span>', '<input id="f-name" name="name" autocomplete="name" maxlength="200" required aria-describedby="err-name">')}
      ${field('phone', 'เบอร์โทรศัพท์ <span aria-hidden="true">*</span>', '<input id="f-phone" name="phone" type="tel" autocomplete="tel" maxlength="40" required aria-describedby="hint-phone err-phone">', 'เช่น 081-234-5678')}
    </fieldset>

    <fieldset data-step="2" hidden>
      <legend><h2 id="step-2-title" tabindex="-1">ข้อมูลองค์กร</h2></legend>
      ${field('company', 'ชื่อบริษัท / องค์กร <span aria-hidden="true">*</span>', '<input id="f-company" name="company" autocomplete="organization" maxlength="200" required aria-describedby="err-company">')}
      ${field('email', 'อีเมลติดต่อ <span aria-hidden="true">*</span>', '<input id="f-email" name="email" type="email" autocomplete="email" maxlength="254" required aria-describedby="hint-email err-email">', 'เช่น name@company.com')}
    </fieldset>

    <fieldset data-step="3" hidden>
      <legend><h2 id="step-3-title" tabindex="-1">รายละเอียดและการยืนยัน</h2></legend>
      ${field('industry', 'ประเภทธุรกิจ <span aria-hidden="true">*</span>', `<select id="f-industry" name="industry" required aria-describedby="err-industry">${options(INDUSTRIES, 'เลือกประเภทธุรกิจ')}</select>`)}
      ${field('businessScale', 'ขอบเขตการดำเนินงาน <span aria-hidden="true">*</span>', `<select id="f-businessScale" name="businessScale" required aria-describedby="err-businessScale">${options(SCALES, 'เลือกขอบเขตปัจจุบัน')}</select>`)}
      ${field('country', 'ประเทศที่ใช้งาน <span aria-hidden="true">*</span>', `<select id="f-country" name="country" autocomplete="country" required aria-describedby="err-country">${options(COUNTRIES)}</select>`)}
      <div class="field">
        <fieldset class="plain" aria-describedby="err-interests">
          <legend>หัวข้อที่สนใจ <span aria-hidden="true">*</span></legend>
          <div class="checks">${interests}</div>
        </fieldset>
        <p class="field-error" id="err-interests" role="alert" hidden></p>
      </div>
      ${field('message', 'รายละเอียดเพิ่มเติม (ไม่บังคับ)', `<textarea id="f-message" name="message" rows="5" maxlength="${MESSAGE_MAX}" aria-describedby="hint-message err-message"></textarea>`, `สูงสุด ${MESSAGE_MAX.toLocaleString('en-US')} ตัวอักษร ไม่ต้องใส่รหัสผ่านหรือข้อมูลอ่อนไหว`)}
      <div class="field">
        <label class="check consent"><input type="checkbox" id="f-serviceConsent" name="serviceConsent" required aria-describedby="err-serviceConsent"> <span>ยินยอมให้ ACS ใช้ข้อมูลติดต่อและรายละเอียดนี้ เพื่อรับคำขอและติดต่อกลับเกี่ยวกับคำขอนี้เท่านั้น <span aria-hidden="true">*</span></span></label>
        <p class="field-error" id="err-serviceConsent" role="alert" hidden></p>
      </div>
      <div class="field">
        <label class="check consent"><input type="checkbox" id="f-marketingConsent" name="marketingConsent"> <span>ยินยอมรับข่าวสารและข้อเสนอจาก ACS (ไม่บังคับ และไม่มีผลต่อการส่งคำขอนี้)</span></label>
      </div>
    </fieldset>

    <p class="actions">
      <button type="button" class="button button-outline" id="prev-step" hidden>ย้อนกลับ</button>
      <button type="button" class="button button-primary" id="next-step">ถัดไป</button>
      <button type="submit" class="button button-primary" id="send-enquiry" hidden>ส่งคำขอ</button>
    </p>
  </form>
</div>`;
  return layout(
    { path: '/enquiry/', title: `ขอราคา / ติดต่อ | ${SITE.shortName}`, description: 'แบบฟอร์มขอราคาและติดต่อ Asian Coding Systems', nav: 'enquiry', script: true },
    main, config,
  );
}

/**
 * A category page owns its category's head term (decision D-09). It states
 * only what the catalogue states: the category's name and its entries.
 */
export function categoryPage(c: Category, config: StatusConfig = statusConfig): string {
  const items = productsIn(c.id);
  // Where a category holds several kinds of one consumable, the page sets them
  // side by side so that it, not one of them, answers "which one?" (decision D-10).
  const compare = items.length > 1 && items.every((p) => p.kind === 'supplies');
  const chooser = compare
    ? `
  <section aria-labelledby="choose-heading" data-chooser>
    <h2 id="choose-heading">เลือกชนิด${esc(c.thai)}</h2>
    <div class="table-wrap" tabindex="0" role="region" aria-label="ตารางเทียบชนิด${esc(c.thai)}">
      <table>
        <thead><tr><th scope="col">ชนิด</th><th scope="col">บริบทการใช้งาน</th><th scope="col">สิ่งที่ต้องตรวจก่อนเลือก</th></tr></thead>
        <tbody>${items.map((p) => `<tr><th scope="row"><a href="${productPath(p.id)}">${esc(p.thaiTitle)}</a></th><td>${esc(p.thaiDescription)}</td><td>${p.features.map(esc).join(' · ')}</td></tr>`).join('')}</tbody>
      </table>
    </div>
    <p class="muted">ตารางนี้ยกข้อความจาก catalogue ของ ACS ชนิดที่ตรงกับงานของคุณต้องยืนยันกับ ACS พร้อมรุ่นเครื่องพิมพ์และวัสดุฉลากที่ใช้</p>
  </section>`
    : '';
  const others = categories.filter((other) => other.id !== c.id).map(categoryLink).join('');
  const main = `
<div class="wrap section" data-category-page="${esc(c.id)}">
  <nav class="breadcrumbs" aria-label="เส้นทาง"><a href="/">หน้าแรก</a> <span aria-hidden="true">/</span> <a href="/products/">สินค้า</a> <span aria-hidden="true">/</span> <span aria-current="page">${esc(c.thai)}</span></nav>
  <h1>${esc(c.thai)}</h1>
  <p class="product-name" lang="en">${esc(c.title)}</p>
  <p class="lead">${items.length} รายการในหมวดนี้ จาก catalogue ของ ACS รุ่นที่จำหน่าย ราคา และการจัดส่งต้องยืนยันกับ ACS</p>${chooser}
  <ul class="card-grid" id="category-grid">
${items.map(productCard).join('\n')}
  </ul>
  <p class="actions"><a class="button button-primary" href="/enquiry/">ขอราคา / ติดต่อ ACS</a> <a class="button button-outline" href="/products/">ดูสินค้าทั้งหมด</a></p>
  <section aria-labelledby="other-cats-heading">
    <h2 id="other-cats-heading">หมวดอื่น</h2>
    <ul class="cat-grid">${others}</ul>
  </section>
</div>`;
  return layout(
    {
      path: categoryPath(c.id),
      title: `${c.thai} (${c.title}) | ${SITE.shortName}`,
      description: `${c.thai} จาก Asian Coding Systems: ${items.map((p) => p.name).join(', ')}`,
      nav: 'products',
      index: config.features.categoryPages === 'live',
      jsonLd: [categoryBreadcrumbJsonLd(c), categoryListJsonLd(c, items)],
    },
    main, config,
  );
}

/**
 * The company page (decision D-11: it lives at /about/). The copy is the
 * governed package draft the Owner approved; until that approval is recorded
 * in the status config the page shows a placeholder and stays out of the index.
 */
export function aboutPage(config: StatusConfig = statusConfig): string {
  const live = config.features.company === 'live';
  const about = parseAbout();
  const main = live
    ? `
<article class="wrap section narrow about" data-about-approved="${esc(ABOUT_APPROVAL.approvedOn)}">
  <h1>${esc(about.heading)}</h1>
  ${about.paragraphs.map((html) => `<p>${html}</p>`).join('\n  ')}
  <p class="actions"><a class="button button-primary" href="/enquiry/">ขอราคา / ติดต่อ ACS</a> <a class="button button-outline" href="/products/">ดูรายการสินค้า</a></p>
</article>`
    : `
<div class="wrap section narrow">
  <h1>เกี่ยวกับ ACS</h1>
  <p class="notice notice-${config.features.company}">${statusChip(config.features.company)} เนื้อหาหน้านี้ <strong>ยังไม่เผยแพร่</strong> — รอเจ้าของอนุมัติข้อความ</p>
  <p>ระหว่างนี้ติดต่อ Asian Coding Systems ได้ที่ <a href="${SITE.phoneHref}">${esc(SITE.phoneDisplay)}</a> หรือ <a href="mailto:${esc(SITE.salesEmail)}">${esc(SITE.salesEmail)}</a></p>
</div>`;
  return layout(
    {
      path: '/about/',
      title: `เกี่ยวกับ ACS | ${SITE.shortName}`,
      description: live ? 'Asian Coding Systems ก่อตั้งเมื่อปี 1994 ทำงานด้านบาร์โค้ดและระบบระบุตัวตนให้กับธุรกิจไทย' : 'ข้อมูลเกี่ยวกับ Asian Coding Systems',
      nav: 'company',
      // A placeholder is not worth indexing; the page opens to crawlers only once its content is live.
      index: live,
      ...(live ? { jsonLd: [organizationJsonLd()] } : {}),
    },
    main, config,
  );
}

export function statusPage(config: StatusConfig = statusConfig): string {
  const rows = (Object.keys(config.features) as FeatureKey[])
    .map((key) => `<tr data-feature="${key}"><th scope="row">${esc(FEATURE_LABEL[key])}</th><td>${statusChip(config.features[key])}</td><td>${esc(FEATURE_NOTE[key])}</td></tr>`)
    .join('');
  const main = `
<div class="wrap section">
  <h1>สถานะระบบ</h1>
  <p class="lead" data-system-line>${esc(systemBadgeText(config))}</p>
  <p>หน้านี้อ่านสถานะจากไฟล์ตั้งค่าเดียวของระบบ ทุกหน้าของเว็บใช้ค่าชุดเดียวกันนี้</p>
  <div class="table-wrap" tabindex="0" role="region" aria-label="ตารางสถานะของแต่ละส่วน">
    <table>
      <thead><tr><th scope="col">ส่วนของระบบ</th><th scope="col">สถานะ</th><th scope="col">หมายเหตุ</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <h2>ความหมายของสถานะ</h2>
  <ul>
    <li><strong>${STATUS_LABEL.live}</strong> — ใช้งานและอ้างอิงได้</li>
    <li><strong>${STATUS_LABEL.demo}</strong> — หน้าจอทำงาน แต่ไม่มีการบันทึกหรือส่งข้อมูล</li>
    <li><strong>${STATUS_LABEL.not_connected}</strong> — ยังไม่มีข้อมูล หน้าเว็บแสดงข้อความ "รอเจ้าของกำหนด" แทน</li>
  </ul>
</div>`;
  return layout(
    { path: '/status/', title: `สถานะระบบ | ${SITE.shortName}`, description: 'สถานะของแต่ละส่วนในเว็บไซต์ ACS', nav: 'status', index: false },
    main, config,
  );
}

export function notFoundPage(config: StatusConfig = statusConfig): string {
  const main = `
<div class="wrap section narrow">
  <h1>ไม่พบหน้าที่ต้องการ</h1>
  <p>หน้านี้อาจถูกย้ายหรือไม่มีอยู่แล้ว</p>
  <p class="actions"><a class="button button-primary" href="/products/">ดูรายการสินค้า</a> <a class="button button-outline" href="/">กลับหน้าแรก</a></p>
</div>`;
  return layout({ path: '/404.html', title: `ไม่พบหน้า | ${SITE.shortName}`, description: 'ไม่พบหน้าที่ต้องการ', index: false }, main, config);
}
