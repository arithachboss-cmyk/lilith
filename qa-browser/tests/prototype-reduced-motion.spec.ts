import { test, expect } from '@playwright/test';

/*
 * อ้างอิงเนื้อหาของ AC-15 — "เคารพ prefers-reduced-motion และไม่มีเสียงหรือแอนิเมชันที่เล่นเอง"
 * กั้นต้นแบบเท่านั้น ไม่ได้ทำให้ AC-15 ผ่าน (ดู qa-browser/README.md)
 */
test.describe('ต้นแบบ · เคารพการลดการเคลื่อนไหว', () => {
  test.use({ reducedMotion: 'reduce' });

  test('เมื่อผู้ใช้ขอลดการเคลื่อนไหว ไม่มีองค์ประกอบใดมี transition หรือ animation ที่ยังกินเวลา', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#roleBar [role="tab"]').first()).toBeVisible();

    const moving = await page.evaluate(() => {
      const toMs = (v: string) =>
        v.split(',').map((s) => {
          const t = s.trim();
          return t.endsWith('ms') ? parseFloat(t) : parseFloat(t) * 1000;
        });
      const out: string[] = [];
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('*'))) {
        const s = getComputedStyle(el);
        const worst = Math.max(...toMs(s.transitionDuration), ...toMs(s.animationDuration));
        /* CSS ของต้นแบบบีบเหลือ .001ms ไม่ใช่ 0 — เกณฑ์คือ "ไม่รู้สึกได้" ไม่ใช่ "เป็นศูนย์เป๊ะ" */
        if (Number.isFinite(worst) && worst > 1) {
          out.push(`${el.tagName.toLowerCase()}.${el.className || '(ไม่มีคลาส)'} = ${worst}ms`);
        }
        if (out.length >= 5) break;
      }
      return out;
    });

    expect(moving, 'องค์ประกอบที่ยังเคลื่อนไหวทั้งที่ผู้ใช้ขอให้ลด').toEqual([]);
  });

  test('ไม่มีสื่อที่เล่นเองในหน้า', async ({ page }) => {
    await page.goto('/');
    const autoplaying = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLMediaElement>('video, audio'))
        .filter((m) => m.autoplay || !m.paused)
        .map((m) => m.tagName.toLowerCase()),
    );
    expect(autoplaying).toEqual([]);
  });
});
