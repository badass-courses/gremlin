/**
 * Smoke test to verify Vitest infrastructure is working
 *
 * This is a minimal test that validates:
 * 1. Vitest is configured correctly
 * 2. TypeScript compilation works
 * 3. Test discovery works
 *
 * Once the infrastructure is validated, this can be deleted.
 */

import { describe, expect, it } from "vitest";

describe("Vitest Infrastructure", () => {
	it("should run basic tests", () => {
		expect(1 + 1).toBe(2);
	});

	it("should support TypeScript", () => {
		const value: string = "test";
		expect(value).toBe("test");
	});

	it("should support async tests", async () => {
		const result = await Promise.resolve(42);
		expect(result).toBe(42);
	});
});
