import { test, expect } from "@playwright/test";

test.describe("Explorer Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/explorer");
  });

  test("should display the page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /on-chain ledger/i })
    ).toBeVisible();
    await expect(
      page.getByText(/immutable blockchain record/i)
    ).toBeVisible();
  });

  test("should display info banner about blockchain", async ({ page }) => {
    await expect(
      page.getByText(/reads directly from the solana blockchain/i)
    ).toBeVisible();
  });

  test("should show loading state or content", async ({ page }) => {
    // Either shows loading indicator or loaded content
    const loadingOrContent = page
      .getByText(/reading from solana blockchain/i)
      .or(page.getByText(/no on-chain verdicts found/i))
      .or(page.getByText(/error/i));
    await expect(loadingOrContent).toBeVisible();
  });

  test("should have navigation links", async ({ page }) => {
    // Wait for page to be ready
    await page.waitForLoadState("networkidle");

    // Check for history link
    await expect(page.getByRole("link", { name: /history/i })).toBeVisible();

    // Check for TruthCast logo/text (in a link)
    await expect(page.getByRole("link").filter({ hasText: "TRUTHCAST" })).toBeVisible();
  });
});

test.describe("Explorer Page - Error Handling", () => {
  test("should handle Solana connection issues gracefully", async ({
    page,
  }) => {
    await page.goto("/explorer");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Page should still be functional (either showing data, loading, or empty state)
    await expect(
      page.getByRole("heading", { name: /on-chain ledger/i })
    ).toBeVisible();
  });
});
