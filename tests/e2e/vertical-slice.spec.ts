import { test, expect, type BrowserContext, type Page } from "@playwright/test";

test("owner and agent complete the first vertical slice through persisted UI actions", async ({
  browser,
}) => {
  const suffix = String(Date.now());
  async function context(role: string): Promise<BrowserContext> {
    return browser.newContext({
      baseURL: "http://127.0.0.1:4199",
      viewport: { width: 1440, height: 1000 },
      extraHTTPHeaders: {
        "oai-authenticated-user-id": `TEST-${role}-${suffix}`,
        "oai-authenticated-user-email": `${role}-${suffix}@example.test`,
      },
    });
  }
  const agentContext = await context("agent"),
    ownerContext = await context("owner");
  const agent = await agentContext.newPage(),
    owner = await ownerContext.newPage();
  const errors: string[] = [];
  for (const page of [agent, owner])
    page.on("pageerror", (error) => errors.push(error.message));
  async function onboard(page: Page, role: string) {
    await page.goto("/middle");
    await expect(
      page.getByRole("heading", { name: "Choose your role." }),
    ).toBeVisible();
    await page.getByLabel("Your display name").fill(`TEST ${role}`);
    await page.getByRole("radio", { name: new RegExp(role) }).check();
    await page.getByRole("button", { name: "Create my profile" }).click();
    await expect(
      page.getByRole("heading", { name: "Discover the right connection." }),
    ).toBeVisible();
  }
  // Required order starts with the agent selecting a role and creating demand.
  await onboard(agent, "Agent");
  await agent.goto("/middle/add");
  await agent
    .getByLabel("Requirement title")
    .fill("TEST ONLY — Sukhumvit brief");
  await agent.getByLabel("Preferred locations / districts").fill("Sukhumvit");
  await agent.getByLabel(/Maximum budget/).fill("50000");
  await agent.getByLabel("Minimum bedrooms").fill("2");
  await agent.getByLabel("Facilities", { exact: true }).fill("pool, gym");
  await agent.getByRole("checkbox", { name: /I have permission/ }).check();
  await agent.getByRole("button", { name: "Save requirement" }).click();
  await expect(
    agent.getByRole("heading", { name: "A clearer brief. A better match." }),
  ).toBeVisible();

  await onboard(owner, "Owner");
  await owner.goto("/middle/add");
  await owner.getByLabel("Property name").fill("TEST ONLY — Sukhumvit Condo");
  await owner
    .getByLabel("Location / district", { exact: true })
    .fill("Sukhumvit");
  await owner.getByLabel(/Asking price/).fill("45000");
  await owner.getByLabel("Bedrooms", { exact: true }).fill("2");
  await owner.getByLabel("Area (m²)").fill("80");
  await owner.getByLabel("Facilities", { exact: true }).fill("pool, gym");
  await owner.getByRole("button", { name: "Publish property" }).click();
  await expect(
    owner.getByRole("heading", { name: "Your property is in." }),
  ).toBeVisible();

  await agent.getByRole("link", { name: "Find matches →" }).click();
  await agent
    .getByRole("button", { name: "Find matches", exact: true })
    .click();
  await expect(
    agent.getByRole("heading", { name: "TEST ONLY — Sukhumvit Condo" }),
  ).toBeVisible();
  await agent.getByText("Why this match", { exact: true }).click();
  await expect(
    agent.getByText("Within the maximum budget", { exact: true }),
  ).toBeVisible();
  await agent.getByRole("button", { name: "Interested", exact: true }).click();
  await expect(
    agent.getByRole("status").filter({ hasText: "Interest saved" }),
  ).toBeVisible();

  await owner.goto("/middle/matches");
  await expect(owner.getByText(/Counterparty: Interested/)).toBeVisible();
  await owner.getByRole("button", { name: "Interested", exact: true }).click();
  await expect(
    owner.getByRole("heading", { name: "It’s a match." }),
  ).toBeVisible();
  await owner.getByRole("link", { name: "Start deal →" }).click();
  await expect(
    owner.getByText("Deal room opened", { exact: true }),
  ).toBeVisible();
  const roomPath = new URL(owner.url()).pathname;
  await agent.goto(roomPath);
  await agent
    .getByLabel("Your message", { exact: true })
    .fill("TEST: I would like to view this property.");
  await agent.getByRole("button", { name: "Send message" }).click();
  await expect(
    agent.getByText("TEST: I would like to view this property.", {
      exact: true,
    }),
  ).toBeVisible();
  await agent.getByRole("button", { name: "Viewing", exact: true }).click();
  const tomorrow = new Date(Date.now() + 86400000);
  tomorrow.setSeconds(0, 0);
  const localTime = new Date(
    tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 16);
  await agent.getByLabel("Date and time").fill(localTime);
  await agent.getByLabel("Viewing notes").fill("TEST: Meet at the lobby.");
  await agent
    .getByRole("button", { name: "Request viewing", exact: true })
    .click();
  await expect(
    agent.getByText("Viewing requested", { exact: true }),
  ).toBeVisible();
  await agent.reload();
  await expect(
    agent.getByText("Viewing requested", { exact: true }),
  ).toBeVisible();

  await owner.reload();
  await owner.getByRole("button", { name: "Viewing", exact: true }).click();
  await owner
    .getByLabel("Confirmation note")
    .fill("TEST: Confirmed, meet at lobby.");
  await owner.getByRole("button", { name: "Confirm viewing action" }).click();
  await expect(
    owner.getByText("Viewing confirmed", { exact: true }).first(),
  ).toBeVisible();
  await owner.getByRole("button", { name: "Timeline", exact: true }).click();
  await expect(
    owner.locator("strong").filter({ hasText: "Viewing requested" }),
  ).toBeVisible();
  await owner.screenshot({
    path: "output/playwright/deal-room-desktop.png",
    fullPage: true,
  });
  await agent.setViewportSize({ width: 390, height: 844 });
  await agent.goto("/middle/matches");
  await expect(
    agent.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  expect(
    await agent.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await agent.screenshot({
    path: "output/playwright/matches-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  await agentContext.close();
  await ownerContext.close();
});

test("anonymous workspace uses the real sign-in entry point", async ({
  page,
}) => {
  await page.goto("/middle");
  await expect(
    page.getByRole("link", { name: "Sign in to your workspace →" }),
  ).toHaveAttribute("href", /\/signin-with-chatgpt\?return_to=/);
  expect((await page.request.get("/api/discover")).status()).toBe(401);
});
