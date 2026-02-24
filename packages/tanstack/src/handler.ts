/// <reference lib="dom" />

import { createHttpHandler, type GremlinConfig } from "@gremlincms/core";

export type TanStackRequestHandler = (
	request: Request,
	options?: unknown,
) => Promise<Response>;

export function createTanStackHandler(
	config: GremlinConfig,
): TanStackRequestHandler {
	const handler = createHttpHandler(config);
	return async (request) => handler(request);
}
