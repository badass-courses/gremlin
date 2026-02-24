import { asc, eq, and, type SQL } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { nanoid } from "nanoid";
import {
	contentResource,
	contentResourceResource,
	contentResourceRelations,
	contentResourceResourceRelations,
	type ContentResource,
	type ContentResourceResource,
	type NewContentResource,
	type NewContentResourceResource,
} from "../schema/index.js";
import { getPositionAtEnd } from "../utils/position.js";
import type {
	ContentResourceAdapter,
	ContentResourceWithResources,
	ListContentResourcesFilters,
	LoadResourceOptions,
} from "./interface.js";

/**
 * Database schema for Drizzle
 */
const schema = {
	contentResource,
	contentResourceResource,
	contentResourceRelations,
	contentResourceResourceRelations,
};

export type DatabaseSchema = typeof schema;

/**
 * Drizzle implementation of ContentResourceAdapter
 *
 * Uses Neon Postgres serverless driver for database operations.
 */
export class DrizzleContentResourceAdapter implements ContentResourceAdapter {
	constructor(private db: NeonHttpDatabase<DatabaseSchema>) {}

	/**
	 * Build nested resource query recursively
	 *
	 * Generates Drizzle query with configurable depth for nested loading.
	 */
	private buildNestedQuery(depth: number) {
		if (depth <= 0) {
			return {};
		}

		// Build query recursively for each depth level
		const buildLevel = (
			currentDepth: number,
		): Record<string, unknown> | object => {
			if (currentDepth <= 0) {
				return {};
			}

			return {
				with: {
					resource: {
						with: {
							resources: buildLevel(currentDepth - 1),
						},
					},
				},
				orderBy: asc(contentResourceResource.position),
			};
		};

		return {
			resources: buildLevel(depth),
		};
	}

	async getContentResource(
		idOrSlug: string,
		options: LoadResourceOptions = {},
	): Promise<ContentResourceWithResources | null> {
		const { depth = 0 } = options;

		// Query by ID or slug field in JSON
		const resource = await this.db.query.contentResource.findFirst({
			where: (fields, { eq, or, sql }) =>
				or(
					eq(fields.id, idOrSlug),
					eq(sql`${fields.fields}->>'slug'`, idOrSlug),
				),
			with: this.buildNestedQuery(depth),
		});

		return resource as ContentResourceWithResources | null;
	}

	async listContentResources(
		filters: ListContentResourcesFilters = {},
		options: LoadResourceOptions = {},
	): Promise<
		Awaited<ReturnType<ContentResourceAdapter["listContentResources"]>>
	> {
		const { type, createdById, limit, offset, cursor } = filters;
		const { depth = 0 } = options;
		const pageSize = limit ?? 20;
		const cursorOffset = cursor ? Number.parseInt(cursor, 10) : Number.NaN;
		const resolvedOffset = offset ?? (Number.isNaN(cursorOffset) ? 0 : cursorOffset);

		// Build where conditions
		const conditions: SQL[] = [];
		if (type) {
			conditions.push(eq(contentResource.type, type));
		}
		if (createdById) {
			conditions.push(eq(contentResource.createdById, createdById));
		}

		const resources = await this.db.query.contentResource.findMany({
			where:
				conditions.length === 0
					? undefined
					: conditions.length === 1
						? conditions[0]
						: and(...conditions),
			with: this.buildNestedQuery(depth),
			limit: pageSize + 1,
			offset: resolvedOffset,
		});

		const items = resources.slice(0, pageSize) as ContentResourceWithResources[];
		const hasMore = resources.length > pageSize;

		return {
			items,
			cursor: hasMore ? String(resolvedOffset + items.length) : undefined,
			hasMore,
		};
	}

	async createContentResource(
		data: NewContentResource,
	): Promise<ContentResource> {
		const id = data.id || `cr_${nanoid()}`;

		const [created] = await this.db
			.insert(contentResource)
			.values({ ...data, id })
			.returning();

		if (!created) {
			throw new Error("Failed to create ContentResource");
		}

		return created;
	}

	async updateContentResource(
		id: string,
		data: Partial<NewContentResource>,
	): Promise<ContentResource> {
		const [updated] = await this.db
			.update(contentResource)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(contentResource.id, id))
			.returning();

		if (!updated) {
			throw new Error(`ContentResource not found: ${id}`);
		}

		return updated;
	}

	async deleteContentResource(id: string): Promise<boolean> {
		const [deleted] = await this.db
			.update(contentResource)
			.set({ deletedAt: new Date() })
			.where(eq(contentResource.id, id))
			.returning();

		return !!deleted;
	}

	async addResourceToResource(
		resourceOfId: string,
		resourceId: string,
		data: Partial<NewContentResourceResource> = {},
	): Promise<ContentResourceResource> {
		// Get existing resources to calculate position
		const existing = await this.db.query.contentResourceResource.findMany({
			where: eq(contentResourceResource.resourceOfId, resourceOfId),
		});

		const position = data.position ?? getPositionAtEnd(existing);

		const [created] = await this.db
			.insert(contentResourceResource)
			.values({
				resourceOfId,
				resourceId,
				position,
				metadata: data.metadata ?? {},
			})
			.returning();

		if (!created) {
			throw new Error("Failed to create ContentResourceResource relationship");
		}

		return created;
	}

	async removeResourceFromResource(
		resourceOfId: string,
		resourceId: string,
	): Promise<boolean> {
		const [deleted] = await this.db
			.update(contentResourceResource)
			.set({ deletedAt: new Date() })
			.where(
				and(
					eq(contentResourceResource.resourceOfId, resourceOfId),
					eq(contentResourceResource.resourceId, resourceId),
				),
			)
			.returning();

		return !!deleted;
	}

	async reorderResource(
		resourceOfId: string,
		resourceId: string,
		newPosition: number,
	): Promise<ContentResourceResource> {
		const [updated] = await this.db
			.update(contentResourceResource)
			.set({ position: newPosition, updatedAt: new Date() })
			.where(
				and(
					eq(contentResourceResource.resourceOfId, resourceOfId),
					eq(contentResourceResource.resourceId, resourceId),
				),
			)
			.returning();

		if (!updated) {
			throw new Error("ContentResourceResource relationship not found");
		}

		return updated;
	}
}
