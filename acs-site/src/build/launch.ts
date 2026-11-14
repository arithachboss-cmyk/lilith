import type { StatusConfig } from '../config/status';
import { products, productImages } from '../data/catalog';
import { enquiryBackend } from '../data/enquiry-backend';
import { planCounts, redirectPlan } from './redirects';

/**
 * Where each launch condition stands, read from the same config and data the
 * site is built from. Nothing here is typed in by hand: a row says "ready"
 * only when the thing it describes is really in place.
 */
export interface LaunchRow {
  key: 'prices' | 'stock' | 'images' | 'enquiry' | 'redirects';
  label: string;
  ready: boolean;
  detail: string;
}

export function launchReadiness(config: StatusConfig): LaunchRow[] {
  const prices = config.presentation?.prices ?? 'pending';
  const stock = config.presentation?.stock ?? 'pending';
  const withImage = products.filter((p) => productImages.some((i) => i.productId === p.id)).length;
  const plan = planCounts(redirectPlan);
  const backendLive = enquiryBackend !== null && config.features.enquiry === 'live';
  return [
    {
      key: 'prices', label: 'วิธีแสดงราคา',
      ready: prices !== 'pending' || config.features.prices === 'live',
      detail: config.features.prices === 'live' ? 'แสดงราคาจากรายการราคา ACS' : prices === 'quote_on_request' ? 'ขอใบเสนอราคาจาก ACS' : 'รอเจ้าของตัดสินใจ: แสดงราคาจริง หรือ ขอใบเสนอราคา',
    },
    {
      key: 'stock', label: 'วิธีแสดงสต็อกและการส่งมอบ',
      ready: stock !== 'pending' || config.features.stock === 'live',
      detail: config.features.stock === 'live' ? 'แสดงข้อมูลสต็อกของ ACS' : stock === 'ask_acs' ? 'สอบถาม ACS' : 'รอเจ้าของตัดสินใจ: แสดงข้อมูลจริง หรือ ให้สอบถาม ACS',
    },
    {
      key: 'images', label: 'รูปสินค้า',
      ready: withImage === products.length,
      detail: `มีรูปแล้ว ${withImage} จาก ${products.length} รายการ`,
    },
    {
      key: 'enquiry', label: 'ปลายทางของคำขอราคา',
      ready: backendLive,
      detail: backendLive ? `เชื่อมต่อแล้ว (${enquiryBackend?.name ?? ''})` : enquiryBackend ? 'มีระบบรับแล้ว แต่ยังไม่เปิดใช้' : 'ยังไม่มีระบบรับคำขอ รอเจ้าของกำหนดปลายทาง',
    },
    {
      key: 'redirects', label: 'ที่อยู่เดิมของเว็บเก่า',
      ready: plan.proposed === 0,
      detail: `อนุมัติแล้ว ${plan.approved} · เสนอไว้รออนุมัติ ${plan.proposed} · ไม่มีหน้าเทียบเท่า ${plan.no_equivalent}`,
    },
  ];
}
