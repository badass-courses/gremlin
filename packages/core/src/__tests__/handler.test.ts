import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { GremlinSession, SessionProvider } from "../auth";
import { GremlinError, type GremlinErrorCode } from "../errors";
import { createHttpHandler, type GremlinConfig } from "../handler";
import { procedure } from "../router";

const session: GremlinSession = {
	user: {
		id: "user_123",
		email: "user@example.com",
		roles: ["admin"],
	},
	expires: "2099-01-01T00:00:00.000Z",
};

const authProvider: SessionProvider = {
	async getSession() {
		return session;
	},
	async requireSession() {
		if (!session.user) {
			throw new GremlinError("UNAUTHORIZED", "Session required.");
		}

		return {
			...session,
			user: session.user,
		};
	},
};

const contentAdapter: GremlinConfig["adapters"]["content"] = {
	async getContentResource() {
		return null;
	},
	async listContentResources() {
		return {
			items: [],
			hasMore: false,
		};
	},
	async createContentResource() {
		return {};
	},
	async updateContentResource() {
		return {};
	},
	async deleteContentResource() {
		return true;
	},
	async addResourceToResource() {
		return {};
	},
	async removeResourceFromResource() {
		return true;
	},
	async reorderResource() {
		return {};
	},
};

function createConfig(overrides: Partial<GremlinConfig> = {}): GremlinConfig {
	return {
		adapters: {
			content: contentAdapter,
		},
		auth: authProvider,
		router: {},
		...overrides,
	};
}

function createRpcRequest(body: { procedure: string; input?: unknown }): Request {
	return new Request("https://example.com/api/gremlin/rpc", {
		method: "POST",
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify(body),
	});
}

describe("createHttpHandler", () => {
	it("returns the session payload for GET /session", async () => {
		const handler = createHttpHandler(createConfig());
		const request = new Request("https://example.com/api/gremlin/session", {
			method: "GET",
		});

		const response = await handler(request);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toEqual(session);
	});

	it("dispatches POST /rpc to the requested procedure", async () => {
		const router = {
			double: procedure
				.input(z.object({ value: z.number() }))
				.handler(({ input }) => ({ doubled: input.value * 2 })),
		};

		const handler = createHttpHandler(
			createConfig({
				router,
			}),
		);

		const response = await handler(
			createRpcRequest({
				procedure: "double",
				input: { value: 8 },
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload).toEqual({ doubled: 16 });
	});

	it("returns 404 for unknown POST /rpc procedures", async () => {
		const handler = createHttpHandler(createConfig());

		const response = await handler(
			createRpcRequest({
				procedure: "missingProcedure",
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(404);
		expect(payload).toEqual({
			error: {
				code: "NOT_FOUND",
				message: "Procedure not found: missingProcedure",
			},
		});
	});

	it.each([
		["NOT_FOUND", 404],
		["UNAUTHORIZED", 401],
		["FORBIDDEN", 403],
		["VALIDATION", 400],
		["CONFLICT", 409],
		["INTERNAL", 500],
	] as const)(
		"maps %s GremlinError to HTTP %d",
		async (code: GremlinErrorCode, expectedStatus: number) => {
			const handler = createHttpHandler(
				createConfig({
					router: {
						fail: procedure.handler(() => {
							throw new GremlinError(code, `failure: ${code}`);
						}),
					},
				}),
			);

			const response = await handler(
				createRpcRequest({
					procedure: "fail",
				}),
			);
			const payload = await response.json();

			expect(response.status).toBe(expectedStatus);
			expect(payload).toEqual({
				error: {
					code,
					message: `failure: ${code}`,
				},
			});
		},
	);
});
