import { mergeConfig } from "vitest/config";
import { baseConfig } from "../../tooling/test-utils/index.ts";

/**
 * Vitest configuration for @badass/core
 *
 * Extends the shared base config from tooling/test-utils.
 * Add package-specific settings here as needed.
 */
export default mergeConfig(baseConfig, {
	test: {
		// Package-specific test settings can go here
		name: "@badass/core",
	},
});
