import { paginationOptsValidator, queryGeneric } from "convex/server";
import { v } from "convex/values";

const contentResourceStatus = v.union(
	v.literal("draft"),
	v.literal("published"),
	v.literal("archived"),
);

export const list = queryGeneric({
	args: {
		type: v.string(),
		status: contentResourceStatus,
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("contentResources")
			.withIndex("by_type_status")
			.filter((q) =>
				q.and(
					q.eq(q.field("type"), args.type),
					q.eq(q.field("status"), args.status),
				),
			)
			.paginate(args.paginationOpts);
	},
});

export const getBySlug = queryGeneric({
	args: {
		slug: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("contentResources")
			.withIndex("by_slug")
			.filter((q) => q.eq(q.field("slug"), args.slug))
			.unique();
	},
});

export const getById = queryGeneric({
	args: {
		id: v.id("contentResources"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});
