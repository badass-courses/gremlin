import { relations, sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { contentResourceResource } from "./content-resource-resource.js";

/**
 * ContentResource table
 *
 * Flexible content model with JSON fields for extensibility.
 * Slug format: {slugified-title}~{guid} for uniqueness.
 *
 * @example
 * const lesson = {
 *   id: 'cr_abc123',
 *   type: 'lesson',
 *   createdById: 'user_xyz',
 *   fields: {
 *     title: 'Introduction to TypeScript',
 *     slug: 'introduction-to-typescript~cr_abc123',
 *     description: 'Learn TypeScript basics',
 *     state: 'published'
 *   }
 * }
 */
export const contentResource = pgTable(
	"content_resource",
	{
		id: varchar("id", { length: 255 }).notNull().primaryKey(),
		type: varchar("type", { length: 255 }).notNull(),
		createdById: varchar("created_by_id", { length: 255 }).notNull(),
		/**
		 * Flexible JSON fields validated by Zod at application layer.
		 * Common fields: title, slug, description, state, metadata
		 */
		fields: jsonb("fields").$type<Record<string, unknown>>().default({}),
		createdAt: timestamp("created_at", { mode: "date", precision: 3 })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		updatedAt: timestamp("updated_at", { mode: "date", precision: 3 })
			.notNull()
			.default(sql`CURRENT_TIMESTAMP`),
		deletedAt: timestamp("deleted_at", { mode: "date", precision: 3 }),
	},
	(table) => ({
		typeIdx: index("content_resource_type_idx").on(table.type),
		createdByIdx: index("content_resource_created_by_idx").on(
			table.createdById,
		),
		createdAtIdx: index("content_resource_created_at_idx").on(table.createdAt),
	}),
);

/**
 * Drizzle relations for ContentResource
 *
 * Self-referential relationship through ContentResourceResource join table.
 * Allows arbitrary nesting (e.g., course → module → lesson → exercise).
 */
export const contentResourceRelations = relations(
	contentResource,
	({ many }) => ({
		/**
		 * Resources that this resource contains
		 * (e.g., lessons in a module)
		 */
		resources: many(contentResourceResource, { relationName: "resourceOf" }),
		/**
		 * Resources that contain this resource
		 * (e.g., modules containing this lesson)
		 */
		resourceOf: many(contentResourceResource, { relationName: "resource" }),
	}),
);

export type ContentResource = typeof contentResource.$inferSelect;
export type NewContentResource = typeof contentResource.$inferInsert;
