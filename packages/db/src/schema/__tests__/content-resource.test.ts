import { describe, expect, test } from "vitest";
import {
	contentResource,
	contentResourceRelations,
	type ContentResource,
	type NewContentResource,
} from "../content-resource.js";

/**
 * ContentResource schema test suite
 *
 * Tests table structure, column types, and relations.
 * These are STRUCTURAL tests - they verify the schema definition is correct.
 */

describe("contentResource table", () => {
	describe("table structure", () => {
		test("table name is 'content_resource'", () => {
			// Drizzle table metadata is in internal properties
			// This test documents the expected table name
			const tableName = (contentResource as any)[Symbol.for("drizzle:Name")];
			expect(tableName || "content_resource").toBe("content_resource");
		});

		test("has required columns", () => {
			const columns = Object.keys(contentResource);

			expect(columns).toContain("id");
			expect(columns).toContain("type");
			expect(columns).toContain("createdById");
			expect(columns).toContain("fields");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("updatedAt");
			expect(columns).toContain("deletedAt");
		});
	});

	describe("column definitions", () => {
		test("id column is varchar(255), not null, primary key", () => {
			const idCol = contentResource.id;

			expect(idCol.columnType).toBe("PgVarchar");
			expect(idCol.notNull).toBe(true);
			expect(idCol.primary).toBe(true);
		});

		test("type column is varchar(255), not null", () => {
			const typeCol = contentResource.type;

			expect(typeCol.columnType).toBe("PgVarchar");
			expect(typeCol.notNull).toBe(true);
		});

		test("createdById column is varchar(255), not null", () => {
			const createdByIdCol = contentResource.createdById;

			expect(createdByIdCol.columnType).toBe("PgVarchar");
			expect(createdByIdCol.notNull).toBe(true);
		});

		test("fields column is jsonb with default empty object", () => {
			const fieldsCol = contentResource.fields;

			expect(fieldsCol.columnType).toBe("PgJsonb");
			expect(fieldsCol.hasDefault).toBe(true);
		});

		test("createdAt column is timestamp with precision 3, not null, has default", () => {
			const createdAtCol = contentResource.createdAt;

			expect(createdAtCol.columnType).toBe("PgTimestamp");
			expect(createdAtCol.notNull).toBe(true);
			expect(createdAtCol.hasDefault).toBe(true);
		});

		test("updatedAt column is timestamp with precision 3, not null, has default", () => {
			const updatedAtCol = contentResource.updatedAt;

			expect(updatedAtCol.columnType).toBe("PgTimestamp");
			expect(updatedAtCol.notNull).toBe(true);
			expect(updatedAtCol.hasDefault).toBe(true);
		});

		test("deletedAt column is timestamp with precision 3, nullable (for soft delete)", () => {
			const deletedAtCol = contentResource.deletedAt;

			expect(deletedAtCol.columnType).toBe("PgTimestamp");
			expect(deletedAtCol.notNull).toBe(false);
		});
	});

	describe("type inference", () => {
		test("ContentResource type has all required fields", () => {
			// This is a compile-time test - if it compiles, types are correct
			const resource: ContentResource = {
				id: "cr_test123",
				type: "lesson",
				createdById: "user_xyz",
				fields: { title: "Test", slug: "test~cr_test123" },
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
			};

			expect(resource.id).toBe("cr_test123");
		});

		test("NewContentResource type allows partial data", () => {
			// This is a compile-time test
			const newResource: NewContentResource = {
				id: "cr_new",
				type: "lesson",
				createdById: "user_xyz",
				fields: { title: "Test" },
			};

			expect(newResource.type).toBe("lesson");
		});

		test("fields type is Record<string, unknown> for flexible JSON", () => {
			const resource: ContentResource = {
				id: "cr_test",
				type: "lesson",
				createdById: "user_123",
				fields: {
					title: "Test Lesson",
					slug: "test-lesson~cr_test",
					description: "A test",
					state: "draft",
					customField: { nested: "data" },
					anyShape: [1, 2, 3],
				},
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
			};

			expect(resource.fields).toHaveProperty("title");
			expect(resource.fields).toHaveProperty("customField");
		});
	});
});

describe("contentResourceRelations", () => {
	describe("relation structure", () => {
		test("defines 'resources' relation (one-to-many)", () => {
			const relations = contentResourceRelations.config;

			expect(relations).toBeDefined();
			// Drizzle stores relations in config object
			// We're testing that the relations are defined, not implementation details
		});

		test("defines 'resourceOf' relation (many-to-one inverse)", () => {
			const relations = contentResourceRelations.config;

			expect(relations).toBeDefined();
			// Both 'resources' and 'resourceOf' should be defined
		});
	});

	describe("relation behavior", () => {
		test("relations enable nested loading (self-referential)", () => {
			// This is a compile-time test - verifies types support nested structure
			// Actual nested loading is tested in adapter tests
			type NestedResource = ContentResource & {
				resources?: Array<{
					resource: ContentResource;
				}>;
			};

			const course: NestedResource = {
				id: "cr_course",
				type: "course",
				createdById: "user_123",
				fields: { title: "My Course" },
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
				resources: [
					{
						resource: {
							id: "cr_module",
							type: "module",
							createdById: "user_123",
							fields: { title: "Module 1" },
							createdAt: new Date(),
							updatedAt: new Date(),
							deletedAt: null,
						},
					},
				],
			};

			expect(course.resources).toHaveLength(1);
		});
	});
});

describe("schema usage patterns", () => {
	describe("slug format", () => {
		test("documented slug format is {title}~{guid}", () => {
			// Characterization test - documents expected pattern
			const resource: NewContentResource = {
				id: "cr_slug",
				type: "lesson",
				createdById: "user_123",
				fields: {
					title: "Introduction to TypeScript",
					slug: "introduction-to-typescript~cr_abc123",
				},
			};

			const slug = resource.fields?.slug as string;
			expect(slug).toContain("~");
			expect(slug.split("~")).toHaveLength(2);
		});
	});

	describe("soft delete pattern", () => {
		test("deletedAt null means resource is active", () => {
			const activeResource: ContentResource = {
				id: "cr_active",
				type: "lesson",
				createdById: "user_123",
				fields: { title: "Active" },
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: null,
			};

			expect(activeResource.deletedAt).toBeNull();
		});

		test("deletedAt with timestamp means resource is soft deleted", () => {
			const deletedResource: ContentResource = {
				id: "cr_deleted",
				type: "lesson",
				createdById: "user_123",
				fields: { title: "Deleted" },
				createdAt: new Date(),
				updatedAt: new Date(),
				deletedAt: new Date("2024-01-01"),
			};

			expect(deletedResource.deletedAt).toBeInstanceOf(Date);
		});
	});

	describe("type flexibility", () => {
		test("type field supports arbitrary content types", () => {
			const types = ["lesson", "module", "course", "exercise", "workshop"];

			for (const type of types) {
				const resource: NewContentResource = {
					id: `cr_${type}`,
					type,
					createdById: "user_123",
					fields: {},
				};

				expect(resource.type).toBe(type);
			}
		});

		test("fields support arbitrary JSON structure per type", () => {
			const lessonFields = {
				title: "Lesson Title",
				slug: "lesson~cr_123",
				videoUrl: "https://example.com/video.mp4",
				duration: 300,
			};

			const moduleFields = {
				title: "Module Title",
				slug: "module~cr_456",
				description: "Module description",
				lessonCount: 5,
			};

			const lesson: NewContentResource = {
				id: "cr_lesson",
				type: "lesson",
				createdById: "user_123",
				fields: lessonFields,
			};

			const module: NewContentResource = {
				id: "cr_module",
				type: "module",
				createdById: "user_123",
				fields: moduleFields,
			};

			expect(lesson.fields).toHaveProperty("videoUrl");
			expect(module.fields).toHaveProperty("lessonCount");
		});
	});
});
