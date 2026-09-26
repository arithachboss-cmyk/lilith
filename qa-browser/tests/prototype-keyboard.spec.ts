import { test, expect } from '@playwright/test';

/*
 * อ้างอิงเนื้อหาของ AC-13 — "แถบบทบาทใช้คีย์บอร์ดได้ครบ ลูกศรสี่ทิศ Home และ End และโฟกัสเห็นชัด"
 * กั้นต้นแบบเท่านั้น ไม่ได้ทำให้ AC-13 ผ่าน (ดู qa-browser/README.md)
 */
test.describe('ต้นแบบ · แถบบทบาทกับคีย์บอร์ด', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#roleBar [role="tab"]').first()).toBeVisible();
  });

  test('แถบบทบาทประกาศตัวเป็น tablist และมีแท็บครบหกบทบาท', async ({ page }) => {
    await expect(page.locator('#roleBar')).toHaveAttribute('role', 'tablist');
    await expect(page.locator('#roleBar [role="tab"]')).toHaveCount(6);
  });

  test('มีแท็บที่ถูกเลือกอยู่เพียงอันเดียวเสมอ', async ({ page }) => {
    await expect(page.locator('#roleBar [role="tab"][aria-selected="true"]')).toHaveCount(1);
  });

  test('ลูกศรสี่ทิศเลื่อนการเลือกได้ และวนกลับที่ปลายทั้งสองด้าน', async ({ page }) => {
    const tabs = page.locator('#roleBar [role="tab"]');
    const selected = () => page.locator('#roleBar [role="tab"][aria-selected="true"]');
    const first = tabs.first();
    await first.focus();

    for (const [key, expected] of [['ArrowRight', 1], ['ArrowDown', 2]] as const) {
      await page.keyboard.press(key);
      await expect(selected()).toHaveAttribute('id', await tabs.nth(expected).getAttribute('id') ?? '');
    }
    for (const [key, expected] of [['ArrowLeft', 1], ['ArrowUp', 0]] as const) {
      await page.keyboard.press(key);
      await expect(selected()).toHaveAttribute('id', await tabs.nth(expected).getAttribute('id') ?? '');
    }
    // จากอันแรกกดถอยหลังต้องวนไปอันสุดท้าย — ขอบที่พังบ่อยที่สุดของ tablist
    await page.keyboard.press('ArrowLeft');
    await expect(selected()).toHaveAttribute('id', await tabs.last().getAttribute('id') ?? '');
  });

  test('Home และ End กระโดดไปต้นและท้าย', async ({ page }) => {
    const tabs = page.locator('#roleBar [role="tab"]');
    const selected = () => page.locator('#roleBar [role="tab"][aria-selected="true"]');
    await tabs.first().focus();

    await page.keyboard.press('End');
    await expect(selected()).toHaveAttribute('id', await tabs.last().getAttribute('id') ?? '');
    await page.keyboard.press('Home');
    await expect(selected()).toHaveAttribute('id', await tabs.first().getAttribute('id') ?? '');
  });

  test('แท็บที่เลือกอยู่คือแท็บที่รับโฟกัส และโฟกัสมองเห็นได้', async ({ page }) => {
    const tabs = page.locator('#roleBar [role="tab"]');
    await tabs.first().focus();
    await page.keyboard.press('End');

    const focusedId = await page.evaluate(() => document.activeElement?.id ?? '');
    expect(focusedId).toBe(await tabs.last().getAttribute('id'));

    /* โฟกัสต้องเห็นได้ — ถ้า outline ถูกลบโดยไม่ใส่อะไรแทน คนที่ใช้คีย์บอร์ดจะหลงทันที */
    const visible = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const s = getComputedStyle(el);
      const noOutline = s.outlineStyle === 'none' || s.outlineWidth === '0px';
      const hasSubstitute = s.boxShadow !== 'none' || parseFloat(s.borderWidth || '0') > 0;
      return !noOutline || hasSubstitute;
    });
    expect(visible, 'แท็บที่โฟกัสอยู่ต้องมี outline หรือสิ่งที่ใช้แทนที่มองเห็นได้').toBe(true);
  });
});
