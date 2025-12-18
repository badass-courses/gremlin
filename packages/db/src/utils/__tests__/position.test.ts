import { describe, expect, test } from "vitest";
import {
	getPositionAtEnd,
	getPositionAtStart,
	getPositionBetween,
	rebalancePositions,
} from "../position.js";

/**
 * Position utilities test suite
 *
 * Tests fractional positioning system for ordered lists.
 * Follows TDD patterns: characterization tests first, then edge cases.
 */

describe("getPositionBetween", () => {
	// CHARACTERIZATION TESTS - Document actual behavior
	describe("characterization tests", () => {
		test("returns midpoint between two positions", () => {
			const result = getPositionBetween(1.0, 3.0);
			expect(result).toBe(2.0);
		});

		test("returns midpoint for close positions", () => {
			const result = getPositionBetween(1.0, 1.1);
			expect(result).toBe(1.05);
		});

		test("handles null before (insert at start)", () => {
			const result = getPositionBetween(null, 1.0);
			expect(result).toBe(0.5);
		});

		test("handles null after (insert at end)", () => {
			const result = getPositionBetween(2.0, null);
			expect(result).toBe(3.0);
		});

		test("handles both null (first item)", () => {
			const result = getPositionBetween(null, null);
			expect(result).toBe(1.0);
		});
	});

	// BEHAVIOR TESTS - Test the contract, not implementation
	describe("behavior tests", () => {
		test("position is always between the two bounds", () => {
			const before = 5.0;
			const after = 10.0;
			const result = getPositionBetween(before, after);

			expect(result).toBeGreaterThan(before);
			expect(result).toBeLessThan(after);
		});

		test("handles very close positions (edge case for fractional precision)", () => {
			const before = 1.0000001;
			const after = 1.0000002;
			const result = getPositionBetween(before, after);

			expect(result).toBeGreaterThan(before);
			expect(result).toBeLessThan(after);
		});

		test("handles negative positions", () => {
			const result = getPositionBetween(-2.0, -1.0);
			expect(result).toBe(-1.5);
			expect(result).toBeGreaterThan(-2.0);
			expect(result).toBeLessThan(-1.0);
		});

		test("handles zero positions", () => {
			const result = getPositionBetween(0, 1.0);
			expect(result).toBe(0.5);
		});

		test("before start returns position less than first", () => {
			const result = getPositionBetween(null, 1.0);
			expect(result).toBeLessThan(1.0);
		});

		test("after end returns position greater than last", () => {
			const result = getPositionBetween(2.0, null);
			expect(result).toBeGreaterThan(2.0);
		});
	});
});

describe("getPositionAtEnd", () => {
	describe("characterization tests", () => {
		test("returns 1.0 for empty list", () => {
			const result = getPositionAtEnd([]);
			expect(result).toBe(1.0);
		});

		test("returns max position + 1.0", () => {
			const items = [{ position: 1.0 }, { position: 2.0 }, { position: 1.5 }];
			const result = getPositionAtEnd(items);
			expect(result).toBe(3.0);
		});

		test("handles single item", () => {
			const items = [{ position: 5.0 }];
			const result = getPositionAtEnd(items);
			expect(result).toBe(6.0);
		});
	});

	describe("behavior tests", () => {
		test("result is always greater than all existing positions", () => {
			const items = [{ position: 1.0 }, { position: 2.5 }, { position: 3.3 }];
			const result = getPositionAtEnd(items);

			for (const item of items) {
				expect(result).toBeGreaterThan(item.position);
			}
		});

		test("handles negative positions", () => {
			const items = [{ position: -5.0 }, { position: -2.0 }];
			const result = getPositionAtEnd(items);
			expect(result).toBe(-1.0);
		});

		test("handles very large positions", () => {
			const items = [{ position: 999999.0 }];
			const result = getPositionAtEnd(items);
			expect(result).toBe(1000000.0);
		});
	});
});

describe("getPositionAtStart", () => {
	describe("characterization tests", () => {
		test("returns 1.0 for empty list", () => {
			const result = getPositionAtStart([]);
			expect(result).toBe(1.0);
		});

		test("returns min position / 2", () => {
			const items = [{ position: 1.0 }, { position: 2.0 }];
			const result = getPositionAtStart(items);
			expect(result).toBe(0.5);
		});

		test("handles single item", () => {
			const items = [{ position: 4.0 }];
			const result = getPositionAtStart(items);
			expect(result).toBe(2.0);
		});
	});

	describe("behavior tests", () => {
		test("result is always less than all existing positions", () => {
			const items = [{ position: 1.0 }, { position: 2.5 }, { position: 3.3 }];
			const result = getPositionAtStart(items);

			for (const item of items) {
				expect(result).toBeLessThan(item.position);
			}
		});

		test("handles positions starting above 1.0", () => {
			const items = [{ position: 10.0 }, { position: 20.0 }];
			const result = getPositionAtStart(items);
			expect(result).toBe(5.0);
		});

		test("handles very small positions", () => {
			const items = [{ position: 0.1 }];
			const result = getPositionAtStart(items);
			expect(result).toBe(0.05);
		});
	});
});

describe("rebalancePositions", () => {
	describe("characterization tests", () => {
		test("reassigns positions as integers starting at 1.0", () => {
			const items = [
				{ id: "a", position: 1.0000001 },
				{ id: "b", position: 1.0000002 },
				{ id: "c", position: 1.0000003 },
			];

			const result = rebalancePositions(items);

			expect(result).toEqual([
				{ id: "a", position: 1.0 },
				{ id: "b", position: 2.0 },
				{ id: "c", position: 3.0 },
			]);
		});

		test("maintains relative order based on original positions", () => {
			const items = [
				{ id: "third", position: 3.3 },
				{ id: "first", position: 1.1 },
				{ id: "second", position: 2.2 },
			];

			const result = rebalancePositions(items);

			expect(result[0].id).toBe("first");
			expect(result[1].id).toBe("second");
			expect(result[2].id).toBe("third");
		});

		test("preserves original item properties", () => {
			const items = [
				{ id: "a", position: 1.5, name: "Item A" },
				{ id: "b", position: 2.5, name: "Item B" },
			];

			const result = rebalancePositions(items);

			expect(result[0]).toEqual({ id: "a", position: 1.0, name: "Item A" });
			expect(result[1]).toEqual({ id: "b", position: 2.0, name: "Item B" });
		});
	});

	describe("behavior tests", () => {
		test("result positions are evenly spaced by 1.0", () => {
			const items = [
				{ position: 0.1 },
				{ position: 0.2 },
				{ position: 0.3 },
				{ position: 0.4 },
			];

			const result = rebalancePositions(items);

			for (let i = 0; i < result.length - 1; i++) {
				const spacing = result[i + 1].position - result[i].position;
				expect(spacing).toBe(1.0);
			}
		});

		test("handles empty array", () => {
			const result = rebalancePositions([]);
			expect(result).toEqual([]);
		});

		test("handles single item", () => {
			const items = [{ id: "only", position: 999.999 }];
			const result = rebalancePositions(items);

			expect(result).toEqual([{ id: "only", position: 1.0 }]);
		});

		test("handles negative positions", () => {
			const items = [{ position: -10 }, { position: -5 }, { position: 0 }];

			const result = rebalancePositions(items);

			expect(result).toEqual([
				{ position: 1.0 },
				{ position: 2.0 },
				{ position: 3.0 },
			]);
		});

		test("sorts by position before rebalancing", () => {
			const items = [
				{ id: "c", position: 30 },
				{ id: "a", position: 10 },
				{ id: "b", position: 20 },
			];

			const result = rebalancePositions(items);

			expect(result[0].id).toBe("a");
			expect(result[1].id).toBe("b");
			expect(result[2].id).toBe("c");
		});
	});

	describe("edge cases", () => {
		test("handles positions that are extremely close together", () => {
			const items = [
				{ position: 1.0000000001 },
				{ position: 1.0000000002 },
				{ position: 1.0000000003 },
			];

			const result = rebalancePositions(items);

			expect(result).toEqual([
				{ position: 1.0 },
				{ position: 2.0 },
				{ position: 3.0 },
			]);
		});

		test("handles duplicate positions (maintains stable sort)", () => {
			const items = [
				{ id: "a", position: 1.0 },
				{ id: "b", position: 1.0 },
				{ id: "c", position: 1.0 },
			];

			const result = rebalancePositions(items);

			// Should maintain input order when positions are equal
			expect(result[0].position).toBe(1.0);
			expect(result[1].position).toBe(2.0);
			expect(result[2].position).toBe(3.0);
		});
	});
});
