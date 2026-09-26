import { test, expect } from '@playwright/test';

/*
 * อ้างอิงเนื้อหาของ AC-14 — "หน้าไม่ล้นแนวนอนที่ความกว้าง 360 ถึง 1440 px"
 * กั้นต้นแบบเท่านั้น ไม่ได้ทำให้ AC-14 ผ่าน (ดู qa-browser/README.md)
 *
 * เกณฑ์ระบุช่วง ไม่ได้ระบุว่าวัดกี่จุด — เลือกสี่จุดคือปลายทั้งสองข้างและสองจุดที่ layout
 * มักเปลี่ยนพฤติกรรม ถ้าเจ้าของระบบกำหนดชุดความกว้างที่แน่นอนภายหลัง ให้แก้ที่นี่
 */
const WIDTHS = [360, 768, 1024, 1440];

for (const width of WIDTHS) {
  test(`ต้นแบบไม่ล้นแนวนอนที่ ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('#roleBar [role="tab"]').first()).toBeVisible();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    /* ยอมให้คลาดได้ 1 px เพราะการปัดเศษของ sub-pixel layout ไม่ใช่การล้นจริง */
    expect(
      overflow.scrollWidth - overflow.clientWidth,
      `เอกสารกว้าง ${overflow.scrollWidth} px ในช่องมอง ${overflow.clientWidth} px`,
    ).toBeLessThanOrEqual(1);
  });

  test(`ไม่มีองค์ประกอบใดยื่นเกินขอบขวาที่ ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('#roleBar [role="tab"]').first()).toBeVisible();

    /*
     * ข้อนี้จับสิ่งที่การวัดระดับเอกสารจับไม่ได้ — องค์ประกอบที่ยื่นพ้นช่องมองโดยไม่ทำให้
     * scrollWidth โต เช่น position:fixed หรือ sticky
     *
     * ต้องข้ามตัวที่อยู่ในกล่องที่เลื่อนหรือตัดขอบได้ (overflow-x: auto/scroll/hidden)
     * เพราะนั่นไม่ใช่ "หน้าล้ม" — แถบบทบาทของต้นแบบเป็น overflow-x:auto โดยตั้งใจ
     * แท็บที่ยื่นพ้นขอบจึงเป็นการออกแบบที่ถูก ไม่ใช่ข้อบกพร่อง
     *
     * ฉบับแรกของข้อนี้ไม่ได้ข้าม แล้วแดงที่ 360 กับ 768 px ตรวจแล้วพบว่าทุกตัวที่ฟ้อง
     * อยู่ใน div.rolebar ทั้งหมด — เป็นเทสต์ที่เข้มเกิน ไม่ใช่ต้นแบบที่พัง
     */
    const offenders = await page.evaluate((vw) => {
      const clipped = (el: HTMLElement) => {
        for (let a = el.parentElement; a; a = a.parentElement) {
          const ov = getComputedStyle(a).overflowX;
          if (ov === 'auto' || ov === 'scroll' || ov === 'hidden') return true;
        }
        return false;
      };
      const out: string[] = [];
      for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > vw + 1 && !clipped(el)) {
          out.push(`${el.tagName.toLowerCase()}.${el.className || '(ไม่มีคลาส)'} right=${Math.round(r.right)}`);
        }
        if (out.length >= 5) break;
      }
      return out;
    }, width);

    expect(offenders, `องค์ประกอบที่ยื่นเกิน ${width} px`).toEqual([]);
  });
}
