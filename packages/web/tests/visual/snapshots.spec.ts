import { test, expect } from "@playwright/test";

/**
 * Visual Regression Tests
 *
 * These tests capture screenshots and compare them against baselines.
 * Run `npx playwright test --update-snapshots` to update baselines.
 */

test.describe("Visual Regression - Desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("home page - hero section", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for animations to complete
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot("home-hero-desktop.png", {
      fullPage: false,
      threshold: 0.2,
    });
  });

  test("history page - empty state", async ({ page }) => {
    // Mock empty response
    await page.route("/api/history", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ verdicts: [], totalCount: 0 }),
      });
    });

    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("history-empty-desktop.png", {
      fullPage: true,
      threshold: 0.2,
    });
  });

  test("history page - with verdicts", async ({ page }) => {
    // Mock verdicts
    await page.route("/api/history", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          verdicts: [
            {
              claim_hash: "abc123def456",
              claim_text: "The Earth is flat",
              verdict_label: "FALSE",
              confidence: 98,
              checked_at: Math.floor(Date.now() / 1000) - 3600,
              tx_hash: "5abc123",
              reasoning: "Scientific consensus proves Earth is spherical.",
            },
            {
              claim_hash: "xyz789",
              claim_text: "Water boils at 100°C at sea level",
              verdict_label: "TRUE",
              confidence: 100,
              checked_at: Math.floor(Date.now() / 1000) - 7200,
              tx_hash: "5def456",
              reasoning: "Standard physics confirms this.",
            },
          ],
          totalCount: 2,
        }),
      });
    });

    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("history-with-verdicts-desktop.png", {
      fullPage: true,
      threshold: 0.2,
    });
  });
});

test.describe("Visual Regression - Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("home page - mobile hero", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot("home-hero-mobile.png", {
      fullPage: false,
      threshold: 0.2,
    });
  });

  test("history page - mobile layout", async ({ page }) => {
    // Mock verdicts
    await page.route("/api/history", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          verdicts: [
            {
              claim_hash: "abc123",
              claim_text: "Test claim for mobile view",
              verdict_label: "CONFLICTING",
              confidence: 65,
              checked_at: Math.floor(Date.now() / 1000),
              tx_hash: null,
            },
          ],
          totalCount: 1,
        }),
      });
    });

    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot("history-mobile.png", {
      fullPage: true,
      threshold: 0.2,
    });
  });
});

test.describe("Visual Regression - Components", () => {
  test("verdict badges - all types", async ({ page }) => {
    // Mock verdicts with all verdict types
    await page.route("/api/history", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          verdicts: [
            {
              claim_hash: "1",
              claim_text: "True claim",
              verdict_label: "TRUE",
              confidence: 95,
              checked_at: Math.floor(Date.now() / 1000),
              tx_hash: null,
            },
            {
              claim_hash: "2",
              claim_text: "Mostly true claim",
              verdict_label: "MOSTLY_TRUE",
              confidence: 85,
              checked_at: Math.floor(Date.now() / 1000),
              tx_hash: null,
            },
            {
              claim_hash: "3",
              claim_text: "Misleading claim",
              verdict_label: "MISLEADING",
              confidence: 70,
              checked_at: Math.floor(Date.now() / 1000),
              tx_hash: null,
            },
            {
              claim_hash: "4",
              claim_text: "Mostly false claim",
              verdict_label: "MOSTLY_FALSE",
              confidence: 75,
              checked_at: Math.floor(Date.now() / 1000),
              tx_hash: null,
            },
            {
              claim_hash: "5",
              claim_text: "False claim",
              verdict_label: "FALSE",
              confidence: 98,
              checked_at: Math.floor(Date.now() / 1000),
              tx_hash: null,
            },
            {
              claim_hash: "6",
              claim_text: "Conflicting claim",
              verdict_label: "CONFLICTING",
              confidence: 55,
              checked_at: Math.floor(Date.now() / 1000),
              tx_hash: null,
            },
            {
              claim_hash: "7",
              claim_text: "Unverifiable claim",
              verdict_label: "UNVERIFIABLE",
              confidence: 0,
              checked_at: Math.floor(Date.now() / 1000),
              tx_hash: null,
            },
          ],
          totalCount: 7,
        }),
      });
    });

    await page.goto("/history");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Screenshot the main content area
    const mainContent = page.locator("main");
    await expect(mainContent).toHaveScreenshot("verdict-badges-all.png", {
      threshold: 0.2,
    });
  });
});

test.describe("Visual Regression - Dark Mode", () => {
  test("home page - dark mode", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Ensure dark mode is active
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot("home-dark-mode.png", {
      fullPage: false,
      threshold: 0.2,
    });
  });
});
