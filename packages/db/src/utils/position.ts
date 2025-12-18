/**
 * Position utilities for fractional ordering
 *
 * Fractional positions allow inserting items between existing items
 * without reordering the entire list.
 */

/**
 * Generate a position between two positions
 *
 * @example
 * getPositionBetween(1.0, 2.0) // 1.5
 * getPositionBetween(1.0, 1.1) // 1.05
 * getPositionBetween(null, 1.0) // 0.5 (before first)
 * getPositionBetween(2.0, null) // 3.0 (after last)
 */
export function getPositionBetween(
	before: number | null,
	after: number | null,
): number {
	if (before === null && after === null) {
		return 1.0;
	}
	if (before === null && after !== null) {
		return after / 2;
	}
	if (after === null && before !== null) {
		return before + 1.0;
	}
	if (before !== null && after !== null) {
		return (before + after) / 2;
	}
	return 1.0;
}

/**
 * Generate position at the end of a list
 *
 * @example
 * getPositionAtEnd([]) // 1.0
 * getPositionAtEnd([{ position: 1.0 }, { position: 2.0 }]) // 3.0
 */
export function getPositionAtEnd(items: Array<{ position: number }>): number {
	if (items.length === 0) {
		return 1.0;
	}
	const maxPosition = Math.max(...items.map((item) => item.position));
	return maxPosition + 1.0;
}

/**
 * Generate position at the start of a list
 *
 * @example
 * getPositionAtStart([]) // 1.0
 * getPositionAtStart([{ position: 1.0 }, { position: 2.0 }]) // 0.5
 */
export function getPositionAtStart(items: Array<{ position: number }>): number {
	if (items.length === 0) {
		return 1.0;
	}
	const minPosition = Math.min(...items.map((item) => item.position));
	return minPosition / 2;
}

/**
 * Rebalance positions when they get too close together
 *
 * Use when fractional precision becomes insufficient (e.g., after many insertions).
 *
 * @example
 * rebalancePositions([
 *   { id: '1', position: 1.0000001 },
 *   { id: '2', position: 1.0000002 }
 * ])
 * // Returns [{ id: '1', position: 1.0 }, { id: '2', position: 2.0 }]
 */
export function rebalancePositions<T extends { position: number }>(
	items: T[],
): Array<T & { position: number }> {
	return items
		.sort((a, b) => a.position - b.position)
		.map((item, index) => ({
			...item,
			position: (index + 1) * 1.0,
		}));
}
