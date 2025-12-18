import { defineWorkspace } from "vitest/config";

/**
 * Vitest workspace configuration for @badass monorepo
 *
 * Each package has its own vitest.config.ts that extends the shared base
 * from tooling/test-utils. This workspace file orchestrates test execution
 * across all packages.
 */
export default defineWorkspace([
	"packages/core/vitest.config.ts",
	"packages/db/vitest.config.ts",
	// Add new packages here as they're created
	// Add apps when needed:
	// "apps/*/vitest.config.ts",
]);
