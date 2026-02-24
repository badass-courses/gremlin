import { getActiveSite, getHostFromSite, getSession } from "./config";
import { CliCommandError, type NextAction } from "./envelope";

const BASE_PATH = "/api/gremlin";

type HttpErrorCode =
	| "NOT_FOUND"
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "VALIDATION"
	| "CONFLICT"
	| "INTERNAL";

export interface GremlinFetchOptions extends Omit<RequestInit, "headers"> {
	headers?: HeadersInit;
	siteUrl?: string;
	token?: string | null;
}

function normalizeApiPath(path: string): string {
	if (path.startsWith("/")) {
		return path;
	}

	return `/${path}`;
}

function mapHttpStatusToCode(status: number): HttpErrorCode {
	switch (status) {
		case 400:
			return "VALIDATION";
		case 401:
			return "UNAUTHORIZED";
		case 403:
			return "FORBIDDEN";
		case 404:
			return "NOT_FOUND";
		case 409:
			return "CONFLICT";
		default:
			return "INTERNAL";
	}
}

function errorFixForStatus(status: number, siteUrl: string): string {
	switch (status) {
		case 400:
			return "Fix request input and re-run the command.";
		case 401:
			return `Log in again: gremlin login ${siteUrl} --token <token>.`;
		case 403:
			return "Use credentials with sufficient permissions.";
		case 404:
			return "Confirm the site base path and procedure name are correct.";
		case 409:
			return "Resolve the conflict and retry the operation.";
		default:
			return "Check the server logs and retry.";
	}
}

function errorNextActionsForStatus(status: number, siteUrl: string): NextAction[] {
	switch (status) {
		case 401:
			return [
				{
					command: `gremlin login ${siteUrl} --token <token>`,
					description: "Refresh stored auth token for the active site.",
				},
			];
		case 404:
			return [
				{
					command: "gremlin rpc <procedure> --input <json>",
					description: "Call the procedure directly and verify procedure naming.",
				},
			];
		default:
			return [];
	}
}

function parseErrorEnvelope(payload: unknown): { code?: string; message?: string } {
	if (!payload || typeof payload !== "object") {
		return {};
	}

	const maybeError = (payload as { error?: unknown }).error;
	if (!maybeError || typeof maybeError !== "object") {
		return {};
	}

	const code = (maybeError as { code?: unknown }).code;
	const message = (maybeError as { message?: unknown }).message;
	return {
		code: typeof code === "string" ? code : undefined,
		message: typeof message === "string" ? message : undefined,
	};
}

function parseJsonResponseBody(text: string, url: string): unknown {
	if (text.length === 0) {
		return null;
	}

	try {
		return JSON.parse(text);
	} catch (error) {
		throw new CliCommandError({
			code: "INTERNAL",
			message: `Invalid JSON response from ${url}.`,
			fix: "Confirm the site exposes the Gremlin handler at /api/gremlin.",
			nextActions: [],
			cause: error,
		});
	}
}

async function resolveSiteUrl(explicitSiteUrl?: string): Promise<string> {
	if (explicitSiteUrl) {
		return new URL(explicitSiteUrl).origin;
	}

	const activeSite = await getActiveSite();
	if (!activeSite) {
		throw new CliCommandError({
			code: "VALIDATION",
			message: "No active site configured.",
			fix: "Run `gremlin config set activeSite <url>` first.",
			nextActions: [
				{
					command: "gremlin config set activeSite <url>",
					description: "Set the default Gremlin site URL.",
				},
			],
		});
	}

	return activeSite;
}

async function resolveToken(
	siteUrl: string,
	explicitToken?: string | null,
): Promise<string | undefined> {
	if (typeof explicitToken === "string" && explicitToken.length > 0) {
		return explicitToken;
	}

	const host = getHostFromSite(siteUrl);
	const session = await getSession(host);
	return session?.token;
}

export async function gremlinFetch(
	path: string,
	options: GremlinFetchOptions = {},
): Promise<unknown> {
	const siteUrl = await resolveSiteUrl(options.siteUrl);
	const token = await resolveToken(siteUrl, options.token);
	const endpoint = new URL(
		`${BASE_PATH}${normalizeApiPath(path)}`,
		`${siteUrl}/`,
	);

	const headers = new Headers(options.headers);
	headers.set("accept", "application/json");
	if (token) {
		headers.set("authorization", `Bearer ${token}`);
	}

	if (options.body && !headers.has("content-type")) {
		headers.set("content-type", "application/json");
	}

	let response: Response;
	try {
		response = await fetch(endpoint, {
			...options,
			headers,
		});
	} catch (error) {
		throw new CliCommandError({
			code: "INTERNAL",
			message: `Network request to ${endpoint.toString()} failed.`,
			fix: "Verify the active site URL and that the server is running.",
			nextActions: [],
			cause: error,
		});
	}

	const text = await response.text();
	const payload = parseJsonResponseBody(text, endpoint.toString());
	if (!response.ok) {
		const envelopeError = parseErrorEnvelope(payload);
		throw new CliCommandError({
			code: envelopeError.code ?? mapHttpStatusToCode(response.status),
			message:
				envelopeError.message ??
				`Request failed with HTTP status ${response.status}.`,
			fix: errorFixForStatus(response.status, siteUrl),
			nextActions: errorNextActionsForStatus(response.status, siteUrl),
			cause: payload,
		});
	}

	return payload;
}

export async function rpc(
	procedure: string,
	input?: unknown,
	options?: { siteUrl?: string; token?: string | null },
): Promise<unknown> {
	if (procedure.trim().length === 0) {
		throw new CliCommandError({
			code: "VALIDATION",
			message: "Procedure name is required.",
			fix: "Pass a procedure name, for example: gremlin rpc listContentResources.",
			nextActions: [],
		});
	}

	return gremlinFetch("/rpc", {
		method: "POST",
		siteUrl: options?.siteUrl,
		token: options?.token,
		body: JSON.stringify({
			procedure,
			input,
		}),
	});
}

export async function getRemoteSession(options?: {
	siteUrl?: string;
	token?: string | null;
}): Promise<unknown> {
	return gremlinFetch("/session", {
		method: "GET",
		siteUrl: options?.siteUrl,
		token: options?.token,
	});
}
