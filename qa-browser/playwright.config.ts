import { defineConfig, devices } from '@playwright/test';

/*
 * เทสต์ชุดนี้ยิงที่ "ต้นแบบ" ใน hr-screens/ ไม่ใช่ที่ apps/web
 * อ่าน qa-browser/README.md ก่อนตีความผลลัพธ์ — เขียวที่นี่ไม่ได้แปลว่าเกณฑ์ AC-13/14/15 ผ่าน
 *
 * PW_CHROMIUM_PATH มีไว้สำหรับเครื่องที่มี Chromium ติดตั้งไว้แล้วคนละ revision กับที่ driver
 * มองหา และดาวน์โหลดเพิ่มไม่ได้ (เช่นคอนเทนเนอร์คลาวด์ของ Claude Code ที่ขาออกถูกบล็อก)
 * ถ้าไม่ตั้ง จะใช้กลไกปกติของ Playwright ซึ่งเป็นสิ่งที่ CI ใช้
 */
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // จงใจไม่ retry — "flake" ไม่ใช่ root cause ดู GROK-QA-ROLE-PACK.md §0.4 ข้อ 4
  reporter: process.env.CI ? 'list' : 'line',
  use: {
    baseURL: 'http://127.0.0.1:4300',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } },
    },
  ],
  webServer: {
    command: 'node hr-screens/serve.mjs',
    cwd: '..',
    url: 'http://127.0.0.1:4300',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
  },
});
