import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["packages/*/src/**/*.{test,spec}.{ts,tsx}"],
		exclude: [
			...configDefaults.exclude,
			"apps/**/e2e/**",
			"packages/**/node_modules/**",
		],
	},
});
