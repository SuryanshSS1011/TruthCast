import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the hero section", async ({ page }) => {
    // Check for main heading
    await expect(
      page.getByRole("heading", { name: /verify any claim/i })
    ).toBeVisible();

    // Check for eyebrow text
    await expect(
      page.getByText(/ai fact-checking.*blockchain verified/i)
    ).toBeVisible();
  });

  test("should display the claim input field", async ({ page }) => {
    // Check for input using placeholder
    const input = page.getByPlaceholder(/enter a claim to fact-check/i);
    await expect(input).toBeVisible();

    // Check for check button
    const checkButton = page.getByRole("button", { name: /check/i });
    await expect(checkButton).toBeVisible();
  });

  test("should display example claims", async ({ page }) => {
    // Check for example claim buttons
    await expect(page.getByText(/try an example/i)).toBeVisible();
    await expect(page.getByText(/moon landing was faked/i)).toBeVisible();
    await expect(page.getByText(/water boils at 100/i)).toBeVisible();
  });

  test("should enable check button when input is valid", async ({ page }) => {
    const input = page.getByPlaceholder(/enter a claim to fact-check/i);
    const checkButton = page.getByRole("button", { name: /check/i });

    // Initially disabled
    await expect(checkButton).toBeDisabled();

    // Type valid claim
    await input.fill("The moon landing was faked in 1969");

    // Should be enabled now
    await expect(checkButton).toBeEnabled();
  });

  test("should fill input when clicking example claim", async ({ page }) => {
    const input = page.getByPlaceholder(/enter a claim to fact-check/i);
    const exampleButton = page.getByText(/moon landing was faked/i);

    await exampleButton.click();

    // Input should be filled
    await expect(input).toHaveValue(/moon landing/i);
  });

  test("should have navigation links", async ({ page }) => {
    // Check for history link
    await expect(page.getByRole("link", { name: /history/i })).toBeVisible();

    // Check for TruthCast logo/text
    await expect(page.getByText("TRUTHCAST")).toBeVisible();
  });

  test("should have theme toggle", async ({ page }) => {
    // Theme toggle uses dynamic label: "Switch to light mode" or "Switch to dark mode"
    const themeToggle = page.getByRole("button", { name: /switch to/i });
    await expect(themeToggle).toBeVisible();
  });
});

test.describe("Home Page - Accessibility", () => {
  test("should be accessible via keyboard navigation", async ({ page }) => {
    await page.goto("/");

    // Tab through interactive elements
    await page.keyboard.press("Tab"); // Skip link
    await page.keyboard.press("Tab"); // Logo link
    await page.keyboard.press("Tab"); // History link
    await page.keyboard.press("Tab"); // Theme toggle
    await page.keyboard.press("Tab"); // Input field

    // Check focused element is the input
    const input = page.getByPlaceholder(/enter a claim to fact-check/i);
    await expect(input).toBeFocused();
  });

  test("should have skip to main content link", async ({ page }) => {
    await page.goto("/");

    // Focus skip link (first tab)
    await page.keyboard.press("Tab");

    // Check skip link is visible when focused
    const skipLink = page.getByRole("link", { name: /skip to main content/i });
    await expect(skipLink).toBeFocused();
  });
});
