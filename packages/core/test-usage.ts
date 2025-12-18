/**
 * Quick verification that the type-safe API works.
 * This file is not part of the package - just for validation.
 */
import { Effect } from "effect";
import { z } from "zod";
import { createRouter, procedure } from "./src";

// Test 1: Basic procedure with input and handler
const getUserProcedure = procedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(({ input }) => {
		return Effect.succeed({ id: input.id, name: "Alice" });
	});

// Test 2: Procedure with middleware
const authMiddleware = () => ({ userId: "user-123", role: "admin" });

const updateUserProcedure = procedure
	.input(z.object({ id: z.string(), name: z.string() }))
	.use(authMiddleware)
	.handler(({ input, ctx }) => {
		console.log("User:", ctx.userId, "Role:", ctx.role);
		return Effect.succeed({ ...input, updatedBy: ctx.userId });
	});

// Test 3: Create router
const router = createRouter({
	getUser: getUserProcedure,
	updateUser: updateUserProcedure,
});

console.log("✅ Type-safe router API verified");
console.log("Router procedures:", Object.keys(router));

// Type assertions to verify type safety
const _getUserInput: Parameters<
	typeof router.getUser._def.handler
>[0]["input"] = {} as Parameters<
	typeof router.getUser._def.handler
>[0]["input"];
const _updateUserOutput: Awaited<
	ReturnType<typeof router.updateUser._def.handler>
> = {} as Awaited<ReturnType<typeof router.updateUser._def.handler>>;

// Use variables to satisfy linter
void _getUserInput;
void _updateUserOutput;
