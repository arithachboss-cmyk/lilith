# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: readiness.spec.ts >> P0 journey mobile: consent, images, unique Lead ID, refresh and operations handoff
- Location: tests/e2e/readiness.spec.ts:175:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('status')
Expected substring: "No call or external message"
Received string:    ""
Timeout: 10000ms

Call log:
  - Expect "toContainText" getByRole('status') with timeout 10000ms
  - waiting for getByRole('status')
    4 × locator resolved to <p role="status" aria-live="polite" class="pilot-status">Restoring saved request and images… / กำลังเปิดข้…</p>
      - unexpected value "Restoring saved request and images… / กำลังเปิดข้อมูลและรูปที่บันทึก"
    20 × locator resolved to <p role="status" aria-live="polite" class="pilot-status"></p>
       - unexpected value ""

```

```yaml
- status
```

# Test source

```ts
  144 |   await page
  145 |     .getByLabel("Test images", { exact: true })
  146 |     .setInputFiles(images(4));
  147 |   await expect(page.getByText("4 / 4 images", { exact: true })).toBeVisible();
  148 |   await page
  149 |     .getByRole("button", { name: "Move image 2 left", exact: true })
  150 |     .click();
  151 |   await page
  152 |     .getByRole("button", { name: "Remove image 4", exact: true })
  153 |     .click();
  154 |   await expect(page.getByText("3 / 4 images", { exact: true })).toBeVisible();
  155 |   await page
  156 |     .getByLabel("Test images", { exact: true })
  157 |     .setInputFiles(images(1));
  158 |   await expect(page.getByText("4 / 4 images", { exact: true })).toBeVisible();
  159 |   await consent(page);
  160 |   await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  161 |   await page.getByRole("button", { name: /Save test request/ }).dblclick();
  162 |   await expect(page.getByTestId("lead-id")).toBeVisible();
  163 |   const id = await page.getByTestId("lead-id").innerText();
  164 |   expect(puts).toBe(4);
  165 |   await page.reload();
  166 |   await expect(page.getByTestId("lead-id")).toHaveText(id);
  167 |   await expect(page.getByText("4 / 4 images", { exact: true })).toBeVisible();
  168 |   await page.screenshot({
  169 |     path: `${output}/mobile-200-double-click.png`,
  170 |     fullPage: true,
  171 |   });
  172 |   await context.close();
  173 | });
  174 | for (const device of ["desktop", "mobile"] as const) {
  175 |   test(`P0 journey ${device}: consent, images, unique Lead ID, refresh and operations handoff`, async ({
  176 |     browser,
  177 |   }) => {
  178 |     const context = await browser.newContext({
  179 |       baseURL: "http://127.0.0.1:4199",
  180 |       viewport:
  181 |         device === "mobile"
  182 |           ? { width: 390, height: 844 }
  183 |           : { width: 1440, height: 1000 },
  184 |       hasTouch: device === "mobile",
  185 |     });
  186 |     const page = await context.newPage();
  187 |     const errors: string[] = [];
  188 |     page.on("pageerror", (e) => errors.push(e.message));
  189 |     await context.route("**/*", (route) => {
  190 |       const url = new URL(route.request().url());
  191 |       return url.hostname !== "127.0.0.1" ? route.abort() : route.continue();
  192 |     });
  193 |     await details(page);
  194 |     await page
  195 |       .getByLabel("Test images", { exact: true })
  196 |       .setInputFiles(images(4));
  197 |     await expect(page.getByText("4 / 4 images", { exact: true })).toBeVisible();
  198 |     await page.getByRole("button", { name: "Next image", exact: true }).click();
  199 |     await expect(
  200 |       page.getByAltText("Synthetic upload 2", { exact: true }),
  201 |     ).toBeVisible();
  202 |     await page
  203 |       .getByRole("button", { name: "Move image 2 left", exact: true })
  204 |       .click();
  205 |     await page
  206 |       .getByRole("button", { name: "Remove image 4", exact: true })
  207 |       .click();
  208 |     await expect(page.getByText("3 / 4 images", { exact: true })).toBeVisible();
  209 |     await page
  210 |       .getByLabel("Test images", { exact: true })
  211 |       .setInputFiles(images(1));
  212 |     await consent(page);
  213 |     const copy = page.getByRole("region", { name: "Consent details" });
  214 |     await copy.focus();
  215 |     await page.keyboard.press("End");
  216 |     await expect(copy).toBeVisible();
  217 |     await page.screenshot({
  218 |       path: `${output}/${device}-consent.png`,
  219 |       fullPage: true,
  220 |     });
  221 |     await page.getByRole("button", { name: /Save test request/ }).dblclick();
  222 |     await expect(page.getByTestId("lead-id")).toBeVisible();
  223 |     const id = await page.getByTestId("lead-id").innerText();
  224 |     await page.screenshot({
  225 |       path: `${output}/${device}-saved.png`,
  226 |       fullPage: true,
  227 |     });
  228 |     await page.reload();
  229 |     await expect(page.getByTestId("lead-id")).toHaveText(id);
  230 |     await expect(page.getByText("4 / 4 images", { exact: true })).toBeVisible();
  231 |     await page.getByRole("button", { name: "Reopen saved request" }).click();
  232 |     await expect(page.getByTestId("lead-id")).toHaveText(id);
  233 |     await expect(page.locator('input[name="contact"]')).toHaveValue(
  234 |       "pilot@example.test",
  235 |     );
  236 |     await page
  237 |       .locator(".pilot-contact")
  238 |       .getByRole("link", { name: "Test LINE", exact: true })
  239 |       .click();
  240 |     await page
  241 |       .locator(".pilot-contact")
  242 |       .getByRole("link", { name: "Test call", exact: true })
  243 |       .click();
> 244 |     await expect(page.getByRole("status")).toContainText(
      |                                            ^ Error: expect(locator).toContainText(expected) failed
  245 |       "No call or external message",
  246 |     );
  247 |     await expect(page.locator('a[href*="@themiddleproperty"]')).toHaveCount(0);
  248 |     const line = page.locator(
  249 |       'a[href="https://line.me/R/ti/p/@middleproperty"]',
  250 |     );
  251 |     expect(await line.count()).toBeGreaterThanOrEqual(5);
  252 |     const phone = page.locator('a[href="tel:+66933888594"]');
  253 |     expect(await phone.count()).toBeGreaterThanOrEqual(5);
  254 |     const ops = await browser.newContext({
  255 |       baseURL: "http://127.0.0.1:4199",
  256 |       extraHTTPHeaders: {
  257 |         "oai-authenticated-user-id": "TEST-operations",
  258 |         "oai-authenticated-user-email": "operations@example.test",
  259 |       },
  260 |     });
  261 |     const inbox = await ops.newPage();
  262 |     await inbox.goto("/pilot/inbox");
  263 |     await inbox.getByRole("button", { name: id, exact: true }).click();
  264 |     const record = inbox
  265 |       .locator("article")
  266 |       .filter({ has: inbox.getByRole("button", { name: id, exact: true }) });
  267 |     await expect(record).toContainText(`notification-${id}`);
  268 |     await expect(record).toContainText("mock://middle-property-operations");
  269 |     await expect(record).toContainText("Images: 4");
  270 |     await record.getByRole("button", { name: "Qualify test lead" }).click();
  271 |     await record.getByLabel("Viewing window").fill("TEST 2026-10-01 14:00");
  272 |     await record.getByRole("button", { name: "Mark viewing-ready" }).click();
  273 |     await expect(record).toContainText("viewing_ready");
  274 |     await inbox.screenshot({
  275 |       path: `${output}/${device}-operations.png`,
  276 |       fullPage: true,
  277 |     });
  278 |     await page.reload();
  279 |     await expect(
  280 |       page.getByText("Status: viewing_ready", { exact: true }),
  281 |     ).toBeVisible();
  282 |     expect(errors).toEqual([]);
  283 |     await ops.close();
  284 |     await context.close();
  285 |   });
  286 | }
  287 | test("P0-01 lost submit response retries and recovers the same persisted Lead ID", async ({
  288 |   page,
  289 | }) => {
  290 |   await details(page);
  291 |   await consent(page);
  292 |   let savedId = "";
  293 |   let lost = false;
  294 |   await page.route("**/api/pilot/leads", async (route) => {
  295 |     if (!lost) {
  296 |       lost = true;
  297 |       const response = await route.fetch();
  298 |       savedId = (await response.json()).data.lead_id;
  299 |       await route.abort("connectionfailed");
  300 |     } else await route.continue();
  301 |   });
  302 |   await page.getByRole("button", { name: /Save test request/ }).click();
  303 |   await expect(page.getByRole("status")).not.toBeEmpty();
  304 |   await expect(
  305 |     page.getByRole("button", { name: /Save test request/ }),
  306 |   ).toBeEnabled();
  307 |   await page.getByRole("button", { name: /Save test request/ }).click();
  308 |   await expect(page.getByTestId("lead-id")).toHaveText(savedId);
  309 |   await page.screenshot({
  310 |     path: `${output}/lost-response-recovered.png`,
  311 |     fullPage: true,
  312 |   });
  313 | });
  314 | test("P0-01/P0-02 invalid input and declined consent never submit; controls recover", async ({
  315 |   page,
  316 | }) => {
  317 |   let creates = 0;
  318 |   page.on("request", (request) => {
  319 |     if (request.url().endsWith("/api/pilot/leads")) creates++;
  320 |   });
  321 |   await details(page);
  322 |   await page.locator('input[name="budget"]').fill("0");
  323 |   await page.getByRole("button", { name: /Review consent/ }).click();
  324 |   await expect(
  325 |     page.getByRole("button", { name: /Review consent/ }),
  326 |   ).toBeEnabled();
  327 |   expect(creates).toBe(0);
  328 |   await page.locator('input[name="budget"]').fill("50000");
  329 |   await page.getByRole("button", { name: /Review consent/ }).click();
  330 |   await page.getByRole("button", { name: /Save test request/ }).click();
  331 |   await expect(page.getByRole("status")).toContainText("Accept consent");
  332 |   expect(creates).toBe(0);
  333 |   await page.getByRole("button", { name: /Decline/ }).click();
  334 |   await expect(page.getByRole("status")).toContainText("Declined");
  335 |   await expect(page.locator('input[name="name"]')).toHaveValue("");
  336 |   expect(creates).toBe(0);
  337 | });
  338 | test("P0-01 offline failure is visible and retry succeeds without a duplicate", async ({
  339 |   page,
  340 |   context,
  341 | }) => {
  342 |   await details(page);
  343 |   await consent(page);
  344 |   await context.setOffline(true);
```