import { relations, sql } from "drizzle-orm";
import {
	doublePrecision,
	index,
	jsonb,
	pgTable,
	primaryKey,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { contentResource } from "./content-resource.js";

/**
 * ContentResourceResource join table
 *
 * Many-to-many relationship with position ordering.
 * Position uses double precision for fractional ordering (allows inserting between items).
 *
 * @example
 * // Module contains lessons at positions
 * {
 *   resourceOfId: 'module_123',  // The container (module)
 *   resourceId: 'lesson_456',     // The contained resource (lesson)
 *   position: 1.5,                // Fractional position (between 1.0 and 2.0)
 *   metadata: { sectionTitle: 'Getting Started' }
 * }
 */
export const contentResourceResource = pgTable(
	"content_resource_resource",
	{
		resourceOfId: varchar("resource_of_id", { length: 255 }).notNull(),
		resourceId: varchar("resource_id", { length: 255 }).notNull(),
		/**
		 * Fractional position for ordering.
		 * Double precision allows inserting between items (e.g., 1.5 between 1.0 and 2.0).
		 */
		position: doublePrecision("position").notNull().default(0),
		/**
		 * Optional metadata for relationship context.
		 * Examples: section title, custom styling, visibility rules.
		 */
		metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
		createdAt: timestamp("created_at", { mode: "date", precision: 3 })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		updatedAt: timestamp("updated_at", { mode: "date", precision: 3 })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.resourceOfId, table.resourceId] }),
		resourceOfIdx: index("content_resource_resource_of_idx").on(
			table.resourceOfId,
		),
		resourceIdx: index("content_resource_resource_idx").on(table.resourceId),
	}),
);

/**
 * Drizzle relations for ContentResourceResource
 */
export const contentResourceResourceRelations = relations(
	contentResourceResource,
	({ one }) => ({
		/**
		 * The container resource (e.g., module containing lessons)
		 */
		resourceOf: one(contentResource, {
			fields: [contentResourceResource.resourceOfId],
			references: [contentResource.id],
			relationName: "resourceOf",
		}),
		/**
		 * The contained resource (e.g., lesson within a module)
		 */
		resource: one(contentResource, {
			fields: [contentResourceResource.resourceId],
			references: [contentResource.id],
			relationName: "resource",
		}),
	}),
);

export type ContentResourceResource =
	typeof contentResourceResource.$inferSelect;
export type NewContentResourceResource =
	typeof contentResourceResource.$inferInsert;
