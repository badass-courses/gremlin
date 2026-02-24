import { parseArgs } from "../args";
import { getRemoteSession } from "../client";
import {
	clearSession,
	getActiveSite,
	getHostFromSite,
	getSession,
	saveSession,
	setActiveSite,
} from "../config";
import { CliCommandError } from "../envelope";
import type { CommandExecutionResult } from "./types";

type AuthAction = "login" | "logout" | "whoami";

function parseSessionUserLabel(sessionPayload: unknown): string {
	if (!sessionPayload || typeof sessionPayload !== "object") {
		return "unknown";
	}

	const user = (sessionPayload as { user?: unknown }).user;
	if (!user || typeof user !== "object") {
		return "anonymous";
	}

	const email = (user as { email?: unknown }).email;
	if (typeof email === "string" && email.length > 0) {
		return email;
	}

	const name = (user as { name?: unknown }).name;
	if (typeof name === "string" && name.length > 0) {
		return name;
	}

	const id = (user as { id?: unknown }).id;
	if (typeof id === "string" && id.length > 0) {
		return id;
	}

	return "unknown";
}

function parseSessionExpiry(sessionPayload: unknown): string {
	if (!sessionPayload || typeof sessionPayload !== "object") {
		return "";
	}

	const expires = (sessionPayload as { expires?: unknown }).expires;
	return typeof expires === "string" ? expires : "";
}

function tokenPreview(token: string): string {
	if (token.length <= 10) {
		return token;
	}

	return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

async function login(args: string[]): Promise<CommandExecutionResult> {
	const parsed = parseArgs(args);
	const site = parsed.positional[0];
	const token = parsed.flags.token;

	if (!site) {
		throw new CliCommandError({
			code: "VALIDATION",
			message: "Usage: gremlin login <url> --token <token>.",
			fix: "Provide a site URL and token.",
			nextActions: [],
		});
	}

	if (!token) {
		throw new CliCommandError({
			code: "VALIDATION",
			message: "Missing required --token flag.",
			fix: "Run: gremlin login <url> --token <token>.",
			nextActions: [],
		});
	}

	const activeSite = await setActiveSite(site);
	const remoteSession = await getRemoteSession({
		siteUrl: activeSite,
		token,
	});
	const host = getHostFromSite(activeSite);
	const user = parseSessionUserLabel(remoteSession);
	const expiresAt = parseSessionExpiry(remoteSession);

	await saveSession(host, {
		token,
		user,
		expiresAt,
	});

	return {
		result: {
			site: activeSite,
			host,
			user,
			expiresAt,
		},
		nextActions: [
			{
				command: "gremlin whoami",
				description: "Inspect local and remote session details.",
			},
			{
				command: "gremlin content list",
				description: "List content resources on the active site.",
			},
		],
	};
}

async function logout(): Promise<CommandExecutionResult> {
	const activeSite = await getActiveSite();
	if (!activeSite) {
		throw new CliCommandError({
			code: "VALIDATION",
			message: "No active site configured.",
			fix: "Set an active site first with `gremlin config set activeSite <url>`.",
			nextActions: [],
		});
	}

	const host = getHostFromSite(activeSite);
	await clearSession(host);

	return {
		result: {
			site: activeSite,
			host,
			loggedOut: true,
		},
		nextActions: [
			{
				command: `gremlin login ${activeSite} --token <token>`,
				description: "Store a new session token.",
			},
		],
	};
}

async function whoami(): Promise<CommandExecutionResult> {
	const activeSite = await getActiveSite();
	if (!activeSite) {
		throw new CliCommandError({
			code: "VALIDATION",
			message: "No active site configured.",
			fix: "Run `gremlin config set activeSite <url>` first.",
			nextActions: [],
		});
	}

	const host = getHostFromSite(activeSite);
	const session = await getSession(host);
	if (!session) {
		throw new CliCommandError({
			code: "UNAUTHORIZED",
			message: `No stored session for host ${host}.`,
			fix: `Run \`gremlin login ${activeSite} --token <token>\`.`,
			nextActions: [
				{
					command: `gremlin login ${activeSite} --token <token>`,
					description: "Authenticate and store a local session.",
				},
			],
		});
	}

	const remoteSession = await getRemoteSession();
	return {
		result: {
			site: activeSite,
			host,
			localSession: {
				user: session.user,
				expiresAt: session.expiresAt,
				token: tokenPreview(session.token),
			},
			remoteSession,
		},
		nextActions: [
			{
				command: "gremlin content list",
				description: "List content resources for the active site.",
			},
			{
				command: "gremlin logout",
				description: "Clear the local stored session token.",
			},
		],
	};
}

export async function runAuthCommand(
	action: AuthAction,
	args: string[],
): Promise<CommandExecutionResult> {
	switch (action) {
		case "login":
			return login(args);
		case "logout":
			return logout();
		case "whoami":
			return whoami();
	}
}
