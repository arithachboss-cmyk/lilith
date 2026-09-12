# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: readiness.spec.ts >> P0 lifecycle: restoration cannot replace withdrawal confirmation with an old event error
- Location: tests/e2e/readiness.spec.ts:608:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('status').first()
Expected substring: "Consent withdrawn"
Received string:    "Your session expired. Start again with consent."
Timeout: 10000ms

Call log:
  - Expect "toContainText" getByRole('status').first() with timeout 10000ms
  - waiting for getByRole('status').first()
    24 × locator resolved to <p role="status" aria-live="polite" class="pilot-status">Your session expired. Start again with consent.</p>
       - unexpected value "Your session expired. Start again with consent."

```

```yaml
- status: Your session expired. Start again with consent.
```

# Test source

```ts
  574 |   await expect(page.getByTestId("lead-id")).toBeVisible();
  575 |   const paused = deferred(),
  576 |     release = deferred();
  577 |   let held = false;
  578 |   await page.route("**/api/pilot/images/*", async (route) => {
  579 |     if (route.request().method() === "GET" && !held) {
  580 |       held = true;
  581 |       paused.resolve();
  582 |       await release.promise;
  583 |     }
  584 |     await route.continue();
  585 |   });
  586 |   await page.reload();
  587 |   await paused.promise;
  588 |   try {
  589 |     const recorded = page.waitForResponse(
  590 |       (response) =>
  591 |         response.url().endsWith("/api/pilot/events") &&
  592 |         response.request().postDataJSON()?.name === "call_click",
  593 |     );
  594 |     await page
  595 |       .getByRole("link", { name: "Test call", exact: true })
  596 |       .first()
  597 |       .click();
  598 |     expect((await recorded).status()).toBe(200);
  599 |   } finally {
  600 |     release.resolve();
  601 |   }
  602 |   await expect(page.getByRole("status").first()).toContainText(
  603 |     "No call or external message",
  604 |   );
  605 |   await expect(page.getByText("1 / 4 images", { exact: true })).toBeVisible();
  606 | });
  607 | 
  608 | test("P0 lifecycle: restoration cannot replace withdrawal confirmation with an old event error", async ({
  609 |   page,
  610 | }) => {
  611 |   await details(page);
  612 |   await page
  613 |     .getByLabel("Test images", { exact: true })
  614 |     .setInputFiles(images(1));
  615 |   await consent(page);
  616 |   await page.getByRole("button", { name: /Save test request/ }).click();
  617 |   await expect(page.getByTestId("lead-id")).toBeVisible();
  618 |   const imagePaused = deferred(),
  619 |     releaseImage = deferred();
  620 |   const eventPaused = deferred(),
  621 |     releaseEvent = deferred();
  622 |   let imageHeld = false,
  623 |     eventHeld = false;
  624 |   await page.route("**/api/pilot/images/*", async (route) => {
  625 |     if (route.request().method() === "GET" && !imageHeld) {
  626 |       imageHeld = true;
  627 |       imagePaused.resolve();
  628 |       await releaseImage.promise;
  629 |     }
  630 |     await route.continue();
  631 |   });
  632 |   await page.route("**/api/pilot/events", async (route) => {
  633 |     if (!eventHeld) {
  634 |       eventHeld = true;
  635 |       eventPaused.resolve();
  636 |       await releaseEvent.promise;
  637 |     }
  638 |     await route.continue();
  639 |   });
  640 |   await page.reload();
  641 |   await imagePaused.promise;
  642 |   await page
  643 |     .getByRole("link", { name: "Test call", exact: true })
  644 |     .first()
  645 |     .click();
  646 |   await eventPaused.promise;
  647 |   releaseImage.resolve();
  648 |   await expect(
  649 |     page.getByRole("button", { name: "Reopen saved request", exact: true }),
  650 |   ).toBeEnabled();
  651 |   await page
  652 |     .getByRole("button", { name: /Withdraw consent and delete test data/ })
  653 |     .click();
  654 |   await expect(page.getByRole("status").first()).toContainText(
  655 |     "Consent withdrawn",
  656 |   );
  657 |   const staleResponse = page.waitForResponse((response) =>
  658 |     response.url().endsWith("/api/pilot/events"),
  659 |   );
  660 |   releaseEvent.resolve();
  661 |   const response = await staleResponse;
  662 |   expect(response.status()).toBe(401);
  663 |   await response.finished();
  664 |   await page.evaluate(
  665 |     () =>
  666 |       new Promise((resolve) =>
  667 |         requestAnimationFrame(() => requestAnimationFrame(resolve)),
  668 |       ),
  669 |   );
  670 |   await page.screenshot({
  671 |     path: `${output}/withdrawal-restoration.png`,
  672 |     fullPage: true,
  673 |   });
> 674 |   await expect(page.getByRole("status").first()).toContainText(
      |                                                  ^ Error: expect(locator).toContainText(expected) failed
  675 |     "Consent withdrawn",
  676 |   );
  677 | });
  678 | 
```