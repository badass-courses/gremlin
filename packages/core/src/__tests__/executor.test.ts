import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { GremlinSession } from "../auth";
import { GremlinError } from "../errors";
import type { ExecutionContext } from "../executor";
import { executeProcedure } from "../executor";
import { procedure } from "../router";

const session: GremlinSession = {
	user: {
		id: "user_123",
		email: "user@example.com",
		roles: ["user"],
	},
	expires: "2099-01-01T00:00:00.000Z",
};

function createExecutionContext(): ExecutionContext {
	const headers = new Headers({
		"x-trace-id": "trace_123",
	});

	return {
		request: new Request("https://example.com/api/gremlin/rpc"),
		session,
		headers,
	};
}

describe("executeProcedure", () => {
	it("executes a synchronous handler", async () => {
		const testProcedure = procedure
			.input(z.object({ value: z.number() }))
			.handler(({ input }) => ({ doubled: input.value * 2 }));

		const result = await executeProcedure(
			testProcedure,
			{ value: 21 },
			createExecutionContext(),
		);

		expect(result).toEqual({ doubled: 42 });
	});

	it("executes an asynchronous handler", async () => {
		const testProcedure = procedure
			.input(z.object({ value: z.number() }))
			.handler(async ({ input }) => {
				return { tripled: input.value * 3 };
			});

		const result = await executeProcedure(
			testProcedure,
			{ value: 7 },
			createExecutionContext(),
		);

		expect(result).toEqual({ tripled: 21 });
	});

	it("validates input and passes parsed data to the handler", async () => {
		const testProcedure = procedure
			.input(z.object({ name: z.string().min(1) }))
			.handler(({ input }) => ({ upper: input.name.toUpperCase() }));

		const result = await executeProcedure(
			testProcedure,
			{ name: "gremlin" },
			createExecutionContext(),
		);

		expect(result).toEqual({ upper: "GREMLIN" });
	});

	it("composes middleware context from multiple middleware functions", async () => {
		const testProcedure = procedure
			.use(() => ({ requestId: "req_123" }))
			.use(async () => ({ organizationId: "org_123" }))
			.handler(({ ctx }) => {
				const mergedContext = ctx as {
					requestId: string;
					organizationId: string;
					session: GremlinSession;
					headers: Headers;
				};

				return {
					requestId: mergedContext.requestId,
					organizationId: mergedContext.organizationId,
					sessionUserId: mergedContext.session.user?.id,
					traceId: mergedContext.headers.get("x-trace-id"),
				};
			});

		const result = await executeProcedure(
			testProcedure,
			undefined,
			createExecutionContext(),
		);

		expect(result).toEqual({
			requestId: "req_123",
			organizationId: "org_123",
			sessionUserId: "user_123",
			traceId: "trace_123",
		});
	});

	it("throws GremlinError with VALIDATION code when input is invalid", async () => {
		const testProcedure = procedure
			.input(z.object({ value: z.number() }))
			.handler(({ input }) => ({ doubled: input.value * 2 }));

		await expect(
			executeProcedure(testProcedure, { value: "not-a-number" }, createExecutionContext()),
		).rejects.toBeInstanceOf(GremlinError);

		await expect(
			executeProcedure(testProcedure, { value: "not-a-number" }, createExecutionContext()),
		).rejects.toMatchObject({
			code: "VALIDATION",
		});
	});
});
