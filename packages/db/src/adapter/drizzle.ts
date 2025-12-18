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
		filters: {
			type?: string;
			createdById?: string;
			limit?: number;
			offset?: number;
		} = {},
		options: LoadResourceOptions = {},
	): Promise<ContentResourceWithResources[]> {
		const { type, createdById, limit, offset } = filters;
		const { depth = 0 } = options;

		// Build where conditions
		const conditions: SQL[] = [];
		if (type) {
			conditions.push(eq(contentResource.type, type));
		}
		if (createdById) {
			conditions.push(eq(contentResource.createdById, createdById));
		}

		const resources = await this.db.query.contentResource.findMany({
			where: conditions.length > 0 ? conditions[0] : undefined,
			with: this.buildNestedQuery(depth),
			limit,
			offset,
		});

		return resources as ContentResourceWithResources[];
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
