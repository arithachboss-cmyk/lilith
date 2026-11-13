/**
 * The ONE place that says what is live, demo or not connected.
 *
 * Every screen reads this file; nothing else may hard-code a state. A feature
 * moves to `live` only when its acceptance test passes and the material behind
 * it is named — see README, "Status rules". Editing this file is the change;
 * there is no second switch anywhere.
 */
export type Status = 'live' | 'demo' | 'not_connected';

export type FeatureKey =
  | 'catalogue'
  | 'productPages'
  | 'categoryPages'
  | 'search'
  | 'enquiry'
  | 'basket'
  | 'specFigures'
  | 'prices'
  | 'stock'
  | 'productImages'
  | 'company';

export interface StatusConfig {
  /** State of the system as a whole. Drives the badge and indexability. */
  system: Status;
  features: Record<FeatureKey, Status>;
}

export const statusConfig: StatusConfig = {
  system: 'demo',
  features: {
    catalogue: 'live',
    productPages: 'live',
    categoryPages: 'live',
    search: 'live',
    enquiry: 'demo',
    basket: 'demo',
    specFigures: 'not_connected',
    prices: 'not_connected',
    stock: 'not_connected',
    productImages: 'not_connected',
    // The Owner approved the copy and its address on 2026-11-13 (decision D-11).
    company: 'live',
  },
};

export const STATUS_LABEL: Record<Status, string> = {
  live: 'ทำงานจริง',
  demo: 'ข้อมูลสาธิต',
  not_connected: 'ยังไม่เชื่อมต่อ',
};

export const FEATURE_LABEL: Record<FeatureKey, string> = {
  catalogue: 'รายการสินค้าและตัวกรองหมวด',
  productPages: 'หน้าสินค้าแยกรายรุ่น',
  categoryPages: 'หน้าหมวดสินค้า',
  search: 'ค้นหาสินค้า',
  enquiry: 'แบบฟอร์มขอราคา',
  basket: 'รายการขอราคา',
  specFigures: 'ตัวเลขสเปกบนหน้าสินค้า',
  prices: 'ราคา',
  stock: 'สต็อกและระยะเวลาส่งมอบ',
  productImages: 'รูปสินค้า',
  company: 'หน้าข้อมูลบริษัท',
};

/** What each feature is waiting for. Shown on the status page. */
export const FEATURE_NOTE: Record<FeatureKey, string> = {
  catalogue: 'ข้อมูลจาก catalogue ของเว็บปัจจุบัน',
  productPages: 'สร้างจากข้อมูล catalogue ชุดเดียวกัน',
  categoryPages: 'หมวดละหนึ่งหน้า สร้างจากข้อมูล catalogue ชุดเดียวกัน',
  search: 'ค้นหาในเบราว์เซอร์จากข้อมูลชุดเดียวกัน',
  enquiry: 'กรอกและตรวจข้อมูลได้ แต่ยังไม่ส่งและไม่บันทึกที่ใด',
  basket: 'เก็บเฉพาะรหัสสินค้าในเบราว์เซอร์นี้ ไม่ส่งถึง ACS',
  specFigures: 'รอ datasheet จากผู้ผลิต',
  prices: 'รอรายการราคา ACS พร้อมวันที่มีผล',
  stock: 'รอข้อมูลสต็อก ACS พร้อมวันที่ของแต่ละตัวเลข',
  productImages: 'รอไฟล์รูปสินค้า',
  company: 'ข้อความที่เจ้าของอนุมัติเมื่อ 13 พ.ย. 2569 อยู่ที่ /about/',
};

/** A build that is not live must never be indexed, wherever it gets hosted. */
export function isIndexable(config: StatusConfig = statusConfig): boolean {
  return config.system === 'live';
}

export function systemBadgeText(config: StatusConfig = statusConfig): string {
  return config.system === 'live'
    ? 'ระบบ: ทำงานจริง'
    : config.system === 'demo'
      ? 'ระบบ: โหมดสาธิต — ยังไม่เชื่อมต่อระบบจริง'
      : 'ระบบ: ยังไม่เชื่อมต่อ';
}
