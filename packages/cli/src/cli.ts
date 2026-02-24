#!/usr/bin/env bun

import { getActiveSite } from "./config";
import { runAuthCommand } from "./commands/auth";
import { runConfigCommand } from "./commands/config";
import { runContentCommand } from "./commands/content";
import { runRpcCommand } from "./commands/rpc";
import { runSeedCommand } from "./commands/seed";
import type { CommandExecutionResult } from "./commands/types";
import { CliCommandError, failure, normalizeCliError, success } from "./envelope";

export { parseArgs } from "./args";

const ROOT_COMMAND_TREE = {
	login: {
		usage: "gremlin login <url> --token <token>",
		description: "Authenticate with a gremlin site using a manual token.",
	},
	logout: {
		usage: "gremlin logout",
		description: "Clear the stored session for the active site.",
	},
	whoami: {
		usage: "gremlin whoami",
		description: "Show local and remote session information for the active site.",
	},
	config: {
		usage: "gremlin config <set|get> activeSite [url]",
		description: "Set or read the active site URL.",
	},
	content: {
		usage:
			"gremlin content <list|get|create|update|delete> [--input <json>] [flags]",
		description: "Convenience wrappers around well-known content RPC procedures.",
	},
	rpc: {
		usage: "gremlin rpc <procedure> [--input <json>]",
		description: "Call an arbitrary registered RPC procedure.",
	},
	seed: {
		usage: "gremlin seed --file <path>",
		description: "Create content resources from a JSON array file.",
	},
};

function commandFromArgv(argv: string[]): string {
	if (argv.length === 0) {
		return "gremlin";
	}

	return `gremlin ${argv.join(" ")}`;
}

function getArgv(): string[] {
	const bunGlobal = (globalThis as { Bun?: { argv?: string[] } }).Bun;
	if (bunGlobal && Array.isArray(bunGlobal.argv)) {
		return bunGlobal.argv.slice(2);
	}

	return process.argv.slice(2);
}

async function routeTopLevelCommand(
	command: string,
	args: string[],
): Promise<CommandExecutionResult> {
	switch (command) {
		case "config":
			return runConfigCommand(args);
		case "login":
			return runAuthCommand("login", args);
		case "logout":
			return runAuthCommand("logout", args);
		case "whoami":
			return runAuthCommand("whoami", args);
		case "content":
			return runContentCommand(args);
		case "rpc":
			return runRpcCommand(args);
		case "seed":
			return runSeedCommand(args);
		default:
			throw new CliCommandError({
				code: "NOT_FOUND",
				message: `Unknown command: ${command}.`,
				fix: "Run `gremlin` to view available commands.",
				nextActions: [
					{
						command: "gremlin",
						description: "Show the self-documenting command tree.",
					},
				],
			});
	}
}

async function run(): Promise<void> {
	const argv = getArgv();
	const command = commandFromArgv(argv);

	try {
		if (argv.length === 0 || argv[0] === "help" || argv[0] === "--help") {
			const activeSite = await getActiveSite();
			success(
				command,
				{
					activeSite,
					commands: ROOT_COMMAND_TREE,
				},
				activeSite
					? [
							{
								command: "gremlin whoami",
								description: "Check auth status for the active site.",
							},
							{
								command: "gremlin content list",
								description: "List content resources from the active site.",
							},
						]
					: [
							{
								command: "gremlin config set activeSite <url>",
								description: "Configure the default site URL before use.",
							},
						],
			);
		}

		const [topCommand, ...rest] = argv;
		if (!topCommand) {
			throw new CliCommandError({
				code: "VALIDATION",
				message: "No command provided.",
				fix: "Run `gremlin` to inspect available commands.",
				nextActions: [],
			});
		}

		const output = await routeTopLevelCommand(topCommand, rest);
		success(command, output.result, output.nextActions);
	} catch (error) {
		const normalized = normalizeCliError(error);
		failure(
			command,
			{
				code: normalized.code,
				message: normalized.message,
			},
			normalized.fix,
			normalized.nextActions,
		);
	}
}

void run();
