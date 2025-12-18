import { z } from "zod";

/**
 * Base schema for content resources.
 * Foundation type for all content entities in the system.
 */
export const ContentResourceSchema = z.object({
	id: z.string().uuid(),
	type: z.string(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date().optional(),
	deletedAt: z.coerce.date().nullable().optional(),

	fields: z
		.object({
			title: z.string().optional(),
			slug: z.string().optional(),
			description: z.string().optional(),
			body: z.string().optional(),
		})
		.passthrough(), // Allow additional fields

	metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ContentResource = z.infer<typeof ContentResourceSchema>;

/**
 * Schema for creating a new content resource.
 * Omits system-generated fields.
 */
export const CreateContentResourceSchema = ContentResourceSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
});

export type CreateContentResource = z.infer<typeof CreateContentResourceSchema>;

/**
 * Schema for updating an existing content resource.
 * All fields are optional except id.
 */
export const UpdateContentResourceSchema = ContentResourceSchema.partial()
	.required({ id: true })
	.omit({
		createdAt: true,
	});

export type UpdateContentResource = z.infer<typeof UpdateContentResourceSchema>;
