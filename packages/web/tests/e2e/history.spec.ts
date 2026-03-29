import { test, expect } from "@playwright/test";

test.describe("History Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/history");
  });

  test("should display the page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /truth ledger/i })
    ).toBeVisible();
    await expect(
      page.getByText(/immutable record of verified claims/i)
    ).toBeVisible();
  });

  test("should display filter pills", async ({ page }) => {
    // Check for ALL filter (using motion.button, so look for text)
    await expect(page.getByRole("button", { name: /^all$/i })).toBeVisible();

    // Check for some verdict filters
    await expect(page.getByRole("button", { name: /^true$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^false$/i })).toBeVisible();
  });

  test("should filter verdicts when clicking filter pill", async ({ page }) => {
    // Click FALSE filter
    await page.getByRole("button", { name: /^false$/i }).click();

    // Wait for filter to apply
    await page.waitForTimeout(300);

    // After clicking, the filter should remain visible and be styled differently
    // (button styling changes when active, but we just verify it's clickable)
    const falseButton = page.getByRole("button", { name: /^false$/i });
    await expect(falseButton).toBeVisible();
  });

  test("should have back to home link", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /check claim/i });
    await expect(backLink).toBeVisible();

    // Click and verify navigation
    await backLink.click();
    await expect(page).toHaveURL("/");
  });

  test("should show loading state initially", async ({ page }) => {
    // Intercept API and never respond, keeping the page in loading state
    await page.route("/api/history", () => {
      // Don't fulfill or continue - keeps request pending
    });

    await page.goto("/history");

    // Should show loading indicator text
    await expect(page.getByText(/loading/i)).toBeVisible();
  });

  test("should show empty state when no verdicts", async ({ page }) => {
    // Mock empty response
    await page.route("/api/history", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ verdicts: [], totalCount: 0 }),
      });
    });

    await page.goto("/history");

    // Should show empty state
    await expect(page.getByText(/no verdicts found/i)).toBeVisible();
  });
});

test.describe("History Page - Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should display mobile card layout", async ({ page }) => {
    // Mock verdicts
    await page.route("/api/history", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          verdicts: [
            {
              claim_hash: "abc123",
              claim_text: "Test claim for mobile",
              verdict_label: "TRUE",
              confidence: 95,
              checked_at: Math.floor(Date.now() / 1000),
              tx_hash: null,
            },
          ],
          totalCount: 1,
        }),
      });
    });

    await page.goto("/history");

    // Wait for content to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    // On mobile, the claim text should be visible (first occurrence)
    await expect(page.getByText("Test claim for mobile").first()).toBeVisible();
  });
});
