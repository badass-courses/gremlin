import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
	test("loads successfully", async ({ page }) => {
		await page.goto("/");
		// Default Next.js title - update when app has custom title
		await expect(page).toHaveTitle(/Next/i);
	});

	test("has main content", async ({ page }) => {
		await page.goto("/");
		// Verify the page has loaded with some content
		const body = page.locator("body");
		await expect(body).toBeVisible();
	});
});
