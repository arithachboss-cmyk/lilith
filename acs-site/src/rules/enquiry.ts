import { categories } from '../data/catalog';

export const INDUSTRIES = ['retail', 'logistics', 'manufacturing', 'healthcare', 'government', 'other'] as const;
export const SCALES = ['single_site', 'multi_site', 'nationwide'] as const;
export const COUNTRIES = ['TH', 'SG', 'MY', 'VN', 'ID', 'PH', 'LA', 'KH', 'MM', 'CN', 'JP', 'US', 'GB', 'AU'] as const;
/** Interests are the catalogue's own six categories; nothing is added. */
export const INTERESTS: readonly string[] = categories.map((c) => c.id);

export const LABELS: Record<string, string> = {
  retail: 'ค้าปลีก / Retail',
  logistics: 'คลังสินค้าและขนส่ง / Logistics',
  manufacturing: 'การผลิต / Manufacturing',
  healthcare: 'สุขภาพ / Healthcare',
  government: 'หน่วยงานภาครัฐ / Government',
  other: 'อื่น ๆ / Other',
  single_site: 'สถานที่เดียว',
  multi_site: 'หลายสถานที่',
  nationwide: 'หลายภูมิภาค / ทั่วประเทศ',
  TH: 'ไทย / Thailand', SG: 'สิงคโปร์ / Singapore', MY: 'มาเลเซีย / Malaysia', VN: 'เวียดนาม / Vietnam',
  ID: 'อินโดนีเซีย / Indonesia', PH: 'ฟิลิปปินส์ / Philippines', LA: 'ลาว / Laos', KH: 'กัมพูชา / Cambodia',
  MM: 'เมียนมา / Myanmar', CN: 'จีน / China', JP: 'ญี่ปุ่น / Japan', US: 'สหรัฐอเมริกา / United States',
  GB: 'สหราชอาณาจักร / United Kingdom', AU: 'ออสเตรเลีย / Australia',
};

export interface EnquiryFields {
  name: string;
  phone: string;
  company: string;
  email: string;
  industry: string;
  businessScale: string;
  country: string;
  interests: string[];
  message: string;
  serviceConsent: boolean;
  marketingConsent: boolean;
  /** Product ids carried over from the basket. */
  items: string[];
}

export type FieldName = keyof EnquiryFields;
export type Errors = Partial<Record<FieldName, string>>;

export const STEP_FIELDS: Record<1 | 2 | 3, FieldName[]> = {
  1: ['name', 'phone'],
  2: ['company', 'email'],
  3: ['industry', 'businessScale', 'country', 'interests', 'message', 'serviceConsent'],
};

export const MESSAGE_MAX = 4900;

/** The consent wording, in one place: the page shows these and a stored enquiry cites their version. */
export const SERVICE_CONSENT_TEXT = 'ยินยอมให้ ACS ใช้ข้อมูลติดต่อและรายละเอียดนี้ เพื่อรับคำขอและติดต่อกลับเกี่ยวกับคำขอนี้เท่านั้น';
export const MARKETING_CONSENT_TEXT = 'ยินยอมรับข่าวสารและข้อเสนอจาก ACS (ไม่บังคับ และไม่มีผลต่อการส่งคำขอนี้)';

/**
 * Changes whenever either consent sentence changes, so a stored enquiry can
 * be matched to the exact words its sender agreed to.
 */
export function consentWordingVersion(): string {
  let hash = 5381;
  for (const ch of `${SERVICE_CONSENT_TEXT}\n${MARKETING_CONSENT_TEXT}`) hash = ((hash * 33) ^ ch.codePointAt(0)!) >>> 0;
  return `c-${hash.toString(16).padStart(8, '0')}`;
}

export function emptyEnquiry(): EnquiryFields {
  return {
    name: '', phone: '', company: '', email: '', industry: '', businessScale: '', country: 'TH',
    interests: [], message: '', serviceConsent: false, marketingConsent: false, items: [],
  };
}

/** Thai text is measured in code points, not UTF-16 units. */
const length = (s: string) => [...s].length;

export function validateEnquiry(f: EnquiryFields): Errors {
  const e: Errors = {};
  const name = f.name.trim();
  if (!name) e.name = 'กรุณากรอกชื่อผู้ติดต่อ';
  else if (length(name) > 200) e.name = 'ชื่อยาวเกิน 200 ตัวอักษร';

  const digits = f.phone.replace(/\D/g, '');
  if (!f.phone.trim()) e.phone = 'กรุณากรอกเบอร์โทรศัพท์';
  else if (!/^[0-9+\-\s()]+$/.test(f.phone.trim()) || digits.length < 8 || digits.length > 15)
    e.phone = 'เบอร์โทรศัพท์ไม่ถูกต้อง ใช้ตัวเลข 8–15 หลัก';

  const company = f.company.trim();
  if (!company) e.company = 'กรุณากรอกชื่อบริษัทหรือองค์กร';
  else if (length(company) > 200) e.company = 'ชื่อบริษัทยาวเกิน 200 ตัวอักษร';

  const email = f.email.trim();
  if (!email) e.email = 'กรุณากรอกอีเมล';
  else if (length(email) > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';

  if (!(INDUSTRIES as readonly string[]).includes(f.industry)) e.industry = 'กรุณาเลือกประเภทธุรกิจ';
  if (!(SCALES as readonly string[]).includes(f.businessScale)) e.businessScale = 'กรุณาเลือกขอบเขตการดำเนินงาน';
  if (!(COUNTRIES as readonly string[]).includes(f.country)) e.country = 'กรุณาเลือกประเทศ';

  if (f.interests.length === 0) e.interests = 'กรุณาเลือกหัวข้อที่สนใจอย่างน้อยหนึ่งข้อ';
  else if (f.interests.some((i) => !INTERESTS.includes(i))) e.interests = 'หัวข้อที่เลือกไม่ถูกต้อง';

  if (length(f.message) > MESSAGE_MAX) e.message = `ข้อความยาวเกิน ${MESSAGE_MAX} ตัวอักษร`;

  // Service consent is required. Marketing consent is separate and never required.
  if (f.serviceConsent !== true) e.serviceConsent = 'ต้องยินยอมให้ ACS ใช้ข้อมูลนี้เพื่อติดต่อกลับ จึงจะส่งคำขอได้';
  return e;
}

export function errorsForStep(f: EnquiryFields, step: 1 | 2 | 3): Errors {
  const all = validateEnquiry(f);
  const out: Errors = {};
  for (const name of STEP_FIELDS[step]) if (all[name]) out[name] = all[name];
  return out;
}
