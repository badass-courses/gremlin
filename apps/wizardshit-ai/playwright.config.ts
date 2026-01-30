import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for wizardshit-ai e2e tests.
 *
 * Features:
 * - Sharding support for parallel CI execution
 * - Blob reporter for merging sharded results
 * - GitHub annotations in CI
 * - Trace capture on failure
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? "50%" : undefined,

	// CI: blob for sharding + github annotations
	// Local: html report
	reporter: process.env.CI
		? [["blob"], ["github"], ["list"]]
		: [["html", { open: "never" }]],

	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],

	// In CI, we build first and start the server separately
	// Locally, we start the dev server
	webServer: process.env.CI
		? {
				command: "pnpm run start",
				url: "http://localhost:3000",
				reuseExistingServer: false,
				timeout: 120 * 1000,
			}
		: {
				command: "pnpm run dev",
				url: "http://localhost:3000",
				reuseExistingServer: true,
				timeout: 120 * 1000,
			},
});
