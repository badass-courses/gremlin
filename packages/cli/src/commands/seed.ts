import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs, requireFlag } from "../args";
import { rpc } from "../client";
import { CliCommandError } from "../envelope";
import type { CommandExecutionResult } from "./types";

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

function readIdFromResult(value: unknown): string | undefined {
	if (!value || typeof value !== "object") {
		return undefined;
	}

	const id = (value as { id?: unknown }).id;
	return typeof id === "string" ? id : undefined;
}

export async function runSeedCommand(
	args: string[],
): Promise<CommandExecutionResult> {
	const parsed = parseArgs(args);
	const file = requireFlag(parsed.flags, "file");
	const filePath = resolve(process.cwd(), file);

	let rawFile = "";
	try {
		rawFile = await readFile(filePath, "utf8");
	} catch (error) {
		if (isNodeErrorWithCode(error, "ENOENT")) {
			throw new CliCommandError({
				code: "NOT_FOUND",
				message: `Seed file not found: ${filePath}.`,
				fix: "Provide an existing JSON file path via --file.",
				nextActions: [],
				cause: error,
			});
		}

		throw error;
	}

	let payload: unknown;
	try {
		payload = JSON.parse(rawFile);
	} catch (error) {
		throw new CliCommandError({
			code: "VALIDATION",
			message: `Seed file is not valid JSON: ${filePath}.`,
			fix: "Ensure the file contains a JSON array of content resources.",
			nextActions: [],
			cause: error,
		});
	}

	if (!Array.isArray(payload)) {
		throw new CliCommandError({
			code: "VALIDATION",
			message: "Seed file must contain a JSON array.",
			fix: "Wrap seed resources in an array: [ { ... }, { ... } ].",
			nextActions: [],
		});
	}

	const created: Array<{ index: number; id?: string }> = [];
	for (let index = 0; index < payload.length; index += 1) {
		const item = payload[index];
		const result = await rpc("createContentResource", item);
		created.push({
			index,
			id: readIdFromResult(result),
		});
	}

	const previewLimit = 25;
	return {
		result: {
			file: filePath,
			total: payload.length,
			created: created.length,
			results: created.slice(0, previewLimit),
			truncated: created.length > previewLimit,
		},
		nextActions: [
			{
				command: "gremlin content list",
				description: "Review newly seeded resources.",
			},
		],
	};
}
