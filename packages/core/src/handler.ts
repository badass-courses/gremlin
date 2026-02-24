/// <reference lib="dom" />

import type { SessionProvider } from "./auth";
import type { GremlinErrorCode } from "./errors";
import { GremlinError } from "./errors";
import { executeProcedure } from "./executor";
import type { Page, PaginationParams } from "./pagination";
import type { AnyParams, Procedure } from "./router";

const DEFAULT_BASE_PATH = "/api/gremlin";

const ERROR_STATUS_MAP: Record<GremlinErrorCode, number> = {
	NOT_FOUND: 404,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	VALIDATION: 400,
	CONFLICT: 409,
	INTERNAL: 500,
};

export interface ContentResourceAdapter {
	getContentResource(
		idOrSlug: string,
		options?: { depth?: number },
	): Promise<unknown>;
	listContentResources(
		filters?: PaginationParams & Record<string, unknown>,
		options?: { depth?: number },
	): Promise<Page<unknown>>;
	createContentResource(data: unknown): Promise<unknown>;
	updateContentResource(id: string, data: unknown): Promise<unknown>;
	deleteContentResource(id: string): Promise<boolean>;
	addResourceToResource(
		resourceOfId: string,
		resourceId: string,
		data?: unknown,
	): Promise<unknown>;
	removeResourceFromResource(
		resourceOfId: string,
		resourceId: string,
	): Promise<boolean>;
	reorderResource(
		resourceOfId: string,
		resourceId: string,
		newPosition: number,
	): Promise<unknown>;
}

export interface GremlinConfig {
	basePath?: string;
	adapters: {
		content: ContentResourceAdapter;
	};
	auth: SessionProvider;
	router?: Record<string, Procedure<AnyParams>>;
	callbacks?: {
		onError?: (error: GremlinError) => void;
	};
}

interface RpcRequestBody {
	procedure: string;
	input?: unknown;
}

function normalizePath(path: string): string {
	if (path.length <= 1) {
		return path;
	}

	return path.endsWith("/") ? path.replace(/\/+$/, "") : path;
}

function normalizeBasePath(basePath: string): string {
	const withLeadingSlash = basePath.startsWith("/") ? basePath : `/${basePath}`;
	return normalizePath(withLeadingSlash);
}

function resolveRelativePath(pathname: string, basePath: string): string | null {
	const normalizedPath = normalizePath(pathname);
	const normalizedBasePath = normalizePath(basePath);

	if (normalizedPath === normalizedBasePath) {
		return "/";
	}

	if (normalizedPath.startsWith(`${normalizedBasePath}/`)) {
		return normalizedPath.slice(normalizedBasePath.length);
	}

	return null;
}

function jsonResponse(body: unknown, status = 200): Response {
	const headers = new Headers();
	headers.set("content-type", "application/json; charset=utf-8");

	return new Response(JSON.stringify(body), {
		status,
		headers,
	});
}

function errorStatus(error: GremlinError): number {
	return ERROR_STATUS_MAP[error.code] ?? 500;
}

function normalizeError(error: unknown): GremlinError {
	if (error instanceof GremlinError) {
		return error;
	}

	return new GremlinError("INTERNAL", "Internal server error.", error);
}

async function parseRpcRequestBody(request: Request): Promise<RpcRequestBody> {
	let parsedBody: unknown;

	try {
		parsedBody = await request.json();
	} catch (error) {
		throw new GremlinError("VALIDATION", "Request body must be valid JSON.", error);
	}

	if (!parsedBody || typeof parsedBody !== "object") {
		throw new GremlinError("VALIDATION", "RPC body must be an object.");
	}

	const procedure = (parsedBody as { procedure?: unknown }).procedure;
	if (typeof procedure !== "string" || procedure.length === 0) {
		throw new GremlinError("VALIDATION", "RPC body must include a procedure.");
	}

	return {
		procedure,
		input: (parsedBody as { input?: unknown }).input,
	};
}

export function createHttpHandler(
	config: GremlinConfig,
): (request: Request) => Promise<Response> {
	const basePath = normalizeBasePath(config.basePath ?? DEFAULT_BASE_PATH);
	const router = config.router ?? {};

	return async (request: Request): Promise<Response> => {
		try {
			const pathname = new URL(request.url).pathname;
			const relativePath = resolveRelativePath(pathname, basePath);

			if (relativePath === null) {
				throw new GremlinError("NOT_FOUND", `Route not found: ${pathname}`);
			}

			if (request.method === "GET" && relativePath === "/session") {
				const session = await config.auth.getSession(request);
				return jsonResponse(session);
			}

			if (request.method === "POST" && relativePath === "/rpc") {
				const { procedure: procedureName, input } =
					await parseRpcRequestBody(request);

				const procedure = router[procedureName];
				if (!procedure) {
					throw new GremlinError(
						"NOT_FOUND",
						`Procedure not found: ${procedureName}`,
					);
				}

				const session = await config.auth.getSession(request);
				const result = await executeProcedure(procedure, input, {
					request,
					session,
					headers: request.headers,
				});

				return jsonResponse(result);
			}

			throw new GremlinError(
				"NOT_FOUND",
				`Route not found: ${request.method} ${relativePath}`,
			);
		} catch (error) {
			const gremlinError = normalizeError(error);
			config.callbacks?.onError?.(gremlinError);

			return jsonResponse(
				{
					error: {
						code: gremlinError.code,
						message: gremlinError.message,
					},
				},
				errorStatus(gremlinError),
			);
		}
	};
}
