import { test, expect } from "@playwright/test";

test.describe("Component Tests", () => {
  test.describe("Theme Toggle", () => {
    test("should toggle between light and dark themes", async ({ page }) => {
      await page.goto("/");

      // Theme toggle uses dynamic aria-label
      const themeToggle = page.getByRole("button", { name: /switch to/i });
      await expect(themeToggle).toBeVisible();

      // Check initial state (dark mode)
      const html = page.locator("html");
      await expect(html).toHaveClass(/dark/);

      // Toggle to light mode
      await themeToggle.click();

      // HTML should now have "light" class
      await expect(html).toHaveClass(/light/);

      // Toggle back
      await themeToggle.click();
      await expect(html).not.toHaveClass(/light/);
    });
  });

  test.describe("Navigation", () => {
    test("should navigate from home to history", async ({ page }) => {
      await page.goto("/");

      const historyLink = page.getByRole("link", { name: /history/i });
      await historyLink.click();

      await expect(page).toHaveURL("/history");
      await expect(
        page.getByRole("heading", { name: /truth ledger/i })
      ).toBeVisible();
    });

    test("should navigate from history back to home", async ({ page }) => {
      await page.goto("/history");

      const homeLink = page.getByRole("link", { name: /check claim/i });
      await homeLink.click();

      await expect(page).toHaveURL("/");
    });
  });

  test.describe("Animations", () => {
    test("should respect reduced motion preference", async ({ page }) => {
      // Enable reduced motion preference
      await page.emulateMedia({ reducedMotion: "reduce" });

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Verify page still renders correctly
      await expect(
        page.getByRole("heading", { name: /verify any claim/i })
      ).toBeVisible();
    });
  });

  test.describe("Error States", () => {
    test("should display error message on API failure", async ({ page }) => {
      // Mock API error
      await page.route("/api/check", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      await page.goto("/");

      // Fill valid claim
      const input = page.getByPlaceholder(/enter a claim to fact-check/i);
      await input.fill("Test claim that is long enough to be valid");

      // Submit
      const checkButton = page.getByRole("button", { name: /check/i });
      await checkButton.click();

      // Wait for error state
      await page.waitForTimeout(2000);

      // Verify error message is shown
      await expect(page.getByText(/error/i)).toBeVisible();
    });
  });
});

test.describe("Input Validation", () => {
  test("should allow short claims", async ({ page }) => {
    await page.goto("/");

    const input = page.getByPlaceholder(/enter a claim to fact-check/i);

    // Type short claim
    await input.fill("short");

    // In current implementation, any non-empty input enables the check button
    const checkButton = page.getByRole("button", { name: /check/i });
    await expect(checkButton).toBeEnabled();
  });

  test("should fill input with example claim", async ({ page }) => {
    await page.goto("/");

    const input = page.getByPlaceholder(/enter a claim to fact-check/i);

    // Click example claim
    await page.getByText(/water boils at 100/i).click();

    // Input should contain the example
    await expect(input).toHaveValue(/water boils/i);
  });
});

test.describe("Responsive Behavior", () => {
  test("desktop layout shows full header", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    // All header elements should be visible
    await expect(page.getByText("TRUTHCAST")).toBeVisible();
    await expect(page.getByRole("link", { name: /history/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /switch to/i })
    ).toBeVisible();
  });

  test("mobile layout adjusts appropriately", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check that heading is still visible
    await expect(
      page.getByRole("heading", { name: /verify any claim/i })
    ).toBeVisible();

    // Check that input is visible
    await expect(
      page.getByPlaceholder(/enter a claim to fact-check/i)
    ).toBeVisible();
  });
});
