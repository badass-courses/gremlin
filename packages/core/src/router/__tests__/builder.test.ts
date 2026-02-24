/**
 * Builder tests - characterization + behavior tests
 *
 * Following TDD patterns:
 * 1. Characterization tests document existing behavior (what IS)
 * 2. Behavior tests verify contracts (what SHOULD)
 * 3. Test behavior, not implementation details
 */

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createRouter, procedure } from "../builder";
import type { Procedure } from "../types";

describe("procedure builder", () => {
	describe("characterization tests - document existing behavior", () => {
		it("creates a base builder with empty _def", () => {
			// This characterizes the starting state
			const builder = procedure;

			// We expect it to have the builder methods
			expect(builder).toHaveProperty("input");
			expect(builder).toHaveProperty("use");
			expect(builder).toHaveProperty("handler");
		});

		it("input() returns new builder with schema stored", () => {
			const schema = z.string();
			const builder = procedure.input(schema);

			// Characterize: builder methods are still present
			expect(builder).toHaveProperty("input");
			expect(builder).toHaveProperty("use");
			expect(builder).toHaveProperty("handler");
		});

		it("use() returns new builder with middleware stored", () => {
			const middleware = () => ({ userId: "123" });
			const builder = procedure.use(middleware);

			// Characterize: builder methods are still present
			expect(builder).toHaveProperty("input");
			expect(builder).toHaveProperty("use");
			expect(builder).toHaveProperty("handler");
		});

		it("handler() returns Procedure with _def and $types", () => {
			const proc = procedure.handler(() => Effect.succeed({ result: "ok" }));

			// Characterize the shape of the returned Procedure
			expect(proc).toHaveProperty("_def");
			expect(proc).toHaveProperty("$types");
			expect(proc._def).toHaveProperty("input");
			expect(proc._def).toHaveProperty("output");
			expect(proc._def).toHaveProperty("middlewares");
			expect(proc._def).toHaveProperty("handler");
		});
	});

	describe("behavior tests - verify contracts", () => {
		it("procedure with input schema stores the schema", () => {
			const schema = z.object({ name: z.string() });
			const proc = procedure.input(schema).handler(({ input }) => {
				return Effect.succeed({ greeting: `Hello ${input.name}` });
			});

			// Test behavior: schema is stored and accessible
			expect(proc._def.input).toBe(schema);
		});

		it("procedure without input has undefined schema", () => {
			const proc = procedure.handler(() => Effect.succeed({ result: "ok" }));

			expect(proc._def.input).toBeUndefined();
		});

		it("procedure with middleware stores the middleware", () => {
			const middleware = () => ({ timestamp: Date.now() });
			const proc = procedure
				.use(middleware)
				.handler(() => Effect.succeed({ result: "ok" }));

			expect(proc._def.middlewares).toEqual([middleware]);
		});

		it("procedure without middleware has empty middleware array", () => {
			const proc = procedure.handler(() => Effect.succeed({ result: "ok" }));

			expect(proc._def.middlewares).toEqual([]);
		});

		it("procedure stores handler function", () => {
			const handler = () => Effect.succeed({ result: "ok" });
			const proc = procedure.handler(handler);

			expect(proc._def.handler).toBe(handler);
		});

		it("builder chain is immutable - returns new builder each time", () => {
			const base = procedure;
			const withInput = base.input(z.string());
			const withMiddleware = withInput.use(() => ({ userId: "123" }));

			// Each step should return a different object (immutability)
			expect(base).not.toBe(withInput);
			expect(withInput).not.toBe(withMiddleware);
		});

		it("full chain: input → use → handler", () => {
			const schema = z.object({ id: z.string() });
			const middleware = () => ({ userId: "user-123" });
			const handler = ({
				input,
				ctx,
			}: {
				input: { id: string };
				ctx: { userId: string };
			}) => Effect.succeed({ id: input.id, user: ctx.userId });

			const proc = procedure.input(schema).use(middleware).handler(handler);

			expect(proc._def.input).toBe(schema);
			expect(proc._def.middlewares).toEqual([middleware]);
			expect(proc._def.handler).toBe(handler);
		});

		it("multiple use() calls append middleware in order", () => {
			const middleware1 = () => ({ a: 1 });
			const middleware2 = () => ({ b: 2 });

			const proc = procedure
				.use(middleware1)
				.use(middleware2)
				.handler(() => Effect.succeed({}));

			expect(proc._def.middlewares).toEqual([middleware1, middleware2]);
		});

		it("$types metadata reflects input/output/context types", () => {
			const schema = z.object({ name: z.string() });
			const proc = procedure.input(schema).handler(({ input }) => {
				return Effect.succeed({ greeting: `Hello ${input.name}` });
			});

			// $types is for type-level metadata
			expect(proc.$types).toHaveProperty("input");
			expect(proc.$types).toHaveProperty("output");
			expect(proc.$types).toHaveProperty("context");
		});
	});
});

describe("createRouter", () => {
	describe("characterization tests", () => {
		it("returns the procedures object unchanged", () => {
			const procedures = {
				getUser: procedure
					.input(z.object({ id: z.string() }))
					.handler(({ input }) => Effect.succeed({ id: input.id })),
				updateUser: procedure
					.input(z.object({ id: z.string(), name: z.string() }))
					.handler(({ input }) =>
						Effect.succeed({ id: input.id, name: input.name }),
					),
			};

			const router = createRouter(procedures);

			// Characterize: router is just the procedures object
			expect(router).toBe(procedures);
		});
	});

	describe("behavior tests", () => {
		it("creates a router with multiple procedures", () => {
			const router = createRouter({
				hello: procedure.handler(() => Effect.succeed({ message: "hello" })),
				goodbye: procedure.handler(() =>
					Effect.succeed({ message: "goodbye" }),
				),
			});

			expect(router).toHaveProperty("hello");
			expect(router).toHaveProperty("goodbye");
			expect(router.hello._def.handler).toBeDefined();
			expect(router.goodbye._def.handler).toBeDefined();
		});

		it("router preserves procedure definitions", () => {
			const schema = z.object({ name: z.string() });
			const middleware = () => ({ timestamp: Date.now() });
			const handler = () => Effect.succeed({ result: "ok" });

			const proc = procedure.input(schema).use(middleware).handler(handler);

			const router = createRouter({ test: proc });

			expect(router.test._def.input).toBe(schema);
			expect(router.test._def.middlewares).toEqual([middleware]);
			expect(router.test._def.handler).toBe(handler);
		});

		it("router with single procedure", () => {
			const router = createRouter({
				single: procedure.handler(() => Effect.succeed({ value: 42 })),
			});

			expect(Object.keys(router)).toHaveLength(1);
			expect(router.single).toBeDefined();
		});

		it("empty router is valid", () => {
			const router = createRouter({});

			expect(router).toEqual({});
			expect(Object.keys(router)).toHaveLength(0);
		});
	});
});

describe("type inference helpers", () => {
	it("procedure type includes input/output/context in _def", () => {
		const proc = procedure
			.input(z.string())
			.use(() => ({ userId: "123" }))
			.handler(() => Effect.succeed(42));

		// Type assertion - verifies the Procedure type structure
		// biome-ignore lint/suspicious/noExplicitAny: testing type structure
		const _typeCheck: Procedure<any> = proc;
		expect(_typeCheck._def).toBeDefined();
		expect(_typeCheck.$types).toBeDefined();
	});
});
