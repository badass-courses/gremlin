import { parseArgs, parseJsonFlag, parsePositiveIntegerFlag } from "../args";
import { rpc } from "../client";
import { CliCommandError, type NextAction } from "../envelope";
import type { CommandExecutionResult } from "./types";

type ContentCommand = "list" | "get" | "create" | "update" | "delete";

const CREATE_UPDATE_FIELDS = ["type", "title", "body", "status", "slug"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function buildCreateOrUpdateInput(
	flags: Record<string, string>,
	command: "create" | "update",
): Record<string, unknown> {
	const jsonInput = parseJsonFlag(flags.input, "--input");
	if (jsonInput !== undefined) {
		if (!isRecord(jsonInput)) {
			throw new CliCommandError({
				code: "VALIDATION",
				message: "--input must be a JSON object.",
				fix: `Pass an object for ${command}, for example: --input '{"title":"New title"}'.`,
				nextActions: [],
			});
		}

		return jsonInput;
	}

	const input: Record<string, unknown> = {};
	for (const field of CREATE_UPDATE_FIELDS) {
		const value = flags[field];
		if (typeof value === "string") {
			input[field] = value;
		}
	}

	if (Object.keys(input).length === 0) {
		throw new CliCommandError({
			code: "VALIDATION",
			message: `${command} requires either --input <json> or field flags.`,
			fix: `Use flags like --title/--status or provide --input '{"key":"value"}'.`,
			nextActions: [],
		});
	}

	return input;
}

function listNextActions(result: unknown): NextAction[] {
	const nextActions: NextAction[] = [
		{
			command: "gremlin content get <id>",
			description: "Fetch one resource by id.",
		},
		{
			command: "gremlin content create --input <json>",
			description: "Create a new resource.",
		},
	];

	if (isRecord(result)) {
		const hasMore = result.hasMore;
		const cursor = result.cursor;
		if (hasMore === true && typeof cursor === "string" && cursor.length > 0) {
			nextActions.unshift({
				command: `gremlin content list --cursor ${cursor}`,
				description: "Load the next page of content resources.",
				params: {
					cursor: {
						value: cursor,
						description: "Cursor returned by the previous list response.",
					},
				},
			});
		}
	}

	return nextActions;
}

async function list(args: string[]): Promise<CommandExecutionResult> {
	const parsed = parseArgs(args);
	const limit = parsePositiveIntegerFlag(parsed.flags.limit, "--limit");

	const input: Record<string, unknown> = {};
	if (typeof parsed.flags.type === "string") {
		input.type = parsed.flags.type;
	}
	if (typeof parsed.flags.status === "string") {
		input.status = parsed.flags.status;
	}
	if (typeof parsed.flags.cursor === "string") {
		input.cursor = parsed.flags.cursor;
	}
	if (typeof limit === "number") {
		input.limit = limit;
	}

	const result = await rpc(
		"listContentResources",
		Object.keys(input).length === 0 ? {} : input,
	);
	return {
		result,
		nextActions: listNextActions(result),
	};
}

async function get(args: string[]): Promise<CommandExecutionResult> {
	const parsed = parseArgs(args);
	const id = parsed.positional[0];
	if (!id) {
		throw new CliCommandError({
			code: "VALIDATION",
			message: "Usage: gremlin content get <id>.",
			fix: "Provide a content resource id.",
			nextActions: [],
		});
	}

	const result = await rpc("getContentResource", { id });
	return {
		result,
		nextActions: [
			{
				command: `gremlin content update ${id} --input <json>`,
				description: "Update the fetched resource.",
			},
			{
				command: `gremlin content delete ${id}`,
				description: "Delete this resource.",
			},
		],
	};
}

async function create(args: string[]): Promise<CommandExecutionResult> {
	const parsed = parseArgs(args);
	const input = buildCreateOrUpdateInput(parsed.flags, "create");
	const result = await rpc("createContentResource", input);

	return {
		result,
		nextActions: [
			{
				command: "gremlin content list",
				description: "List content after creation.",
			},
			{
				command: "gremlin content get <id>",
				description: "Fetch the created resource by id.",
			},
		],
	};
}

async function update(args: string[]): Promise<CommandExecutionResult> {
	const parsed = parseArgs(args);
	const id = parsed.positional[0];
	if (!id) {
		throw new CliCommandError({
			code: "VALIDATION",
			message: "Usage: gremlin content update <id> [--input <json>].",
			fix: "Provide a content id and update payload.",
			nextActions: [],
		});
	}

	const input = buildCreateOrUpdateInput(parsed.flags, "update");
	const result = await rpc("updateContentResource", {
		id,
		data: input,
	});

	return {
		result,
		nextActions: [
			{
				command: `gremlin content get ${id}`,
				description: "Review updated content.",
			},
			{
				command: "gremlin content list",
				description: "Return to the content list.",
			},
		],
	};
}

async function remove(args: string[]): Promise<CommandExecutionResult> {
	const parsed = parseArgs(args);
	const id = parsed.positional[0];
	if (!id) {
		throw new CliCommandError({
			code: "VALIDATION",
			message: "Usage: gremlin content delete <id>.",
			fix: "Provide a content resource id to delete.",
			nextActions: [],
		});
	}

	const result = await rpc("deleteContentResource", { id });
	return {
		result,
		nextActions: [
			{
				command: "gremlin content list",
				description: "List remaining content resources.",
			},
		],
	};
}

export async function runContentCommand(
	args: string[],
): Promise<CommandExecutionResult> {
	const [subcommand, ...rest] = args;
	const command = subcommand as ContentCommand | undefined;

	switch (command) {
		case "list":
			return list(rest);
		case "get":
			return get(rest);
		case "create":
			return create(rest);
		case "update":
			return update(rest);
		case "delete":
			return remove(rest);
		default:
			throw new CliCommandError({
				code: "VALIDATION",
				message:
					"Usage: gremlin content <list|get|create|update|delete> [options].",
				fix: "Use one of the supported content subcommands.",
				nextActions: [
					{
						command: "gremlin",
						description: "Show the full command tree.",
					},
				],
			});
	}
}
