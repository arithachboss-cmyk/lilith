import { syntheticPng } from "../helpers/synthetic-image.mjs";
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
const images = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    name: `synthetic-${i + 1}.png`,
    mimeType: "image/png",
    buffer: syntheticPng(i),
  }));
const output = "output/playwright/readiness";
test.beforeAll(() => mkdirSync(output, { recursive: true }));
async function details(page: Page) {
  await page.goto(
    "/pilot?utm_source=test_source&utm_medium=organic&utm_campaign=test_pilot&lang=en",
  );
  await page
    .getByRole("button", { name: "Fill synthetic test details" })
    .click();
}
async function consent(page: Page) {
  await page.getByRole("button", { name: /Review consent/ }).click();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await page.getByRole("checkbox").check();
}
for (const device of ["desktop", "mobile"] as const) {
  test(`P0 journey ${device}: consent, images, unique Lead ID, refresh and operations handoff`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:4199",
      viewport:
        device === "mobile"
          ? { width: 390, height: 844 }
          : { width: 1440, height: 1000 },
      hasTouch: device === "mobile",
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      return url.hostname !== "127.0.0.1" ? route.abort() : route.continue();
    });
    await details(page);
    await page
      .getByLabel("Test images", { exact: true })
      .setInputFiles(images(4));
    await expect(page.getByText("4 / 4 images", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Next image", exact: true }).click();
    await expect(
      page.getByAltText("Synthetic upload 2", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Move image 2 left", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Remove image 4", exact: true })
      .click();
    await expect(page.getByText("3 / 4 images", { exact: true })).toBeVisible();
    await page
      .getByLabel("Test images", { exact: true })
      .setInputFiles(images(1));
    await consent(page);
    const copy = page.getByRole("region", { name: "Consent details" });
    await copy.focus();
    await page.keyboard.press("End");
    await expect(copy).toBeVisible();
    await page.screenshot({
      path: `${output}/${device}-consent.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: /Save test request/ }).dblclick();
    await expect(page.getByTestId("lead-id")).toBeVisible();
    const id = await page.getByTestId("lead-id").innerText();
    await page.screenshot({
      path: `${output}/${device}-saved.png`,
      fullPage: true,
    });
    await page.reload();
    await expect(page.getByTestId("lead-id")).toHaveText(id);
    await expect(page.getByText("4 / 4 images", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Reopen saved request" }).click();
    await expect(page.getByTestId("lead-id")).toHaveText(id);
    await expect(page.locator('input[name="contact"]')).toHaveValue(
      "pilot@example.test",
    );
    await page
      .locator(".pilot-contact")
      .getByRole("link", { name: "Test LINE", exact: true })
      .click();
    await page
      .locator(".pilot-contact")
      .getByRole("link", { name: "Test call", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "No call or external message",
    );
    await expect(page.locator('a[href*="@themiddleproperty"]')).toHaveCount(0);
    const line = page.locator(
      'a[href="https://line.me/R/ti/p/@middleproperty"]',
    );
    expect(await line.count()).toBeGreaterThanOrEqual(5);
    const phone = page.locator('a[href="tel:+66933888594"]');
    expect(await phone.count()).toBeGreaterThanOrEqual(5);
    const ops = await browser.newContext({
      baseURL: "http://127.0.0.1:4199",
      extraHTTPHeaders: { "oai-authenticated-user-id": "TEST-operations" },
    });
    const inbox = await ops.newPage();
    await inbox.goto("/pilot/inbox");
    await inbox.getByRole("button", { name: id, exact: true }).click();
    const record = inbox
      .locator("article")
      .filter({ has: inbox.getByRole("button", { name: id, exact: true }) });
    await expect(record).toContainText(`notification-${id}`);
    await expect(record).toContainText("mock://middle-property-operations");
    await expect(record).toContainText("Images: 4");
    await record.getByRole("button", { name: "Qualify test lead" }).click();
    await record.getByLabel("Viewing window").fill("TEST 2026-10-01 14:00");
    await record.getByRole("button", { name: "Mark viewing-ready" }).click();
    await expect(record).toContainText("viewing_ready");
    await inbox.screenshot({
      path: `${output}/${device}-operations.png`,
      fullPage: true,
    });
    await page.reload();
    await expect(
      page.getByText("Status: viewing_ready", { exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
    await ops.close();
    await context.close();
  });
}
test("P0-01 lost submit response retries and recovers the same persisted Lead ID", async ({
  page,
}) => {
  await details(page);
  await consent(page);
  let savedId = "";
  let lost = false;
  await page.route("**/api/pilot/leads", async (route) => {
    if (!lost) {
      lost = true;
      const response = await route.fetch();
      savedId = (await response.json()).data.lead_id;
      await route.abort("connectionfailed");
    } else await route.continue();
  });
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByRole("status")).not.toBeEmpty();
  await expect(
    page.getByRole("button", { name: /Save test request/ }),
  ).toBeEnabled();
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByTestId("lead-id")).toHaveText(savedId);
  await page.screenshot({
    path: `${output}/lost-response-recovered.png`,
    fullPage: true,
  });
});
test("P0-01/P0-02 invalid input and declined consent never submit; controls recover", async ({
  page,
}) => {
  let creates = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/pilot/leads")) creates++;
  });
  await details(page);
  await page.locator('input[name="budget"]').fill("0");
  await page.getByRole("button", { name: /Review consent/ }).click();
  await expect(
    page.getByRole("button", { name: /Review consent/ }),
  ).toBeEnabled();
  expect(creates).toBe(0);
  await page.locator('input[name="budget"]').fill("50000");
  await page.getByRole("button", { name: /Review consent/ }).click();
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByRole("status")).toContainText("Accept consent");
  expect(creates).toBe(0);
  await page.getByRole("button", { name: /Decline/ }).click();
  await expect(page.getByRole("status")).toContainText("Declined");
  await expect(page.locator('input[name="name"]')).toHaveValue("");
  expect(creates).toBe(0);
});
test("P0-01 offline failure is visible and retry succeeds without a duplicate", async ({
  page,
  context,
}) => {
  await details(page);
  await consent(page);
  await context.setOffline(true);
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByRole("status")).not.toBeEmpty();
  await context.setOffline(false);
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByTestId("lead-id")).toBeVisible();
});
test("P0-03 failed upload retains preview, reports error, and retries the same image ID", async ({
  page,
}) => {
  await details(page);
  await page
    .getByLabel("Test images", { exact: true })
    .setInputFiles(images(1));
  await consent(page);
  let failed = false;
  const attempts: string[] = [];
  await page.route("**/api/pilot/images/*", async (route) => {
    if (route.request().method() === "PUT") {
      attempts.push(route.request().url());
      if (!failed) {
        failed = true;
        return route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: { message: "TEST upload interrupted; retry" },
          }),
        });
      }
    }
    return route.continue();
  });
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByRole("status")).toContainText("upload interrupted");
  await expect(
    page.getByAltText("Synthetic upload 1", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByTestId("lead-id")).toBeVisible();
  expect(attempts.length).toBe(2);
  expect(attempts[0]).toBe(attempts[1]);
});
test("P0-05/P0-06 landing contact routes preserve source and simulate canonical contact", async ({
  page,
}) => {
  await page.goto(
    "/pilot?channel=line&utm_source=test_header&utm_medium=organic&utm_campaign=test_contact&lang=en",
  );
  await page.getByText("Test event log (no personal data)").click();
  await expect(page.locator("output")).toContainText("line_click");
  await page
    .getByRole("button", { name: "Fill synthetic test details" })
    .click();
  await consent(page);
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByTestId("lead-id")).toBeVisible();
});
test("P0-02 mobile 200% text remains scrollable with unobstructed consent controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await details(page);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await consent(page);
  await expect(page.getByRole("checkbox")).toBeChecked();
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByTestId("lead-id")).toBeVisible();
  await page.screenshot({
    path: `${output}/mobile-200-percent.png`,
    fullPage: true,
  });
});

test("P0-05 actual Landing preserves canonical contacts and UTM into requirement flow", async ({
  page,
}) => {
  await page.route("**/*", (route) =>
    new URL(route.request().url()).hostname !== "127.0.0.1"
      ? route.abort()
      : route.continue(),
  );
  await page.goto(
    "/?utm_source=test_landing&utm_medium=organic&utm_campaign=test_header",
  );
  await expect(
    page.getByText("MOCK PREVIEW", { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.locator('a[href="tel:+66933888594"]').first(),
  ).toBeVisible();
  await expect(page.locator('a[href*="@themiddleproperty"]')).toHaveCount(0);
  await page.screenshot({ path: `${output}/landing.png`, fullPage: true });
  await page.locator('a[href="tel:+66933888594"]').first().click();
  await expect(page).toHaveURL(
    /pilot\?.*utm_source=test_landing.*channel=call/,
  );
  await page.getByText("Test event log (no personal data)").click();
  await expect(page.locator("output")).toContainText("call_click");
});

test("P0-03 saving waits for slow image decoding instead of silently dropping selected files", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = window.createImageBitmap.bind(window);
    window.createImageBitmap = (async (
      ...args: Parameters<typeof createImageBitmap>
    ) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return original(...args);
    }) as typeof createImageBitmap;
  });
  await details(page);
  await consent(page);
  await page
    .getByLabel("Test images", { exact: true })
    .setInputFiles(images(2));
  await expect(
    page.getByRole("button", { name: /Save test request/ }),
  ).toBeDisabled();
  await expect(page.getByText("2 / 4 images", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Save test request/ }).click();
  await expect(page.getByTestId("lead-id")).toBeVisible();
  await page.reload();
  await expect(page.getByText("2 / 4 images", { exact: true })).toBeVisible();
});
