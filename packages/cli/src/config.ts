import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface GremlinCliConfig {
	activeSite: string;
}

export interface GremlinCliSession {
	token: string;
	user: string;
	expiresAt: string;
}

const CONFIG_DIR_NAME = ".gremlin";
const CONFIG_FILE_NAME = "config.json";
const SESSIONS_DIR_NAME = "sessions";

function requireHomeDirectory(): string {
	const homeDirectory = process.env.HOME;
	if (!homeDirectory || homeDirectory.trim().length === 0) {
		throw new Error("HOME environment variable is not set.");
	}

	return homeDirectory;
}

function normalizeSiteUrl(url: string): string {
	const parsedUrl = new URL(url);
	if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
		throw new Error("Site URL must use http or https.");
	}

	return parsedUrl.origin;
}

function normalizeHost(host: string): string {
	const normalized = host.trim().toLowerCase();
	if (normalized.length === 0) {
		throw new Error("Host is required.");
	}

	return normalized;
}

function isNodeErrorWithCode(
	error: unknown,
	code: string,
): error is NodeJS.ErrnoException {
	return (
		error instanceof Error &&
		"code" in error &&
		(error as NodeJS.ErrnoException).code === code
	);
}

function getConfigDirectoryPath(): string {
	return join(requireHomeDirectory(), CONFIG_DIR_NAME);
}

function getConfigFilePath(): string {
	return join(getConfigDirectoryPath(), CONFIG_FILE_NAME);
}

function getSessionsDirectoryPath(): string {
	return join(getConfigDirectoryPath(), SESSIONS_DIR_NAME);
}

function getSessionFilePath(host: string): string {
	return join(getSessionsDirectoryPath(), `${normalizeHost(host)}.json`);
}

async function ensureConfigDirectories(): Promise<void> {
	await mkdir(getConfigDirectoryPath(), { recursive: true });
	await mkdir(getSessionsDirectoryPath(), { recursive: true });
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
	try {
		const raw = await readFile(filePath, "utf8");
		return JSON.parse(raw) as T;
	} catch (error) {
		if (isNodeErrorWithCode(error, "ENOENT")) {
			return null;
		}

		if (error instanceof SyntaxError) {
			throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
		}

		throw error;
	}
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
	await ensureConfigDirectories();
	await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function getHostFromSite(siteUrl: string): string {
	return normalizeHost(new URL(siteUrl).hostname);
}

export async function getActiveSite(): Promise<string | null> {
	const config = await readJsonFile<Partial<GremlinCliConfig>>(getConfigFilePath());
	if (!config) {
		return null;
	}

	if (typeof config.activeSite !== "string" || config.activeSite.length === 0) {
		throw new Error("Invalid ~/.gremlin/config.json: activeSite must be a string.");
	}

	return normalizeSiteUrl(config.activeSite);
}

export async function setActiveSite(url: string): Promise<string> {
	const activeSite = normalizeSiteUrl(url);
	await writeJsonFile(getConfigFilePath(), { activeSite });
	return activeSite;
}

export async function getSession(host: string): Promise<GremlinCliSession | null> {
	const sessionFile = getSessionFilePath(host);
	const session = await readJsonFile<Partial<GremlinCliSession>>(sessionFile);
	if (!session) {
		return null;
	}

	if (typeof session.token !== "string" || session.token.length === 0) {
		throw new Error(`Invalid session file ${sessionFile}: token must be a string.`);
	}

	return {
		token: session.token,
		user: typeof session.user === "string" ? session.user : "unknown",
		expiresAt: typeof session.expiresAt === "string" ? session.expiresAt : "",
	};
}

export async function saveSession(
	host: string,
	session: GremlinCliSession,
): Promise<void> {
	if (session.token.trim().length === 0) {
		throw new Error("Session token cannot be empty.");
	}

	await writeJsonFile(getSessionFilePath(host), {
		token: session.token,
		user: session.user,
		expiresAt: session.expiresAt,
	});
}

export async function clearSession(host: string): Promise<void> {
	await ensureConfigDirectories();
	await rm(getSessionFilePath(host), { force: true });
}
