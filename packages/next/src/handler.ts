/// <reference lib="dom" />

import { createHttpHandler, type GremlinConfig } from "@gremlincms/core";

export type NextRouteHandler = (
	request: Request,
	context?: unknown,
) => Promise<Response>;

export interface NextRouteHandlers {
	GET: NextRouteHandler;
	POST: NextRouteHandler;
	PUT: NextRouteHandler;
	DELETE: NextRouteHandler;
}

export function createNextHandler(config: GremlinConfig): NextRouteHandlers {
	const handler = createHttpHandler(config);
	const routeHandler: NextRouteHandler = async (request) => handler(request);

	return {
		GET: routeHandler,
		POST: routeHandler,
		PUT: routeHandler,
		DELETE: routeHandler,
	};
}
