/**
 * Parameterized test suite for ContentResourceAdapter implementations
 *
 * Usage:
 * ```ts
 * import { runContentResourceAdapterTests, FakeDatabase, FakeContentResourceAdapter } from "@badass/test-utils/adapter-tests";
 *
 * // Test with fake adapter
 * runContentResourceAdapterTests({
 *   name: "FakeContentResourceAdapter",
 *   createAdapter: () => {
 *     const db = new FakeDatabase();
 *     return { adapter: new FakeContentResourceAdapter(db), db };
 *   }
 * });
 *
 * // Test with real Drizzle adapter
 * runContentResourceAdapterTests({
 *   name: "DrizzleContentResourceAdapter",
 *   createAdapter: async () => {
 *     const db = await createTestDatabase();
 *     return { adapter: new DrizzleContentResourceAdapter(db), cleanup: () => db.close() };
 *   }
 * });
 * ```
 */

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type {
	ContentResource,
	ContentResourceResource,
	NewContentResource,
} from "@badass/db";

/**
 * Options for running adapter tests
 */
export interface AdapterTestOptions<TAdapter, TContext = unknown> {
	/** Name for the test suite */
	name: string;

	/** Factory to create adapter instance (called before each test) */
	createAdapter: () =>
		| { adapter: TAdapter; context?: TContext; cleanup?: () => Promise<void> }
		| Promise<{
				adapter: TAdapter;
				context?: TContext;
				cleanup?: () => Promise<void>;
		  }>;

	/** Tests to skip */
	skipTests?: string[];
}

/**
 * Minimal adapter interface for testing
 * Matches ContentResourceAdapter from @badass/db
 */
export interface TestableAdapter {
	getContentResource(
		idOrSlug: string,
		options?: { depth?: number },
	): Promise<ContentResource | null>;
	listContentResources(
		filters?: { limit?: number; offset?: number },
		options?: { depth?: number },
	): Promise<ContentResource[]>;
	createContentResource(data: NewContentResource): Promise<ContentResource>;
	updateContentResource(
		id: string,
		data: Partial<NewContentResource>,
	): Promise<ContentResource>;
	deleteContentResource(id: string): Promise<boolean>;
	addResourceToResource(
		resourceOfId: string,
		resourceId: string,
		data?: { position?: number; metadata?: Record<string, unknown> },
	): Promise<ContentResourceResource>;
	removeResourceFromResource(
		resourceOfId: string,
		resourceId: string,
	): Promise<boolean>;
	reorderResource(
		resourceOfId: string,
		resourceId: string,
		newPosition: number,
	): Promise<ContentResourceResource>;
}

/**
 * Run the full ContentResourceAdapter test suite
 */
export function runContentResourceAdapterTests<
	TAdapter extends TestableAdapter,
	TContext = unknown,
>(options: AdapterTestOptions<TAdapter, TContext>) {
	const { name, createAdapter, skipTests = [] } = options;

	describe(name, () => {
		let adapter: TAdapter;
		let cleanup: (() => Promise<void>) | undefined;

		beforeEach(async () => {
			const result = await createAdapter();
			adapter = result.adapter;
			cleanup = result.cleanup;
		});

		afterEach(async () => {
			await cleanup?.();
		});

		const maybeTest = (
			testName: string,
			fn: () => void | Promise<void>,
		): void => {
			if (skipTests.includes(testName)) {
				test.skip(testName, fn);
			} else {
				test(testName, fn);
			}
		};

		describe("createContentResource", () => {
			maybeTest("creates a resource with provided ID", async () => {
				const data: NewContentResource = {
					id: "cr_test123",
					type: "lesson",
					createdById: "user_xyz",
					fields: { title: "Test Lesson" },
				};

				const result = await adapter.createContentResource(data);

				expect(result.id).toBe("cr_test123");
				expect(result.type).toBe("lesson");
				expect(result.fields).toEqual({ title: "Test Lesson" });
			});

			maybeTest("generates ID if not provided (starts with cr_)", async () => {
				const data: NewContentResource = {
					type: "lesson",
					createdById: "user_xyz",
					fields: { title: "Test" },
				};

				const result = await adapter.createContentResource(data);

				expect(result.id).toMatch(/^cr_/);
			});

			maybeTest("sets createdAt and updatedAt timestamps", async () => {
				const data: NewContentResource = {
					type: "lesson",
					createdById: "user_xyz",
					fields: {},
				};

				const result = await adapter.createContentResource(data);

				expect(result.createdAt).toBeInstanceOf(Date);
				expect(result.updatedAt).toBeInstanceOf(Date);
			});

			maybeTest("sets deletedAt to null initially", async () => {
				const data: NewContentResource = {
					type: "lesson",
					createdById: "user_xyz",
					fields: {},
				};

				const result = await adapter.createContentResource(data);

				expect(result.deletedAt).toBeNull();
			});
		});

		describe("getContentResource", () => {
			maybeTest("retrieves resource by ID", async () => {
				const created = await adapter.createContentResource({
					id: "cr_123",
					type: "lesson",
					createdById: "user_xyz",
					fields: { title: "Find Me" },
				});

				const result = await adapter.getContentResource("cr_123");

				expect(result).toEqual(created);
			});

			maybeTest("retrieves resource by slug", async () => {
				const created = await adapter.createContentResource({
					id: "cr_123",
					type: "lesson",
					createdById: "user_xyz",
					fields: {
						title: "Test",
						slug: "test-lesson~cr_123",
					},
				});

				const result = await adapter.getContentResource("test-lesson~cr_123");

				expect(result?.id).toBe(created.id);
			});

			maybeTest("returns null if resource not found", async () => {
				const result = await adapter.getContentResource("nonexistent");

				expect(result).toBeNull();
			});

			maybeTest("excludes soft-deleted resources", async () => {
				await adapter.createContentResource({
					id: "cr_deleted",
					type: "lesson",
					createdById: "user_xyz",
					fields: {},
				});

				await adapter.deleteContentResource("cr_deleted");

				const result = await adapter.getContentResource("cr_deleted");

				expect(result).toBeNull();
			});
		});

		describe("listContentResources", () => {
			maybeTest("returns all resources when no filters", async () => {
				await adapter.createContentResource({
					id: "cr_1",
					type: "lesson",
					createdById: "user_xyz",
					fields: {},
				});

				await adapter.createContentResource({
					id: "cr_2",
					type: "module",
					createdById: "user_xyz",
					fields: {},
				});

				const results = await adapter.listContentResources();

				expect(results).toHaveLength(2);
			});

			maybeTest("excludes soft-deleted resources", async () => {
				await adapter.createContentResource({
					id: "cr_active",
					type: "lesson",
					createdById: "user_xyz",
					fields: {},
				});

				await adapter.createContentResource({
					id: "cr_deleted",
					type: "lesson",
					createdById: "user_xyz",
					fields: {},
				});

				await adapter.deleteContentResource("cr_deleted");

				const results = await adapter.listContentResources();

				expect(results).toHaveLength(1);
				expect(results[0].id).toBe("cr_active");
			});

			maybeTest("supports pagination with limit and offset", async () => {
				for (let i = 0; i < 5; i++) {
					await adapter.createContentResource({
						id: `cr_${i}`,
						type: "lesson",
						createdById: "user_xyz",
						fields: {},
					});
				}

				const page1 = await adapter.listContentResources({
					limit: 2,
					offset: 0,
				});
				const page2 = await adapter.listContentResources({
					limit: 2,
					offset: 2,
				});

				expect(page1).toHaveLength(2);
				expect(page2).toHaveLength(2);
				expect(page1[0].id).not.toBe(page2[0].id);
			});
		});

		describe("updateContentResource", () => {
			maybeTest("updates resource fields", async () => {
				await adapter.createContentResource({
					id: "cr_update",
					type: "lesson",
					createdById: "user_xyz",
					fields: { title: "Original" },
				});

				const updated = await adapter.updateContentResource("cr_update", {
					fields: { title: "Updated" },
				});

				expect(updated.fields).toEqual({ title: "Updated" });
			});

			maybeTest("updates updatedAt timestamp", async () => {
				const created = await adapter.createContentResource({
					id: "cr_update",
					type: "lesson",
					createdById: "user_xyz",
					fields: {},
				});

				const originalUpdatedAt = created.updatedAt;

				// Wait a bit to ensure timestamp difference
				await new Promise((resolve) => setTimeout(resolve, 10));

				const updated = await adapter.updateContentResource("cr_update", {
					fields: { title: "Changed" },
				});

				expect(updated.updatedAt.getTime()).toBeGreaterThan(
					originalUpdatedAt.getTime(),
				);
			});

			maybeTest("throws if resource not found", async () => {
				await expect(
					adapter.updateContentResource("nonexistent", { fields: {} }),
				).rejects.toThrow();
			});
		});

		describe("deleteContentResource", () => {
			maybeTest("performs soft delete", async () => {
				await adapter.createContentResource({
					id: "cr_delete",
					type: "lesson",
					createdById: "user_xyz",
					fields: {},
				});

				const result = await adapter.deleteContentResource("cr_delete");

				expect(result).toBe(true);

				// Verify it's no longer retrievable
				const deleted = await adapter.getContentResource("cr_delete");
				expect(deleted).toBeNull();
			});

			maybeTest("returns false if resource not found", async () => {
				const result = await adapter.deleteContentResource("nonexistent");

				expect(result).toBe(false);
			});
		});

		describe("addResourceToResource", () => {
			maybeTest("creates relationship between resources", async () => {
				await adapter.createContentResource({
					id: "cr_parent",
					type: "module",
					createdById: "user_xyz",
					fields: {},
				});

				await adapter.createContentResource({
					id: "cr_child",
					type: "lesson",
					createdById: "user_xyz",
					fields: {},
				});

				const relationship = await adapter.addResourceToResource(
					"cr_parent",
					"cr_child",
				);

				expect(relationship.resourceOfId).toBe("cr_parent");
				expect(relationship.resourceId).toBe("cr_child");
			});

			maybeTest("auto-calculates position at end if not provided", async () => {
				await adapter.createContentResource({
					id: "cr_parent",
					type: "module",
					createdById: "user_xyz",
					fields: {},
				});

				await adapter.createContentResource({
					id: "cr_child1",
					type: "lesson",
					createdById: "user_xyz",
					fields: {},
				});

				await adapter.createContentResource({
					id: "cr_child2",
					type: "lesson",
					createdById: "user_xyz",
					fields: {},
				});

				await adapter.addResourceToResource("cr_parent", "cr_child1", {
					position: 1.0,
				});

				const rel2 = await adapter.addResourceToResource(
					"cr_parent",
					"cr_child2",
				);

				expect(rel2.position).toBe(2.0);
			});

			maybeTest("uses provided position", async () => {
				await adapter.createContentResource({
					id: "cr_parent",
					type: "module",
					createdById: "user_xyz",
					fields: {},
				});

				await adapter.createContentResource({
					id: "cr_child",
					type: "lesson",
					createdById: "user_xyz",
					fields: {},
				});

				const relationship = await adapter.addResourceToResource(
					"cr_parent",
					"cr_child",
					{ position: 5.5 },
				);

				expect(relationship.position).toBe(5.5);
			});

			maybeTest("sets metadata if provided", async () => {
				await adapter.createContentResource({
					id: "cr_parent",
					type: "module",
					createdById: "user_xyz",
					fields: {},
				});

				await adapter.createContentResource({
					id: "cr_child",
					type: "lesson",
					createdById: "user_xyz",
					fields: {},
				});

				const relationship = await adapter.addResourceToResource(
					"cr_parent",
					"cr_child",
					{ metadata: { sectionTitle: "Getting Started" } },
				);

				expect(relationship.metadata).toEqual({
					sectionTitle: "Getting Started",
				});
			});
		});

		describe("removeResourceFromResource", () => {
			maybeTest("soft deletes relationship", async () => {
				await adapter.createContentResource({
					id: "cr_parent",
					type: "module",
					createdById: "user_xyz",
					fields: {},
				});

				await adapter.createContentResource({
					id: "cr_child",
					type: "lesson",
					createdById: "user_xyz",
					fields: {},
				});

				await adapter.addResourceToResource("cr_parent", "cr_child");

				const result = await adapter.removeResourceFromResource(
					"cr_parent",
					"cr_child",
				);

				expect(result).toBe(true);
			});

			maybeTest("returns false if relationship not found", async () => {
				const result = await adapter.removeResourceFromResource(
					"nonexistent",
					"nonexistent",
				);

				expect(result).toBe(false);
			});
		});

		describe("reorderResource", () => {
			maybeTest("updates position of resource relationship", async () => {
				await adapter.createContentResource({
					id: "cr_parent",
					type: "module",
					createdById: "user_xyz",
					fields: {},
				});

				await adapter.createContentResource({
					id: "cr_child",
					type: "lesson",
					createdById: "user_xyz",
					fields: {},
				});

				await adapter.addResourceToResource("cr_parent", "cr_child", {
					position: 1.0,
				});

				const updated = await adapter.reorderResource(
					"cr_parent",
					"cr_child",
					2.5,
				);

				expect(updated.position).toBe(2.5);
			});

			maybeTest("throws if relationship not found", async () => {
				await expect(
					adapter.reorderResource("nonexistent", "nonexistent", 1.0),
				).rejects.toThrow();
			});
		});
	});
}
