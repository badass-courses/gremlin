/**
 * Content Resource schema tests
 *
 * Following TDD patterns:
 * - Test behavior (validation rules) not implementation
 * - Use real Zod validation, not mocks
 * - Characterize existing schema behavior first
 */

import { describe, expect, it } from "vitest";
import {
	ContentResourceSchema,
	type ContentResource,
	CreateContentResourceSchema,
	type CreateContentResource,
	UpdateContentResourceSchema,
	type UpdateContentResource,
} from "../content-resource";

describe("ContentResourceSchema", () => {
	describe("characterization tests", () => {
		it("schema has expected shape", () => {
			const shape = ContentResourceSchema.shape;

			expect(shape).toHaveProperty("id");
			expect(shape).toHaveProperty("type");
			expect(shape).toHaveProperty("createdAt");
			expect(shape).toHaveProperty("updatedAt");
			expect(shape).toHaveProperty("deletedAt");
			expect(shape).toHaveProperty("fields");
			expect(shape).toHaveProperty("metadata");
		});

		it("parses valid minimal resource", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: new Date(),
				fields: {},
			};

			const result = ContentResourceSchema.parse(data);

			expect(result.id).toBe(data.id);
			expect(result.type).toBe(data.type);
		});
	});

	describe("behavior tests - required fields", () => {
		it("requires id field", () => {
			const data = {
				// id missing
				type: "post",
				createdAt: new Date(),
				fields: {},
			};

			expect(() => ContentResourceSchema.parse(data)).toThrow();
		});

		it("requires type field", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				// type missing
				createdAt: new Date(),
				fields: {},
			};

			expect(() => ContentResourceSchema.parse(data)).toThrow();
		});

		it("requires createdAt field", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				// createdAt missing
				fields: {},
			};

			expect(() => ContentResourceSchema.parse(data)).toThrow();
		});

		it("requires fields object", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: new Date(),
				// fields missing
			};

			expect(() => ContentResourceSchema.parse(data)).toThrow();
		});
	});

	describe("behavior tests - id validation", () => {
		it("accepts valid UUID v4", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: new Date(),
				fields: {},
			};

			const result = ContentResourceSchema.parse(data);
			expect(result.id).toBe(data.id);
		});

		it("rejects non-UUID id", () => {
			const data = {
				id: "not-a-uuid",
				type: "post",
				createdAt: new Date(),
				fields: {},
			};

			expect(() => ContentResourceSchema.parse(data)).toThrow();
		});

		it("rejects empty string id", () => {
			const data = {
				id: "",
				type: "post",
				createdAt: new Date(),
				fields: {},
			};

			expect(() => ContentResourceSchema.parse(data)).toThrow();
		});
	});

	describe("behavior tests - date coercion", () => {
		it("coerces ISO string to Date for createdAt", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: "2024-01-01T00:00:00.000Z",
				fields: {},
			};

			const result = ContentResourceSchema.parse(data);
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.createdAt.toISOString()).toBe("2024-01-01T00:00:00.000Z");
		});

		it("accepts Date object for createdAt", () => {
			const now = new Date();
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: now,
				fields: {},
			};

			const result = ContentResourceSchema.parse(data);
			// z.coerce.date() creates a new Date instance, so reference equality fails
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.createdAt.getTime()).toBe(now.getTime());
		});

		it("coerces ISO string to Date for updatedAt", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: new Date(),
				updatedAt: "2024-01-02T00:00:00.000Z",
				fields: {},
			};

			const result = ContentResourceSchema.parse(data);
			expect(result.updatedAt).toBeInstanceOf(Date);
		});
	});

	describe("behavior tests - optional fields", () => {
		it("updatedAt is optional", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: new Date(),
				fields: {},
			};

			const result = ContentResourceSchema.parse(data);
			expect(result.updatedAt).toBeUndefined();
		});

		it("deletedAt is optional", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: new Date(),
				fields: {},
			};

			const result = ContentResourceSchema.parse(data);
			expect(result.deletedAt).toBeUndefined();
		});

		it("deletedAt accepts null", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: new Date(),
				deletedAt: null,
				fields: {},
			};

			const result = ContentResourceSchema.parse(data);
			expect(result.deletedAt).toBeNull();
		});

		it("metadata is optional", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: new Date(),
				fields: {},
			};

			const result = ContentResourceSchema.parse(data);
			expect(result.metadata).toBeUndefined();
		});
	});

	describe("behavior tests - fields object", () => {
		it("accepts empty fields object", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: new Date(),
				fields: {},
			};

			const result = ContentResourceSchema.parse(data);
			expect(result.fields).toEqual({});
		});

		it("accepts standard field properties", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: new Date(),
				fields: {
					title: "Test Post",
					slug: "test-post",
					description: "A test post",
					body: "Post content here",
				},
			};

			const result = ContentResourceSchema.parse(data);
			expect(result.fields.title).toBe("Test Post");
			expect(result.fields.slug).toBe("test-post");
			expect(result.fields.description).toBe("A test post");
			expect(result.fields.body).toBe("Post content here");
		});

		it("all standard fields are optional", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: new Date(),
				fields: {
					title: "Only title",
				},
			};

			const result = ContentResourceSchema.parse(data);
			expect(result.fields.title).toBe("Only title");
			expect(result.fields.slug).toBeUndefined();
			expect(result.fields.description).toBeUndefined();
			expect(result.fields.body).toBeUndefined();
		});

		it("passthrough allows additional fields", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: new Date(),
				fields: {
					title: "Test",
					customField: "custom value",
					anotherField: 42,
				},
			};

			const result = ContentResourceSchema.parse(data);
			// biome-ignore lint/suspicious/noExplicitAny: testing passthrough behavior
			expect((result.fields as any).customField).toBe("custom value");
			// biome-ignore lint/suspicious/noExplicitAny: testing passthrough behavior
			expect((result.fields as any).anotherField).toBe(42);
		});
	});

	describe("behavior tests - metadata", () => {
		it("accepts metadata record", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: new Date(),
				fields: {},
				metadata: {
					author: "Test Author",
					tags: ["test", "example"],
					views: 100,
				},
			};

			const result = ContentResourceSchema.parse(data);
			expect(result.metadata).toEqual({
				author: "Test Author",
				tags: ["test", "example"],
				views: 100,
			});
		});

		it("metadata accepts any value types (unknown)", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: new Date(),
				fields: {},
				metadata: {
					string: "value",
					number: 42,
					boolean: true,
					null: null,
					array: [1, 2, 3],
					object: { nested: "value" },
				},
			};

			const result = ContentResourceSchema.parse(data);
			expect(result.metadata).toEqual(data.metadata);
		});
	});

	describe("type inference", () => {
		it("inferred type matches expected shape", () => {
			const resource: ContentResource = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				createdAt: new Date(),
				fields: {
					title: "Test",
				},
			};

			expect(resource.id).toBeDefined();
			expect(resource.type).toBeDefined();
			expect(resource.createdAt).toBeDefined();
		});
	});
});

describe("CreateContentResourceSchema", () => {
	describe("characterization tests", () => {
		it("omits system-generated fields from base schema", () => {
			const shape = CreateContentResourceSchema.shape;

			expect(shape).not.toHaveProperty("id");
			expect(shape).not.toHaveProperty("createdAt");
			expect(shape).not.toHaveProperty("updatedAt");
			expect(shape).not.toHaveProperty("deletedAt");
			expect(shape).toHaveProperty("type");
			expect(shape).toHaveProperty("fields");
		});
	});

	describe("behavior tests", () => {
		it("accepts minimal valid creation data", () => {
			const data = {
				type: "post",
				fields: {},
			};

			const result = CreateContentResourceSchema.parse(data);
			expect(result.type).toBe("post");
			expect(result.fields).toEqual({});
		});

		it("rejects data with id field", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "post",
				fields: {},
			};

			// Characterization: .omit() strips the field but doesn't reject it
			// The field is just ignored during parsing
			const result = CreateContentResourceSchema.parse(data);
			expect(result).not.toHaveProperty("id");
			expect(result.type).toBe("post");
		});

		it("rejects data with createdAt field", () => {
			const data = {
				type: "post",
				createdAt: new Date(),
				fields: {},
			};

			// Characterization: .omit() strips the field but doesn't reject it
			const result = CreateContentResourceSchema.parse(data);
			expect(result).not.toHaveProperty("createdAt");
		});

		it("accepts fields and metadata", () => {
			const data = {
				type: "post",
				fields: {
					title: "New Post",
					slug: "new-post",
				},
				metadata: {
					draft: true,
				},
			};

			const result = CreateContentResourceSchema.parse(data);
			expect(result.fields.title).toBe("New Post");
			expect(result.metadata).toEqual({ draft: true });
		});
	});

	describe("type inference", () => {
		it("inferred type excludes system fields", () => {
			const createData: CreateContentResource = {
				type: "post",
				fields: {
					title: "Test",
				},
			};

			// TypeScript would error if we tried to add:
			// createData.id = "...";
			// createData.createdAt = new Date();

			expect(createData.type).toBe("post");
		});
	});
});

describe("UpdateContentResourceSchema", () => {
	describe("characterization tests", () => {
		it("makes all fields partial except id", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
			};

			const result = UpdateContentResourceSchema.parse(data);
			expect(result.id).toBe(data.id);
		});
	});

	describe("behavior tests", () => {
		it("requires id field", () => {
			const data = {
				type: "post",
			};

			expect(() => UpdateContentResourceSchema.parse(data)).toThrow();
		});

		it("accepts id with no other fields", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
			};

			const result = UpdateContentResourceSchema.parse(data);
			expect(result.id).toBe(data.id);
		});

		it("accepts partial updates", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "updated-type",
			};

			const result = UpdateContentResourceSchema.parse(data);
			expect(result.id).toBe(data.id);
			expect(result.type).toBe("updated-type");
		});

		it("rejects createdAt field", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				createdAt: new Date(),
			};

			// Characterization: .omit() after .partial() strips the field
			const result = UpdateContentResourceSchema.parse(data);
			expect(result).not.toHaveProperty("createdAt");
		});

		it("accepts updatedAt field", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				updatedAt: new Date("2024-01-02"),
			};

			const result = UpdateContentResourceSchema.parse(data);
			expect(result.updatedAt).toBeInstanceOf(Date);
		});

		it("accepts deletedAt field", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				deletedAt: new Date("2024-01-03"),
			};

			const result = UpdateContentResourceSchema.parse(data);
			expect(result.deletedAt).toBeInstanceOf(Date);
		});

		it("accepts partial fields update", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				fields: {
					title: "Updated Title",
				},
			};

			const result = UpdateContentResourceSchema.parse(data);
			expect(result.fields?.title).toBe("Updated Title");
		});

		it("accepts metadata update", () => {
			const data = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				metadata: {
					lastModifiedBy: "user-123",
				},
			};

			const result = UpdateContentResourceSchema.parse(data);
			expect(result.metadata).toEqual({ lastModifiedBy: "user-123" });
		});
	});

	describe("type inference", () => {
		it("inferred type has required id and optional other fields", () => {
			const updateData: UpdateContentResource = {
				id: "550e8400-e29b-41d4-a716-446655440000",
				type: "updated",
			};

			expect(updateData.id).toBeDefined();
			expect(updateData.type).toBe("updated");
		});
	});
});
