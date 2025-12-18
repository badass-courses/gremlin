/**
 * Shared test utilities for @badass monorepo
 *
 * Provides common test helpers, fixtures, and utilities used across
 * all packages. Follows TDD patterns from testing-patterns skill:
 * - Fakes over mocks
 * - Test behavior, not state
 * - Characterization tests for existing code
 */

import { defineConfig } from "vitest/config";

/**
 * Base Vitest configuration for all packages
 *
 * Each package's vitest.config.ts should extend this base config
 * and add package-specific settings as needed.
 */
export const baseConfig = defineConfig({
	test: {
		// Only show passed tests if they fail ("silent: 'passed-only'")
		// This keeps test output focused on failures
		silent: false,

		// Reset mocks between tests for isolation
		mockReset: true,

		// Coverage settings
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			enabled: false, // Enable with --coverage flag
			include: ["src/**/*.ts"],
			exclude: [
				"**/*.test.ts",
				"**/*.spec.ts",
				"**/test-*.ts",
				"**/index.ts", // Usually just re-exports
			],
		},

		// Test file patterns
		include: ["**/*.{test,spec}.{ts,tsx}"],
		exclude: ["node_modules", "dist", "build", ".next"],
	},
});

/**
 * Create a fake implementation for testing
 *
 * Prefer fakes over mocks - they're more realistic and less brittle.
 * A fake is a working implementation with shortcuts (e.g., in-memory DB).
 *
 * @example
 * ```ts
 * class FakeEmailService implements EmailService {
 *   sent: Email[] = [];
 *   send(email: Email) {
 *     this.sent.push(email);
 *   }
 * }
 * ```
 */
export function createFake<T>(implementation: T): T {
	return implementation;
}

/**
 * Delay execution for testing async behavior
 *
 * @example
 * ```ts
 * await delay(100); // Wait 100ms
 * ```
 */
export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a spy function that records calls
 *
 * @example
 * ```ts
 * const spy = createSpy();
 * spy("arg1", "arg2");
 * expect(spy.calls).toEqual([["arg1", "arg2"]]);
 * ```
 */
export function createSpy<TArgs extends unknown[] = unknown[]>() {
	const calls: TArgs[] = [];
	const fn = (...args: TArgs) => {
		calls.push(args);
	};
	fn.calls = calls;
	return fn;
}
