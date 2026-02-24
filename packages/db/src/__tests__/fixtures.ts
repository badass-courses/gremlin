/**
 * Test fixtures for @gremlincms/db
 *
 * Provides FakeDatabase and FakeContentResourceAdapter for testing
 * without a real database connection.
 */

import type {
	ContentResource,
	ContentResourceResource,
	NewContentResource,
} from "../schema/index.js";
import type {
	ContentResourceAdapter,
	ContentResourceWithResources,
	ListContentResourcesFilters,
} from "../adapter/interface.js";

const DEFAULT_PAGE_SIZE = 50;
const IN_MEMORY_CURSOR_PREFIX = "idx_";

function encodeInMemoryCursor(index: number): string {
	return `${IN_MEMORY_CURSOR_PREFIX}${index.toString(36)}`;
}

function decodeInMemoryCursor(cursor: string | undefined): number | null {
	if (!cursor || !cursor.startsWith(IN_MEMORY_CURSOR_PREFIX)) {
		return null;
	}

	const parsed = Number.parseInt(
		cursor.slice(IN_MEMORY_CURSOR_PREFIX.length),
		36,
	);

	if (Number.isNaN(parsed) || parsed < 0) {
		return null;
	}

	return parsed;
}

/**
 * In-memory fake database for testing
 *
 * Implements the same operations as a real database but stores
 * everything in memory. Useful for fast unit tests.
 */
export class FakeDatabase {
	resources = new Map<string, ContentResource>();
	relationships = new Map<string, ContentResourceResource>();

	async findResourceById(id: string): Promise<ContentResource | undefined> {
		const resource = this.resources.get(id);
		return resource && !resource.deletedAt ? resource : undefined;
	}

	async findResourceBySlug(slug: string): Promise<ContentResource | undefined> {
		for (const resource of this.resources.values()) {
			if (resource.fields?.slug === slug && !resource.deletedAt) {
				return resource;
			}
		}
		return undefined;
	}

	async findAllResources(
		options: {
			type?: string;
			createdById?: string;
			limit?: number;
			offset?: number;
		} = {},
	): Promise<ContentResource[]> {
		let results = Array.from(this.resources.values()).filter(
			(r) => !r.deletedAt,
		);
		if (options.type) {
			results = results.filter((r) => r.type === options.type);
		}
		if (options.createdById) {
			results = results.filter((r) => r.createdById === options.createdById);
		}

		if (options.offset) {
			results = results.slice(options.offset);
		}
		if (options.limit) {
			results = results.slice(0, options.limit);
		}

		return results;
	}

	async insertResource(data: NewContentResource): Promise<ContentResource> {
		const resource: ContentResource = {
			id: data.id || `cr_${Math.random().toString(36).slice(2, 11)}`,
			type: data.type,
			createdById: data.createdById,
			fields: data.fields ?? {},
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null,
		};
		this.resources.set(resource.id, resource);
		return resource;
	}

	async updateResource(
		id: string,
		data: Partial<NewContentResource>,
	): Promise<ContentResource | undefined> {
		const resource = this.resources.get(id);
		if (!resource) return undefined;

		const updated = { ...resource, ...data, updatedAt: new Date() };
		this.resources.set(id, updated);
		return updated;
	}

	async softDeleteResource(id: string): Promise<boolean> {
		const resource = this.resources.get(id);
		if (!resource) return false;

		resource.deletedAt = new Date();
		this.resources.set(id, resource);
		return true;
	}

	async findRelationshipsByParent(
		resourceOfId: string,
	): Promise<ContentResourceResource[]> {
		return Array.from(this.relationships.values())
			.filter((rel) => rel.resourceOfId === resourceOfId && !rel.deletedAt)
			.sort((a, b) => a.position - b.position);
	}

	async insertRelationship(data: {
		resourceOfId: string;
		resourceId: string;
		position: number;
		metadata?: Record<string, unknown>;
	}): Promise<ContentResourceResource> {
		const relationship: ContentResourceResource = {
			resourceOfId: data.resourceOfId,
			resourceId: data.resourceId,
			position: data.position,
			metadata: data.metadata ?? {},
			createdAt: new Date(),
			updatedAt: new Date(),
			deletedAt: null,
		};
		const key = `${data.resourceOfId}:${data.resourceId}`;
		this.relationships.set(key, relationship);
		return relationship;
	}

	async updateRelationship(
		resourceOfId: string,
		resourceId: string,
		data: Partial<ContentResourceResource>,
	): Promise<ContentResourceResource | undefined> {
		const key = `${resourceOfId}:${resourceId}`;
		const relationship = this.relationships.get(key);
		if (!relationship) return undefined;

		const updated = { ...relationship, ...data, updatedAt: new Date() };
		this.relationships.set(key, updated);
		return updated;
	}

	async softDeleteRelationship(
		resourceOfId: string,
		resourceId: string,
	): Promise<boolean> {
		const key = `${resourceOfId}:${resourceId}`;
		const relationship = this.relationships.get(key);
		if (!relationship) return false;

		relationship.deletedAt = new Date();
		this.relationships.set(key, relationship);
		return true;
	}

	reset() {
		this.resources.clear();
		this.relationships.clear();
	}
}

/**
 * Fake adapter that wraps FakeDatabase
 *
 * Implements ContentResourceAdapter interface using the in-memory
 * FakeDatabase. Use for unit tests that don't need a real database.
 */
export class FakeContentResourceAdapter implements ContentResourceAdapter {
	constructor(public fakeDb: FakeDatabase) {}

	async getContentResource(
		idOrSlug: string,
		_options: { depth?: number } = {},
	): Promise<ContentResourceWithResources | null> {
		const resource =
			(await this.fakeDb.findResourceById(idOrSlug)) ||
			(await this.fakeDb.findResourceBySlug(idOrSlug));

		return (resource as ContentResourceWithResources) || null;
	}

	async listContentResources(
		filters: ListContentResourcesFilters = {},
		_options: { depth?: number } = {},
	): Promise<Awaited<ReturnType<ContentResourceAdapter["listContentResources"]>>> {
		const pageSize =
			typeof filters.limit === "number" && filters.limit > 0
				? filters.limit
				: DEFAULT_PAGE_SIZE;
		const cursorIndex = decodeInMemoryCursor(filters.cursor);
		const startIndex = cursorIndex === null ? 0 : cursorIndex + 1;

		const resources = (
			await this.fakeDb.findAllResources({
				type: filters.type,
				createdById: filters.createdById,
			})
		).sort((left, right) => left.id.localeCompare(right.id));

		const items = resources.slice(startIndex, startIndex + pageSize) as
			| ContentResourceWithResources[]
			| [];
		const hasMore = startIndex + items.length < resources.length;
		const lastIndex = startIndex + items.length - 1;

		return {
			items,
			cursor:
				hasMore && items.length > 0
					? encodeInMemoryCursor(lastIndex)
					: undefined,
			hasMore,
		};
	}

	async createContentResource(
		data: NewContentResource,
	): Promise<ContentResource> {
		return this.fakeDb.insertResource(data);
	}

	async updateContentResource(
		id: string,
		data: Partial<NewContentResource>,
	): Promise<ContentResource> {
		const updated = await this.fakeDb.updateResource(id, data);
		if (!updated) {
			throw new Error(`ContentResource not found: ${id}`);
		}
		return updated;
	}

	async deleteContentResource(id: string): Promise<boolean> {
		return this.fakeDb.softDeleteResource(id);
	}

	async addResourceToResource(
		resourceOfId: string,
		resourceId: string,
		data: { position?: number; metadata?: Record<string, unknown> } = {},
	): Promise<ContentResourceResource> {
		const existing = await this.fakeDb.findRelationshipsByParent(resourceOfId);

		const position =
			data.position ??
			(existing.length > 0
				? Math.max(...existing.map((r) => r.position)) + 1.0
				: 1.0);

		return this.fakeDb.insertRelationship({
			resourceOfId,
			resourceId,
			position,
			metadata: data.metadata,
		});
	}

	async removeResourceFromResource(
		resourceOfId: string,
		resourceId: string,
	): Promise<boolean> {
		return this.fakeDb.softDeleteRelationship(resourceOfId, resourceId);
	}

	async reorderResource(
		resourceOfId: string,
		resourceId: string,
		newPosition: number,
	): Promise<ContentResourceResource> {
		const updated = await this.fakeDb.updateRelationship(
			resourceOfId,
			resourceId,
			{ position: newPosition },
		);

		if (!updated) {
			throw new Error("ContentResourceResource relationship not found");
		}

		return updated;
	}
}

/**
 * Sample test data fixtures
 */
export const fixtures = {
	lesson: {
		type: "lesson" as const,
		createdById: "user_test",
		fields: {
			title: "Test Lesson",
			slug: "test-lesson~cr_test",
			state: "draft",
		},
	},
	module: {
		type: "module" as const,
		createdById: "user_test",
		fields: {
			title: "Test Module",
			slug: "test-module~cr_test",
		},
	},
	course: {
		type: "course" as const,
		createdById: "user_test",
		fields: {
			title: "Test Course",
			slug: "test-course~cr_test",
		},
	},
};
