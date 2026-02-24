import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	contentResources: defineTable({
		type: v.string(),
		title: v.string(),
		slug: v.string(),
		description: v.optional(v.string()),
		body: v.optional(v.string()),
		status: v.union(
			v.literal("draft"),
			v.literal("published"),
			v.literal("archived"),
		),
		metadata: v.optional(v.any()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_slug", ["slug"])
		.index("by_type", ["type"])
		.index("by_status", ["status"])
		.index("by_type_status", ["type", "status"]),
});
